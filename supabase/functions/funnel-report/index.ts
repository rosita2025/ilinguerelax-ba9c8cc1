import { assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf",
};

const FUNNEL_EVENTS = ["PageView", "ViewContent", "Lead", "AddToCart", "InitiateCheckout", "Purchase"];

// ---------- GA4 auth ----------
async function getGa4AccessToken(): Promise<string> {
  const raw = Deno.env.get("GA4_SERVICE_ACCOUNT_JSON");
  if (!raw) throw new Error("GA4_SERVICE_ACCOUNT_JSON not set");
  const sa = JSON.parse(raw);

  // Convert PEM PKCS8 -> CryptoKey
  const pem = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
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
  const json = await res.json();
  return json.access_token as string;
}

async function ga4Run(propertyId: string, token: string, body: unknown) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error(`GA4 report error [${res.status}]: ${await res.text()}`);
  return await res.json();
}

async function ga4Realtime(propertyId: string, token: string) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ metrics: [{ name: "activeUsers" }] }),
    },
  );
  if (!res.ok) return 0;
  const json = await res.json();
  return parseInt(json?.rows?.[0]?.metricValues?.[0]?.value ?? "0", 10) || 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const csrfBlock = assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const { adminKey, days = 7, startDate, endDate } = await req.json().catch(() => ({}));

    const expectedKey = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expectedKey || adminKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const propertyId = Deno.env.get("GA4_PROPERTY_ID");
    if (!propertyId) throw new Error("GA4_PROPERTY_ID not set");

    const token = await getGa4AccessToken();

    // Resolve date range: custom start/end (YYYY-MM-DD) takes priority; otherwise fall back to `days`.
    const isoDate = /^\d{4}-\d{2}-\d{2}$/;
    let ga4Start: string;
    let ga4End: string;
    let safeDays: number;
    let sinceMs: number;
    if (startDate && endDate && isoDate.test(startDate) && isoDate.test(endDate)) {
      ga4Start = startDate;
      ga4End = endDate;
      const s = new Date(`${startDate}T00:00:00Z`).getTime();
      const e = new Date(`${endDate}T23:59:59Z`).getTime();
      safeDays = Math.max(1, Math.round((e - s) / 86400000));
      sinceMs = s;
    } else {
      safeDays = Math.min(Math.max(parseInt(String(days)) || 7, 1), 365);
      ga4Start = `${safeDays - 1}daysAgo`;
      ga4End = "today";
      sinceMs = Date.now() - safeDays * 86400000;
    }
    const dateRange = { startDate: ga4Start, endDate: ga4End };

    // Parallel GA4 queries
    const [totalsRes, countryRes, sourceRes, pageRes, liveVisitors] = await Promise.all([
      ga4Run(propertyId, token, {
        dateRanges: [dateRange],
        metrics: [
          { name: "screenPageViews" },
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "activeUsers" },
          { name: "engagedSessions" },
          { name: "userEngagementDuration" },
        ],
      }),
      ga4Run(propertyId, token, {
        dateRanges: [dateRange],
        dimensions: [{ name: "country" }],
        metrics: [{ name: "screenPageViews" }, { name: "sessions" }, { name: "totalUsers" }],
        limit: 50,
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      }),
      ga4Run(propertyId, token, {
        dateRanges: [dateRange],
        dimensions: [{ name: "sessionDefaultChannelGroup" }, { name: "sessionSource" }],
        metrics: [{ name: "sessions" }, { name: "totalUsers" }],
        limit: 50,
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      }),
      ga4Run(propertyId, token, {
        dateRanges: [dateRange],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }, { name: "totalUsers" }],
        limit: 50,
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      }),
      ga4Realtime(propertyId, token),
    ]);

    // Totals row
    const tRow = totalsRes.rows?.[0]?.metricValues ?? [];
    const num = (i: number) => parseFloat(tRow[i]?.value ?? "0") || 0;
    const totals = {
      pageViews: num(0),
      sessions: num(1),
      totalUsers: num(2),
      activeUsers: num(3),
      engagedSessions: num(4),
      engagementSeconds: num(5),
    };
    const engagementRate = totals.sessions ? (totals.engagedSessions / totals.sessions) * 100 : 0;
    const avgSessionSeconds = totals.sessions ? totals.engagementSeconds / totals.sessions : 0;

    // Country breakdown
    const byCountry = (countryRes.rows ?? []).map((r: any) => ({
      country: r.dimensionValues?.[0]?.value || "(desconocido)",
      pageViews: parseInt(r.metricValues?.[0]?.value ?? "0", 10),
      sessions: parseInt(r.metricValues?.[1]?.value ?? "0", 10),
      users: parseInt(r.metricValues?.[2]?.value ?? "0", 10),
    }));

    // Source/channel breakdown
    const bySource = (sourceRes.rows ?? []).map((r: any) => ({
      channel: r.dimensionValues?.[0]?.value || "(direct)",
      source: r.dimensionValues?.[1]?.value || "(direct)",
      sessions: parseInt(r.metricValues?.[0]?.value ?? "0", 10),
      users: parseInt(r.metricValues?.[1]?.value ?? "0", 10),
    }));

    // Top pages
    const byPage = (pageRes.rows ?? [])
      .filter((r: any) => !(r.dimensionValues?.[0]?.value || "").startsWith("/admin"))
      .map((r: any) => ({
        path: r.dimensionValues?.[0]?.value || "/",
        pageViews: parseInt(r.metricValues?.[0]?.value ?? "0", 10),
        users: parseInt(r.metricValues?.[1]?.value ?? "0", 10),
      }));

    // Also pull conversion events (AddToCart/Purchase) from internal funnel_events for the same range
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const since = new Date(sinceMs).toISOString();
    const untilIso = startDate && endDate && isoDate.test(endDate)
      ? new Date(`${endDate}T23:59:59Z`).toISOString()
      : new Date().toISOString();
    const { data: convData } = await supabase
      .from("funnel_events")
      .select("event_name, value, product_id")
      .gte("created_at", since)
      .lte("created_at", untilIso)
      .in("event_name", FUNNEL_EVENTS)
      .limit(50000);

    const eventCounts: Record<string, number> = {};
    const byProduct: Record<string, Record<string, number>> = {};
    let revenue = 0;
    for (const row of convData ?? []) {
      const ev = row.event_name as string;
      eventCounts[ev] = (eventCounts[ev] || 0) + 1;
      const pid = (row.product_id as string) || "(sin producto)";
      byProduct[pid] = byProduct[pid] || {};
      byProduct[pid][ev] = (byProduct[pid][ev] || 0) + 1;
      if (ev === "Purchase" && row.value) revenue += Number(row.value);
    }

    const conversionRates = {
      view_to_cart: eventCounts.ViewContent ? ((eventCounts.AddToCart || 0) / eventCounts.ViewContent) * 100 : 0,
      cart_to_checkout: eventCounts.AddToCart ? ((eventCounts.InitiateCheckout || 0) / eventCounts.AddToCart) * 100 : 0,
      checkout_to_purchase: eventCounts.InitiateCheckout ? ((eventCounts.Purchase || 0) / eventCounts.InitiateCheckout) * 100 : 0,
      session_to_purchase: totals.sessions ? ((eventCounts.Purchase || 0) / totals.sessions) * 100 : 0,
    };

    return new Response(
      JSON.stringify({
        source: "ga4",
        days: safeDays,
        range: { startDate: ga4Start, endDate: ga4End },
        propertyId,
        totals,
        engagementRate,
        avgSessionSeconds,
        liveVisitors,
        byCountry,
        bySource,
        byPage,
        eventCounts,
        byProduct,
        revenue,
        conversionRates,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("funnel-report error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
