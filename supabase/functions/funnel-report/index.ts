import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

  try {
    const { adminKey, days = 7 } = await req.json().catch(() => ({}));

    const expectedKey = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expectedKey || adminKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeDays = Math.min(Math.max(parseInt(String(days)) || 7, 1), 90);
    const propertyId = Deno.env.get("GA4_PROPERTY_ID");
    if (!propertyId) throw new Error("GA4_PROPERTY_ID not set");

    const token = await getGa4AccessToken();
    const dateRange = { startDate: `${safeDays}daysAgo`, endDate: "today" };

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
    const since = new Date(Date.now() - safeDays * 86400000).toISOString();
    const { data: convData } = await supabase
      .from("funnel_events")
      .select("event_name, value, product_id")
      .gte("created_at", since)
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
