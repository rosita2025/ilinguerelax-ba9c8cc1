// Aggregates Shopify orders into KPIs for the admin dashboard
// Mirrors the Power BI "Shopify Sales" report style.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-key",
};

const SHOP_DOMAIN = "ilinguerelax-9ur75.myshopify.com";
const API_VERSION = "2025-07";

function extractToken(v: string | undefined): string | null {
  if (!v) return null;
  const t = v.trim();
  if (t.startsWith("{")) {
    try {
      const j = JSON.parse(t);
      return j.access_token || j.token || j.accessToken || null;
    } catch { return null; }
  }
  return t;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Simple admin gate
  const adminKey = req.headers.get("x-admin-key") || new URL(req.url).searchParams.get("key");
  const expected = Deno.env.get("ADMIN_REVIEW_KEY");
  if (!expected || adminKey !== expected) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const candidates = [
    extractToken(Deno.env.get("SHOPIFY_ONLINE_ACCESS_TOKEN:user:99eenseffGgb07U1zAl89Vt9wGu2")),
    extractToken(Deno.env.get("SHOPIFY_ONLINE_ACCESS_TOKEN")),
    extractToken(Deno.env.get("SHOPIFY_ACCESS_TOKEN")),
    extractToken(Deno.env.get("SHOPIFY_ORDERS_TOKEN")),
  ].filter(Boolean) as string[];

  if (candidates.length === 0) {
    return new Response(JSON.stringify({ error: "missing_shopify_token" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get("days") || "30", 10)));
  const sinceIso = new Date(Date.now() - days * 86400_000).toISOString();

  // Paginate through Shopify orders since `sinceIso`
  let token = candidates[0];
  let nextUrl: string | null = `https://${SHOP_DOMAIN}/admin/api/${API_VERSION}/orders.json` +
    `?status=any&financial_status=paid&limit=250&created_at_min=${encodeURIComponent(sinceIso)}` +
    `&fields=id,name,created_at,total_price,subtotal_price,currency,gateway,payment_gateway_names,line_items,customer,shipping_address,billing_address`;

  const orders: any[] = [];
  let pages = 0;
  try {
    while (nextUrl && pages < 8) {
      let res: Response | null = null;
      for (const t of candidates) {
        res = await fetch(nextUrl, {
          headers: { "X-Shopify-Access-Token": t, "Content-Type": "application/json" },
        });
        if (res.ok) { token = t; break; }
      }
      if (!res || !res.ok) {
        return new Response(JSON.stringify({ error: `shopify_${res?.status ?? "fetch"}` }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await res.json();
      if (Array.isArray(data?.orders)) orders.push(...data.orders);
      // parse Link header for pagination
      const link = res.headers.get("link") || res.headers.get("Link") || "";
      const m = link.match(/<([^>]+)>;\s*rel="next"/);
      nextUrl = m ? m[1] : null;
      pages++;
    }
  } catch (e) {
    console.error("shopify fetch failed", e);
    return new Response(JSON.stringify({ error: "internal" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // --- Aggregate ---
  let netSales = 0;
  let totalQty = 0;
  const customersOrders = new Map<string, number>(); // customerId/email -> orderCount
  const byProduct = new Map<string, { qty: number; revenue: number }>();
  const byCountry = new Map<string, { orders: number; revenue: number }>();
  const byCity = new Map<string, { orders: number; revenue: number; country: string }>();
  const byGateway = new Map<string, number>();
  const byDay = new Map<string, { revenue: number; orders: number }>();
  const byHour = new Array(24).fill(0).map(() => ({ revenue: 0, orders: 0 }));
  let currency = "USD";

  for (const o of orders) {
    const total = parseFloat(String(o.total_price ?? "0")) || 0;
    netSales += total;
    if (o.currency) currency = o.currency;

    const items = Array.isArray(o.line_items) ? o.line_items : [];
    for (const li of items) {
      const q = parseInt(String(li?.quantity ?? "0"), 10) || 0;
      const p = parseFloat(String(li?.price ?? "0")) || 0;
      totalQty += q;
      const title = String(li?.title || "Unknown");
      const cur = byProduct.get(title) || { qty: 0, revenue: 0 };
      cur.qty += q; cur.revenue += p * q;
      byProduct.set(title, cur);
    }

    const cust = o.customer || {};
    const custKey = String(cust.id || cust.email || o.email || o.id);
    customersOrders.set(custKey, (customersOrders.get(custKey) || 0) + 1);

    const addr = o.shipping_address || o.billing_address || {};
    const country = addr.country || cust.default_address?.country || "Unknown";
    const c = byCountry.get(country) || { orders: 0, revenue: 0 };
    c.orders += 1; c.revenue += total;
    byCountry.set(country, c);

    const city = addr.city || "Unknown";
    const cityKey = `${city}, ${country}`;
    const ci = byCity.get(cityKey) || { orders: 0, revenue: 0, country };
    ci.orders += 1; ci.revenue += total;
    byCity.set(cityKey, ci);

    const gws: string[] = Array.isArray(o.payment_gateway_names) && o.payment_gateway_names.length
      ? o.payment_gateway_names
      : [String(o.gateway || "unknown")];
    for (const g of gws) {
      byGateway.set(g, (byGateway.get(g) || 0) + total / gws.length);
    }

    const d = new Date(o.created_at);
    const dayKey = d.toISOString().slice(0, 10);
    const day = byDay.get(dayKey) || { revenue: 0, orders: 0 };
    day.revenue += total; day.orders += 1;
    byDay.set(dayKey, day);
    byHour[d.getUTCHours()].revenue += total;
    byHour[d.getUTCHours()].orders += 1;
  }

  const totalOrders = orders.length;
  const totalCustomers = customersOrders.size;
  let repeat = 0, single = 0;
  for (const n of customersOrders.values()) {
    if (n > 1) repeat++; else single++;
  }
  const aov = totalOrders > 0 ? netSales / totalOrders : 0;
  const purchaseFrequency = totalCustomers > 0 ? totalOrders / totalCustomers : 0;
  const repeatRate = totalCustomers > 0 ? (repeat / totalCustomers) * 100 : 0;
  const ltv = aov * purchaseFrequency;

  const sortMap = <T,>(m: Map<string, T>, pick: (v: T) => number, limit = 10) =>
    Array.from(m.entries())
      .map(([k, v]) => ({ key: k, ...(v as any) }))
      .sort((a, b) => pick(b as any) - pick(a as any))
      .slice(0, limit);

  // Fill missing days for trend continuity
  const trend: Array<{ day: string; revenue: number; orders: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
    const v = byDay.get(key) || { revenue: 0, orders: 0 };
    trend.push({ day: key, revenue: Math.round(v.revenue * 100) / 100, orders: v.orders });
  }

  return new Response(JSON.stringify({
    range: { days, since: sinceIso },
    currency,
    kpis: {
      netSales: Math.round(netSales * 100) / 100,
      totalOrders,
      totalQuantity: totalQty,
      aov: Math.round(aov * 100) / 100,
      totalCustomers,
      singleOrderCustomers: single,
      repeatCustomers: repeat,
      repeatRate: Math.round(repeatRate * 10) / 10,
      purchaseFrequency: Math.round(purchaseFrequency * 100) / 100,
      ltv: Math.round(ltv * 100) / 100,
    },
    trend,
    hourly: byHour.map((h, i) => ({ hour: i, revenue: Math.round(h.revenue * 100) / 100, orders: h.orders })),
    topProducts: sortMap(byProduct, (v: any) => v.revenue, 10),
    topCountries: sortMap(byCountry, (v: any) => v.revenue, 12),
    topCities: sortMap(byCity, (v: any) => v.revenue, 12),
    gateways: sortMap(byGateway as any, (v: any) => v, 10).map((x: any) => ({ key: x.key, revenue: Math.round((x.key !== undefined ? (byGateway.get(x.key) || 0) : 0) * 100) / 100 })),
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
    status: 200,
  });
});
