import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";
const SITE_URL = "sc-domain:ilinguerelax.com";

async function querySearchAnalytics(dimension: "query" | "page", days: number, limit: number) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const gscKey = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");
  if (!lovableKey || !gscKey) throw new Error("GSC connector not configured");

  const end = new Date();
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - days);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const url = `${GATEWAY}/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": gscKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate: iso(start),
      endDate: iso(end),
      dimensions: [dimension],
      rowLimit: limit,
      dataState: "all",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GSC ${dimension} ${res.status}: ${body}`);
  }
  const json = await res.json();
  return (json.rows ?? []).map((r: any) => ({
    key: r.keys?.[0] ?? "",
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0,
  }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { adminKey, days = 28, limit = 25 } = await req.json().catch(() => ({}));
    const expectedKey = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expectedKey || adminKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeDays = Math.min(Math.max(parseInt(String(days)) || 28, 1), 480);
    const safeLimit = Math.min(Math.max(parseInt(String(limit)) || 25, 1), 100);

    const [queries, pages] = await Promise.all([
      querySearchAnalytics("query", safeDays, safeLimit),
      querySearchAnalytics("page", safeDays, safeLimit),
    ]);

    return new Response(
      JSON.stringify({ days: safeDays, queries, pages, site: SITE_URL }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    console.error("gsc-report error:", err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
