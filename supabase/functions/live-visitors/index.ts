import { assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa",
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

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const classifyReferrer = (ref: string | null): { source: string; channel: string; campaign: string | null } => {
  if (!ref) return { source: "Directo", channel: "Directo / manual", campaign: null };
  if (ref === "stripe-webhook") return { source: "Stripe", channel: "Pago", campaign: null };
  if (ref === "hotmart-webhook") return { source: "Hotmart", channel: "Pago", campaign: null };
  if (ref.startsWith("utm:")) {
    const parts = ref.split(":");
    const source = parts[1] || "Campaña";
    const campaign = parts[2] || null;
    const normalized = source.toLowerCase();
    let channel = "Campaña";
    if (["google", "bing", "yahoo", "duckduckgo"].includes(normalized)) channel = "Orgánico / búsqueda";
    else if (["facebook", "fb", "instagram", "ig", "tiktok", "youtube", "yt", "x", "twitter", "threads"].includes(normalized)) channel = "Social";
    else if (["email", "newsletter", "mail", "resend", "brevo"].includes(normalized)) channel = "Email";
    else if (["whatsapp", "wa"].includes(normalized)) channel = "Mensaje directo";
    return { source: cap(source), channel, campaign: campaign || null };
  }
  try {
    const host = new URL(ref).hostname.toLowerCase().replace(/^www\./, "");
    const base = (s: string, c: string) => ({ source: s, channel: c, campaign: null });
    // Email tracking redirect domains (Brevo, Sendinblue, Mailchimp, Resend, etc.)
    if (host.includes("sendibt") || host.includes("sendinblue") || host.includes("brevo")
        || host.includes("mailchi") || host.includes("list-manage") || host.includes("mailgun")
        || host.includes("resend") || host.includes("sendgrid") || host.includes("mcusercontent")) {
      return base("Email", "Email");
    }
    if (host.includes("google")) return base("Google", "Orgánico / búsqueda");
    if (host.includes("bing")) return base("Bing", "Orgánico / búsqueda");
    if (host.includes("yahoo")) return base("Yahoo", "Orgánico / búsqueda");
    if (host.includes("duckduckgo")) return base("DuckDuckGo", "Orgánico / búsqueda");
    if (host.includes("baidu")) return base("Baidu", "Orgánico / búsqueda");
    if (host.includes("yandex")) return base("Yandex", "Orgánico / búsqueda");
    if (host.includes("naver")) return base("Naver", "Orgánico / búsqueda");
    if (host.includes("daum") || host.includes("kakao")) return base("Daum/Kakao", "Orgánico / búsqueda");
    if (host.includes("ecosia") || host.includes("qwant") || host.includes("brave")) return base(cap(host.split(".")[0]), "Orgánico / búsqueda");
    if (host.includes("facebook") || host.includes("fb.") || host === "l.facebook.com" || host === "lm.facebook.com") return base("Facebook", "Social");
    if (host.includes("instagram") || host === "l.instagram.com") return base("Instagram", "Social");
    if (host.includes("messenger")) return base("Messenger", "Social");
    if (host.includes("threads")) return base("Threads", "Social");
    if (host.includes("tiktok")) return base("TikTok", "Social");
    if (host.includes("youtube") || host === "youtu.be") return base("YouTube", "Social");
    if (host.includes("twitter") || host === "t.co" || host.includes("x.com")) return base("Twitter/X", "Social");
    if (host.includes("linkedin") || host === "lnkd.in") return base("LinkedIn", "Social");
    if (host.includes("pinterest") || host === "pin.it") return base("Pinterest", "Social");
    if (host.includes("reddit") || host === "redd.it") return base("Reddit", "Social");
    if (host.includes("snapchat")) return base("Snapchat", "Social");
    if (host.includes("weibo")) return base("Weibo", "Social");
    if (host.includes("wechat") || host.includes("weixin")) return base("WeChat", "Social");
    if (host.includes("line.me") || host === "line.me") return base("LINE", "Social");
    if (host.includes("telegram") || host === "t.me") return base("Telegram", "Mensaje directo");
    if (host.includes("whatsapp") || host === "wa.me" || host === "l.wl.co") return base("WhatsApp", "Mensaje directo");
    if (host.includes("discord")) return base("Discord", "Social");
    if (host.includes("hotmart")) return base("Hotmart", "Pago");
    if (host.includes("paypal")) return base("PayPal", "Pago");
    if (host.includes("stripe")) return base("Stripe", "Pago");
    if (host.includes("mercadopago") || host.includes("mercadolibre")) return base("MercadoPago", "Pago");
    if (host.includes("binance")) return base("Binance", "Pago");
    if (host.includes("amazon")) return base("Amazon", "Marketplace");
    if (host.includes("shopify") || host.includes("myshopify")) return base("Shopify", "Marketplace");
    if (host.includes("ilinguerelax") || host.includes("lovable")) return base("Interno", "Interno");
    return base(host, "Referido");
  } catch { return { source: "Directo", channel: "Directo / manual", campaign: null }; }
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

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

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
        .select("event_name, product_id, value, currency, session_id, country, page_path, referrer, created_at, is_bot, bot_reason, user_agent")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5000),
      fetchGa4Live(),
    ]);
    if (error) throw error;

    const allRows = (data || []).filter((row) => !isAdminPath((row.page_path as string) || null));

    // Split humans vs bots
    const botRows = allRows.filter((r) => (r as { is_bot?: boolean }).is_bot === true);
    const rows = allRows.filter((r) => (r as { is_bot?: boolean }).is_bot !== true);

    // Bot summary
    const botSessions = new Set<string>();
    const botReasonCounts: Record<string, number> = {};
    const botByCountry: Record<string, number> = {};
    for (const b of botRows) {
      const sid = (b.session_id as string) || `anon-${b.created_at}`;
      botSessions.add(sid);
      const reason = ((b as { bot_reason?: string }).bot_reason) || "desconocido";
      botReasonCounts[reason] = (botReasonCounts[reason] || 0) + 1;
      const c = (b.country as string) || "??";
      botByCountry[c] = (botByCountry[c] || 0) + 1;
    }
    const botRecent = botRows.slice(0, 50).map((row) => ({
      session_id: (row.session_id as string) || null,
      country: (row.country as string) || null,
      page_path: (row.page_path as string) || null,
      event_name: row.event_name as string,
      bot_reason: (row as { bot_reason?: string }).bot_reason || null,
      user_agent: (row as { user_agent?: string }).user_agent || null,
      created_at: row.created_at as string,
    }));

    // Group by session — one entry per live visitor with their latest activity
    const bySession = new Map<string, {
      session_id: string;
      country: string | null;
      page_path: string | null;
      referrer: string | null;
      source: string;
      source_channel: string;
      campaign: string | null;
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
        campaign: traffic.campaign,
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
    const byCampaign: Record<string, number> = {};
    const bySourceCountry: Record<string, Record<string, number>> = {};
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
      if (v.campaign) byCampaign[v.campaign] = (byCampaign[v.campaign] || 0) + 1;
      const scMap = bySourceCountry[v.source] || (bySourceCountry[v.source] = {});
      scMap[c] = (scMap[c] || 0) + 1;
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
    // Solo humanos reales del pixel interno (GA4 puede incluir bots/crawlers).
    const activeNow = activeFive.size;
    const totalOut = visitors.length;

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
      byCampaign,
      bySourceCountry,
      byEvent: mergedByEvent,
      revenueByCountry,
      visitors: visitors.slice(0, 200),
      recentEvents,
      bots: {
        events: botRows.length,
        sessions: botSessions.size,
        byReason: botReasonCounts,
        byCountry: botByCountry,
        recent: botRecent,
      },
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
