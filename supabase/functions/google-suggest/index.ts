import { assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa",
};

// Each market queries Google Suggest IN ITS OWN LANGUAGE. We translate the
// user's seed to every target language via Lovable AI before hitting Suggest.
const LANGUAGES: { hl: string; gl: string; label: string; flag: string; langName: string }[] = [
  { hl: "es", gl: "es", label: "Español (ES)", flag: "🇪🇸", langName: "Spanish (Spain)" },
  { hl: "es", gl: "mx", label: "Español (MX)", flag: "🇲🇽", langName: "Spanish (Mexico)" },
  { hl: "es", gl: "pe", label: "Español (PE)", flag: "🇵🇪", langName: "Spanish (Peru)" },
  { hl: "en", gl: "us", label: "English (US)", flag: "🇺🇸", langName: "English (US)" },
  { hl: "en", gl: "gb", label: "English (UK)", flag: "🇬🇧", langName: "English (UK)" },
  { hl: "fr", gl: "fr", label: "Français (FR)", flag: "🇫🇷", langName: "French" },
  { hl: "ko", gl: "kr", label: "한국어 (KR)", flag: "🇰🇷", langName: "Korean" },
  { hl: "it", gl: "it", label: "Italiano (IT)", flag: "🇮🇹", langName: "Italian" },
  { hl: "pt", gl: "br", label: "Português (BR)", flag: "🇧🇷", langName: "Portuguese (Brazil)" },
  { hl: "de", gl: "de", label: "Deutsch (DE)", flag: "🇩🇪", langName: "German" },
];

async function fetchSuggestions(query: string, hl: string, gl: string): Promise<string[]> {
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=${hl}&gl=${gl}&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; iLingueRelax-SEO/1.0)" },
  });
  if (!res.ok) throw new Error(`suggest ${res.status}`);
  const text = await res.text();
  try {
    const parsed = JSON.parse(text);
    const list = Array.isArray(parsed) && Array.isArray(parsed[1]) ? parsed[1] : [];
    return list.filter((s: unknown): s is string => typeof s === "string");
  } catch {
    return [];
  }
}

// One AI call → returns { "Spanish (Spain)": "...", "English (US)": "...", ... }
async function translateSeedToAll(seed: string): Promise<Record<string, string>> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return {};
  const targets = LANGUAGES.map((l) => l.langName);
  const prompt = `Translate the search keyword below to each target language as a NATIVE SPEAKER would type it into Google. Keep it short (2-5 words). Keep proper nouns natural. Return ONLY a JSON object mapping each language name to the translation.

Keyword: "${seed}"

Target languages: ${JSON.stringify(targets)}

Example format: {"Spanish (Spain)":"aprender coreano","English (US)":"learn korean","Korean":"한국어 배우기"}`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return {};
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    return JSON.parse(content);
  } catch (e) {
    console.error("translate failed:", e);
    return {};
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const { adminKey, query, languages, translate = true } = await req.json().catch(() => ({}));
    const expectedKey = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expectedKey || adminKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const q = String(query ?? "").trim().slice(0, 120);
    if (!q) {
      return new Response(JSON.stringify({ error: "query requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const selectedLangs = Array.isArray(languages) && languages.length > 0
      ? LANGUAGES.filter((l) => languages.includes(`${l.hl}-${l.gl}`))
      : LANGUAGES;

    const translations = translate ? await translateSeedToAll(q) : {};

    const results = await Promise.all(
      selectedLangs.map(async (l) => {
        const localSeed = translations[l.langName] || q;
        try {
          const suggestions = await fetchSuggestions(localSeed, l.hl, l.gl);
          return {
            hl: l.hl, gl: l.gl, label: l.label, flag: l.flag,
            translatedSeed: localSeed,
            popularity: suggestions.length, // 0-10 relative signal from Google
            suggestions,
            error: null,
          };
        } catch (e) {
          return {
            hl: l.hl, gl: l.gl, label: l.label, flag: l.flag,
            translatedSeed: localSeed,
            popularity: 0,
            suggestions: [],
            error: String((e as Error).message ?? e),
          };
        }
      }),
    );

    return new Response(
      JSON.stringify({ query: q, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    console.error("google-suggest error:", err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
