import { assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa",
};

const isExcludedPath = (p: string | null) =>
  !!p && p.startsWith("/admin");

// Shopify/GA-style sessionization: a browser id becomes a new session after
// 30 minutes of inactivity. Older events used a persistent browser id, so the
// analytics function splits historical rows into real visit sessions here.
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

// Classify a referrer string into a traffic source bucket for the funnel table.
// Only meaningful for real browser events (PageView / InitiateCheckout / etc.);
// gateway-injected Purchase events pack JSON into referrer and are excluded upstream.
type TrafficSource =
  | "pixel_meta"      // Facebook / Instagram / Messenger / Threads (fbclid o hostname)
  | "google_organic"  // google.* sin gclid/utm=cpc
  | "google_ads"      // gclid o utm_medium=cpc/ppc desde google
  | "otro_organico"   // bing/yahoo/duckduckgo/ecosia/yandex/baidu/naver/daum/qwant/brave
  | "social"          // tiktok/youtube/twitter-x/linkedin/pinterest/reddit/snapchat/weibo/wechat/line
  | "mensajeria"      // whatsapp/telegram/messenger link
  | "email"           // utm_source=email / mailchimp / brevo / newsletter / sendgrid / mailgun
  | "referral"        // cualquier otro sitio externo
  | "directo";        // sin referrer
function classifyTrafficSource(referrer: string | null): TrafficSource {
  const raw = (referrer || "").trim().toLowerCase();
  if (!raw) return "directo";
  // Meta (Facebook, Instagram, Messenger, Threads)
  if (raw.includes("fbclid=") || /(?:^|[\/.@])(facebook|instagram|fb|m\.facebook|l\.facebook|lm\.facebook|fb\.watch|messenger|threads\.net)\b/.test(raw)) {
    return "pixel_meta";
  }
  // Email tools (UTMs y dominios de trackers)
  if (/utm_source=(email|newsletter|brevo|mailchimp|resend|sendinblue|sendgrid|mailgun)/.test(raw)
      || raw.includes("mailto:") || raw.includes("brevo.com") || raw.includes("sendinblue")
      || raw.includes("sendibt") || raw.includes("mailchi") || raw.includes("list-manage")
      || raw.includes("mailgun") || raw.includes("sendgrid") || raw.includes("mcusercontent")) {
    return "email";
  }
  // Google ads vs organic
  if (raw.includes("gclid=") || /utm_medium=(cpc|ppc|paid)/.test(raw)) return "google_ads";
  if (/(?:^|[\/.@])google\./.test(raw) || raw.includes("google.com")) return "google_organic";
  if (/(?:^|[\/.@])(bing|yahoo|duckduckgo|ecosia|yandex|baidu|naver|daum|kakao|qwant|brave)\./.test(raw)) return "otro_organico";
  // Mensajería directa
  if (/(?:^|[\/.@])(wa\.me|whatsapp|t\.me|telegram)\b/.test(raw)) return "mensajeria";
  // Redes sociales adicionales
  if (/(?:^|[\/.@])(tiktok|youtube|youtu\.be|twitter|x\.com|t\.co|linkedin|lnkd\.in|pinterest|pin\.it|reddit|redd\.it|snapchat|weibo|wechat|weixin|line\.me|discord)\b/.test(raw)) return "social";
  return "referral";
}



serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const {
      adminKey,
      from,
      to,
      granularity = "hour",
      includeBots = false,
    } = await req.json().catch(() => ({}));

    const expected = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expected || adminKey !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fromDate = from ? new Date(from) : new Date(Date.now() - 24 * 3600 * 1000);
    const toDate = to ? new Date(to) : new Date();
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return new Response(JSON.stringify({ error: "Invalid dates" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const gran: "hour" | "day" = granularity === "day" ? "day" : "hour";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Page in batches of 1000 to avoid PostgREST limits
    const rows: Array<{
      event_name: string;
      product_id: string | null;
      value: number | null;
      session_id: string | null;
      page_path: string | null;
      country: string | null;
      referrer: string | null;
      is_bot: boolean;
      created_at: string;
    }> = [];


    const PAGE = 1000;
    let offset = 0;
    // Hard cap to prevent runaway (up to ~100k events per query)
    for (let i = 0; i < 100; i++) {
      const { data, error } = await supabase
        .from("funnel_events")
        .select("event_name, product_id, value, session_id, page_path, country, referrer, is_bot, created_at")
        .gte("created_at", fromDate.toISOString())
        .lte("created_at", toDate.toISOString())
        .order("created_at", { ascending: true })
        .range(offset, offset + PAGE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      rows.push(...(data as typeof rows));
      if (data.length < PAGE) break;
      offset += PAGE;
    }

    const filtered = rows.filter(
      (r) => !isExcludedPath(r.page_path) && (includeBots || r.is_bot !== true),
    );

    // Fetch abandoned carts from persistent_carts
    const { data: abandonedRaw, error: abandonedErr } = await supabase
      .from("persistent_carts")
      .select("id, created_at, converted, email, items")
      .gte("created_at", fromDate.toISOString())
      .lte("created_at", toDate.toISOString());
    if (abandonedErr) console.error("persistent_carts query failed", abandonedErr);

    const abandoned = (abandonedRaw || []).map((r: Record<string, unknown>) => ({
      ...r,
      customer_email: r.email,
      product_type: Array.isArray(r.items) && r.items.length
        ? String((r.items[0] as Record<string, unknown>)?.id ?? "digital")
        : "digital",
    }));

    // Correos que ya habían abandonado antes del rango
    const { data: priorAbandoned } = await supabase
      .from("persistent_carts")
      .select("email")
      .lt("created_at", fromDate.toISOString());

    const priorEmails = new Set(
      (priorAbandoned || [])
        .map((r) => String(r.customer_email || "").trim().toLowerCase())
        .filter(Boolean),
    );



    // ---------- Aggregation ----------
    // Todos los buckets se calculan en hora de Perú (UTC-5) para que el gráfico
    // muestre la hora local real del negocio.
    const PERU_OFFSET_MS = 5 * 60 * 60 * 1000;
    const toPeru = (d: Date) => new Date(d.getTime() - PERU_OFFSET_MS);
    const bucketKey = (iso: string) => {
      const d = toPeru(new Date(iso));
      if (gran === "day") {
        return d.toISOString().slice(0, 10); // YYYY-MM-DD (Perú)
      }
      // hour → YYYY-MM-DDTHH:00 (Perú)
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:00`;
    };

    type Bucket = {
      bucket: string;
      pageviews: number;
      viewContent: number;
      addToCart: number;
      checkout: number;
      purchases: number;
      revenue: number;
      sessions: Set<string>;
    };
    const buckets = new Map<string, Bucket>();
    const ensure = (k: string): Bucket => {
      let b = buckets.get(k);
      if (!b) {
        b = {
          bucket: k,
          pageviews: 0,
          viewContent: 0,
          addToCart: 0,
          checkout: 0,
          purchases: 0,
          revenue: 0,
          sessions: new Set(),
        };
        buckets.set(k, b);
      }
      return b;
    };

    // Global counters
    const totals = {
      pageviews: 0,
      viewContent: 0,
      addToCart: 0,
      checkout: 0,
      purchases: 0,
      revenue: 0,
      sessions: new Set<string>(),
      purchaseSessions: new Set<string>(),
      checkoutSessions: new Set<string>(),
      cartSessions: new Set<string>(),
    };

    const byProductAgg = new Map<
      string,
      { views: number; carts: number; purchases: number; revenue: number; hotmart: number; store: number; pending: number; hotmartPending: number; storePending: number }
    >();
    const byCountryAgg = new Map<string, { sessions: Set<string>; purchases: number; revenue: number }>();
    // Product × Country breakdown: sessions/views/carts/purchases/revenue per (product_id, country)
    const byProductCountryAgg = new Map<
      string,
      { product_id: string; country: string; sessions: Set<string>; views: number; carts: number; purchases: number; revenue: number }
    >();
    // Checkouts (InitiateCheckout / BeginCheckout) segmented by country + traffic source.
    // Unique sessions per (country, source) pair.
    const checkoutBySrcAgg = new Map<string, { country: string; source: TrafficSource; sessions: Set<string> }>();
    // Global sessions per traffic source (all visitors, not just checkouts)
    const bySourceAgg = new Map<TrafficSource, { sessions: Set<string>; pageviews: number }>();
    // Sessions per URL / page path (top landing/most-visited URLs of the store)
    const byUrlAgg = new Map<string, { sessions: Set<string>; pageviews: number }>();


    const sessionState = new Map<string, { lastSeen: number; index: number }>();
    const sessionKeyFor = (r: { session_id: string | null; created_at: string }) => {
      const base = r.session_id?.trim() || `anon-${r.created_at}`;
      const at = Date.parse(r.created_at);
      if (!Number.isFinite(at)) return `${base}#0`;

      const current = sessionState.get(base);
      if (!current || at - current.lastSeen > SESSION_TIMEOUT_MS || at < current.lastSeen) {
        const index = (current?.index || 0) + 1;
        sessionState.set(base, { lastSeen: at, index });
        return `${base}#${index}`;
      }

      current.lastSeen = at;
      return `${base}#${current.index}`;
    };
    // Identidad estable del visitante (sin el #índice de sesión): un mismo
    // cliente que vuelve más tarde NO debe contar otra vez en "agregar al
    // carrito" ni en "checkouts iniciados".
    const visitorKeyFor = (r: { session_id: string | null; created_at: string }) =>
      r.session_id?.trim() || `anon-${r.created_at}`;
    // Dedupe de carrito por visitante × producto (y × país).
    const cartVisitorProduct = new Set<string>();
    const cartVisitorProductCountry = new Set<string>();

    for (const r of filtered) {
      const k = bucketKey(r.created_at);
      const b = ensure(k);
      const sid = sessionKeyFor(r);
      const vid = visitorKeyFor(r);
      b.sessions.add(sid);
      totals.sessions.add(sid);


      // Traffic source aggregation (per session, based on referrer of first event seen)
      const src = classifyTrafficSource(r.referrer);
      let srcAgg = bySourceAgg.get(src);
      if (!srcAgg) {
        srcAgg = { sessions: new Set(), pageviews: 0 };
        bySourceAgg.set(src, srcAgg);
      }
      srcAgg.sessions.add(sid);
      if (r.event_name === "PageView") srcAgg.pageviews++;

      // URL / page path aggregation
      const url = (r.page_path || "/").split("?")[0] || "/";
      let uAgg = byUrlAgg.get(url);
      if (!uAgg) {
        uAgg = { sessions: new Set(), pageviews: 0 };
        byUrlAgg.set(url, uAgg);
      }
      uAgg.sessions.add(sid);
      if (r.event_name === "PageView") uAgg.pageviews++;

      const cKey = r.country || "??";
      let cAgg = byCountryAgg.get(cKey);
      if (!cAgg) {
        cAgg = { sessions: new Set(), purchases: 0, revenue: 0 };
        byCountryAgg.set(cKey, cAgg);
      }
      cAgg.sessions.add(sid);

      const pKey = r.product_id || "sin_producto";
      let pAgg = byProductAgg.get(pKey);
      if (!pAgg) {
        pAgg = { views: 0, carts: 0, purchases: 0, revenue: 0, hotmart: 0, store: 0, pending: 0, hotmartPending: 0, storePending: 0 };
        byProductAgg.set(pKey, pAgg);
      }

      // Product × Country aggregation (session dedup per pair)
      const pcKey = `${pKey}::${cKey}`;
      let pcAgg = byProductCountryAgg.get(pcKey);
      if (!pcAgg) {
        pcAgg = { product_id: pKey, country: cKey, sessions: new Set(), views: 0, carts: 0, purchases: 0, revenue: 0 };
        byProductCountryAgg.set(pcKey, pcAgg);
      }
      pcAgg.sessions.add(sid);




      switch (r.event_name) {
        case "PageView":
          b.pageviews++;
          totals.pageviews++;
          break;
        case "ViewContent":
          b.viewContent++;
          totals.viewContent++;
          pAgg.views++;
          pcAgg.views++;
          break;
        case "AddToCart":
          if (!totals.cartSessions.has(vid)) {
            b.addToCart++;
            totals.addToCart++;
            totals.cartSessions.add(vid);
          }
          if (!cartVisitorProduct.has(`${vid}::${pKey}`)) {
            cartVisitorProduct.add(`${vid}::${pKey}`);
            pAgg.carts++;
          }
          if (!cartVisitorProductCountry.has(`${vid}::${pcKey}`)) {
            cartVisitorProductCountry.add(`${vid}::${pcKey}`);
            pcAgg.carts++;
          }
          break;
        case "InitiateCheckout":
        case "BeginCheckout": {
          // Direct "Comprar / continuar pago" skips a visible cart but still
          // represents cart intent in the funnel, so checkout sessions are also
          // counted in the cart step if no AddToCart was seen first.
          if (!totals.cartSessions.has(vid)) {
            totals.cartSessions.add(vid);
            b.addToCart++;
            totals.addToCart++;
          }
          if (!cartVisitorProduct.has(`${vid}::${pKey}`)) {
            cartVisitorProduct.add(`${vid}::${pKey}`);
            pAgg.carts++;
          }
          if (!cartVisitorProductCountry.has(`${vid}::${pcKey}`)) {
            cartVisitorProductCountry.add(`${vid}::${pcKey}`);
            pcAgg.carts++;
          }

          if (!totals.checkoutSessions.has(vid)) {
            b.checkout++;
            totals.checkout++;
            totals.checkoutSessions.add(vid);
          }
          const src = classifyTrafficSource(r.referrer);
          const country = r.country || "??";
          const key = `${country}::${src}`;
          let sAgg = checkoutBySrcAgg.get(key);
          if (!sAgg) {
            sAgg = { country, source: src, sessions: new Set<string>() };
            checkoutBySrcAgg.set(key, sAgg);
          }
          sAgg.sessions.add(vid);
          break;
        }


        case "Purchase":
        case "purchase": {
          // Purchase counts come from the authoritative sources below
          // (hotmart_purchases[status=approved] + manual_payments[verified]
          // + verified gateway webhooks). Funnel_events Purchase rows may
          // include pending, refunded or test transactions, so we ignore
          // them here to keep the counter aligned with /admin/orders.
          break;
        }
      }
    }

    // ---------- REAL purchases (USD only for revenue) ----------
    // Note: hotmart_purchases table was dropped. Purchases are now unified in funnel_events
    // with provider: 'hotmart' and referrer/event_data containing the webhook payload.
    const [manualRes, digitalRes, storeGatewayRes] = await Promise.all([
      supabase
        .from("manual_payments")
        .select("order_number, items, amount_usd, amount_local, currency_local, buyer_country, buyer_email, created_at, updated_at, status, verified_at, method")
        .in("status", ["approved", "verified", "completed", "pending", "in_process", "in_review"])
        // Ventana ampliada: un pago creado antes puede verificarse dentro del
        // rango; abajo se filtra por la fecha efectiva (verified_at || created_at).
        .gte("created_at", new Date(fromDate.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString())
        .lte("created_at", toDate.toISOString()),
      supabase.from("digital_products").select("sku, name, sku_aliases"),
      supabase
        .from("funnel_events")
        .select("id, created_at, product_id, value, currency, country, session_id, referrer, page_path, is_bot, provider")
        .in("event_name", ["Purchase", "purchase"])
        .gte("created_at", fromDate.toISOString())
        .lte("created_at", toDate.toISOString()),
    ]);
    const APPROVED_STORE = new Set(["approved", "verified", "completed"]);

    // Build name/slug → SKU maps so aggregation collapses duplicate keys
    // (e.g. URL slug "patrones-especiales-alfabeto..." and display name
    // "Patrones Especiales, Alfabeto..." must resolve to the same SKU row).
    const nameToSku = new Map<string, string>();
    const skuToName = new Map<string, string>();
    const slugToSku = new Map<string, string>();
    const skuSlugs: Array<{ sku: string; slug: string }> = [];
    const slugify = (s: string) =>
      s.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    for (const p of (digitalRes.data ?? []) as any[]) {
      if (p.sku && p.name) {
        const nameKey = p.name.trim().toLowerCase();
        nameToSku.set(nameKey, p.sku);
        skuToName.set(p.sku, p.name);
        const nameSlug = slugify(p.name);
        slugToSku.set(nameSlug, p.sku);
        slugToSku.set(String(p.sku).toLowerCase(), p.sku);
        skuSlugs.push({ sku: p.sku, slug: nameSlug });
        // sku_aliases: legacy SKUs / slugs that must collapse into this SKU
        const aliases = Array.isArray(p.sku_aliases) ? p.sku_aliases : [];
        for (const a of aliases) {
          if (!a) continue;
          const aStr = String(a).trim().toLowerCase();
          slugToSku.set(aStr, p.sku);
          slugToSku.set(slugify(aStr), p.sku);
        }
      }
    }
    // Sort by descending slug length so longer/more specific names win first
    skuSlugs.sort((a, b) => b.slug.length - a.slug.length);
    const canonicalProductKey = (raw: string): string => {
      if (!raw) return raw;
      const trimmed = String(raw).trim();
      const lower = trimmed.toLowerCase();
      // Strip path/query noise: keep last segment only
      const lastSeg = lower.split("?")[0].split("#")[0].split("/").filter(Boolean).pop() || lower;
      const slug = slugify(lastSeg);
      const direct = nameToSku.get(lower) || slugToSku.get(lower) || slugToSku.get(slug) || slugToSku.get(slugify(trimmed));
      if (direct) return direct;
      // Substring fallback: URL slug like "patrones-especiales-alfabeto-ingles-a1" contains SKU slug
      for (const { sku, slug: s } of skuSlugs) {
        if (!s) continue;
        if (slug.includes(s) || s.includes(slug)) return sku;
      }
      return trimmed;
    };


    // ---------- FX rates (USD base) ----------
    // Public, no-key endpoint. Cached in-memory per invocation.
    let fxRates: Record<string, number> = { USD: 1 };
    let fxFetchedAt = new Date().toISOString();
    let fxSource = "open.er-api.com";
    try {
      const fxRes = await fetch("https://open.er-api.com/v6/latest/USD", {
        headers: { "accept": "application/json" },
      });
      if (fxRes.ok) {
        const fxJson = await fxRes.json();
        if (fxJson?.rates && typeof fxJson.rates === "object") {
          fxRates = { ...fxJson.rates, USD: 1 };
          if (fxJson.time_last_update_utc) {
            fxFetchedAt = new Date(fxJson.time_last_update_utc).toISOString();
          }
        }
      }
    } catch (e) {
      console.warn("FX fetch failed, revenue conversions will be 0 for non-USD", e);
    }
    const toUsd = (amount: number, currency: string): number => {
      if (!amount || !currency) return 0;
      const cur = currency.toUpperCase();
      if (cur === "USD") return amount;
      const rate = fxRates[cur];
      if (!rate || rate <= 0) return 0;
      return amount / rate; // rates are "USD -> CUR", so USD = amount / rate
    };

    type PurchaseSource = "hotmart" | "store";
    type RealPurchase = { at: string; productId: string; country: string; usd: number; source: PurchaseSource; pending: boolean; provider: string };
    const realPurchases: RealPurchase[] = [];
    // Conteo/monto por pasarela real (stripe, mercadopago, paypal, dlocalgo,
    // yape_plin, binance_pay, clabe_mx/spei, hotmart...) para el panel.
    const byProviderAgg = new Map<string, { count: number; revenue: number; pending: number }>();
    const addProvider = (provider: string, usd: number, pending: boolean) => {
      const key = provider || "otros";
      const agg = byProviderAgg.get(key) || { count: 0, revenue: 0, pending: 0 };
      if (pending) agg.pending++;
      else { agg.count++; agg.revenue += usd; }
      byProviderAgg.set(key, agg);
    };
    let hotmartPendingCount = 0;
    let storePendingCount = 0;

    // Detalle de compras PENDIENTES (no cuentan como venta hasta aprobarse).
    // Se muestran en /admin/analytics con proveedor, estado y último intento
    // de verificación para revisarlas una por una.
    type PendingDetail = {
      orderNumber: string;
      provider: string;
      source: PurchaseSource;
      status: string;
      email: string;
      country: string;
      product: string;
      amount: number;
      currency: string;
      amountUsd: number;
      createdAt: string;
      lastCheckAt: string | null;
    };
    const pendingDetails: PendingDetail[] = [];

    // Aggregate pending amounts per currency for the FX transparency card
    const pendingByCurrencyAgg = new Map<string, { source: PurchaseSource; amount: number; count: number }[]>();
    const addPending = (currency: string, source: PurchaseSource, amount: number) => {
      const cur = (currency || "USD").toUpperCase();
      const list = pendingByCurrencyAgg.get(cur) ?? [];
      const existing = list.find((x) => x.source === source);
      if (existing) { existing.amount += amount; existing.count += 1; }
      else list.push({ source, amount, count: 1 });
      pendingByCurrencyAgg.set(cur, list);
    };

    // Hotmart purchases are now handled via gatewayEvents block below
    // as they are stored in funnel_events by hotmart-purchase-pixel.
    for (const m of (manualRes.data ?? []) as any[]) {
      const items = Array.isArray(m.items) ? m.items : [];
      const first = items[0] || {};
      const nameKey = String(first.name || "").trim().toLowerCase();
      const firstSku = first.sku || first.product_id || nameToSku.get(nameKey) || "manual";
      const isPending = !APPROVED_STORE.has(String(m.status || "").toLowerCase());
      // Fecha efectiva: si ya fue verificado, la venta cuenta el día de la
      // verificación; si sigue pendiente, el día de creación.
      const effectiveAt = new Date(m.verified_at || m.created_at);
      if (!(effectiveAt >= fromDate && effectiveAt <= toDate)) continue;
      if (isPending) {
        storePendingCount++;
        // manual_payments already store amount_usd (USD-normalized)
        const amt = Number(m.amount_usd || 0);
        if (amt > 0) addPending("USD", "store", amt);
        pendingDetails.push({
          orderNumber: String(m.order_number || "-"),
          provider: String(m.method || "manual").toLowerCase(),
          source: "store",
          status: String(m.status || "pending").toLowerCase(),
          email: String(m.buyer_email || ""),
          country: String(m.buyer_country || "??"),
          product: String(first.name || firstSku),
          amount: Number(m.amount_local || m.amount_usd || 0),
          currency: String(m.currency_local || "USD").toUpperCase(),
          amountUsd: amt,
          createdAt: new Date(m.created_at).toISOString(),
          lastCheckAt: m.updated_at ?? null,
        });
      }
      realPurchases.push({
        at: effectiveAt.toISOString(),
        productId: firstSku,
        country: m.buyer_country || "??",
        usd: isPending ? 0 : Number(m.amount_usd || 0),
        source: "store",
        pending: isPending,
        provider: String(m.method || "manual").toLowerCase(),
      });
    }

    // ---------- Store gateway purchases (Stripe/PayPal/MercadoPago) from funnel_events ----------
    // Avoid double-counting: manual_payments (Yape/Plin + verified checkouts) already ingested.
    // Gateway webhooks write Purchase events with provider metadata in referrer JSON.
    const seenGatewayKeys = new Set<string>();
    // Snapshot of purchases already ingested (hotmart + manual) used to avoid
    // double-counting the browser-side Purchase pixel for the same sale.
    const alreadyIngested = realPurchases.map((p) => ({
      at: new Date(p.at).getTime(),
      productId: p.productId,
      country: String(p.country || "").toUpperCase(),
    }));
    // Process webhook (gateway) events FIRST, then browser pixels, so a pixel
    // never double-counts a sale a webhook already reported.
    const gatewayEvents: any[] = [];
    const pixelEvents: any[] = [];
    // Proveedores con webhook verificado. dLocal Go escribe la compra con la
    // columna `provider` (sin JSON en referrer), por eso se revisan ambas.
    const GATEWAY_PROVIDERS = [
      "stripe", "paypal", "mercadopago", "mercado_pago", "mp",
      "dlocal", "dlocalgo", "dlocal_go", "hotmart",
    ];
    for (const ev of (storeGatewayRes.data ?? []) as any[]) {
      let m: any = {};
      try { m = ev.referrer && ev.referrer.startsWith("{") ? JSON.parse(ev.referrer) : {}; } catch { m = {}; }
      const p = String(m.provider || ev.provider || (ev.referrer === "hotmart-webhook" ? "hotmart" : "")).toLowerCase();
      if (GATEWAY_PROVIDERS.includes(p)) gatewayEvents.push(ev);
      else pixelEvents.push(ev);
    }
    // Solo webhooks verificados (Stripe, PayPal, Mercado Pago, dLocal Go) + Hotmart y manual.
    // Los píxeles del navegador NO cuentan como compra.
    for (const ev of gatewayEvents) {

      let meta: any = {};
      try { 
        meta = ev.referrer && ev.referrer.startsWith("{") ? JSON.parse(ev.referrer) : (ev.event_data || {}); 
      } catch { meta = ev.event_data || {}; }
      
      const provider = String(meta.provider || ev.provider || (ev.referrer === "hotmart-webhook" ? "hotmart" : "")).toLowerCase();
      
      const txn = String(meta.external_reference || meta.payment_id || meta.transaction || meta.transaction_code || ev.session_id || ev.id);
      if (/test|sandbox|prueba/i.test(txn)) continue;
      const dedupeKey = `${provider}:${txn}`;
      if (seenGatewayKeys.has(dedupeKey)) continue;
      seenGatewayKeys.add(dedupeKey);
      const currency = String(ev.currency || "USD").toUpperCase();
      const rawAmount = Number(ev.value || 0);
      const usdAmount = currency === "USD" ? rawAmount : toUsd(rawAmount, currency);
      const status = String(meta.status || "approved").toLowerCase();
      const isPending = !APPROVED_STORE.has(status) && status !== "approved" && status !== "complete" && status !== "completed";
      const pid = ev.product_id || (meta.skus ? String(meta.skus).split(",")[0].trim() : "store");
      if (!pid || pid === "0") continue;
      if (isPending && usdAmount > 0) {
        if (provider === "hotmart") hotmartPendingCount++; else storePendingCount++;
        addPending(currency, provider === "hotmart" ? "hotmart" : "store", rawAmount);
        pendingDetails.push({
          orderNumber: String(meta.order_number || meta.external_reference || meta.transaction || meta.transactionCode || txn || "-"),
          provider,
          source: provider === "hotmart" ? "hotmart" : "store",
          status,
          email: String(meta.email || meta.customer_email || meta.buyer_email || ev.email || ""),
          country: String(ev.country || meta.country || "??"),
          product: String(meta.product_name || meta.name || ev.product_id || pid),
          amount: rawAmount,
          currency,
          amountUsd: usdAmount,
          createdAt: ev.created_at,
          lastCheckAt: ev.created_at,
        });
      }
      realPurchases.push({
        at: ev.created_at,
        productId: pid,
        country: ev.country || "??",
        usd: isPending ? 0 : usdAmount,
        source: provider === "hotmart" ? "hotmart" : "store",
        pending: isPending,
        provider,
      });
      // Make this webhook sale visible to the pixel dedupe pass below.
      alreadyIngested.push({
        at: new Date(ev.created_at).getTime(),
        productId: pid,
        country: String(ev.country || "").toUpperCase(),
      });
    }

    // Respaldo para pagos cuyo webhook no llegó: CheckoutSuccess solo emite
    // Purchase después de volver del proveedor con referencia de pago y con el
    // comprador/carrito presentes. No contamos visitas directas, bots ni filas
    // sin producto/importe. Si el webhook sí existe, la ventana evita duplicarlo.
    for (const ev of pixelEvents) {
      if (ev.page_path !== "/checkouts/success" || ev.is_bot === true) continue;
      const pid = String(ev.product_id || "").trim();
      const rawAmount = Number(ev.value || 0);
      if (!pid || pid === "0" || !Number.isFinite(rawAmount) || rawAmount <= 0) continue;

      const eventAt = new Date(ev.created_at).getTime();
      const evCountry = String(ev.country || "").toUpperCase();
      // El píxel del navegador usa el slug del producto y el webhook usa el SKU
      // real (p. ej. "5000-palabras-ingles" vs "product-spanish-5000-physical"),
      // así que la deduplicación NO puede depender del product_id: una venta ya
      // registrada por webhook en el mismo país y dentro de 30 min es la misma.
      const duplicatedByWebhook = alreadyIngested.some((known) => {
        if (Math.abs(known.at - eventAt) > 30 * 60 * 1000) return false;
        if (known.productId === pid) return true;
        return !!evCountry && !!known.country && known.country === evCountry;
      });
      if (duplicatedByWebhook) continue;

      const currency = String(ev.currency || "USD").toUpperCase();
      realPurchases.push({
        at: ev.created_at,
        productId: pid,
        country: ev.country || "??",
        usd: currency === "USD" ? rawAmount : toUsd(rawAmount, currency),
        source: "store",
        pending: false,
        provider: "otros",
      });
      alreadyIngested.push({ at: eventAt, productId: pid, country: evCountry });
    }


    console.log("[funnel-analytics] range", fromDate.toISOString(), "→", toDate.toISOString(), "manualRows", (manualRes.data??[]).length, "gatewayRows", (storeGatewayRes.data??[]).length, "realPurchases", realPurchases.length);


    // Último intento de verificación por pedido (order_events registra cada
    // consulta/webhook del proveedor). Enriquece el detalle de pendientes.
    if (pendingDetails.length > 0) {
      const orderNumbers = Array.from(
        new Set(pendingDetails.map((p) => p.orderNumber).filter((o) => o && o !== "-")),
      ).slice(0, 200);
      if (orderNumbers.length > 0) {
        const { data: evRows } = await supabase
          .from("order_events")
          .select("order_number, created_at, event, status")
          .in("order_number", orderNumbers)
          .order("created_at", { ascending: false })
          .limit(1000);
        const lastByOrder = new Map<string, { at: string; event: string; status: string | null }>();
        for (const r of (evRows ?? []) as any[]) {
          if (!lastByOrder.has(r.order_number)) {
            lastByOrder.set(r.order_number, { at: r.created_at, event: r.event, status: r.status ?? null });
          }
        }
        for (const p of pendingDetails) {
          const last = lastByOrder.get(p.orderNumber);
          if (last) {
            p.lastCheckAt = last.at;
            if (last.status) p.status = String(last.status).toLowerCase();
          }
        }
      }
      pendingDetails.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const pendingByCurrency = Array.from(pendingByCurrencyAgg.entries()).map(([currency, breakdown]) => {
      const totalAmount = breakdown.reduce((s, x) => s + x.amount, 0);
      const rate = fxRates[currency] ?? null;
      return {
        currency,
        rate,                         // 1 USD = <rate> <currency>
        rateInverse: rate ? 1 / rate : null, // 1 <currency> = <rateInverse> USD
        amount: Number(totalAmount.toFixed(2)),
        usdEquivalent: Number(toUsd(totalAmount, currency).toFixed(2)),
        breakdown: breakdown.map((b) => ({
          source: b.source,
          count: b.count,
          amount: Number(b.amount.toFixed(2)),
          usdEquivalent: Number(toUsd(b.amount, currency).toFixed(2)),
        })),
      };
    }).sort((a, b) => b.usdEquivalent - a.usdEquivalent);


    for (const p of realPurchases) {
      const k = bucketKey(p.at);
      const b = ensure(k);
      const pAgg = byProductAgg.get(p.productId) || { views: 0, carts: 0, purchases: 0, revenue: 0, hotmart: 0, store: 0, pending: 0, hotmartPending: 0, storePending: 0 };
      addProvider(p.provider, p.usd, p.pending);


      if (p.pending) {
        pAgg.pending++;
        if (p.source === "hotmart") pAgg.hotmartPending++; else pAgg.storePending++;
      
      } else {
        // Authoritative purchase counters. Aligns totals with
        // /admin/orders (approved only, tests excluded, gateway sandbox filtered).
        b.purchases++;
        totals.purchases++;
        b.revenue += p.usd;
        totals.revenue += p.usd;
        pAgg.purchases++;
        pAgg.revenue += p.usd;
        if (p.source === "hotmart") pAgg.hotmart++; else pAgg.store++;

        const cAgg = byCountryAgg.get(p.country) || { sessions: new Set<string>(), purchases: 0, revenue: 0 };
        cAgg.purchases++;
        cAgg.revenue += p.usd;
        byCountryAgg.set(p.country, cAgg);

        // Product × Country purchase attribution
        const pcKey = `${p.productId}::${p.country || "??"}`;
        let pcAgg = byProductCountryAgg.get(pcKey);
        if (!pcAgg) {
          pcAgg = { product_id: p.productId, country: p.country || "??", sessions: new Set(), views: 0, carts: 0, purchases: 0, revenue: 0 };
          byProductCountryAgg.set(pcKey, pcAgg);
        }
        pcAgg.purchases++;
        pcAgg.revenue += p.usd;
      }
      byProductAgg.set(p.productId, pAgg);
    }


    // Product names: use the same digital_products fetch from earlier
    const nameMap = skuToName;



    // Fill missing buckets so the chart renders zeros
    const seriesKeys: string[] = [];
    const cursor = toPeru(new Date(fromDate));
    const toDatePeru = toPeru(toDate);
    if (gran === "hour") {
      cursor.setUTCMinutes(0, 0, 0);
      while (cursor <= toDatePeru) {
        const pad = (n: number) => String(n).padStart(2, "0");
        seriesKeys.push(
          `${cursor.getUTCFullYear()}-${pad(cursor.getUTCMonth() + 1)}-${pad(cursor.getUTCDate())}T${pad(cursor.getUTCHours())}:00`,
        );
        cursor.setUTCHours(cursor.getUTCHours() + 1);
      }
    } else {
      cursor.setUTCHours(0, 0, 0, 0);
      while (cursor <= toDatePeru) {
        seriesKeys.push(cursor.toISOString().slice(0, 10));
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    }
    const series = seriesKeys.map((k) => {
      const b = buckets.get(k);
      return {
        bucket: k,
        pageviews: b?.pageviews || 0,
        viewContent: b?.viewContent || 0,
        addToCart: b?.addToCart || 0,
        checkout: b?.checkout || 0,
        purchases: b?.purchases || 0,
        revenue: Number((b?.revenue || 0).toFixed(2)),
        sessions: b?.sessions.size || 0,
      };
    });

    // Abandoned carts summary (clientes únicos por correo, sin correos de prueba)
    const isTestEmail = (e: string) => /prueba|test|ejemplo|example\.com|\+test/i.test(e);
    const abandonedRows = (abandoned || []).filter(
      (c) => !isTestEmail(String(c.customer_email || "")),
    );
    const uniqueEmails = new Set(
      abandonedRows.map((c) => String(c.customer_email || "").trim().toLowerCase()).filter(Boolean),
    );
    const newEmails = Array.from(uniqueEmails).filter((e) => !priorEmails.has(e));
    const abandonedTotal = uniqueEmails.size;
    const abandonedNew = newEmails.length;
    const abandonedReturning = abandonedTotal - abandonedNew;
    const recoveredEmails = new Set(
      abandonedRows
        .filter((c) => c.converted === true || c.is_completed === true)
        .map((c) => String(c.customer_email || "").trim().toLowerCase())
        .filter(Boolean),
    );
    const abandonedRecovered = recoveredEmails.size;
    // Carritos que siguen abiertos = clientes identificados que aún no compraron.
    const abandonedOpen = Math.max(0, abandonedTotal - abandonedRecovered);
    const abandonedValue = 0;

    // ---------- Carritos abandonados unificados (3 fuentes) ----------
    // 1) Hotmart  → abandoned_carts (PURCHASE_OUT_OF_SHOPPING_CART)
    // 2) Tienda   → persistent_carts (checkout propio)
    // 3) Checkout → checkout_rate_hits (/admin/checkouts-abuse), incluye visitas sin correo
    const purchasedEmails = new Set(
      realPurchases
        .map((p: any) => String(p.email || "").trim().toLowerCase())
        .filter(Boolean),
    );

    const [persistentRes, hitsRes] = await Promise.all([
      supabase
        .from("persistent_carts")
        .select("email, converted, country, created_at, last_activity")
        .gte("created_at", fromDate.toISOString())
        .lte("created_at", toDate.toISOString()),
      supabase
        .from("checkout_rate_hits")
        .select("email, country, created_at")
        .gte("created_at", fromDate.toISOString())
        .lte("created_at", toDate.toISOString()),
    ]);
    if (persistentRes.error) console.error("persistent_carts query failed", persistentRes.error);
    if (hitsRes.error) console.error("checkout_rate_hits query failed", hitsRes.error);

    const norm = (e: unknown) => String(e || "").trim().toLowerCase();

    // Hotmart (abandoned_carts) → abiertos = no convertidos y sin compra registrada
    const hotmartAbandonedEmails = new Set(
      Array.from(uniqueEmails).filter(
        (e) => !recoveredEmails.has(e) && !purchasedEmails.has(e),
      ),
    );

    // Tienda propia (persistent_carts)
    const storeAllEmails = new Set<string>();
    const storeRecovered = new Set<string>();
    for (const c of (persistentRes.data ?? []) as any[]) {
      const e = norm(c.email);
      if (!e || isTestEmail(e)) continue;
      storeAllEmails.add(e);
      if (c.converted === true || purchasedEmails.has(e)) storeRecovered.add(e);
    }
    const storeAbandonedEmails = new Set(
      Array.from(storeAllEmails).filter((e) => !storeRecovered.has(e)),
    );

    // Visitantes del checkout (checkout_rate_hits)
    const hitsRows = (hitsRes.data ?? []) as any[];
    const hitsEmails = new Set<string>();
    let hitsNoEmail = 0;
    for (const h of hitsRows) {
      const e = norm(h.email);
      if (e && !isTestEmail(e)) hitsEmails.add(e);
      else if (!e) hitsNoEmail++;
    }
    const checkoutAbandonedEmails = new Set(
      Array.from(hitsEmails).filter((e) => !purchasedEmails.has(e)),
    );

    // Unificado (una persona = un correo, sin importar la fuente)
    const unifiedAbandoned = new Set<string>([
      ...hotmartAbandonedEmails,
      ...storeAbandonedEmails,
      ...checkoutAbandonedEmails,
    ]);

    const abandonedSources = {
      hotmart: {
        label: "Hotmart (carrito abandonado)",
        total: uniqueEmails.size,
        open: hotmartAbandonedEmails.size,
        recovered: recoveredEmails.size,
      },
      store: {
        label: "Tienda propia (checkout interno)",
        total: storeAllEmails.size,
        open: storeAbandonedEmails.size,
        recovered: storeRecovered.size,
      },
      checkoutVisitors: {
        label: "Visitantes del checkout",
        total: hitsEmails.size + hitsNoEmail,
        open: checkoutAbandonedEmails.size,
        withoutEmail: hitsNoEmail,
        recovered: Math.max(0, hitsEmails.size - checkoutAbandonedEmails.size),
      },
      unifiedPeople: unifiedAbandoned.size,
    };




    // Conversion metrics
    const sessions = totals.sessions.size;
    const cartRate = sessions ? (totals.addToCart / sessions) * 100 : 0;
    const checkoutRate = totals.addToCart ? (totals.checkout / totals.addToCart) * 100 : 0;
    const purchaseRate = totals.checkout ? (totals.purchases / totals.checkout) * 100 : 0;
    const globalConversion = sessions ? (totals.purchases / sessions) * 100 : 0;
    const abandonedRate = totals.checkout
      ? ((totals.checkout - totals.purchases) / totals.checkout) * 100
      : 0;

    // Collapse duplicate keys (URL slug vs display name vs SKU) into one row per canonical SKU.
    const mergedByProduct = new Map<string, { views: number; carts: number; purchases: number; revenue: number; hotmart: number; store: number; pending: number; hotmartPending: number; storePending: number }>();
    for (const [pid, v] of byProductAgg.entries()) {
      if (!pid || pid === "sin_producto" || pid === "0" || pid === "manual") continue;
      if ((v.views + v.carts + v.purchases + v.pending) === 0) continue;
      const key = canonicalProductKey(pid);
      const existing = mergedByProduct.get(key);
      if (!existing) {
        mergedByProduct.set(key, { ...v });
      } else {
        existing.views += v.views;
        existing.carts += v.carts;
        existing.purchases += v.purchases;
        existing.revenue += v.revenue;
        existing.hotmart += v.hotmart;
        existing.store += v.store;
        existing.pending += v.pending;
        existing.hotmartPending += v.hotmartPending;
        existing.storePending += v.storePending;
      }
    }
    const byProduct = Array.from(mergedByProduct.entries())
      .map(([product_id, v]) => {
        const source =
          v.hotmart && v.store ? "mixto" :
          v.hotmart ? "hotmart" :
          v.store ? "store" :
          v.pending ? "hotmart" :
          "—";
        return {
          product_id,
          name: nameMap.get(product_id) || null,
          source,
          hotmart_purchases: v.hotmart,
          store_purchases: v.store,
          pending: v.pending,
          hotmart_pending: v.hotmartPending,
          store_pending: v.storePending,
          views: v.views,
          carts: v.carts,
          purchases: v.purchases,
          revenue: Number(v.revenue.toFixed(2)),
          conversion: v.views ? Number(((v.purchases / v.views) * 100).toFixed(2)) : 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue || b.purchases - a.purchases || b.pending - a.pending)
      .slice(0, 30);



    const byCountry = Array.from(byCountryAgg.entries())
      .map(([country, v]) => ({
        country,
        sessions: v.sessions.size,
        purchases: v.purchases,
        revenue: Number(v.revenue.toFixed(2)),
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 30);

    const checkoutsByCountrySource = Array.from(checkoutBySrcAgg.values())
      .map((v) => ({ country: v.country, source: v.source, sessions: v.sessions.size }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 100);

    const bySource = Array.from(bySourceAgg.entries())
      .map(([source, v]) => ({ source, sessions: v.sessions.size, pageviews: v.pageviews }))
      .sort((a, b) => b.sessions - a.sessions);

    const byUrl = Array.from(byUrlAgg.entries())
      .map(([url, v]) => ({ url, sessions: v.sessions.size, pageviews: v.pageviews }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 30);

    // Product × Country breakdown, filtered to products with real activity.
    // Collapse duplicate product keys (slug vs name vs SKU) into one row per (SKU, country).
    const validProductIds = new Set(byProduct.map((p) => p.product_id));
    const mergedPC = new Map<string, { product_id: string; country: string; sessionsIds: Set<string>; views: number; carts: number; purchases: number; revenue: number }>();
    for (const v of byProductCountryAgg.values()) {
      const canon = canonicalProductKey(v.product_id);
      if (!validProductIds.has(canon)) continue;
      if ((v.sessions.size + v.views + v.carts + v.purchases) === 0) continue;
      const k = `${canon}::${v.country}`;
      let m = mergedPC.get(k);
      if (!m) {
        m = { product_id: canon, country: v.country, sessionsIds: new Set(), views: 0, carts: 0, purchases: 0, revenue: 0 };
        mergedPC.set(k, m);
      }
      for (const s of v.sessions) m.sessionsIds.add(s);
      m.views += v.views;
      m.carts += v.carts;
      m.purchases += v.purchases;
      m.revenue += v.revenue;
    }
    const byProductCountry = Array.from(mergedPC.values())
      .map((v) => ({
        product_id: v.product_id,
        name: nameMap.get(v.product_id) || null,
        country: v.country,
        sessions: v.sessionsIds.size,
        views: v.views,
        carts: v.carts,
        purchases: v.purchases,
        revenue: Number(v.revenue.toFixed(2)),
      }))
      .sort((a, b) => b.revenue - a.revenue || b.purchases - a.purchases || b.sessions - a.sessions)
      .slice(0, 200);



    return new Response(
      JSON.stringify({
        range: { from: fromDate.toISOString(), to: toDate.toISOString(), granularity: gran },
        totals: {
          sessions,
          pageviews: totals.pageviews,
          viewContent: totals.viewContent,
          addToCart: totals.addToCart,
          checkout: totals.checkout,
          purchases: totals.purchases,
          revenue: Number(totals.revenue.toFixed(2)),
          purchaseSessions: totals.purchaseSessions.size,
          checkoutSessions: totals.checkoutSessions.size,
          cartSessions: totals.cartSessions.size,
          hotmartPending: hotmartPendingCount,
          storePending: storePendingCount,
          pending: hotmartPendingCount + storePendingCount,
        },
        // Desglose real por pasarela: stripe, mercadopago, paypal, dlocalgo,
        // yape_plin, binance_pay, clabe_mx (SPEI), hotmart, etc.
        providers: Array.from(byProviderAgg.entries())
          .map(([provider, v]) => ({
            provider,
            count: v.count,
            pending: v.pending,
            revenue: Number(v.revenue.toFixed(2)),
          }))
          .sort((a, b) => b.count - a.count || b.revenue - a.revenue),

        // Compras pendientes (no cuentan como venta hasta aprobarse), con
        // proveedor, estado y último intento de verificación.
        pendingOrders: pendingDetails.slice(0, 100).map((p) => ({
          ...p,
          amount: Number((p.amount || 0).toFixed(2)),
          amountUsd: Number((p.amountUsd || 0).toFixed(2)),
        })),


        conversion: {
          globalPct: Number(globalConversion.toFixed(2)),
          viewToCartPct: Number(cartRate.toFixed(2)),
          cartToCheckoutPct: Number(checkoutRate.toFixed(2)),
          checkoutToPurchasePct: Number(purchaseRate.toFixed(2)),
          abandonedCheckoutPct: Number(abandonedRate.toFixed(2)),
        },
        abandoned: {
          total: abandonedTotal,
          open: abandonedOpen,
          newCustomers: abandonedNew,
          returningCustomers: abandonedReturning,
          recovered: abandonedRecovered,
          // Sesiones que llegaron al checkout y no compraron (incluye anónimos sin correo)
          checkoutNoPurchase: Math.max(0, totals.checkout - totals.purchases),
          openValue: Number(abandonedValue.toFixed(2)),
          recoveryRatePct: abandonedTotal
            ? Number(((abandonedRecovered / abandonedTotal) * 100).toFixed(2))
            : 0,
          sources: abandonedSources,
        },


        series,
        byProduct,
        byProductCountry,
        byCountry,
        checkoutsByCountrySource,
        bySource,
        byUrl,


        fx: {
          base: "USD",
          source: fxSource,
          fetchedAt: fxFetchedAt,
          computedAt: new Date().toISOString(),
          rates: fxRates,
          pendingByCurrency,
        },
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("funnel-analytics error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
