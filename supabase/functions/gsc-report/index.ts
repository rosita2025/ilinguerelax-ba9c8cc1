import { assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

import { adminCorsHeaders as corsHeaders } from "../_shared/adminCsrf.ts";

const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";
// Try domain property first, then URL-prefix variants. The connector picks
// whichever the account actually owns in Search Console.
const SITE_CANDIDATES = [
  "sc-domain:ilinguerelax.com",
  "https://ilinguerelax.com/",
  "https://www.ilinguerelax.com/",
];

async function querySearchAnalytics(dimension: "query" | "page", days: number, limit: number) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const gscKey = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");
  if (!lovableKey || !gscKey) throw new Error("GSC connector not configured");

  const end = new Date();
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - days);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  let lastErr = "";
  let usedSite = "";
  for (const site of SITE_CANDIDATES) {
    const url = `${GATEWAY}/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
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
    if (res.ok) {
      const json = await res.json();
      usedSite = site;
      return {
        site: usedSite,
        rows: (json.rows ?? []).map((r: { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }) => ({
          key: r.keys?.[0] ?? "",
          clicks: r.clicks ?? 0,
          impressions: r.impressions ?? 0,
          ctr: r.ctr ?? 0,
          position: r.position ?? 0,
        })),
      };
    }
    lastErr = `${site} → ${res.status}: ${await res.text()}`;
    console.warn("GSC probe failed:", lastErr);
  }
  throw new Error(`GSC ${dimension} — no property matched. Last: ${lastErr}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

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

    const [queriesRes, pagesRes] = await Promise.all([
      querySearchAnalytics("query", safeDays, safeLimit),
      querySearchAnalytics("page", safeDays, safeLimit),
    ]);

    return new Response(
      JSON.stringify({
        days: safeDays,
        queries: queriesRes.rows,
        pages: pagesRes.rows,
        site: queriesRes.site || pagesRes.site,
      }),
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
