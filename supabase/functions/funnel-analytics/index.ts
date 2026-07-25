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

    // Fetch abandoned carts within window (columnas reales de la tabla)
    const { data: abandoned, error: abandonedErr } = await supabase
      .from("abandoned_carts")
      .select("id, created_at, converted, is_completed, customer_email, product_type")
      .gte("created_at", fromDate.toISOString())
      .lte("created_at", toDate.toISOString());
    if (abandonedErr) console.error("abandoned_carts query failed", abandonedErr);


    // ---------- Aggregation ----------
    const bucketKey = (iso: string) => {
      const d = new Date(iso);
      if (gran === "day") {
        return d.toISOString().slice(0, 10); // YYYY-MM-DD
      }
      // hour → YYYY-MM-DDTHH:00
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

    for (const r of filtered) {
      const k = bucketKey(r.created_at);
      const b = ensure(k);
      const sid = sessionKeyFor(r);
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
          if (!totals.cartSessions.has(sid)) {
            b.addToCart++;
            totals.addToCart++;
            totals.cartSessions.add(sid);
          }
          pAgg.carts++;
          pcAgg.carts++;
          break;
        case "InitiateCheckout":
        case "BeginCheckout": {
          // Direct "Comprar / continuar pago" skips a visible cart but still
          // represents cart intent in the funnel, so checkout sessions are also
          // counted in the cart step if no AddToCart was seen first.
          if (!totals.cartSessions.has(sid)) {
            totals.cartSessions.add(sid);
            b.addToCart++;
            totals.addToCart++;
            pAgg.carts++;
            pcAgg.carts++;
          }

          if (!totals.checkoutSessions.has(sid)) {
            b.checkout++;
            totals.checkout++;
            totals.checkoutSessions.add(sid);
          }
          const src = classifyTrafficSource(r.referrer);
          const country = r.country || "??";
          const key = `${country}::${src}`;
          let sAgg = checkoutBySrcAgg.get(key);
          if (!sAgg) {
            sAgg = { country, source: src, sessions: new Set<string>() };
            checkoutBySrcAgg.set(key, sAgg);
          }
          sAgg.sessions.add(sid);
          break;
        }

        case "Purchase":
        case "purchase": {
          // Purchase counts come from the authoritative sources below
          // (hotmart_purchases[status=approved] + manual_payments[verified]
          // + verified gateway webhooks). Funnel_events Purchase rows may
          // include pending, refunded or test transactions, so we ignore
          // them here to keep the counter aligned with /admin/orders and
          // /admin/hotmart-audit.
          break;
        }
      }
    }

    // ---------- REAL purchases (USD only for revenue) ----------
    const [hotmartRes, manualRes, digitalRes, storeGatewayRes] = await Promise.all([
      supabase
        .from("hotmart_purchases")
        .select("product_id, purchased_at, raw_payload, status, email, transaction_code")
        .in("status", ["approved", "pending"])
        .gte("purchased_at", fromDate.toISOString())
        .lte("purchased_at", toDate.toISOString()),
      supabase
        .from("manual_payments")
        .select("items, amount_usd, buyer_country, created_at, status, verified_at")
        .in("status", ["approved", "verified", "completed", "pending", "in_process", "in_review"])
        .gte("created_at", fromDate.toISOString())
        .lte("created_at", toDate.toISOString()),
      supabase.from("digital_products").select("sku, name, sku_aliases"),
      supabase
        .from("funnel_events")
        .select("id, created_at, product_id, value, currency, country, session_id, referrer")
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
    type RealPurchase = { at: string; productId: string; country: string; usd: number; source: PurchaseSource; pending: boolean };
    const realPurchases: RealPurchase[] = [];
    let hotmartPendingCount = 0;
    let storePendingCount = 0;

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

    for (const h of (hotmartRes.data ?? []) as any[]) {
      // Defensive: PURCHASE_COMPLETE es el fin del periodo de reembolso de una
      // venta ya contada como PURCHASE_APPROVED. Nunca debe sumar como compra
      // nueva. Ignorar aunque el webhook lo haya insertado por error.
      const eventName = String(h.raw_payload?.event || h.raw_payload?.data?.event || "").toUpperCase();
      if (eventName === "PURCHASE_COMPLETE") continue;
      const txn = String(h.transaction_code ?? h.raw_payload?.data?.purchase?.transaction ?? h.raw_payload?.transaction ?? "");
      if (/test|sandbox/i.test(txn)) continue;
      const buyerEmail = String(h.email ?? h.raw_payload?.data?.buyer?.email ?? h.raw_payload?.data?.purchase?.buyer?.email ?? "").toLowerCase();
      if (/test|example\.com|postman|hotmart\.com\.br/.test(buyerEmail)) continue;
      const rawPid = h.product_id || String(h.raw_payload?.data?.product?.id ?? "");
      if (!rawPid || rawPid === "0") continue;
      const purchase = h.raw_payload?.data?.purchase ?? {};
      const price = purchase.price ?? {};
      const currency = String(price.currency_code || price.currency_value || "USD").toUpperCase();
      const amount = Number(price.value || 0);

      // SOLO commissions[PRODUCER, USD]. Sin offer, sin price, sin FX.
      let usdAmount = 0;
      const usdCurrency = "USD";
      const commissions = Array.isArray(purchase.commissions) ? purchase.commissions : [];
      const producerComm = commissions.find((c: any) =>
        String(c?.source || "").toUpperCase() === "PRODUCER" &&
        String(c?.currency_value || c?.currency_code || "").toUpperCase() === "USD"
      );
      if (producerComm && Number(producerComm.value) > 0) {
        usdAmount = Number(producerComm.value);
      }





      const buyerCountry = h.raw_payload?.data?.buyer?.address?.country_iso
        || h.raw_payload?.data?.buyer?.address?.country
        || "??";
      const isPending = h.status === "pending";
      if (isPending) {
        hotmartPendingCount++;
        if (usdAmount > 0) addPending(usdCurrency, "hotmart", usdAmount);
      }
      realPurchases.push({
        at: h.purchased_at,
        productId: rawPid,
        country: buyerCountry,
        usd: isPending ? 0 : usdAmount,
        source: "hotmart",
        pending: isPending,
      });
    }
    for (const m of (manualRes.data ?? []) as any[]) {
      const items = Array.isArray(m.items) ? m.items : [];
      const first = items[0] || {};
      const nameKey = String(first.name || "").trim().toLowerCase();
      const firstSku = first.sku || first.product_id || nameToSku.get(nameKey) || "manual";
      const isPending = !APPROVED_STORE.has(String(m.status || "").toLowerCase());
      if (isPending) {
        storePendingCount++;
        // manual_payments already store amount_usd (USD-normalized)
        const amt = Number(m.amount_usd || 0);
        if (amt > 0) addPending("USD", "store", amt);
      }
      realPurchases.push({
        at: m.verified_at || m.created_at,
        productId: firstSku,
        country: m.buyer_country || "??",
        usd: isPending ? 0 : Number(m.amount_usd || 0),
        source: "store",
        pending: isPending,
      });
    }

    // ---------- Store gateway purchases (Stripe/PayPal/MercadoPago) from funnel_events ----------
    // Avoid double-counting: manual_payments (Yape/Plin + verified checkouts) already ingested.
    // Gateway webhooks write Purchase events with provider metadata in referrer JSON.
    const seenGatewayKeys = new Set<string>();
    // Snapshot of purchases already ingested (hotmart + manual) used to avoid
    // double-counting the browser-side Purchase pixel for the same sale.
    const alreadyIngested = realPurchases.map((p) => ({ at: new Date(p.at).getTime(), productId: p.productId }));
    // Process webhook (gateway) events FIRST, then browser pixels, so a pixel
    // never double-counts a sale a webhook already reported.
    const gatewayEvents: any[] = [];
    const pixelEvents: any[] = [];
    for (const ev of (storeGatewayRes.data ?? []) as any[]) {
      let m: any = {};
      try { m = ev.referrer ? JSON.parse(ev.referrer) : {}; } catch { m = {}; }
      const p = String(m.provider || "").toLowerCase();
      if (["stripe", "paypal", "mercadopago", "mp"].includes(p)) gatewayEvents.push(ev);
      else pixelEvents.push(ev);
    }
    // Solo webhooks verificados (Stripe, PayPal, Mercado Pago) + Hotmart y manual.
    // Los píxeles del navegador NO cuentan como compra.
    for (const ev of gatewayEvents) {

      let meta: any = {};
      try { meta = ev.referrer ? JSON.parse(ev.referrer) : {}; } catch { meta = {}; }
      const provider = String(meta.provider || "").toLowerCase();

      const txn = String(meta.external_reference || meta.payment_id || ev.session_id || ev.id);
      if (/test|sandbox|prueba/i.test(txn)) continue;
      const dedupeKey = `${provider}:${txn}`;
      if (seenGatewayKeys.has(dedupeKey)) continue;
      seenGatewayKeys.add(dedupeKey);
      const currency = String(ev.currency || "USD").toUpperCase();
      const rawAmount = Number(ev.value || 0);
      const usdAmount = currency === "USD" ? rawAmount : toUsd(rawAmount, currency);
      const status = String(meta.status || "approved").toLowerCase();
      const isPending = !APPROVED_STORE.has(status) && status !== "approved";
      const pid = ev.product_id || (meta.skus ? String(meta.skus).split(",")[0].trim() : "store");
      if (!pid || pid === "0") continue;
      if (isPending && usdAmount > 0) {
        storePendingCount++;
        addPending(currency, "store", rawAmount);
      }
      realPurchases.push({
        at: ev.created_at,
        productId: pid,
        country: ev.country || "??",
        usd: isPending ? 0 : usdAmount,
        source: "store",
        pending: isPending,
      });
      // Make this webhook sale visible to the pixel dedupe pass below.
      alreadyIngested.push({ at: new Date(ev.created_at).getTime(), productId: pid });
    }

    console.log("[funnel-analytics] range", fromDate.toISOString(), "→", toDate.toISOString(), "hotmartRows", (hotmartRes.data??[]).length, "manualRows", (manualRes.data??[]).length, "gatewayRows", (storeGatewayRes.data??[]).length, "realPurchases", realPurchases.length);


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

      if (p.pending) {
        pAgg.pending++;
        if (p.source === "hotmart") pAgg.hotmartPending++; else pAgg.storePending++;
      
      } else {
        // Authoritative purchase counters. Aligns totals with
        // /admin/orders and /admin/hotmart-audit (approved only,
        // tests excluded, gateway sandbox filtered).
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
    const cursor = new Date(fromDate);
    if (gran === "hour") {
      cursor.setUTCMinutes(0, 0, 0);
      while (cursor <= toDate) {
        const pad = (n: number) => String(n).padStart(2, "0");
        seriesKeys.push(
          `${cursor.getUTCFullYear()}-${pad(cursor.getUTCMonth() + 1)}-${pad(cursor.getUTCDate())}T${pad(cursor.getUTCHours())}:00`,
        );
        cursor.setUTCHours(cursor.getUTCHours() + 1);
      }
    } else {
      cursor.setUTCHours(0, 0, 0, 0);
      while (cursor <= toDate) {
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

    // Abandoned carts summary (clientes únicos por correo)
    const abandonedRows = abandoned || [];
    const uniqueEmails = new Set(
      abandonedRows.map((c) => String(c.customer_email || "").toLowerCase()).filter(Boolean),
    );
    const abandonedTotal = uniqueEmails.size || abandonedRows.length;
    const abandonedRecovered = abandonedRows.filter((c) => c.converted === true || c.is_completed === true).length;
    const abandonedValue = 0;


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

        conversion: {
          globalPct: Number(globalConversion.toFixed(2)),
          viewToCartPct: Number(cartRate.toFixed(2)),
          cartToCheckoutPct: Number(checkoutRate.toFixed(2)),
          checkoutToPurchasePct: Number(purchaseRate.toFixed(2)),
          abandonedCheckoutPct: Number(abandonedRate.toFixed(2)),
        },
        abandoned: {
          total: abandonedTotal,
          recovered: abandonedRecovered,
          openValue: Number(abandonedValue.toFixed(2)),
          recoveryRatePct: abandonedTotal
            ? Number(((abandonedRecovered / abandonedTotal) * 100).toFixed(2))
            : 0,
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
