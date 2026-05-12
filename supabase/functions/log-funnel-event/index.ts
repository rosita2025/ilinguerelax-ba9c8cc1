import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED = new Set(["ViewContent", "AddToCart", "InitiateCheckout", "Purchase", "Lead"]);

// In-memory IP→country cache (lives during function instance lifetime)
const ipCache = new Map<string, string>();

const resolveCountry = async (ip: string | null, fallback: string | null): Promise<string | null> => {
  if (!ip) return fallback;
  if (ipCache.has(ip)) return ipCache.get(ip)!;
  try {
    // api.country.is is free, no key, generous limits
    const r = await fetch(`https://api.country.is/${ip}`, { signal: AbortSignal.timeout(2000) });
    if (r.ok) {
      const j = await r.json();
      const cc = (j.country as string) || fallback || null;
      if (cc) ipCache.set(ip, cc);
      return cc;
    }
  } catch (_) { /* ignore */ }
  return fallback;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const event_name = String(body.event_name || "");
    if (!ALLOWED.has(event_name)) {
      return new Response(JSON.stringify({ error: "Invalid event_name" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const xff = req.headers.get("x-forwarded-for") || "";
    const ip = xff.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
    const country = await resolveCountry(ip, body.country || null);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.from("funnel_events").insert({
      event_name,
      product_id: body.product_id ?? null,
      value: typeof body.value === "number" ? body.value : null,
      currency: typeof body.currency === "string" ? body.currency : null,
      session_id: body.session_id ?? null,
      page_path: body.page_path ?? null,
      country,
    });

    if (error) {
      console.error("insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, country }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});