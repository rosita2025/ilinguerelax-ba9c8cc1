// Shared CSRF / origin protection for admin edge functions.
//
// Threat model: even though every admin endpoint also requires an adminKey in
// the body, we defend in depth by rejecting any request whose browser-supplied
// Origin / Referer is not on the allowlist. Browsers set Origin automatically
// and JS on a malicious site cannot spoof it, so cross-site request forgery
// attempts against an admin logged in on another tab are blocked here.
//
// Additionally we require a non-empty `x-admin-csrf` header. Being a custom
// header, it forces a CORS preflight — which our origin allowlist will reject
// for any non-approved origin, closing the loop.

const ALLOWED_ORIGINS = [
  "https://ilinguerelax.com",
  "https://www.ilinguerelax.com",
  "https://ilinguerelax.lovable.app",
  // Lovable preview / sandbox subdomains
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/i,
  /^https:\/\/[a-z0-9-]+\.lovable\.dev$/i,
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
    "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Vary": "Origin",
};

/**
 * Guards an admin edge function against CSRF.
 * Returns a Response to short-circuit, or null when the request is allowed.
 * Skips checks for OPTIONS (already handled by caller) and non-browser calls
 * that carry a service-role bearer (server-to-server).
 */
export function assertAdminCsrf(req: Request): Response | null {
  const method = req.method.toUpperCase();
  if (method === "OPTIONS" || method === "GET" || method === "HEAD") return null;

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const csrf = req.headers.get("x-admin-csrf");

  // Allow trusted server-to-server calls (e.g. cron, webhooks) that authenticate
  // with the service-role key and never come from a browser origin.
  const auth = req.headers.get("authorization") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!origin && serviceKey && auth === `Bearer ${serviceKey}`) return null;

  if (!isOriginAllowed(origin)) {
    return new Response(
      JSON.stringify({ error: "Forbidden: origin not allowed" }),
      { status: 403, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Referer, when present, must also match the allowlist.
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (!isOriginAllowed(refOrigin)) {
        return new Response(
          JSON.stringify({ error: "Forbidden: referer not allowed" }),
          { status: 403, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } },
        );
      }
    } catch { /* malformed referer -> ignore */ }
  }

  if (!csrf || csrf.length < 16) {
    return new Response(
      JSON.stringify({ error: "Missing CSRF token" }),
      { status: 403, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } },
    );
  }

  return null;
}
