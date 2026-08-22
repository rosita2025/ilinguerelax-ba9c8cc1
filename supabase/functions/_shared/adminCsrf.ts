// Shared CSRF + 2FA / origin protection for admin edge functions.
//
// Layers of defence for admin endpoints:
//  1. Origin allowlist (rejects cross-site browsers).
//  2. Custom `x-admin-csrf` header (forces CORS preflight).
//  3. HMAC-signed 2FA session token in `x-admin-2fa` (proves the operator
//     completed the email OTP challenge issued by `admin-2fa`).
//
// Service-role server-to-server calls (cron, webhooks) bypass all three.

const ALLOWED_ORIGINS = [
  "https://ilinguerelax.com",
  "https://www.ilinguerelax.com",
  "https://admin.ilinguerelax.com",
  "https://ilinguerelax.lovable.app",
  // Lovable preview / sandbox subdomains
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/i,
  /^https:\/\/[a-z0-9-]+\.lovable\.dev$/i,
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/i,
  /^https:\/\/[a-z0-9-]+\.lovable\.host$/i,
  // Local dev
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000",
];

const EXTRA_ALLOWED = (Deno.env.get("ADMIN_ALLOWED_ORIGINS") || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  if (EXTRA_ALLOWED.includes(origin)) return true;
  return ALLOWED_ORIGINS.some((rule) =>
    typeof rule === "string" ? rule === origin : rule.test(origin),
  );
}

export const adminCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Vary": "Origin",
};

// ---------- HMAC helpers (stateless tokens) ----------

function b64urlEncode(bytes: Uint8Array): string {
  let s = btoa(String.fromCharCode(...bytes));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function b64urlDecode(s: string): Uint8Array {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
async function hmac(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}

function get2faSecret(): string {
  // Reuse the existing admin key as HMAC secret — rotating the admin key
  // invalidates all outstanding 2FA sessions automatically.
  const s = Deno.env.get("ADMIN_REVIEW_KEY") || "";
  if (!s || s.length < 8) throw new Error("ADMIN_REVIEW_KEY missing");
  return `ilr-2fa:${s}`;
}

export async function signAdmin2FAToken(payload: Record<string, unknown>): Promise<string> {
  const body = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = b64urlEncode(await hmac(get2faSecret(), body));
  return `${body}.${sig}`;
}

export async function verifyAdmin2FAToken(
  token: string | null,
): Promise<{ ok: true; payload: Record<string, unknown> } | { ok: false }> {
  if (!token || !token.includes(".")) return { ok: false };
  const [body, sig] = token.split(".");
  if (!body || !sig) return { ok: false };
  try {
    const expected = await hmac(get2faSecret(), body);
    const provided = b64urlDecode(sig);
    if (!timingSafeEqual(expected, provided)) return { ok: false };
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body))) as Record<string, unknown>;
    const exp = Number(payload.exp || 0);
    if (!exp || exp < Math.floor(Date.now() / 1000)) return { ok: false };
    return { ok: true, payload };
  } catch {
    return { ok: false };
  }
}

// ---------- Guard ----------

export interface AdminGuardOptions {
  /** Require the HMAC-signed 2FA session token. Default true. */
  require2fa?: boolean;
}

export function adminLog(
  fn: string,
  level: "info" | "warn" | "error",
  event: string,
  data: Record<string, unknown> = {},
): void {
  const entry = { ts: new Date().toISOString(), fn, level, event, ...data };
  const line = `[admin:${fn}] ${event} ${JSON.stringify(entry)}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

function reqContext(req: Request): Record<string, unknown> {
  return {
    method: req.method,
    url: req.url,
    origin: req.headers.get("origin"),
    referer: req.headers.get("referer"),
    ua: (req.headers.get("user-agent") || "").slice(0, 120),
    hasCsrf: !!req.headers.get("x-admin-csrf"),
    has2fa: !!req.headers.get("x-admin-2fa"),
    hasAuth: !!req.headers.get("authorization"),
    ip: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip"),
  };
}

/**
 * Guards an admin edge function. Returns a Response to short-circuit, or null
 * when the request is allowed. Emits structured logs for every decision so
 * CORS / permission / dispatch failures are visible in edge function logs.
 */
export async function assertAdminCsrf(
  req: Request,
  opts: AdminGuardOptions = {},
): Promise<Response | null> {
  const method = req.method.toUpperCase();
  const fn = (() => {
    try {
      const parts = new URL(req.url).pathname.split("/").filter(Boolean);
      const i = parts.indexOf("v1");
      return i >= 0 && parts[i + 1] ? parts[i + 1] : "unknown";
    } catch { return "unknown"; }
  })();

  if (method === "OPTIONS") {
    adminLog(fn, "info", "cors.preflight", reqContext(req));
    return null;
  }
  // NOTE: GET/HEAD are NOT exempt — read-only admin endpoints leak data too.
  // They must pass the same origin + CSRF + 2FA checks as mutations.

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const csrf = req.headers.get("x-admin-csrf");

  const auth = req.headers.get("authorization") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!origin && serviceKey && auth === `Bearer ${serviceKey}`) {
    adminLog(fn, "info", "guard.service_role", { method });
    return null;
  }

  if (!isOriginAllowed(origin)) {
    adminLog(fn, "warn", "guard.origin_denied", reqContext(req));
    return new Response(
      JSON.stringify({ error: "Forbidden: origin not allowed" }),
      { status: 403, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (!isOriginAllowed(refOrigin)) {
        adminLog(fn, "warn", "guard.referer_denied", { ...reqContext(req), refOrigin });
        return new Response(
          JSON.stringify({ error: "Forbidden: referer not allowed" }),
          { status: 403, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } },
        );
      }
    } catch { /* malformed referer -> ignore */ }
  }

  if (!csrf || csrf.length < 16) {
    adminLog(fn, "warn", "guard.csrf_missing", reqContext(req));
    return new Response(
      JSON.stringify({ error: "Missing CSRF token" }),
      { status: 403, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } },
    );
  }

  const require2fa = opts.require2fa !== false;
  if (require2fa) {
    const token = req.headers.get("x-admin-2fa");
    const check = await verifyAdmin2FAToken(token);
    if (!check.ok) {
      adminLog(fn, "warn", "guard.2fa_invalid", { ...reqContext(req), tokenLen: token?.length || 0 });
      return new Response(
        JSON.stringify({ error: "2FA required", code: "TWO_FA_REQUIRED" }),
        { status: 401, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } },
      );
    }
  }

  adminLog(fn, "info", "guard.pass", { method, origin });
  return null;
}

/**
 * Wraps an admin handler so unhandled exceptions and slow dispatches become
 * visible in edge function logs with a stable shape (fn / status / ms / error).
 */
export function withAdminLogging(
  fnName: string,
  handler: (req: Request) => Promise<Response>,
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    const started = Date.now();
    try {
      const res = await handler(req);
      adminLog(fnName, res.status >= 500 ? "error" : "info", "handler.done", {
        status: res.status,
        ms: Date.now() - started,
        method: req.method,
      });
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      adminLog(fnName, "error", "handler.exception", {
        error: msg,
        stack: stack?.split("\n").slice(0, 6).join(" | "),
        ms: Date.now() - started,
        method: req.method,
      });
      return new Response(
        JSON.stringify({ error: "Internal error", detail: msg }),
        { status: 500, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } },
      );
    }
  };
}

