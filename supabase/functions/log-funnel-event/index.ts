import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED = new Set(["PageView", "ViewContent", "AddToCart", "InitiateCheckout", "BeginCheckout", "Purchase", "PaymentError", "Lead"]);

// In-memory IP→country cache (lives during function instance lifetime)
const ipCache = new Map<string, string>();

// In-memory rate tracker per session (detects bursts characteristic of bots)
const sessionRate = new Map<string, number[]>(); // sid -> timestamps ms
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_EVENTS = 30; // >30 events / 60s = likely bot

const resolveCountry = async (ip: string | null, fallback: string | null): Promise<string | null> => {
  if (!ip) return fallback;
  if (ipCache.has(ip)) return ipCache.get(ip)!;
  try {
    const r = await fetch(`https://api.country.is/${ip}`, { signal: AbortSignal.timeout(2000) });
    if (r.ok) {
      const j = await r.json();
      const cc = (j.country as string) || fallback || null;
      if (cc) ipCache.set(ip, cc);
      return cc;
    }
  } catch (_) { /* ignore */ }
  return fallback;
};

// Bot filter patterns from public.bot_filters (cached 60s)
type FilterRow = { pattern: string; kind: string; enabled: boolean };
let filtersCache: { ua: RegExp | null; referrer: RegExp | null; ips: Set<string>; expires: number } = {
  ua: null, referrer: null, ips: new Set(), expires: 0,
};

const buildRegex = (patterns: string[]): RegExp | null => {
  if (patterns.length === 0) return null;
  const escaped = patterns.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`(${escaped.join("|")})`, "i");
};

const loadFilters = async (supabase: ReturnType<typeof createClient>) => {
  const now = Date.now();
  if (now < filtersCache.expires) return filtersCache;
  const { data } = await supabase.from("bot_filters").select("pattern,kind,enabled").eq("enabled", true);
  const rows = (data ?? []) as FilterRow[];
  filtersCache = {
    ua: buildRegex(rows.filter((r) => r.kind === "user_agent").map((r) => r.pattern)),
    referrer: buildRegex(rows.filter((r) => r.kind === "referrer").map((r) => r.pattern)),
    ips: new Set(rows.filter((r) => r.kind === "ip").map((r) => r.pattern.trim())),
    expires: now + 60000,
  };
  return filtersCache;
};

// Built-in heuristics — catch automation frameworks even without custom filters
const BUILTIN_BOT_UA = /(bot|crawler|spider|slurp|bingpreview|semrush|ahrefs|mj12|petalbot|yandex|baiduspider|pingdom|uptime|gtmetrix|pagespeed|lighthouse|headlesschrome|headless|phantomjs|puppeteer|playwright|selenium|chrome-lighthouse|wget|curl|python-requests|python-urllib|scrapy|node-fetch|okhttp|axios\/|go-http-client|java\/|libwww|apachebench|masscan|zgrab|nmap|ruby|perl|http_request|facebookexternalhit|meta-externalagent|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|slackbot|embedly|preview|monitor|check|scan|fetch|http-client|dataminr|feedfetcher|applebot|duckduckbot|sogou|exabot|archive\.org|screaming|siteauditor|ia_archiver|serpstat)/i;

// Datacenter / cloud provider IP ranges (partial — catches common scraper sources)
const isDatacenterIp = (ip: string | null): boolean => {
  if (!ip) return false;
  // AWS, GCP, Azure, DigitalOcean, OVH, Hetzner, Linode common ranges (coarse /8-/12 prefixes)
  const dc = [
    /^3\./, /^13\./, /^15\./, /^18\./, /^34\./, /^35\./, /^40\./, /^44\./, /^52\./, /^54\./, /^64\.225\./, /^99\./, /^104\.196\./, /^107\.20\./,
    /^128\.199\./, /^134\.209\./, /^138\.197\./, /^139\.59\./, /^142\.93\./, /^143\.198\./, /^146\.190\./, /^147\.182\./, /^157\.230\./, /^159\.203\./,
    /^159\.65\./, /^159\.89\./, /^161\.35\./, /^164\.90\./, /^165\.22\./, /^165\.227\./, /^167\.71\./, /^167\.99\./, /^168\.62\./, /^170\.187\./,
    /^172\.104\./, /^172\.105\./, /^188\.166\./, /^192\.34\./, /^192\.81\./, /^198\.199\./, /^199\.36\./, /^206\.189\./, /^207\.154\./, /^209\.97\./,
  ];
  return dc.some((r) => r.test(ip));
};

const classifyBot = (
  ua: string,
  sessionId: string | null,
  referer: string,
  filters: typeof filtersCache,
  headers: Headers,
  ip: string | null,
): string | null => {
  // 1. no session id → almost certainly non-browser
  if (!sessionId || sessionId.length < 6) return "no_session";
  // 2. missing / trivial user-agent
  if (!ua || ua.length < 15) return "empty_ua";
  // 3. built-in known bot / automation signature
  if (BUILTIN_BOT_UA.test(ua)) return "bot_ua";
  // 4. custom filters (admin-managed)
  if (filters.ua && filters.ua.test(ua)) return "bot_ua_custom";
  if (filters.referrer && filters.referrer.test(referer)) return "bot_referrer";
  // 5. real browsers ALWAYS send Accept-Language — scrapers often skip it
  const acceptLang = headers.get("accept-language") || "";
  if (!acceptLang || acceptLang.length < 2) return "no_accept_language";
  // 6. modern browsers send Sec-Fetch-* + Sec-Ch-Ua on Chromium/Edge/Firefox 90+
  //    Absence of BOTH sec-fetch-site AND sec-ch-ua on a Chrome/Edge UA = scraper mimic
  const secFetch = headers.get("sec-fetch-site");
  const secChUa = headers.get("sec-ch-ua");
  const looksChromium = /Chrome|Edg|OPR/i.test(ua) && !/Firefox/i.test(ua);
  if (looksChromium && !secFetch && !secChUa) return "no_sec_fetch";
  // 7. datacenter IP (AWS/GCP/Azure/DO/Linode) → not a real user
  if (isDatacenterIp(ip)) return "datacenter_ip";
  // 8. burst rate — >RATE_MAX_EVENTS events in 60s from same session
  const now = Date.now();
  const arr = sessionRate.get(sessionId) || [];
  const recent = arr.filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  sessionRate.set(sessionId, recent);
  if (recent.length > RATE_MAX_EVENTS) return "burst_rate";
  if (sessionRate.size > 5000) {
    for (const [k, v] of sessionRate) {
      if (v.every((t) => now - t > RATE_WINDOW_MS)) sessionRate.delete(k);
    }
  }
  return null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const ua = req.headers.get("user-agent") || "";
    const referer = req.headers.get("referer") || req.headers.get("referrer") || "";
    const xff = req.headers.get("x-forwarded-for") || "";
    const ip = xff.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;

    const body = await req.json().catch(() => ({}));
    const event_name = String(body.event_name || "");
    if (!ALLOWED.has(event_name)) {
      return new Response(JSON.stringify({ error: "Invalid event_name" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const filters = await loadFilters(supabase);
    const sid = typeof body.session_id === "string" ? body.session_id : null;

    let botReason: string | null = classifyBot(ua, sid, referer, filters, req.headers, ip);
    if (!botReason && ip && filters.ips.has(ip)) botReason = "bot_ip";

    const country = await resolveCountry(ip, body.country || null);

    const { error } = await supabase.from("funnel_events").insert({
      event_name,
      product_id: body.product_id ?? null,
      value: typeof body.value === "number" ? body.value : null,
      currency: typeof body.currency === "string" ? body.currency : null,
      session_id: sid,
      client_id: typeof body.client_id === "string" ? body.client_id.slice(0, 100) : null,
      page_path: body.page_path ?? null,
      country,
      referrer: typeof body.referrer === "string" ? body.referrer.slice(0, 500) : null,
      is_bot: !!botReason,
      bot_reason: botReason,
      user_agent: ua ? ua.slice(0, 300) : null,
      // Guardamos proveedor y motivo para poder diagnosticar pagos fallidos.
      provider: typeof body.provider === "string" ? body.provider.slice(0, 60) : null,
      error_reason: typeof body.reason === "string" ? body.reason.slice(0, 300) : null,
    });

    if (error) {
      console.error("insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, country, is_bot: !!botReason, bot_reason: botReason }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
