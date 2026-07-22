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

const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 20;
const BAN_MS = 30 * 60 * 1000;

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

    // 1) Ban activo?
    const { data: ban } = await admin
      .from("checkout_ip_bans")
      .select("banned_until, reason")
      .eq("ip", ip)
      .maybeSingle();

    if (ban && new Date(ban.banned_until as string) > now) {
      return json({
        allowed: false,
        reason: "banned",
        until: ban.banned_until,
      });
    }

    // 2) Registrar hit (best effort, no bloquea).
    await admin.from("checkout_rate_hits").insert({ ip, ua, slug, referer, source });

    // 3) Contar hits en ventana.
    const since = new Date(now.getTime() - WINDOW_MS).toISOString();
    const { count } = await admin
      .from("checkout_rate_hits")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("created_at", since);

    const hits = count || 0;

    if (hits > MAX_HITS) {
      const until = new Date(now.getTime() + BAN_MS).toISOString();
      await admin
        .from("checkout_ip_bans")
        .upsert(
          {
            ip,
            reason: "rate_limit",
            banned_until: until,
            ua,
            hits,
            updated_at: now.toISOString(),
          },
          { onConflict: "ip" },
        );
      return json({ allowed: false, reason: "rate", until });
    }

    return json({ allowed: true, hits });
  } catch (err) {
    console.error("checkout-gate-check error", err);
    // Fail-open: si el gate server-side falla, no rompemos ventas legítimas.
    return json({ allowed: true, error: (err as Error).message });
  }
});
