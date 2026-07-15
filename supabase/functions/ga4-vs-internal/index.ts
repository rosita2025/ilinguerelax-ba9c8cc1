// GA4 vs internal events comparison — realtime + windowed report.
// Compares GA4 (Realtime activeUsers / eventCount / pageViews by page & country)
// against our own funnel_events pixel data. Highlights deltas and infers likely
// causes (adblock, privacy/ITP, bot filtering, sampling, unmapped country codes).
import { assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa",
};

// ---------- GA4 auth (shared pattern) ----------
async function getGa4AccessToken(): Promise<string> {
  const raw = Deno.env.get("GA4_SERVICE_ACCOUNT_JSON");
  if (!raw) throw new Error("GA4_SERVICE_ACCOUNT_JSON not set");
  const sa = JSON.parse(raw);
  const pem = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8", der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["sign"],
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
  return (await res.json()).access_token as string;
}

async function ga4Realtime(propertyId: string, token: string, body: unknown) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) { console.warn("GA4 realtime failed", res.status, await res.text()); return null; }
  return await res.json();
}

type Row = { dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> };
const readMap = (r: unknown): Record<string, number> => {
  const out: Record<string, number> = {};
  const rows = (r as { rows?: Row[] })?.rows || [];
  for (const row of rows) {
    const k = row.dimensionValues?.[0]?.value || "";
    const v = parseInt(row.metricValues?.[0]?.value || "0", 10) || 0;
    if (k) out[k] = (out[k] || 0) + v;
  }
  return out;
};

// GA4 returns 2-letter country IDs (US, PE, MX...) — keep as-is; our
// funnel_events also store 2-letter ISO codes.
const normCountry = (c: string | null | undefined) => (c || "").trim().toUpperCase() || "??";
// Normalize page paths for comparison (strip trailing slash, query, hash).
const normPath = (p: string | null | undefined) => {
  let s = String(p || "/").trim();
  s = s.split("#")[0].split("?")[0];
  if (s.length > 1 && s.endsWith("/")) s = s.slice(0, -1);
  if (!s.startsWith("/")) s = "/" + s;
  return s;
};

// Infer the likely explanation from a (ga4, internal) count pair.
function explainDelta(ga4: number, internal: number): { severity: "ok" | "warn" | "high"; cause: string } {
  if (ga4 === 0 && internal === 0) return { severity: "ok", cause: "Sin datos en ambos" };
  if (ga4 === 0 && internal > 0) {
    return { severity: "high", cause: "GA4 no reporta: probable adblock / uBlock / Brave / DNS filter bloqueando gtag.js" };
  }
  if (internal === 0 && ga4 > 0) {
    return { severity: "high", cause: "Pixel interno no recibe: bloqueo por CSP, error JS o Meta/pixel bloqueado (nuestro log-funnel-event usa dominio propio)" };
  }
  const ratio = internal / Math.max(1, ga4);
  const diffPct = Math.abs(1 - ratio) * 100;
  if (diffPct < 15) return { severity: "ok", cause: "Coincidencia razonable (<15% diferencia normal por muestreo)" };
  if (ratio > 1.25) {
    return { severity: "warn", cause: "Interno > GA4: adblockers/ITP en Safari afectan más a GA4 (~20-40% pérdida típica)" };
  }
  if (ratio < 0.75) {
    return { severity: "warn", cause: "GA4 > Interno: posible sub-registro del pixel propio (sesión sin JS, navegación rápida antes del fetch) o bots contados por GA4" };
  }
  return { severity: "warn", cause: `Diferencia ${diffPct.toFixed(0)}% — revisar muestreo o filtros` };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const { adminKey, windowMinutes = 30 } = await req.json().catch(() => ({}));
    const expectedKey = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expectedKey || adminKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const propertyId = Deno.env.get("GA4_PROPERTY_ID");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const winMs = Math.min(Math.max(parseInt(String(windowMinutes)) || 30, 5), 240) * 60_000;
    const since = new Date(Date.now() - winMs).toISOString();

    // ---- GA4 realtime (last 30 min max — GA4 restriction) ----
    let ga4Available = false;
    let ga4Active = 0;
    let ga4ByCountry: Record<string, number> = {};
    let ga4ByPage: Record<string, number> = {};
    let ga4ByEvent: Record<string, number> = {};
    let ga4BySource: Record<string, number> = {};
    if (propertyId) {
      try {
        const token = await getGa4AccessToken();
        const [total, byCountry, byPage, byEvent, bySource] = await Promise.all([
          ga4Realtime(propertyId, token, { metrics: [{ name: "activeUsers" }] }),
          ga4Realtime(propertyId, token, { dimensions: [{ name: "countryId" }], metrics: [{ name: "activeUsers" }], limit: 100 }),
          ga4Realtime(propertyId, token, { dimensions: [{ name: "unifiedScreenName" }], metrics: [{ name: "screenPageViews" }], limit: 100 }),
          ga4Realtime(propertyId, token, { dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }], limit: 50 }),
          ga4Realtime(propertyId, token, { dimensions: [{ name: "sessionSource" }], metrics: [{ name: "activeUsers" }], limit: 50 }),
        ]);
        ga4Available = true;
        ga4Active = parseInt((total as { rows?: Row[] })?.rows?.[0]?.metricValues?.[0]?.value || "0", 10) || 0;
        // Normalize keys.
        for (const [c, n] of Object.entries(readMap(byCountry))) ga4ByCountry[normCountry(c)] = (ga4ByCountry[normCountry(c)] || 0) + n;
        for (const [p, n] of Object.entries(readMap(byPage))) ga4ByPage[normPath(p)] = (ga4ByPage[normPath(p)] || 0) + n;
        ga4ByEvent = readMap(byEvent);
        ga4BySource = readMap(bySource);
      } catch (e) {
        console.warn("GA4 fetch failed:", e instanceof Error ? e.message : e);
      }
    }

    // ---- Internal funnel_events (same window) ----
    const { data: events, error } = await supabase
      .from("funnel_events")
      .select("event_name, page_path, country, is_bot, session_id, referrer")
      .gte("created_at", since)
      .limit(50000);
    if (error) throw error;

    const humans = (events ?? []).filter((r) => !r.is_bot);
    const bots = (events ?? []).length - humans.length;

    const intByCountry: Record<string, number> = {};
    const intByPage: Record<string, number> = {};
    const intByEvent: Record<string, number> = {};
    const intBySource: Record<string, number> = {};
    const sessionSet = new Set<string>();
    for (const r of humans) {
      const c = normCountry(r.country as string);
      const p = normPath(r.page_path as string);
      const ev = String(r.event_name || "");
      intByEvent[ev] = (intByEvent[ev] || 0) + 1;
      // Count unique sessions by page/country to align with GA4 activeUsers.
      if (r.session_id) sessionSet.add(String(r.session_id));
      if (ev === "PageView" || ev === "ViewContent") {
        intByCountry[c] = (intByCountry[c] || 0) + 1;
        intByPage[p] = (intByPage[p] || 0) + 1;
      }
      // Rough source classification from referrer.
      const ref = String(r.referrer || "").toLowerCase();
      let src = "direct";
      if (!ref) src = "(direct)";
      else if (ref.includes("google")) src = "google";
      else if (ref.includes("facebook") || ref.includes("fb.")) src = "facebook";
      else if (ref.includes("instagram")) src = "instagram";
      else if (ref.includes("tiktok")) src = "tiktok";
      else if (ref.includes("bing")) src = "bing";
      else if (ref.includes("youtube")) src = "youtube";
      else if (ref.startsWith("utm:")) src = ref.split(":")[1] || "campaign";
      else { try { src = new URL(ref).hostname.replace(/^www\./, ""); } catch { /* noop */ } }
      intBySource[src] = (intBySource[src] || 0) + 1;
    }
    const intActive = sessionSet.size;

    // ---- Build comparison rows ----
    const allCountries = new Set<string>([...Object.keys(ga4ByCountry), ...Object.keys(intByCountry)]);
    const byCountry = [...allCountries].map((code) => {
      const ga4 = ga4ByCountry[code] || 0;
      const internal = intByCountry[code] || 0;
      const { severity, cause } = explainDelta(ga4, internal);
      return { code, ga4, internal, diff: internal - ga4, severity, cause };
    }).sort((a, b) => (b.ga4 + b.internal) - (a.ga4 + a.internal));

    const allPages = new Set<string>([...Object.keys(ga4ByPage), ...Object.keys(intByPage)]);
    const byPage = [...allPages]
      .filter((p) => !p.startsWith("/admin"))
      .map((path) => {
        const ga4 = ga4ByPage[path] || 0;
        const internal = intByPage[path] || 0;
        const { severity, cause } = explainDelta(ga4, internal);
        return { path, ga4, internal, diff: internal - ga4, severity, cause };
      }).sort((a, b) => (b.ga4 + b.internal) - (a.ga4 + a.internal));

    const allSources = new Set<string>([...Object.keys(ga4BySource), ...Object.keys(intBySource)]);
    const bySource = [...allSources].map((source) => {
      const ga4 = ga4BySource[source] || 0;
      const internal = intBySource[source] || 0;
      const { severity, cause } = explainDelta(ga4, internal);
      return { source, ga4, internal, diff: internal - ga4, severity, cause };
    }).sort((a, b) => (b.ga4 + b.internal) - (a.ga4 + a.internal));

    // Aggregate totals for the summary card.
    const totalGa4Page = Object.values(ga4ByPage).reduce((s, n) => s + n, 0);
    const totalIntPage = Object.values(intByPage).reduce((s, n) => s + n, 0);
    const totals = {
      ga4ActiveUsers: ga4Active,
      internalActiveSessions: intActive,
      ga4PageViews: totalGa4Page,
      internalPageViews: totalIntPage,
      bots,
      // Adblock / privacy loss estimate: how many pageviews the pixel saw that
      // GA4 missed, as % of internal (>0 → GA4 undercount → likely adblock).
      estimatedGa4Loss: totalIntPage > 0
        ? Math.max(0, Math.round(((totalIntPage - totalGa4Page) / totalIntPage) * 100))
        : 0,
    };

    return new Response(
      JSON.stringify({
        windowMinutes: winMs / 60_000,
        ga4Available,
        totals,
        byCountry,
        byPage,
        bySource,
        byEvent: {
          ga4: ga4ByEvent,
          internal: intByEvent,
        },
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("ga4-vs-internal error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
