import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { pushAbandonedCartToBrevo } from "../_shared/brevoAbandonedCart.ts";
import { getPurchasedSkus } from "../_shared/purchasedSkus.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const body = await req.json();

    // Verify Hotmart webhook token (configure HOTMART_WEBHOOK_TOKEN secret and match in Hotmart panel)
    const expectedToken = Deno.env.get("HOTMART_WEBHOOK_TOKEN");
    const receivedToken =
      body.hottok ||
      body.data?.hottok ||
      url.searchParams.get("hottok") ||
      req.headers.get("x-hotmart-hottok");
    if (!expectedToken || receivedToken !== expectedToken) {
      console.warn("Unauthorized Hotmart webhook (invalid or missing hottok)");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Hotmart abandoned cart webhook received:", JSON.stringify(body));

    // Hotmart sends buyer info in different formats depending on webhook version
    const buyerName = body.data?.buyer?.name || body.buyer?.name || body.name || "Cliente";
    const buyerEmail = body.data?.buyer?.email || body.buyer?.email || body.email;

    if (!buyerEmail) {
      console.error("No email found in webhook payload");
      return new Response(JSON.stringify({ error: "No email provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Detect language from email or name patterns
    const language = detectLanguage(buyerEmail, buyerName);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Resolve SKU dynamically from Hotmart payload. Fall back to the digital
    // catalog default if the webhook does not include a product identifier.
    const rawSku = String(
      body.data?.product?.slug ||
      body.data?.product?.sku ||
      body.data?.product?.id ||
      body.product?.slug ||
      body.product?.sku ||
      body.sku ||
      ""
    ).trim().toLowerCase();

    let productSku = rawSku;
    if (!productSku) {
      const { data: firstProduct } = await supabase
        .from("digital_products")
        .select("sku")
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      productSku = (firstProduct as { sku?: string } | null)?.sku ||
        "5-000-spanish-words-with-english-pronunciation-digital";
    }

    // Check if this email already has an active abandoned cart sequence
    const { data: existing } = await supabase
      .from("abandoned_carts")
      .select("id, is_completed, converted")
      .eq("customer_email", buyerEmail.toLowerCase())
      .eq("is_completed", false)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("abandoned_carts")
        .update({
          emails_sent: 0,
          next_email_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          last_email_sent_at: null,
          customer_name: buyerName,
          product_type: productSku,
        })
        .eq("id", existing.id);
      console.log("Reset abandoned cart:", buyerEmail, productSku);
    } else {
      const { error } = await supabase.from("abandoned_carts").insert({
        customer_name: buyerName,
        customer_email: buyerEmail.toLowerCase(),
        product_type: productSku,
        language,
        next_email_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      });
      if (error) throw error;
      console.log("Created abandoned cart:", buyerEmail, productSku);
    }

    // Save to central email contacts
    try {
      await supabase.from("email_contacts").insert({
        email: buyerEmail.toLowerCase(),
        name: buyerName,
        source: "abandoned_cart",
        language,
        product_type: productSku,
      });
    } catch (e) {
      console.log("Contact already saved:", e);
    }

    // Push to Brevo — workflow handles the drip.
    try {
      const { data: product } = await supabase
        .from("digital_products")
        .select("name, price_usd, slug")
        .eq("sku", productSku)
        .maybeSingle();
      const site = "https://ilinguerelax.com";
      const url = (product as { slug?: string } | null)?.slug
        ? `${site}/checkouts/${(product as { slug?: string }).slug}`
        : `${site}/products/${productSku}`;
      // País: solo desde el payload de Hotmart (nunca inventar)
      const rawCountry = String(
        body.data?.buyer?.address?.country_iso ||
        body.data?.buyer?.address?.country ||
        body.data?.buyer?.country ||
        body.buyer?.address?.country_iso ||
        body.buyer?.country ||
        ""
      ).trim();
      const countryReason = rawCountry ? undefined : "hotmart_payload_incomplete";
      await pushAbandonedCartToBrevo({
        email: buyerEmail.toLowerCase(),
        name: buyerName,
        productSku,
        productName: (product as { name?: string } | null)?.name,
        productUrl: url,
        priceUsd: (product as { price_usd?: number } | null)?.price_usd ?? undefined,
        couponCode: "NEW10",
        couponPercent: 10,
        language,
        country: rawCountry,
        countryReason,
        source: "hotmart",
      });
    } catch (e) {
      console.warn("brevo push failed:", e instanceof Error ? e.message : String(e));
    }


    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Webhook error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function detectLanguage(email: string, name: string): string {
  // Simple heuristic: Spanish-speaking domains or names
  const spanishDomains = [".es", ".mx", ".ar", ".co", ".cl", ".pe", ".ve"];
  const isSpanishDomain = spanishDomains.some(d => email.endsWith(d));
  if (isSpanishDomain) return "es";

  // Default to Spanish since the product targets Spanish speakers
  return "es";
}
