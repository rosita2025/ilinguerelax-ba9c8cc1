// Puerta de acceso interna para funciones de correo.
//
// Estas funciones envían correos con la identidad del dominio (y en algunos
// casos material del comprador), así que NO pueden quedar abiertas a internet.
// Solo se aceptan llamadas que presenten:
//   - Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>  (otras edge functions / pg_cron)
//   - x-internal-key: <CRON_SHARED_SECRET>               (tareas programadas / admin backend)
export const internalCors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-key",
};

function safeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Devuelve una Response 403 si la llamada NO es interna, o null si está permitida.
 * Uso:  const blocked = assertInternalCall(req); if (blocked) return blocked;
 */
export function assertInternalCall(req: Request): Response | null {
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const cronSecret = Deno.env.get("CRON_SHARED_SECRET") ?? "";

  const auth = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  const internalKey = (req.headers.get("x-internal-key") ?? "").trim();

  if (service && safeEqual(auth, service)) return null;
  if (cronSecret && (safeEqual(internalKey, cronSecret) || safeEqual(auth, cronSecret))) return null;

  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { ...internalCors, "Content-Type": "application/json" },
  });
}
