import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { assertAdminCsrf } from "../_shared/adminCsrf.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa",
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

type Engine = "bing" | "yandex" | "duckduckgo" | "brave";

interface EngineResult {
  engine: Engine;
  indexed: boolean | null; // null = unknown/blocked
  note?: string;
}

function canonical(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    if (u.hostname.startsWith("www.")) u.hostname = u.hostname.slice(4);
    u.hash = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return rawUrl;
  }
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function hostAndPath(u: string) {
  try {
    const url = new URL(u);
    return { host: url.hostname.replace(/^www\./, ""), path: url.pathname.replace(/\/$/, "") };
  } catch {
    return { host: "", path: "" };
  }
}

function looksLikeCaptcha(html: string): boolean {
  const s = html.toLowerCase();
  return s.includes("captcha") || s.includes("are you a robot") ||
    s.includes("smartcaptcha") || s.includes("unusual traffic");
}

function hasMatch(html: string, target: string): boolean {
  const { host, path } = hostAndPath(target);
  if (!host) return false;
  // Look for the domain + path combo (ignore www. and trailing slash)
  const needle = `${host}${path}`.toLowerCase();
  const alt = `www.${needle}`;
  const lower = html.toLowerCase();
  return lower.includes(needle) || lower.includes(alt);
}

async function checkBing(target: string): Promise<EngineResult> {
  const q = `url:${target}`;
  const html = await fetchHtml(`https://www.bing.com/search?q=${encodeURIComponent(q)}&setlang=en`);
  if (!html) return { engine: "bing", indexed: null, note: "sin respuesta" };
  if (looksLikeCaptcha(html)) return { engine: "bing", indexed: null, note: "captcha" };
  // Bing shows "No results found" or similar when not indexed
  if (/no results found for/i.test(html) || /no se han encontrado resultados/i.test(html)) {
    return { engine: "bing", indexed: false };
  }
  return { engine: "bing", indexed: hasMatch(html, target) };
}

async function checkYandex(target: string): Promise<EngineResult> {
  const q = `url:${target}`;
  const html = await fetchHtml(`https://yandex.com/search/?text=${encodeURIComponent(q)}`);
  if (!html) return { engine: "yandex", indexed: null, note: "sin respuesta" };
  if (looksLikeCaptcha(html)) return { engine: "yandex", indexed: null, note: "captcha" };
  if (/nothing found/i.test(html) || /ничего не нашлось/i.test(html)) {
    return { engine: "yandex", indexed: false };
  }
  return { engine: "yandex", indexed: hasMatch(html, target) };
}

async function checkDuckDuckGo(target: string): Promise<EngineResult> {
  const q = `site:${target}`;
  const html = await fetchHtml(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`);
  if (!html) return { engine: "duckduckgo", indexed: null, note: "sin respuesta" };
  if (looksLikeCaptcha(html)) return { engine: "duckduckgo", indexed: null, note: "captcha" };
  if (/no results\./i.test(html) || /no-results/i.test(html)) {
    return { engine: "duckduckgo", indexed: false };
  }
  return { engine: "duckduckgo", indexed: hasMatch(html, target) };
}

async function checkBrave(target: string): Promise<EngineResult> {
  const q = `site:${target}`;
  const html = await fetchHtml(`https://search.brave.com/search?q=${encodeURIComponent(q)}&source=web`);
  if (!html) return { engine: "brave", indexed: null, note: "sin respuesta" };
  if (looksLikeCaptcha(html)) return { engine: "brave", indexed: null, note: "captcha" };
  if (/no results found/i.test(html) || /brave search didn['’]t find/i.test(html)) {
    return { engine: "brave", indexed: false };
  }
  return { engine: "brave", indexed: hasMatch(html, target) };
}

async function checkOne(target: string) {
  const url = canonical(target);
  const [bing, yandex, ddg, brave] = await Promise.all([
    checkBing(url),
    checkYandex(url),
    checkDuckDuckGo(url),
    checkBrave(url),
  ]);
  return { url, results: { bing, yandex, duckduckgo: ddg, brave } };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    await assertAdminCsrf(req);
    const { urls } = await req.json();
    if (!Array.isArray(urls) || urls.length === 0) {
      return new Response(JSON.stringify({ error: "urls array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Cap concurrency; process in small batches to avoid engine throttling
    const capped = urls.slice(0, 25);
    const out: Array<Awaited<ReturnType<typeof checkOne>>> = [];
    for (let i = 0; i < capped.length; i += 3) {
      const batch = capped.slice(i, i + 3);
      const results = await Promise.all(batch.map(checkOne));
      out.push(...results);
    }
    return new Response(JSON.stringify({ results: out }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    const status = message.includes("Unauthorized") || message.includes("csrf") ? 401 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
