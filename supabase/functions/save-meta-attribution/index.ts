// Guarda la atribución de Meta Ads (fbc/fbp) asociada al correo del comprador.
// Los webhooks de compra la consultan para enviar el evento Purchase a la
// Conversions API SOLO cuando la venta vino de un anuncio de Facebook/Instagram.
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa", "Access-Control-Allow-Methods": "POST, OPTIONS" };
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const fbc = body?.fbc ? String(body.fbc).slice(0, 255) : null;
    const fbp = body?.fbp ? String(body.fbp).slice(0, 255) : null;
    const country = body?.country ? String(body.country).slice(0, 8) : null;

    if (!email || !email.includes("@") || email.length > 254) {
      return new Response(JSON.stringify({ error: "invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!fbc && !fbp) {
      return new Response(JSON.stringify({ ok: true, skipped: "no meta attribution" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expires = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from("meta_attribution").upsert(
      { email, fbc, fbp, country, expires_at: expires, updated_at: new Date().toISOString() },
      { onConflict: "email" },
    );
    if (error) {
      console.error("save-meta-attribution error", error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("save-meta-attribution failure", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
