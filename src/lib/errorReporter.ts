// Global error reporter — captures runtime errors that could cause blank screens
// and forwards them to the log-client-error edge function with stack traces.

const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/log-client-error`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const RELEASE = (import.meta.env.VITE_APP_RELEASE as string | undefined) ?? "prod";

type Payload = {
  source: string;
  message?: string;
  stack?: string;
  componentStack?: string;
  extra?: Record<string, unknown>;
};

const recent = new Set<string>();
const DEDUPE_MS = 5000;

function shouldSend(key: string) {
  if (recent.has(key)) return false;
  recent.add(key);
  setTimeout(() => recent.delete(key), DEDUPE_MS);
  return true;
}

export function reportClientError(payload: Payload) {
  try {
    const key = `${payload.source}|${payload.message ?? ""}|${(payload.stack ?? "").slice(0, 200)}`;
    if (!shouldSend(key)) return;

    const body = JSON.stringify({
      ...payload,
      url: typeof location !== "undefined" ? location.href : undefined,
      route: typeof location !== "undefined" ? location.pathname : undefined,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      viewport:
        typeof window !== "undefined"
          ? `${window.innerWidth}x${window.innerHeight}`
          : undefined,
      release: RELEASE,
    });

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (ANON_KEY) {
      headers["apikey"] = ANON_KEY;
      headers["Authorization"] = `Bearer ${ANON_KEY}`;
    }

    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      try {
        const blob = new Blob([body], { type: "application/json" });
        if (navigator.sendBeacon(ENDPOINT, blob)) return;
      } catch {
        // fall through to fetch
      }
    }

    void fetch(ENDPOINT, {
      method: "POST",
      headers,
      body,
      keepalive: true,
    }).catch(() => {
      /* swallow — reporter must never throw */
    });
  } catch {
    /* never let the reporter break the app */
  }
}

let installed = false;
export function installGlobalErrorReporter() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    const err = event.error as Error | undefined;
    reportClientError({
      source: "window.error",
      message: err?.message ?? event.message ?? "unknown error",
      stack: err?.stack,
      extra: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const err = reason instanceof Error ? reason : undefined;
    reportClientError({
      source: "unhandledrejection",
      message: err?.message ?? (typeof reason === "string" ? reason : JSON.stringify(reason)?.slice(0, 500)),
      stack: err?.stack,
    });
  });
}
