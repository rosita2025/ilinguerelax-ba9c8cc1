// Llamada interna fiable a `send-transactional-email`.
//
// Por qué existe: `supabase.functions.invoke(...)` no siempre reenvía la
// cabecera Authorization con la service-role key, así que la puerta interna de
// `send-transactional-email` respondía 403 y la entrega digital fallaba con el
// inútil "Edge Function returned a non-2xx status code".
// Aquí enviamos apikey + Authorization + x-internal-key y devolvemos el motivo
// real del fallo para poder auditarlo en order_events.
export interface InternalEmailPayload {
  templateName: string;
  recipientEmail?: string;
  idempotencyKey?: string;
  templateData?: Record<string, unknown>;
}

export async function sendInternalEmail(
  payload: InternalEmailPayload,
): Promise<{ error: { message: string } | null; data: unknown }> {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const cronSecret = Deno.env.get("CRON_SHARED_SECRET") ?? "";
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        ...(cronSecret ? { "x-internal-key": cronSecret } : {}),
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text().catch(() => "");
    let parsed: unknown = null;
    try { parsed = text ? JSON.parse(text) : null; } catch { /* texto plano */ }
    if (!res.ok) {
      const detail = (parsed as { error?: string } | null)?.error ?? text ?? "";
      return { error: { message: `send-transactional-email ${res.status}: ${detail || "sin detalle"}` }, data: parsed };
    }
    return { error: null, data: parsed };
  } catch (e) {
    return { error: { message: e instanceof Error ? e.message : String(e) }, data: null };
  }
}
