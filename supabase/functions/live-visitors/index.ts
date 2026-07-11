import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---------- GA4 auth ----------
async function getGa4AccessToken(): Promise<string> {
  const raw = Deno.env.get("GA4_SERVICE_ACCOUNT_JSON");
  if (!raw) throw new Error("GA4_SERVICE_ACCOUNT_JSON not set");
  const sa = JSON.parse(raw);
  const pem = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8", der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["sign"],
  );
  const jwt = await create(
    { alg: "RS256", typ: "JWT" },
    {
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: getNumericDate(3600),
      iat: getNumericDate(0),
    },
    key,
  );
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`GA4 token error [${res.status}]: ${await res.text()}`);
  return (await res.json()).access_token as string;
}

async function ga4Realtime(propertyId: string, token: string, body: unknown) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) { console.warn("GA4 realtime failed", res.status, await res.text()); return null; }
  return await res.json();
}

interface Ga4Live {
  activeUsers: number;
  byCountry: Record<string, number>;
  byPage: Record<string, number>;
  byEvent: Record<string, number>;
}

async function fetchGa4Live(): Promise<Ga4Live | null> {
  try {
    const propertyId = Deno.env.get("GA4_PROPERTY_ID");
    if (!propertyId) return null;
    const token = await getGa4AccessToken();
    const [total, byCountry, byPage, byEvent] = await Promise.all([
      ga4Realtime(propertyId, token, { metrics: [{ name: "activeUsers" }] }),
      ga4Realtime(propertyId, token, { dimensions: [{ name: "countryId" }], metrics: [{ name: "activeUsers" }], limit: 50 }),
      ga4Realtime(propertyId, token, { dimensions: [{ name: "unifiedScreenName" }], metrics: [{ name: "screenPageViews" }], limit: 20 }),
      ga4Realtime(propertyId, token, { dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }], limit: 30 }),
    ]);
    const readMap = (r: unknown): Record<string, number> => {
      const out: Record<string, number> = {};
      const rows = (r as { rows?: Array<{ dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }> })?.rows || [];
      for (const row of rows) {
        const k = row.dimensionValues?.[0]?.value || "";
        const v = parseInt(row.metricValues?.[0]?.value || "0", 10) || 0;
        if (k) out[k] = (out[k] || 0) + v;
      }
      return out;
    };
    return {
      activeUsers: parseInt((total as { rows?: Array<{ metricValues?: Array<{ value?: string }> }> })?.rows?.[0]?.metricValues?.[0]?.value || "0", 10) || 0,
      byCountry: readMap(byCountry),
      byPage: readMap(byPage),
      byEvent: readMap(byEvent),
    };
  } catch (e) {
    console.warn("GA4 live fetch failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

const classifyReferrer = (ref: string | null): { source: string; channel: string } => {
  if (!ref) return { source: "Directo", channel: "Directo / manual" };
  if (ref === "stripe-webhook") return { source: "Stripe", channel: "Pago" };
  if (ref === "hotmart-webhook") return { source: "Hotmart", channel: "Pago" };
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

    // "en vivo ahora": ventana corta de segundos (default 60s), max 5 min
    const winSec = Math.min(Math.max(parseInt(String(windowMinutes)) * 60 || 60, 15), 300);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const since = new Date(Date.now() - winSec * 1000).toISOString();
    const win = winSec / 60;

    const [{ data, error }, ga4] = await Promise.all([
      supabase
        .from("funnel_events")
        .select("event_name, product_id, value, currency, session_id, country, page_path, referrer, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5000),
      fetchGa4Live(),
    ]);
    if (error) throw error;

    const BOT_REF = /(bot|crawler|spider|semrush|ahrefs|mj12|petalbot|yandex|baiduspider|pingdom|uptime|gtmetrix|pagespeed|lighthouse)/i;
    const rows = (data || []).filter((row) => {
      if (isAdminPath((row.page_path as string) || null)) return false;
      const ref = (row.referrer as string) || "";
      if (BOT_REF.test(ref)) return false;
      return true;
    });

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
    const countedPurchases = new Set<string>();
    let revenue = 0;
    const fiveMinCutoff = Date.now() - 5 * 60000;

    const recordPurchase = (row: Record<string, unknown>) => {
      const sid = row.session_id as string | null;
      const purchaseKey = sid || `${row.product_id || "purchase"}:${row.value || 0}:${row.created_at || ""}`;
      if (sid) purchaseSessions.add(sid);
      if (countedPurchases.has(purchaseKey)) return;
      countedPurchases.add(purchaseKey);
      if (typeof row.value === "number") {
        const val = Number(row.value || 0);
        revenue += val;
        const country = (row.country as string) || "??";
        revenueByCountry[country] = (revenueByCountry[country] || 0) + val;
      }
    };

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
      if (ev === "Purchase") recordPurchase(row as Record<string, unknown>);
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
      if (ev === "Purchase") recordPurchase(row as Record<string, unknown>);
    }

    // ---- Merge GA4 realtime into the live snapshot ----
    const mergedByCountry = { ...byCountry };
    const mergedByPageLabel = { ...byPageLabel };
    const mergedByEvent = { ...byEvent };
    if (ga4) {
      for (const [c, n] of Object.entries(ga4.byCountry)) {
        mergedByCountry[c] = Math.max(mergedByCountry[c] || 0, n);
      }
      for (const [p, n] of Object.entries(ga4.byPage)) {
        mergedByPageLabel[p] = Math.max(mergedByPageLabel[p] || 0, n);
      }
      for (const [e, n] of Object.entries(ga4.byEvent)) {
        mergedByEvent[e] = Math.max(mergedByEvent[e] || 0, n);
      }
    }
    const ga4Active = ga4?.activeUsers || 0;
    const activeNow = Math.max(activeFive.size, ga4Active);
    const totalOut = Math.max(visitors.length, ga4Active);

    return new Response(JSON.stringify({
      windowMinutes: win,
      total: totalOut,
      activeNow,
      ga4ActiveUsers: ga4Active,
      ga4Available: !!ga4,
      productViews: mergedByEvent.ViewContent || mergedByEvent.view_item || 0,
      checkouts: byEvent.InitiateCheckout || mergedByEvent.begin_checkout || 0,
      checkoutSessions: checkoutSessions.size,
      purchases: purchaseSessions.size,
      purchaseSessions: purchaseSessions.size,
      revenue,
      byCountry: mergedByCountry,
      byPage,
      byPageLabel: mergedByPageLabel,
      byProduct,
      bySource,
      byChannel,
      byEvent: mergedByEvent,
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
