import { assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa",
};

const isAdminPath = (p: string | null) =>
  !!p && (p.startsWith("/admin") || p.startsWith("/checkouts/"));

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
      is_bot: boolean;
      created_at: string;
    }> = [];

    const PAGE = 1000;
    let offset = 0;
    // Hard cap to prevent runaway (up to ~100k events per query)
    for (let i = 0; i < 100; i++) {
      const { data, error } = await supabase
        .from("funnel_events")
        .select("event_name, product_id, value, session_id, page_path, country, is_bot, created_at")
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
      (r) => !isAdminPath(r.page_path) && (includeBots || r.is_bot !== true),
    );

    // Fetch abandoned carts within window
    const { data: abandoned } = await supabase
      .from("abandoned_carts")
      .select("id, created_at, recovered_at, total_amount, currency")
      .gte("created_at", fromDate.toISOString())
      .lte("created_at", toDate.toISOString());

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
      { views: number; carts: number; purchases: number; revenue: number; hotmart: number; store: number; pending: number }
    >();
    const byCountryAgg = new Map<string, { sessions: Set<string>; purchases: number; revenue: number }>();



    for (const r of filtered) {
      const k = bucketKey(r.created_at);
      const b = ensure(k);
      const sid = r.session_id || `anon-${r.created_at}`;
      b.sessions.add(sid);
      totals.sessions.add(sid);

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
        pAgg = { views: 0, carts: 0, purchases: 0, revenue: 0, hotmart: 0, store: 0 };
        byProductAgg.set(pKey, pAgg);
      }


      switch (r.event_name) {
        case "PageView":
          b.pageviews++;
          totals.pageviews++;
          break;
        case "ViewContent":
          b.viewContent++;
          totals.viewContent++;
          pAgg.views++;
          break;
        case "AddToCart":
          b.addToCart++;
          totals.addToCart++;
          totals.cartSessions.add(sid);
          pAgg.carts++;
          break;
        case "InitiateCheckout":
        case "BeginCheckout":
          b.checkout++;
          totals.checkout++;
          totals.checkoutSessions.add(sid);
          break;
        // Purchase events from the pixel are IGNORED — real purchases come
        // from Hotmart webhooks, Shopify orders, and verified manual payments.
      }
    }

    // ---------- REAL purchases (USD only for revenue) ----------
    const [hotmartRes, manualRes] = await Promise.all([
      supabase
        .from("hotmart_purchases")
        .select("product_id, purchased_at, raw_payload, status")
        .eq("status", "approved")
        .gte("purchased_at", fromDate.toISOString())
        .lte("purchased_at", toDate.toISOString()),
      supabase
        .from("manual_payments")
        .select("items, amount_usd, buyer_country, created_at, status, verified_at")
        .in("status", ["approved", "verified", "completed"])
        .gte("created_at", fromDate.toISOString())
        .lte("created_at", toDate.toISOString()),
    ]);
    const shopifyRes = { data: [] as any[] };

    type PurchaseSource = "hotmart" | "store";
    type RealPurchase = { at: string; productId: string; country: string; usd: number; source: PurchaseSource };
    const realPurchases: RealPurchase[] = [];

    for (const h of (hotmartRes.data ?? []) as any[]) {
      const txn = String(h.raw_payload?.data?.purchase?.transaction ?? "");
      // Skip test/sandbox transactions
      if (/test|sandbox/i.test(txn)) continue;
      const price = h.raw_payload?.data?.purchase?.price ?? {};
      const currency = price.currency_code || price.currency_value || "";
      const usd = currency === "USD" ? Number(price.value || 0) : 0;
      const buyerCountry = h.raw_payload?.data?.buyer?.address?.country_iso
        || h.raw_payload?.data?.buyer?.address?.country
        || "??";
      realPurchases.push({
        at: h.purchased_at,
        productId: h.product_id || String(h.raw_payload?.data?.product?.id ?? "hotmart"),
        country: buyerCountry,
        usd,
        source: "hotmart",
      });
    }
    for (const m of (manualRes.data ?? []) as any[]) {
      const items = Array.isArray(m.items) ? m.items : [];
      const firstSku = items[0]?.sku || items[0]?.product_id || "manual";
      realPurchases.push({
        at: m.verified_at || m.created_at,
        productId: firstSku,
        country: m.buyer_country || "??",
        usd: Number(m.amount_usd || 0),
        source: "store",
      });
    }

    for (const p of realPurchases) {
      const k = bucketKey(p.at);
      const b = ensure(k);
      b.purchases++;
      b.revenue += p.usd;
      totals.purchases++;
      totals.revenue += p.usd;

      const pAgg = byProductAgg.get(p.productId) || { views: 0, carts: 0, purchases: 0, revenue: 0, hotmart: 0, store: 0 };
      pAgg.purchases++;
      pAgg.revenue += p.usd;
      if (p.source === "hotmart") pAgg.hotmart++; else pAgg.store++;
      byProductAgg.set(p.productId, pAgg);

      const cAgg = byCountryAgg.get(p.country) || { sessions: new Set<string>(), purchases: 0, revenue: 0 };
      cAgg.purchases++;
      cAgg.revenue += p.usd;
      byCountryAgg.set(p.country, cAgg);
    }

    // Lookup product names from digital_products (SKU → name)
    const skuSet = Array.from(byProductAgg.keys()).filter((k) => k && k !== "sin_producto");
    const nameMap = new Map<string, string>();
    if (skuSet.length) {
      const { data: prods } = await supabase
        .from("digital_products")
        .select("sku, name")
        .in("sku", skuSet);
      for (const p of (prods ?? []) as any[]) {
        if (p.sku && p.name) nameMap.set(p.sku, p.name);
      }
    }


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

    // Abandoned carts summary
    const abandonedTotal = abandoned?.length || 0;
    const abandonedRecovered = (abandoned || []).filter((c) => c.recovered_at).length;
    const abandonedValue = (abandoned || []).reduce(
      (s, c) => s + Number(c.total_amount || 0),
      0,
    );

    // Conversion metrics
    const sessions = totals.sessions.size;
    const cartRate = totals.viewContent ? (totals.addToCart / totals.viewContent) * 100 : 0;
    const checkoutRate = totals.addToCart ? (totals.checkout / totals.addToCart) * 100 : 0;
    const purchaseRate = totals.checkout ? (totals.purchases / totals.checkout) * 100 : 0;
    const globalConversion = sessions ? (totals.purchases / sessions) * 100 : 0;
    const abandonedRate = totals.checkout
      ? ((totals.checkout - totals.purchases) / totals.checkout) * 100
      : 0;

    const byProduct = Array.from(byProductAgg.entries())
      .map(([product_id, v]) => {
        const source =
          v.hotmart && v.store ? "mixto" :
          v.hotmart ? "hotmart" :
          v.store ? "store" :
          "—";
        return {
          product_id,
          name: nameMap.get(product_id) || null,
          source,
          hotmart_purchases: v.hotmart,
          store_purchases: v.store,
          views: v.views,
          carts: v.carts,
          purchases: v.purchases,
          revenue: Number(v.revenue.toFixed(2)),
          conversion: v.views ? Number(((v.purchases / v.views) * 100).toFixed(2)) : 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue || b.purchases - a.purchases)
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
        byCountry,
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
