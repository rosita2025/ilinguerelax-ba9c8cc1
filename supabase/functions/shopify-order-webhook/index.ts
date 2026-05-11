import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic, x-shopify-shop-domain",
};

// Match the MAIN Spanish Relax product (>$15 to skip cheap upsells)
const MAIN_TITLE_REGEX = /spanish/i;
const WORDS_REGEX = /(5[, ]?000|words|palabras|relax)/i;

async function verifyHmac(rawBody: string, hmacHeader: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return b64 === hmacHeader;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const secret = Deno.env.get("SHOPIFY_WEBHOOK_SECRET");
    if (!secret) {
      console.error("SHOPIFY_WEBHOOK_SECRET not configured");
      return new Response("config_error", { status: 500, headers: corsHeaders });
    }

    const hmac = req.headers.get("x-shopify-hmac-sha256") ?? "";
    const rawBody = await req.text();

    const ok = await verifyHmac(rawBody, hmac, secret);
    if (!ok) {
      console.warn("Invalid HMAC signature");
      return new Response("invalid_signature", { status: 401, headers: corsHeaders });
    }

    const order = JSON.parse(rawBody);
    const items = Array.isArray(order?.line_items) ? order.line_items : [];
    const mainItem = items.find((li: any) => {
      const title = String(li?.title ?? "");
      const price = parseFloat(String(li?.price ?? "0"));
      return MAIN_TITLE_REGEX.test(title) && WORDS_REGEX.test(title) && price > 15;
    });

    if (!mainItem) {
      // Not the Spanish 5000 product → ignore but ack 200 so Shopify doesn't retry
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const addr = order.shipping_address || order.billing_address || {};
    const customer = order.customer || {};
    const firstName = (customer.first_name || addr.first_name || "Customer").toString();
    const lastInitial = ((customer.last_name || addr.last_name || "").toString().trim()[0] || "").toUpperCase();
    const customerName = lastInitial ? `${firstName} ${lastInitial}.` : firstName;
    const country = addr.country || customer.default_address?.country || "United States";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await supabase.from("shopify_sales").upsert(
      {
        shopify_order_id: String(order.id),
        customer_name: customerName,
        country,
        product_name: "5,000 Spanish Words",
        product_key: "spanish5000",
        order_created_at: order.created_at ?? new Date().toISOString(),
      },
      { onConflict: "shopify_order_id" },
    );

    if (error) {
      console.error("DB insert error", error);
      return new Response("db_error", { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("webhook error", e);
    return new Response("error", { status: 500, headers: corsHeaders });
  }
});