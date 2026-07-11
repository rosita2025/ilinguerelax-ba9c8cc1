import { assertAdminCsrf } from "../_shared/adminCsrf.ts";
// Aggregates OWN funnel_events data (Purchase / InitiateCheckout / ViewContent)
// into a Shopify/Power BI style KPI report. No Shopify Admin token required.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-key",
};

const PRODUCT_LABEL = (raw: string | null, page: string | null): string => {
  const s = ((raw || "") + " " + (page || "")).toLowerCase();
  if (!s.trim()) return "Sin producto";
  if (s.includes("coreano") || s.includes("korean")) return "100 Mapas Mentales Coreano";
  if (s.includes("patrones")) return "Patrones en Inglés";
  if (s.includes("8000") || s.includes("8-000")) return "8,000 Palabras Inglés";
  if (s.includes("spanish-5000") || s.includes("spanish")) return "5,000 Spanish Words";
  if (s.includes("5000") || s.includes("5-000")) return "5,000 Palabras Inglés";
  if (s.includes("verb") || s.includes("1000")) return "1,000 Verbos";
  if (s.includes("500-preguntas") || s.includes("question")) return "500 Preguntas";
  if (s.includes("estructura") || s.includes("grammar")) return "Estructuras Gramaticales";
  if (page?.startsWith("/products/")) return page.replace("/products/", "").replace(/-/g, " ").slice(0, 60);
  return raw || "Sin producto";
};

const PAGE_LABEL = (p: string | null): string => {
  if (!p || p === "/") return "Home";
  if (p.startsWith("/products/")) return `Producto · ${PRODUCT_LABEL(null, p)}`;
  if (p.startsWith("/blog")) return "Blog";
  if (p.startsWith("/admin")) return "Admin";
  return p;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const csrfBlock = assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  const url = new URL(req.url);
  const adminKey = req.headers.get("x-admin-key") || url.searchParams.get("key");
  const expected = Deno.env.get("ADMIN_REVIEW_KEY");
  if (!expected || adminKey !== expected) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const days = Math.max(1, Math.min(365, Number(url.searchParams.get("days") || 30)));
  const since = new Date(Date.now() - days * 86400_000).toISOString();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: rows, error } = await supabase
    .from("funnel_events")
    .select("event_name, product_id, value, currency, session_id, page_path, country, referrer, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(20000);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const events = rows || [];
  const purchases = events.filter(e => e.event_name === "Purchase");
  const checkouts = events.filter(e => e.event_name === "InitiateCheckout");
  const views = events.filter(e => e.event_name === "ViewContent" || e.event_name === "PageView");

  // KPIs
  const currency = (purchases[0]?.currency as string) || "USD";
  const netSales = purchases.reduce((a, e) => a + Number(e.value || 0), 0);
  const totalOrders = purchases.length;
  const totalQuantity = totalOrders; // 1 unit per purchase event
  const aov = totalOrders ? netSales / totalOrders : 0;

  // Customers by session
  const bySession = new Map<string, number>();
  for (const p of purchases) {
    const sid = p.session_id || `anon-${p.created_at}`;
    bySession.set(sid, (bySession.get(sid) || 0) + 1);
  }
  const totalCustomers = bySession.size;
  const singleOrderCustomers = [...bySession.values()].filter(v => v === 1).length;
  const repeatCustomers = totalCustomers - singleOrderCustomers;
  const repeatRate = totalCustomers ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;
  const purchaseFrequency = totalCustomers ? +(totalOrders / totalCustomers).toFixed(2) : 0;
  const ltv = totalCustomers ? +(netSales / totalCustomers).toFixed(2) : 0;

  // Trend by day
  const dayMap = new Map<string, { revenue: number; orders: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - (days - 1 - i) * 86400_000).toISOString().slice(0, 10);
    dayMap.set(d, { revenue: 0, orders: 0 });
  }
  for (const p of purchases) {
    const d = new Date(p.created_at).toISOString().slice(0, 10);
    const cur = dayMap.get(d);
    if (cur) { cur.revenue += Number(p.value || 0); cur.orders += 1; }
  }
  const trend = [...dayMap.entries()].map(([day, v]) => ({ day, ...v }));

  // Hourly
  const hourMap = new Map<number, { revenue: number; orders: number }>();
  for (let h = 0; h < 24; h++) hourMap.set(h, { revenue: 0, orders: 0 });
  for (const p of purchases) {
    const h = new Date(p.created_at).getUTCHours();
    const cur = hourMap.get(h)!;
    cur.revenue += Number(p.value || 0); cur.orders += 1;
  }
  const hourly = [...hourMap.entries()].map(([hour, v]) => ({ hour, ...v }));

  // Top products
  const prodMap = new Map<string, { qty: number; revenue: number }>();
  for (const p of purchases) {
    const label = PRODUCT_LABEL(p.product_id as string, p.page_path as string);
    const cur = prodMap.get(label) || { qty: 0, revenue: 0 };
    cur.qty += 1; cur.revenue += Number(p.value || 0);
    prodMap.set(label, cur);
  }
  const topProducts = [...prodMap.entries()]
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // Top countries
  const cMap = new Map<string, { orders: number; revenue: number }>();
  for (const p of purchases) {
    const key = (p.country as string) || "—";
    const cur = cMap.get(key) || { orders: 0, revenue: 0 };
    cur.orders += 1; cur.revenue += Number(p.value || 0);
    cMap.set(key, cur);
  }
  const topCountries = [...cMap.entries()]
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => b.revenue - a.revenue).slice(0, 15);

  // Gateways from referrer
  const gwMap = new Map<string, number>();
  for (const p of purchases) {
    const ref = (p.referrer as string) || "";
    let gw = "Otros";
    if (ref.includes("stripe")) gw = "Stripe";
    else if (ref.includes("hotmart")) gw = "Hotmart";
    else if (ref.includes("paypal")) gw = "PayPal";
    else if (ref.includes("shopify") || ref.includes("myshopify")) gw = "Shopify";
    else if (ref.includes("amazon")) gw = "Amazon";
    gwMap.set(gw, (gwMap.get(gw) || 0) + Number(p.value || 0));
  }
  const gateways = [...gwMap.entries()].map(([key, revenue]) => ({ key, revenue }));

  // Funnel
  const viewCount = views.length;
  const checkoutCount = checkouts.length;
  const conversionRate = viewCount ? +((totalOrders / viewCount) * 100).toFixed(2) : 0;
  const checkoutRate = viewCount ? +((checkoutCount / viewCount) * 100).toFixed(2) : 0;

  return new Response(JSON.stringify({
    source: "own-funnel-events",
    range: { days, since },
    currency,
    kpis: {
      netSales: +netSales.toFixed(2), totalOrders, totalQuantity,
      aov: +aov.toFixed(2),
      totalCustomers, singleOrderCustomers, repeatCustomers,
      repeatRate, purchaseFrequency, ltv,
      viewCount, checkoutCount, conversionRate, checkoutRate,
    },
    trend, hourly, topProducts, topCountries, topCities: [], gateways,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
