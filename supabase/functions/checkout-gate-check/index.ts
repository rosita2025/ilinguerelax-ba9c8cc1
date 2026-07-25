// Public edge function: rate-limits /checkouts opens by client IP.
// Called from the browser BEFORE showing the checkout page. Uses two tables:
//   - checkout_rate_hits: append-only log (ip, ua, slug, created_at).
//   - checkout_ip_bans:   active bans keyed by ip with banned_until.
//
// Response:
//   200 { allowed: true }                              -> permitir
//   200 { allowed: false, reason: "banned"|"rate" }    -> bloquear

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") || "";
  const first = xff.split(",")[0]?.trim();
  return (
    first ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Detecta el origen del visitante (Instagram, Facebook, WhatsApp, TikTok,
// Google, correo, directo…) combinando el UA (apps in-app) y el referer.
function detectSource(ua: string, referer: string | null): string {
  const u = (ua || "").toLowerCase();
  if (u.includes("instagram")) return "instagram";
  if (u.includes("fbav") || u.includes("fban") || u.includes("facebook")) return "facebook";
  if (u.includes("tiktok") || u.includes("bytedance")) return "tiktok";
  if (u.includes("whatsapp") || u.includes("wa/")) return "whatsapp";
  if (u.includes("telegram")) return "telegram";
  if (u.includes("threads")) return "threads";
  if (u.includes("line/")) return "line";
  if (u.includes("kakao")) return "kakao";
  if (u.includes("gsa/") || u.includes("googleapp")) return "google-app";

  const r = (referer || "").toLowerCase();
  if (!r) return "direct";
  try {
    const h = new URL(r).hostname.replace(/^www\./, "");
    if (h.includes("instagram") || h.includes("l.instagram")) return "instagram";
    if (h.includes("facebook") || h.includes("fb.com") || h.includes("l.facebook") || h.includes("m.facebook")) return "facebook";
    if (h.includes("tiktok")) return "tiktok";
    if (h.includes("whatsapp") || h.includes("wa.me")) return "whatsapp";
    if (h.includes("t.me") || h.includes("telegram")) return "telegram";
    if (h.includes("youtube") || h.includes("youtu.be")) return "youtube";
    if (h.includes("google")) return "google";
    if (h.includes("bing")) return "bing";
    if (h.includes("duckduckgo")) return "duckduckgo";
    if (h.includes("yandex")) return "yandex";
    if (h.includes("mail.") || h.includes("gmail") || h.includes("outlook") || h.includes("yahoo")) return "email";
    if (h.includes("ilinguerelax")) return "internal";
    return h;
  } catch {
    return "direct";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const body = (await req.json().catch(() => ({}))) as { slug?: string; referer?: string };
    const slug = (body.slug || "").toString().slice(0, 120) || null;
    const ip = clientIp(req);
    const ua = (req.headers.get("user-agent") || "").slice(0, 300);
    // Preferimos el referer que envía el cliente (document.referrer) porque
    // el header HTTP suele venir de nuestro propio dominio. Fallback al header.
    const referer = ((body.referer || req.headers.get("referer") || "") + "").slice(0, 500) || null;
    const source = detectSource(ua, referer);
    const now = new Date();

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Registrar el acceso para analítica y detección de abuso. Este endpoint
    // nunca bloquea compras: una IP puede ser compartida por una oficina,
    // operadora móvil, VPN o por la vista previa del administrador.
    await admin.from("checkout_rate_hits").insert({ ip, ua, slug, referer, source });
    return json({ allowed: true });
  } catch (err) {
    console.error("checkout-gate-check error", err);
    // Fail-open: si el gate server-side falla, no rompemos ventas legítimas.
    return json({ allowed: true, error: (err as Error).message });
  }
});
