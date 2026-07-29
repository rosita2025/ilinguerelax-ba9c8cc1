// Lee el mensaje real que devuelve una Edge Function cuando responde 4xx/5xx.
// supabase.functions.invoke solo entrega "Edge Function returned a non-2xx
// status code"; el texto útil viaja en el body JSON ({ error: "..." }).
export async function extractEdgeErrorMessage(error: unknown): Promise<string | null> {
  if (!error) return null;
  const ctx = (error as { context?: unknown }).context;
  const res = ctx as Response | undefined;
  if (res && typeof (res as Response).text === "function") {
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

/** ¿El mensaje es jerga técnica que no debe verse en el checkout? */
export function looksTechnical(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    !m ||
    m.includes("non-2xx") ||
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("edge function") ||
    m.includes("functionsfetcherror") ||
    m.includes("functionshttperror") ||
    m.includes("undefined") ||
    m.includes("[object")
  );
}
