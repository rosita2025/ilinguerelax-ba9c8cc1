// Llamada interna fiable a otra Edge Function (misma idea que sendInternalEmail).
//
// `supabase.functions.invoke(...)` no siempre reenvía Authorization con la
// service-role key ni la clave interna, así que las funciones protegidas
// devolvían 403 y quedaba el inútil "Edge Function returned a non-2xx status
// code". Aquí mandamos apikey + Authorization + x-internal-key y devolvemos el
// motivo real del fallo para auditarlo en order_events.
export async function invokeInternalFunction(
  name: string,
  body: unknown,
): Promise<{ error: { message: string } | null; data: unknown }> {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const cronSecret = Deno.env.get("CRON_SHARED_SECRET") ?? "";
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/${name}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        ...(cronSecret ? { "x-internal-key": cronSecret } : {}),
      },
      body: JSON.stringify(body ?? {}),
    });
    const text = await res.text().catch(() => "");
    let parsed: unknown = null;
    try { parsed = text ? JSON.parse(text) : null; } catch { /* texto plano */ }
    if (!res.ok) {
      const detail = (parsed as { error?: string } | null)?.error ?? text ?? "";
      return { error: { message: `${name} ${res.status}: ${detail || "sin detalle"}` }, data: parsed };
    }
    return { error: null, data: parsed };
  } catch (e) {
    return { error: { message: e instanceof Error ? e.message : String(e) }, data: null };
  }
}
