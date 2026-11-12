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

export const WHOP_API_BASE = "https://api.whop.com/api/v1";
/** Versión de la API de Whop contra la que se escribió esta integración. */
export const WHOP_API_VERSION_DATE = "2026-11-10-1";

/** Métodos de pago que Whop ofrece en este checkout: solo billeteras de Colombia (en pesos). */
export const WHOP_COLOMBIA_WALLETS = ["nequi", "bre_b"];

/**
 * Cuerpo para `POST /checkout_configurations`: una variante («plan») en línea, de pago único, oculta, con el importe exacto en pesos
 * que calculó nuestro servidor. Whop reutiliza la variante si ya existe una igual. `metadata` se copia a cada pago y a cada aviso.
 */
export function buildWhopCheckoutConfig(input: {
  accountId?: string;
  productId: string;
  orderId: string;
  title: string;
  amountCop: number;
}): Record<string, unknown> {
  const amount = Math.round(input.amountCop);
  return {
    ...(input.accountId ? { account_id: input.accountId } : {}),
    mode: "payment",
    metadata: { order_id: input.orderId },
    variant: {
      product_id: input.productId,
      currency: "cop",
      initial_price: amount,
      billing_type: "one_time",
      release_method: "buy_now",
      visibility: "hidden",
      title: input.title.slice(0, 80),
      payment_method_configuration: { enabled: WHOP_COLOMBIA_WALLETS, include_platform_defaults: false },
    },
  };
}

/** Importe de un campo «Money» de Whop ({ amount: "59900.00", currency: "cop" }). */
export function whopMoney(m: unknown): { amount: number; currency: string } | null {
  if (!m || typeof m !== "object") return null;
  const o = m as { amount?: unknown; currency?: unknown };
  const amount = Number(o.amount);
  if (!Number.isFinite(amount) || typeof o.currency !== "string" || !o.currency) return null;
  return { amount, currency: o.currency.toUpperCase() };
}
