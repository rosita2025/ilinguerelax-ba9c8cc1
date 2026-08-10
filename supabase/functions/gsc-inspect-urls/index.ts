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

function canonicalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    if (url.hostname === "www.ilinguerelax.com") url.hostname = "ilinguerelax.com";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return rawUrl;
  }
}

interface InspectResult {
  url: string;
  verdict: string; // PASS | PARTIAL | FAIL | NEUTRAL | UNKNOWN
  coverageState: string;
  indexingState: string;
  lastCrawlTime?: string | null;
  error?: string;
}

async function fetchWithTimeout(url: string, init: RequestInit, ms = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function resolveSite(headers: Record<string, string>, sample: string): Promise<string | null> {
  for (const site of SITE_CANDIDATES) {
    try {
      const res = await fetchWithTimeout(`${GATEWAY}/v1/urlInspection/index:inspect`, {
        method: "POST",
        headers,
        body: JSON.stringify({ inspectionUrl: sample, siteUrl: site }),
      });
      if (res.ok) { await res.body?.cancel(); return site; }
      await res.body?.cancel();
    } catch (_e) { /* try next */ }
  }
  return null;
}

async function inspect(url: string, headers: Record<string, string>, site: string): Promise<InspectResult> {
  const canonicalUrl = canonicalizeUrl(url);
  try {
    const res = await fetchWithTimeout(`${GATEWAY}/v1/urlInspection/index:inspect`, {
      method: "POST",
      headers,
      body: JSON.stringify({ inspectionUrl: canonicalUrl, siteUrl: site }),
    });
    if (!res.ok) {
      const txt = await res.text();
      return { url: canonicalUrl, verdict: "UNKNOWN", coverageState: "—", indexingState: "—", error: `${res.status}: ${txt.slice(0, 200)}` };
    }
    const json = await res.json();
    const r = json?.inspectionResult?.indexStatusResult ?? {};
    return {
      url: canonicalUrl,
      verdict: r.verdict ?? "UNKNOWN",
      coverageState: r.coverageState ?? "—",
      indexingState: r.indexingState ?? "—",
      lastCrawlTime: r.lastCrawlTime ?? null,
    };
  } catch (e) {
    return { url: canonicalUrl, verdict: "UNKNOWN", coverageState: "—", indexingState: "—", error: String((e as Error).message) };
  }
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
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
      console.error("[gsc-inspect-urls] GSC connector missing. LovableKey:", !!lovableKey, "GSCKey:", !!gscKey);
      return new Response(JSON.stringify({ error: "GSC connector not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const headers = {
      "Authorization": `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": gscKey,
      "Content-Type": "application/json",
    };
    const list = Array.isArray(urls) ? urls.filter((u) => typeof u === "string").slice(0, 10) : [];
    if (list.length === 0) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }
    const site = await resolveSite(headers, canonicalizeUrl(list[0]));
    if (!site) {
      return new Response(JSON.stringify({ error: "No verified Search Console property covers these URLs" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Limited concurrency keeps us under the 150s idle timeout and provider rate limits.
    const results = await mapPool(list, 3, (u) => inspect(u, headers, site));
    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
