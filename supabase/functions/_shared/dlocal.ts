// dLocal Go — utilidades compartidas de seguridad.
// Verificación de la firma HMAC-SHA256 que dLocal Go envía en sus webhooks.
//
// Formato del header:
//   Authorization: V2-HMAC-SHA256, Signature: <hex>
// Datos firmados: apiKey + [X-Date] + rawBody   (probamos ambas variantes)

const enc = new TextEncoder();

function hexToBytes(hex: string): Uint8Array | null {
  const clean = hex.trim().toLowerCase().replace(/^0x/, "");
  if (clean.length === 0 || clean.length % 2 !== 0 || /[^0-9a-f]/.test(clean)) return null;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function extractSignature(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const m = authHeader.match(/Signature:\s*([0-9a-fA-F]+)/);
  if (m) return m[1];
  // Algunas integraciones envían solo el hex.
  const bare = authHeader.trim();
  return /^[0-9a-fA-F]{64}$/.test(bare) ? bare : null;
}

/**
 * Verifica la firma del webhook de dLocal.
 *
 * Esquema documentado (docs.dlocal.com/reference/payins-security):
 *   Authorization: V2-HMAC-SHA256, Signature: <hmac(secretKey, X-Login + X-Date + RequestBody)>
 * dLocal Go usa la misma construcción, donde X-Login es la API key del comercio.
 *
 * Devuelve true solo si la firma coincide con el cuerpo recibido.
 */
export async function verifyDlocalSignature(
  req: Request,
  rawBody: string,
): Promise<boolean> {
  const apiKey = Deno.env.get("DLOCAL_GO_API_KEY");
  const secretKey = Deno.env.get("DLOCAL_GO_SECRET_KEY");
  if (!apiKey || !secretKey) return false;

  const provided = extractSignature(req.headers.get("authorization"))
    ?? extractSignature(req.headers.get("x-signature"));
  if (!provided) return false;

  const providedBytes = hexToBytes(provided);
  if (!providedBytes) return false;

  // Si viene X-Login debe ser el de nuestra cuenta: una notificación firmada
  // por otro comercio nunca puede validar contra nuestros pedidos.
  const xLogin = (req.headers.get("x-login") ?? "").trim();
  if (xLogin && xLogin !== apiKey) return false;

  const xDate = req.headers.get("x-date") ?? req.headers.get("x-login-date") ?? "";
  const login = xLogin || apiKey;
  const candidates = [
    login + xDate + rawBody, // esquema documentado V2-HMAC-SHA256
    apiKey + xDate + rawBody,
    apiKey + rawBody,
  ];

  for (const data of candidates) {
    const expected = hexToBytes(await hmacHex(secretKey, data));
    if (expected && equalBytes(expected, providedBytes)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Estados de pago — fuente única de verdad.
//
// IMPORTANTE: solo un pago LIQUIDADO habilita la entrega digital. En los rails
// de efectivo/transferencia de LATAM (PagoEfectivo, PIX, SPEI, boleto, Yape)
// dLocal usa AUTHORIZED / VERIFIED / PENDING mientras el dinero todavía NO está
// acreditado; tratarlos como pagados permitiría descargar el producto sin
// cobrar. Cualquier función que decida "¿está pagado?" debe usar estos helpers
// y nunca su propia lista, para que no vuelvan a divergir.
// ---------------------------------------------------------------------------

/** Estados en los que el dinero está realmente acreditado. */
export const DLOCAL_SETTLED_STATUSES = ["PAID", "COMPLETED", "SUCCEEDED"] as const;

/** Estados intermedios: el pago existe pero NO está acreditado. */
export const DLOCAL_PENDING_STATUSES = [
  "PENDING",
  "AUTHORIZED",
  "VERIFIED",
  "PROCESSING",
  "IN_PROCESS",
] as const;

/** Estados finales fallidos. */
export const DLOCAL_FAILED_STATUSES = [
  "REJECTED",
  "CANCELLED",
  "CANCELED",
  "EXPIRED",
  "EXPIRED_PARTIAL",
  "FAILED",
] as const;

export function isSettledStatus(status: unknown): boolean {
  return (DLOCAL_SETTLED_STATUSES as readonly string[])
    .includes(String(status ?? "").trim().toUpperCase());
}

export function isPendingStatus(status: unknown): boolean {
  return (DLOCAL_PENDING_STATUSES as readonly string[])
    .includes(String(status ?? "").trim().toUpperCase());
}

export function isFailedStatus(status: unknown): boolean {
  return (DLOCAL_FAILED_STATUSES as readonly string[])
    .includes(String(status ?? "").trim().toUpperCase());
}

// ---------------------------------------------------------------------------
// Entorno (sandbox / producción).
//
// dLocal Go tiene dos hosts distintos y las credenciales NO son intercambiables:
// una llave de sandbox contra el host de producción devuelve 401 y el pago
// "desaparece". `DLOCAL_GO_ENV=sandbox` conmuta todo el flujo (crear pago,
// webhook y consulta de estado) al host de pruebas; por defecto: producción.
// ---------------------------------------------------------------------------
export type DlocalEnv = "sandbox" | "live";

export function dlocalEnv(): DlocalEnv {
  const raw = (Deno.env.get("DLOCAL_GO_ENV") ?? "").trim().toLowerCase();
  return raw === "sandbox" || raw === "sbx" || raw === "test" ? "sandbox" : "live";
}

export function dlocalApiBase(): string {
  return dlocalEnv() === "sandbox"
    ? "https://api-sbx.dlocalgo.com/v1"
    : "https://api.dlocalgo.com/v1";
}
