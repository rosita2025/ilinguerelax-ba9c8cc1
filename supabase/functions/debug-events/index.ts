import { assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa",
};

interface RawEvent {
  id: string;
  event_name: string;
  product_id: string | null;
  value: number | null;
  currency: string | null;
  session_id: string | null;
  page_path: string | null;
  referrer: string | null;
  country: string | null;
  is_bot: boolean;
  bot_reason: string | null;
  user_agent: string | null;
  created_at: string;
}

interface EventItem {
  id: string;
  event_name: string;
  page_path: string | null;
  full_url: string | null;
  referrer: string | null;
  country: string | null;
  session_id: string | null;
  value: number | null;
  currency: string | null;
  is_bot: boolean;
  created_at: string;
}

interface SkuBucket {
  sku: string;
  total: number;
  humans: number;
  bots: number;
  events: Record<string, number>;
  urls: Record<string, number>;
  referrers: Record<string, number>;
  sessions: Set<string>;
  lastSeen: string;
  recent: EventItem[];
}

const SITE_ORIGIN = "https://ilinguerelax.com";

const toFullUrl = (path: string | null): string | null => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
};

const inferSku = (product_id: string | null, page_path: string | null): string => {
  if (product_id && product_id.trim()) return product_id.trim();
  if (page_path?.startsWith("/products/")) {
    return page_path.replace("/products/", "").split("?")[0].split("#")[0] || "sin-sku";
  }
  if (page_path?.startsWith("/checkout/")) {
    return page_path.replace("/checkout/", "").split("?")[0].split("#")[0] || "sin-sku";
  }
  return "sin-sku";
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const {
      adminKey,
      windowMinutes = 30,
      includeBots = false,
      limit = 2000,
    } = await req.json().catch(() => ({}));
    const expected = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expected || adminKey !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const winMin = Math.min(Math.max(parseInt(String(windowMinutes)) || 30, 1), 720);
    const rowLimit = Math.min(Math.max(parseInt(String(limit)) || 2000, 100), 5000);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const since = new Date(Date.now() - winMin * 60_000).toISOString();
    const { data, error } = await supabase
      .from("funnel_events")
      .select(
        "id, event_name, product_id, value, currency, session_id, page_path, referrer, country, is_bot, bot_reason, user_agent, created_at",
      )
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(rowLimit);
    if (error) throw error;

    const rows = ((data || []) as RawEvent[]).filter(
      (r) => includeBots || !r.is_bot,
    );

    const bySku = new Map<string, SkuBucket>();
    const recentAll: EventItem[] = [];

    for (const r of rows) {
      const sku = inferSku(r.product_id, r.page_path);
      let bucket = bySku.get(sku);
      if (!bucket) {
        bucket = {
          sku,
          total: 0,
          humans: 0,
          bots: 0,
          events: {},
          urls: {},
          referrers: {},
          sessions: new Set<string>(),
          lastSeen: r.created_at,
          recent: [],
        };
        bySku.set(sku, bucket);
      }
      bucket.total += 1;
      if (r.is_bot) bucket.bots += 1;
      else bucket.humans += 1;
      bucket.events[r.event_name] = (bucket.events[r.event_name] || 0) + 1;
      const url = toFullUrl(r.page_path) || "(sin url)";
      bucket.urls[url] = (bucket.urls[url] || 0) + 1;
      const ref = r.referrer && r.referrer.trim() ? r.referrer : "(directo)";
      bucket.referrers[ref] = (bucket.referrers[ref] || 0) + 1;
      if (r.session_id) bucket.sessions.add(r.session_id);
      if (r.created_at > bucket.lastSeen) bucket.lastSeen = r.created_at;

      const item: EventItem = {
        id: r.id,
        event_name: r.event_name,
        page_path: r.page_path,
        full_url: toFullUrl(r.page_path),
        referrer: r.referrer,
        country: r.country,
        session_id: r.session_id,
        value: r.value,
        currency: r.currency,
        is_bot: r.is_bot,
        created_at: r.created_at,
      };
      if (bucket.recent.length < 40) bucket.recent.push(item);
      if (recentAll.length < 200) recentAll.push(item);
    }

    const skus = Array.from(bySku.values())
      .map((b) => ({
        sku: b.sku,
        total: b.total,
        humans: b.humans,
        bots: b.bots,
        sessions: b.sessions.size,
        lastSeen: b.lastSeen,
        events: b.events,
        urls: b.urls,
        referrers: b.referrers,
        recent: b.recent,
      }))
      .sort((a, b) => b.total - a.total);

    return new Response(
      JSON.stringify({
        windowMinutes: winMin,
        totalEvents: rows.length,
        includeBots,
        skus,
        recent: recentAll,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
