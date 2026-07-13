// Instruments window.fetch to report network failures and relevant 4xx/5xx
// responses to the client error log (endpoint, status, duration, method).

import { reportClientError } from "@/lib/errorReporter";

// Endpoints to ignore (avoid feedback loops and noise from third parties).
const IGNORE_HOST_SUBSTRINGS = [
  "/functions/v1/log-client-error",
  "/functions/v1/log-funnel-event",
  "ipapi.co",
  "ipwho.is",
  "country.is",
  "cdn.gpteng.co",
  "google-analytics.com",
  "googletagmanager.com",
  "facebook.com/tr",
  "connect.facebook.net",
];

// Only report these client errors (skip 401/403/404 which are usually app logic).
const REPORTABLE_4XX = new Set([408, 409, 413, 425, 429]);

function shouldSkip(url: string) {
  return IGNORE_HOST_SUBSTRINGS.some((s) => url.includes(s));
}

function safeUrl(input: RequestInfo | URL): string {
  try {
    if (typeof input === "string") return input;
    if (input instanceof URL) return input.toString();
    return (input as Request).url ?? "";
  } catch {
    return "";
  }
}

let installed = false;

export function installFetchLogger() {
  if (installed || typeof window === "undefined" || !window.fetch) return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = safeUrl(input);
    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    const start = performance.now();
    const skip = shouldSkip(url);

    try {
      const response = await originalFetch(input as RequestInfo, init);
      const durationMs = Math.round(performance.now() - start);

      if (!skip && !response.ok) {
        const status = response.status;
        const isServerError = status >= 500;
        const isReportableClient = REPORTABLE_4XX.has(status);
        if (isServerError || isReportableClient) {
          reportClientError({
            source: "fetch.httpError",
            message: `${method} ${url} → ${status}`,
            extra: { url, method, status, durationMs },
          });
        }
      }

      return response;
    } catch (err) {
      const durationMs = Math.round(performance.now() - start);
      if (!skip) {
        const e = err as Error;
        reportClientError({
          source: "fetch.networkError",
          message: `${method} ${url} failed: ${e?.message ?? "network error"}`,
          stack: e?.stack,
          extra: { url, method, durationMs },
        });
      }
      throw err;
    }
  };
}
