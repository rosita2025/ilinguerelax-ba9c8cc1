const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SHOP_DOMAIN = "ilinguerelax-9ur75.myshopify.com";
const API_VERSION = "2025-07";

// Match titles for the MAIN Spanish Relax product (ignore upsells/cheap add-ons)
const MAIN_TITLE_REGEX = /spanish/i;
const WORDS_REGEX = /(5[, ]?000|words|palabras|relax)/i;

function timeAgo(iso: string, lang: "es" | "en"): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return lang === "en" ? `${mins} min ago` : `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return lang === "en" ? `${hours} hour${hours > 1 ? "s" : ""} ago` : `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return lang === "en" ? `${days} day${days > 1 ? "s" : ""} ago` : `hace ${days} d`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Try online token first (has user-granted scopes incl. read_orders), fall back to offline token
    let token = Deno.env.get("SHOPIFY_ONLINE_ACCESS_TOKEN:user:99eenseffGgb07U1zAl89Vt9wGu2") ||
                Deno.env.get("SHOPIFY_ONLINE_ACCESS_TOKEN") ||
                Deno.env.get("SHOPIFY_ACCESS_TOKEN");
    if (!token) {
      return new Response(JSON.stringify({ sales: [], error: "missing_token" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const url = new URL(req.url);
    const lang = (url.searchParams.get("lang") === "en" ? "en" : "es") as "es" | "en";

    const ordersUrl = `https://${SHOP_DOMAIN}/admin/api/${API_VERSION}/orders.json?status=any&financial_status=paid&limit=50&fields=id,name,created_at,line_items,customer,shipping_address,billing_address`;
    const res = await fetch(ordersUrl, {
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Shopify orders fetch failed", res.status, body);
      return new Response(JSON.stringify({ sales: [], error: `shopify_${res.status}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const data = await res.json();
    const orders = Array.isArray(data?.orders) ? data.orders : [];

    const sales = orders
      .map((o: any) => {
        const items = Array.isArray(o.line_items) ? o.line_items : [];
        const mainItem = items.find((li: any) => {
          const title = String(li?.title ?? "");
          const price = parseFloat(String(li?.price ?? "0"));
          // Main product: matches both regexes AND has meaningful price (>$15) to skip upsells
          return MAIN_TITLE_REGEX.test(title) && WORDS_REGEX.test(title) && price > 15;
        });
        if (!mainItem) return null;

        const addr = o.shipping_address || o.billing_address || {};
        const customer = o.customer || {};
        const firstName = (customer.first_name || addr.first_name || "Customer").toString();
        const lastInitial = ((customer.last_name || addr.last_name || "").toString().trim()[0] || "").toUpperCase();
        const country = addr.country || customer.default_address?.country || "United States";

        return {
          name: lastInitial ? `${firstName} ${lastInitial}.` : firstName,
          country,
          timeAgo: timeAgo(o.created_at, lang),
          productName: lang === "en" ? "5,000 Spanish Words" : "5,000 Palabras en Español",
          productLabel: "🇪🇸 5K",
          platform: "shopify" as const,
          createdAt: o.created_at,
        };
      })
      .filter(Boolean)
      .slice(0, 20);

    return new Response(JSON.stringify({ sales }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
      status: 200,
    });
  } catch (e) {
    console.error("shopify-spanish-sales error", e);
    return new Response(JSON.stringify({ sales: [], error: "internal" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});