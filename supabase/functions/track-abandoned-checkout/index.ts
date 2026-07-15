import { createClient } from "npm:@supabase/supabase-js@2";
import { pushAbandonedCartToBrevo } from "../_shared/brevoAbandonedCart.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function detectLanguage(email: string): string {
  const map: Record<string, string> = {
    ".br": "pt", ".pt": "pt",
    ".fr": "fr", ".be": "fr",
    ".us": "en", ".uk": "en", ".ca": "en", ".au": "en",
  };
  for (const suf of Object.keys(map)) if (email.endsWith(suf)) return map[suf];
  return "es";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "Cliente").trim() || "Cliente";
    const phone = String(body.phone || "").trim();
    const productType = String(body.product_type || body.slug || "checkout").slice(0, 80);
    const language = body.language ? String(body.language) : detectLanguage(email);
    const cart = Array.isArray(body.cart)
      ? (body.cart as Array<{ id?: string; q?: number }>)
          .filter((c) => c && typeof c.id === "string")
          .slice(0, 20)
          .map((c) => ({ id: String(c.id).slice(0, 60), q: Math.max(1, Math.min(20, Number(c.q) || 1)) }))
      : [];

    if (!EMAIL_RE.test(email)) {
      return new Response(JSON.stringify({ error: "invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Upsert-like: reset existing open cart or create new
    const { data: existing } = await supabase
      .from("abandoned_carts")
      .select("id")
      .eq("customer_email", email)
      .eq("is_completed", false)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("abandoned_carts")
        .update({
          customer_name: name,
          product_type: productType,
          language,
          next_email_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("abandoned_carts").insert({
        customer_name: name,
        customer_email: email,
        product_type: productType,
        language,
        next_email_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // Central contacts
    try {
      await supabase.from("email_contacts").insert({
        email,
        name,
        source: "abandoned_cart",
        language,
        product_type: productType,
      });
    } catch (_) { /* dedupe conflict ignored */ }

    // Push to Brevo — the Brevo Automation workflow sends Day 1/7/15/30 emails.
    try {
      const { data: product } = await supabase
        .from("digital_products")
        .select("name, price_usd, slug")
        .eq("sku", productType)
        .maybeSingle();
      const site = "https://ilinguerelax.com";
      // Payload de recuperación estilo Shopify: al hacer clic en el email,
      // /checkouts/:slug hidrata carrito + datos del cliente automáticamente.
      const recoverPayload = {
        v: 1,
        b: { n: name, e: email, p: phone },
        c: cart,
      };
      const recoverB64 = btoa(unescape(encodeURIComponent(JSON.stringify(recoverPayload))))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      const baseUrl = product?.slug
        ? `${site}/checkouts/${product.slug}`
        : `${site}/products/${productType}`;
      const url = `${baseUrl}?r=${recoverB64}`;
      await pushAbandonedCartToBrevo({
        email,
        name,
        phone,
        productSku: productType,
        productName: (product as { name?: string } | null)?.name,
        productUrl: url,
        priceUsd: (product as { price_usd?: number } | null)?.price_usd ?? undefined,
        couponCode: "NEW10",
        language,
        source: "checkout",
      });
    } catch (e) {
      console.warn("brevo push failed:", e instanceof Error ? e.message : String(e));
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("track-abandoned-checkout error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
