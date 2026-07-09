import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const classifyReferrer = (ref: string | null): { source: string; channel: string } => {
  if (!ref) return { source: "Directo", channel: "Directo / manual" };
  if (ref.startsWith("utm:")) {
    const source = ref.split(":")[1] || "Campaña";
    const normalized = source.toLowerCase();
    if (["google", "bing", "yahoo", "duckduckgo"].includes(normalized)) {
      return { source: source[0]?.toUpperCase() + source.slice(1), channel: "Orgánico / búsqueda" };
    }
    if (["facebook", "instagram", "tiktok", "youtube", "x", "twitter"].includes(normalized)) {
      return { source: source[0]?.toUpperCase() + source.slice(1), channel: "Social" };
    }
    return { source: source[0]?.toUpperCase() + source.slice(1), channel: "Campaña" };
  }
  try {
    const host = new URL(ref).hostname.toLowerCase().replace(/^www\./, "");
    if (host.includes("google")) return { source: "Google", channel: "Orgánico / búsqueda" };
    if (host.includes("bing") || host.includes("yahoo") || host.includes("duckduckgo")) return { source: host, channel: "Orgánico / búsqueda" };
    if (host.includes("facebook") || host.includes("fb.")) return { source: "Facebook", channel: "Social" };
    if (host.includes("instagram")) return { source: "Instagram", channel: "Social" };
    if (host.includes("tiktok")) return { source: "TikTok", channel: "Social" };
    if (host.includes("youtube") || host === "youtu.be") return { source: "YouTube", channel: "Social" };
    if (host.includes("twitter") || host === "t.co" || host.includes("x.com")) return { source: "Twitter/X", channel: "Social" };
    if (host.includes("whatsapp") || host === "wa.me") return { source: "WhatsApp", channel: "Mensaje directo" };
    if (host.includes("hotmart")) return { source: "Hotmart", channel: "Pago" };
    if (host.includes("paypal")) return { source: "PayPal", channel: "Pago" };
    if (host.includes("stripe")) return { source: "Stripe", channel: "Pago" };
    if (host.includes("amazon")) return { source: "Amazon", channel: "Marketplace" };
    if (host.includes("ilinguerelax") || host.includes("lovable")) return { source: "Interno", channel: "Interno" };
    return { source: host, channel: "Referido" };
  } catch { return { source: "Directo", channel: "Directo / manual" }; }
};

const isAdminPath = (path: string | null): boolean => (path || "").startsWith("/admin");

const labelProduct = (productId: string | null, pagePath: string | null): string => {
  const raw = productId || pagePath || "";
  if (!raw) return "Sin producto";
  const s = raw.toLowerCase();
  if (s.includes("coreano") || s.includes("korean")) return "100 Mapas Mentales Coreano";
  if (s.includes("patrones")) return "Patrones en Inglés";
  if (s.includes("8-000") || s.includes("8000")) return "8,000 Palabras Inglés";
  if (s.includes("5-000-palabras") || s.includes("5000") && !s.includes("spanish")) return "5,000 Palabras Inglés";
  if (s.includes("spanish-5000") || s.includes("spanish-words") || s.includes("spanish")) return "5,000 Spanish Words";
  if (s.includes("1000") || s.includes("verbos") || s.includes("verbs")) return "1,000 Verbos";
  if (s.includes("500-preguntas") || s.includes("questions")) return "500 Preguntas";
  if (s.includes("estructuras") || s.includes("grammar")) return "Estructuras Gramaticales";
  if (pagePath?.startsWith("/products/")) {
    return pagePath.replace("/products/", "").replace(/-/g, " ").slice(0, 70);
  }
  return productId || "Sin producto";
};

const labelPage = (path: string | null): string => {
  if (!path || path === "/") return "Home";
  if (path.startsWith("/products/")) return `Producto · ${labelProduct(null, path)}`;
  if (path.startsWith("/blog")) return "Blog";
  if (path.startsWith("/contacto")) return "Contacto";
  if (path.startsWith("/dejar-resena")) return "Reseñas";
  if (path.startsWith("/payment-success") || path.startsWith("/hotmart-success")) return "Gracias / compra";
  return path;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { adminKey, windowMinutes = 5 } = await req.json().catch(() => ({}));
    const expected = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expected || adminKey !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const win = Math.min(Math.max(parseInt(String(windowMinutes)) || 5, 1), 60);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const since = new Date(Date.now() - win * 60000).toISOString();

    const { data, error } = await supabase
      .from("funnel_events")
      .select("event_name, product_id, value, currency, session_id, country, page_path, referrer, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw error;

    const rows = (data || []).filter((row) => !isAdminPath((row.page_path as string) || null));

    // Group by session — one entry per live visitor with their latest activity
    const bySession = new Map<string, {
      session_id: string;
      country: string | null;
      page_path: string | null;
      referrer: string | null;
      source: string;
      source_channel: string;
      last_seen: string;
      event_count: number;
      last_event: string;
      product_id: string | null;
      product_name: string;
    }>();

    for (const row of rows) {
      const sid = row.session_id as string | null;
      if (!sid) continue;
      const existing = bySession.get(sid);
      if (existing) {
        existing.event_count += 1;
        continue;
      }
      const traffic = classifyReferrer((row.referrer as string) || null);
      bySession.set(sid, {
        session_id: sid,
        country: (row.country as string) || null,
        page_path: (row.page_path as string) || null,
        referrer: (row.referrer as string) || null,
        source: traffic.source,
        source_channel: traffic.channel,
        last_seen: row.created_at as string,
        event_count: 1,
        last_event: row.event_name as string,
        product_id: (row.product_id as string) || null,
        product_name: labelProduct((row.product_id as string) || null, (row.page_path as string) || null),
      });
    }

    const visitors = Array.from(bySession.values());

    // Aggregate by country
    const byCountry: Record<string, number> = {};
    const byPage: Record<string, number> = {};
    const byPageLabel: Record<string, number> = {};
    const byProduct: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const byChannel: Record<string, number> = {};
    const byEvent: Record<string, number> = {};
    const revenueByCountry: Record<string, number> = {};
    const activeFive = new Set<string>();
    const checkoutSessions = new Set<string>();
    const purchaseSessions = new Set<string>();
    let revenue = 0;
    const fiveMinCutoff = Date.now() - 5 * 60000;

    for (const v of visitors) {
      const c = v.country || "??";
      byCountry[c] = (byCountry[c] || 0) + 1;
      if (v.page_path) byPage[v.page_path] = (byPage[v.page_path] || 0) + 1;
      byPageLabel[labelPage(v.page_path)] = (byPageLabel[labelPage(v.page_path)] || 0) + 1;
      if (v.product_name !== "Sin producto") byProduct[v.product_name] = (byProduct[v.product_name] || 0) + 1;
      bySource[v.source] = (bySource[v.source] || 0) + 1;
      byChannel[v.source_channel] = (byChannel[v.source_channel] || 0) + 1;
      if (new Date(v.last_seen).getTime() >= fiveMinCutoff) activeFive.add(v.session_id);
    }

    const recentEvents = rows.slice(0, 120).map((row) => {
      const traffic = classifyReferrer((row.referrer as string) || null);
      const ev = row.event_name as string;
      byEvent[ev] = (byEvent[ev] || 0) + 1;
      const sid = row.session_id as string | null;
      if (ev === "InitiateCheckout" && sid) checkoutSessions.add(sid);
      if (ev === "Purchase" && sid) purchaseSessions.add(sid);
      if (ev === "Purchase" && typeof row.value === "number") {
        const val = Number(row.value || 0);
        revenue += val;
        const country = (row.country as string) || "??";
        revenueByCountry[country] = (revenueByCountry[country] || 0) + val;
      }
      return {
        session_id: sid,
        country: (row.country as string) || null,
        page_path: (row.page_path as string) || null,
        page_label: labelPage((row.page_path as string) || null),
        source: traffic.source,
        source_channel: traffic.channel,
        event_name: ev,
        product_id: (row.product_id as string) || null,
        product_name: labelProduct((row.product_id as string) || null, (row.page_path as string) || null),
        value: typeof row.value === "number" ? Number(row.value) : null,
        currency: (row.currency as string) || null,
        created_at: row.created_at as string,
      };
    });

    for (const row of rows.slice(120)) {
      const ev = row.event_name as string;
      byEvent[ev] = (byEvent[ev] || 0) + 1;
      const sid = row.session_id as string | null;
      if (ev === "InitiateCheckout" && sid) checkoutSessions.add(sid);
      if (ev === "Purchase" && sid) purchaseSessions.add(sid);
      if (ev === "Purchase" && typeof row.value === "number") {
        const val = Number(row.value || 0);
        revenue += val;
        const country = (row.country as string) || "??";
        revenueByCountry[country] = (revenueByCountry[country] || 0) + val;
      }
    }

    return new Response(JSON.stringify({
      windowMinutes: win,
      total: visitors.length,
      activeNow: activeFive.size,
      productViews: byEvent.ViewContent || 0,
      checkouts: byEvent.InitiateCheckout || 0,
      checkoutSessions: checkoutSessions.size,
      purchases: byEvent.Purchase || 0,
      purchaseSessions: purchaseSessions.size,
      revenue,
      byCountry,
      byPage,
      byPageLabel,
      byProduct,
      bySource,
      byChannel,
      byEvent,
      revenueByCountry,
      visitors: visitors.slice(0, 200),
      recentEvents,
      generatedAt: new Date().toISOString(),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("live-visitors error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
