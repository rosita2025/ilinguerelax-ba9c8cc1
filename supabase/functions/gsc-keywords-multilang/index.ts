import { assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";
const SITE_CANDIDATES = [
  "sc-domain:ilinguerelax.com",
  "https://ilinguerelax.com/",
  "https://www.ilinguerelax.com/",
];

// ISO 3166-1 alpha-3 country codes that GSC uses in the "country" dimension filter
const DEFAULT_MARKETS: { code: string; label: string; language: string; flag: string }[] = [
  { code: "esp", label: "España", language: "es", flag: "🇪🇸" },
  { code: "mex", label: "México", language: "es", flag: "🇲🇽" },
  { code: "per", label: "Perú", language: "es", flag: "🇵🇪" },
  { code: "arg", label: "Argentina", language: "es", flag: "🇦🇷" },
  { code: "col", label: "Colombia", language: "es", flag: "🇨🇴" },
  { code: "usa", label: "USA (English)", language: "en", flag: "🇺🇸" },
  { code: "gbr", label: "UK", language: "en", flag: "🇬🇧" },
  { code: "fra", label: "Francia", language: "fr", flag: "🇫🇷" },
  { code: "kor", label: "Corea", language: "ko", flag: "🇰🇷" },
  { code: "ita", label: "Italia", language: "it", flag: "🇮🇹" },
  { code: "bra", label: "Brasil", language: "pt", flag: "🇧🇷" },
  { code: "deu", label: "Alemania", language: "de", flag: "🇩🇪" },
];

async function queryMarket(site: string, country: string, days: number, limit: number, lovableKey: string, gscKey: string) {
  const end = new Date();
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - days);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

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
      dimensions: ["query"],
      rowLimit: limit,
      dataState: "all",
      dimensionFilterGroups: [{ filters: [{ dimension: "country", operator: "equals", expression: country }] }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status}: ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  return (json.rows ?? []).map((r: { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }) => ({
    key: r.keys?.[0] ?? "",
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0,
  }));
}

async function pickSite(lovableKey: string, gscKey: string): Promise<string> {
  // Cheap probe: try /sites endpoint
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
        startDate: "2025-01-01",
        endDate: "2025-01-02",
        dimensions: ["query"],
        rowLimit: 1,
      }),
    });
    if (res.ok) return site;
  }
  throw new Error("No verified GSC property found");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const { adminKey, days = 90, limit = 15 } = await req.json().catch(() => ({}));
    const expectedKey = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expectedKey || adminKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const gscKey = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");
    if (!lovableKey || !gscKey) throw new Error("GSC connector not configured");

    const safeDays = Math.min(Math.max(parseInt(String(days)) || 90, 1), 480);
    const safeLimit = Math.min(Math.max(parseInt(String(limit)) || 15, 1), 50);

    const site = await pickSite(lovableKey, gscKey);

    const results = await Promise.all(
      DEFAULT_MARKETS.map(async (m) => {
        try {
          const rows = await queryMarket(site, m.code, safeDays, safeLimit, lovableKey, gscKey);
          return { ...m, rows, error: null };
        } catch (e) {
          return { ...m, rows: [], error: String((e as Error).message ?? e) };
        }
      }),
    );

    return new Response(
      JSON.stringify({ site, days: safeDays, markets: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    console.error("gsc-keywords-multilang error:", err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
