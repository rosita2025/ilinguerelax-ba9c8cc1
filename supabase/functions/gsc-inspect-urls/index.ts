import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { assertAdminCsrf } from "../_shared/adminCsrf.ts";

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

interface InspectResult {
  url: string;
  verdict: string; // PASS | PARTIAL | FAIL | NEUTRAL | UNKNOWN
  coverageState: string;
  indexingState: string;
  lastCrawlTime?: string | null;
  error?: string;
}

async function inspect(url: string, headers: Record<string, string>): Promise<InspectResult> {
  let lastErr = "";
  for (const site of SITE_CANDIDATES) {
    try {
      const res = await fetch(`${GATEWAY}/v1/urlInspection/index:inspect`, {
        method: "POST",
        headers,
        body: JSON.stringify({ inspectionUrl: url, siteUrl: site }),
      });
      if (res.ok) {
        const json = await res.json();
        const r = json?.inspectionResult?.indexStatusResult ?? {};
        return {
          url,
          verdict: r.verdict ?? "UNKNOWN",
          coverageState: r.coverageState ?? "—",
          indexingState: r.indexingState ?? "—",
          lastCrawlTime: r.lastCrawlTime ?? null,
        };
      }
      lastErr = `${site} → ${res.status}`;
    } catch (e) {
      lastErr = String((e as Error).message);
    }
  }
  return { url, verdict: "UNKNOWN", coverageState: "—", indexingState: "—", error: lastErr };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const { adminKey, urls } = await req.json().catch(() => ({}));
    const expectedKey = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expectedKey || adminKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const gscKey = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");
    if (!lovableKey || !gscKey) {
      return new Response(JSON.stringify({ error: "GSC connector not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const headers = {
      "Authorization": `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": gscKey,
      "Content-Type": "application/json",
    };
    const list = Array.isArray(urls) ? urls.slice(0, 25).filter((u) => typeof u === "string") : [];
    const results: InspectResult[] = [];
    // Sequential to stay under provider rate limits.
    for (const u of list) {
      results.push(await inspect(u, headers));
    }
    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
