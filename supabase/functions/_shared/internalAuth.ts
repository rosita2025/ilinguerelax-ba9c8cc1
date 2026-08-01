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

/** Cache por isolate: tokens ya verificados como service-role reales. */
const verifiedTokens = new Set<string>();

/**
 * Comprueba contra la API de Supabase si el token presentado tiene privilegios
 * de service-role. Necesario porque pg_cron guarda la clave en Vault y ésta
 * puede ser una variante válida (legacy JWT vs. clave nueva) que no coincide
 * carácter a carácter con SUPABASE_SERVICE_ROLE_KEY del entorno.
 */
async function isRealServiceRole(token: string): Promise<boolean> {
  if (!token) return false;
  if (verifiedTokens.has(token)) return true;
  const url = Deno.env.get("SUPABASE_URL");
  if (!url) return false;
  try {
    const res = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1`, {
      headers: { apikey: token, Authorization: `Bearer ${token}` },
    });
    if (res.status === 200) {
      await res.body?.cancel();
      verifiedTokens.add(token);
      return true;
    }
    await res.body?.cancel();
  } catch (_) { /* red caída → denegamos */ }
  return false;
}

/**
 * Devuelve una Response 403 si la llamada NO es interna, o null si está permitida.
 * Uso:  const blocked = await assertInternalCall(req); if (blocked) return blocked;
 */
export async function assertInternalCall(req: Request): Promise<Response | null> {
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const cronSecret = Deno.env.get("CRON_SHARED_SECRET") ?? "";

  const auth = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  const internalKey = (req.headers.get("x-internal-key") ?? "").trim();

  if (service && safeEqual(auth, service)) return null;
  if (cronSecret && (safeEqual(internalKey, cronSecret) || safeEqual(auth, cronSecret))) return null;
  if (await isRealServiceRole(auth)) return null;

  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { ...internalCors, "Content-Type": "application/json" },
  });
}
