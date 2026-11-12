// Whop — ayudantes del pago con billetera (Nequi) en Colombia.
// Whop firma cada aviso (webhook) con el estándar «Standard Webhooks»:
//   firma = base64( HMAC-SHA256( clave, `${webhook-id}.${webhook-timestamp}.${cuerpo}` ) )
// La clave son los bytes literales (UTF-8) del secreto `ws_…`, con su prefijo y sin decodificar.

const enc = new TextEncoder();

function b64(bytes: ArrayBuffer): string {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

type HeaderBag = Headers | Record<string, string | undefined>;
function header(h: HeaderBag, name: string): string {
  if (typeof (h as Headers).get === "function") return (h as Headers).get(name) ?? "";
  const rec = h as Record<string, string | undefined>;
  const key = Object.keys(rec).find((k) => k.toLowerCase() === name);
  return (key ? rec[key] : "") ?? "";
}

/** Calcula la firma `v1,<base64>` de un aviso (la usan las pruebas y la verificación). */
export async function signWhopPayload(secret: string, id: string, timestamp: string, rawBody: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${id}.${timestamp}.${rawBody}`));
  return `v1,${b64(sig)}`;
}

/**
 * Verifica la firma de un aviso de Whop. Devuelve false si falta algún encabezado, si el aviso es de hace más de 5 minutos
 * (anti-repetición) o si ninguna de las firmas coincide. Siempre sobre el cuerpo TAL CUAL llegó (sin reserializar).
 */
export async function verifyWhopWebhook(
  rawBody: string,
  headers: HeaderBag,
  secret: string | undefined,
  opts: { toleranceSec?: number; nowMs?: number } = {},
): Promise<boolean> {
  if (!secret) return false;
  const id = header(headers, "webhook-id");
  const ts = header(headers, "webhook-timestamp");
  const sigHeader = header(headers, "webhook-signature");
  if (!id || !ts || !sigHeader) return false;
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return false;
  const now = Math.floor((opts.nowMs ?? Date.now()) / 1000);
  if (Math.abs(now - tsNum) > (opts.toleranceSec ?? 300)) return false;
  const expected = await signWhopPayload(secret, id, ts, rawBody);
  // El encabezado puede traer varias firmas separadas por espacio (rotación de secretos).
  return sigHeader.split(" ").some((s) => timingSafeEqual(s.trim(), expected));
}

/**
 * Plan de Whop de cada producto: secreto `WHOP_PLAN_MAP` = JSON {"<sku>": "plan_xxxxxxxx"}.
 * El precio del plan (en pesos colombianos) lo fija el vendedor en Whop y debe ser el que se ve en la página de Colombia.
 */
export function parseWhopPlanMap(raw: string | undefined | null): Record<string, string> {
  if (!raw) return {};
  try {
    const obj = JSON.parse(raw);
    const out: Record<string, string> = {};
    for (const [sku, plan] of Object.entries(obj ?? {})) {
      if (typeof plan === "string" && /^plan_[A-Za-z0-9]+$/.test(plan.trim())) out[sku.trim().toLowerCase()] = plan.trim();
    }
    return out;
  } catch {
    return {};
  }
}

/** Importe de un campo «Money» de Whop ({ amount: "59900.00", currency: "cop" }). */
export function whopMoney(m: unknown): { amount: number; currency: string } | null {
  if (!m || typeof m !== "object") return null;
  const o = m as { amount?: unknown; currency?: unknown };
  const amount = Number(o.amount);
  if (!Number.isFinite(amount) || typeof o.currency !== "string" || !o.currency) return null;
  return { amount, currency: o.currency.toUpperCase() };
}
