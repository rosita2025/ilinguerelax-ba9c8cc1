import { supabase } from "@/integrations/supabase/client";
import { reportClientError } from "@/lib/errorReporter";
import { edgeErrorStatus, extractEdgeErrorMessage } from "@/lib/edgeError";

export interface InvokeRetryOptions {
  /** Max attempts including the first. Default 3. */
  attempts?: number;
  /** Base delay in ms for exponential backoff. Default 400ms. */
  baseDelayMs?: number;
  /** Max delay cap in ms. Default 4000ms. */
  maxDelayMs?: number;
  /** Optional predicate to decide if an error/response is retryable. */
  isRetryable?: (err: unknown, data: unknown) => boolean;
  /** Called after each failed attempt (for UI hints). */
  onAttemptError?: (info: { attempt: number; nextDelayMs: number; error: unknown }) => void;
  /** Optional abort signal. */
  signal?: AbortSignal;
}

interface InvokeBody {
  body?: unknown;
  method?: "POST" | "GET" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
}

const DEFAULT_RETRYABLE = (err: unknown): boolean => {
  if (!err) return false;
  const anyErr = err as { status?: number; message?: string; name?: string };
  // Network / abort / timeout / 5xx / 408 / 429 → retry
  if (anyErr.name === "AbortError") return false;
  // FunctionsHttpError expone el status real en context.status
  const httpStatus = edgeErrorStatus(err) ?? (typeof anyErr.status === "number" ? anyErr.status : null);
  if (typeof httpStatus === "number") {
    return httpStatus >= 500 || httpStatus === 408 || httpStatus === 429;
  }
  const msg = String(anyErr.message ?? err).toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("network") ||
    msg.includes("timeout") ||
    msg.includes("load failed") ||
    msg.includes("networkerror")
  );
};

/** Adjunta el mensaje real de la Edge Function (body JSON) al error. */
async function withEdgeDetail(error: unknown): Promise<unknown> {
  if (!error || typeof error !== "object") return error;
  try {
    const detail = await extractEdgeErrorMessage(error);
    if (detail) {
      (error as { edgeDetail?: string }).edgeDetail = detail;
    }
    const status = edgeErrorStatus(error);
    if (status != null) (error as { status?: number }).status = status;
  } catch { /* ignore */ }
  return error;
}

const sleep = (ms: number, signal?: AbortSignal) =>


  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    if (signal) {
      const onAbort = () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      };
      if (signal.aborted) onAbort();
      else signal.addEventListener("abort", onAbort, { once: true });
    }
  });

/**
 * Wraps supabase.functions.invoke with exponential backoff retries for
 * transient network / 5xx errors so a flaky link doesn't leave the user
 * with a blank checkout.
 */
export async function invokeWithRetry<T = unknown>(
  fnName: string,
  invokeArgs: InvokeBody,
  opts: InvokeRetryOptions = {},
): Promise<{ data: T | null; error: unknown }> {
  const attempts = Math.max(1, opts.attempts ?? 3);
  const baseDelayMs = opts.baseDelayMs ?? 400;
  const maxDelayMs = opts.maxDelayMs ?? 4000;
  const isRetryable = opts.isRetryable ?? DEFAULT_RETRYABLE;

  let lastError: unknown = null;
  let lastData: unknown = null;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (opts.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    try {
      const { data, error } = await supabase.functions.invoke(fnName, invokeArgs as never);
      lastData = data;
      lastError = error;
      if (!error) return { data: data as T, error: null };
      if (attempt >= attempts || !isRetryable(error, data)) {
        return { data: data as T, error: await withEdgeDetail(error) };
      }
    } catch (err) {
      lastError = err;
      if (attempt >= attempts || !isRetryable(err, null)) {
        return { data: null, error: err };
      }
    }
    const jitter = Math.floor(Math.random() * 150);
    const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1)) + jitter;
    opts.onAttemptError?.({ attempt, nextDelayMs: delay, error: lastError });
    try {
      await sleep(delay, opts.signal);
    } catch {
      return { data: null, error: lastError };
    }
  }

  // Should not reach here, but keep TS happy.
  try {
    reportClientError({
      source: "invokeWithRetry",
      message: `invokeWithRetry exhausted: ${fnName}`,
      extra: { fnName, attempts },
    });
  } catch { /* ignore */ }

  return { data: lastData as T | null, error: lastError };
}
