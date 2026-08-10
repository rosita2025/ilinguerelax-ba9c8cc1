import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from "@supabase/supabase-js";

// Lee el mensaje real que devuelve una Edge Function cuando responde 4xx/5xx.
// supabase.functions.invoke solo entrega "Edge Function returned a non-2xx
// status code"; el texto útil viaja en el body JSON ({ error: "..." }).
// Patrón oficial: https://supabase.com/docs/guides/functions/quickstart#error-handling

/** Código HTTP real devuelto por la Edge Function (si lo hay). */
export function edgeErrorStatus(error: unknown): number | null {
  const ctx = (error as { context?: { status?: number } } | null)?.context;
  return typeof ctx?.status === "number" ? ctx.status : null;
}

export async function extractEdgeErrorMessage(error: unknown): Promise<string | null> {
  if (!error) return null;

  if (error instanceof FunctionsHttpError) {
    // El detalle viaja en el body de la respuesta.
    try {
      const body = await error.context.json();
      const msg =
        (body as { reason?: string })?.reason ||
        (body as { error?: string; message?: string })?.error ||
        (body as { message?: string })?.message;
      if (msg && typeof msg === "string") return msg.slice(0, 300);
      if (body && typeof body === "string") return (body as string).slice(0, 300);
    } catch {
      try {
        const text = await (error.context as Response).clone().text();
        if (text && text.length < 300 && !text.startsWith("<")) return text;
      } catch { /* body ya consumido */ }
    }
    return `HTTP ${edgeErrorStatus(error) ?? "error"}`;
  }

  if (error instanceof FunctionsRelayError) return "Relay error";
  if (error instanceof FunctionsFetchError) return "Network error";

  // Fallback genérico (errores que no son de supabase-js o ya envueltos).
  const ctx = (error as { context?: unknown }).context;
  const res = ctx as Response | undefined;
  if (res && typeof res.text === "function") {
    try {
      const text = await res.clone().text();
      try {
        const j = JSON.parse(text) as { error?: string; message?: string };
        const msg = j.error || j.message;
        if (msg && typeof msg === "string") return msg.slice(0, 300);
      } catch {
        if (text && text.length < 300 && !text.startsWith("<")) return text;
      }
    } catch { /* body ya consumido */ }
  }
  const msg = (error as { message?: string }).message;
  return typeof msg === "string" ? msg : null;
}

/** Clasifica el tipo de fallo para registrarlo en /admin/payment-errors. */
export function edgeErrorKind(error: unknown): "http" | "relay" | "network" | "unknown" {
  if (error instanceof FunctionsHttpError) return "http";
  if (error instanceof FunctionsRelayError) return "relay";
  if (error instanceof FunctionsFetchError) return "network";
  return "unknown";
}

/** ¿El mensaje es jerga técnica que no debe verse en el checkout? */
export function looksTechnical(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    !m ||
    m.includes("non-2xx") ||
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("network error") ||
    m.includes("relay error") ||
    m.includes("edge function") ||
    m.includes("functionsfetcherror") ||
    m.includes("functionshttperror") ||
    m.includes("undefined") ||
    m.includes("[object")
  );
}
