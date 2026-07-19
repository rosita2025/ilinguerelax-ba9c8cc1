import { adminCorsHeaders, assertAdminCsrf, withAdminLogging } from "../_shared/adminCsrf.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = adminCorsHeaders;

// Grouped markets. Countries inside a group share a language & are aggregated
// (dedup by frequency = "alto volumen" within the group).
type Group = {
  id: string;
  label: string;
  flag: string;
  langName: string; // for AI translation
  hl: string;
  countries: { gl: string; name: string }[];
};

const GROUPS: Group[] = [
  {
    id: "es-latam",
    label: "Español — LATAM (14 países)",
    flag: "🌎",
    langName: "Spanish (Latin America)",
    hl: "es",
    countries: [
      { gl: "mx", name: "México" }, { gl: "ar", name: "Argentina" },
      { gl: "co", name: "Colombia" }, { gl: "cl", name: "Chile" },
      { gl: "pe", name: "Perú" }, { gl: "ve", name: "Venezuela" },
      { gl: "ec", name: "Ecuador" }, { gl: "uy", name: "Uruguay" },
      { gl: "py", name: "Paraguay" }, { gl: "bo", name: "Bolivia" },
      { gl: "cr", name: "Costa Rica" }, { gl: "gt", name: "Guatemala" },
      { gl: "do", name: "R. Dominicana" }, { gl: "pa", name: "Panamá" },
    ],
  },
  { id: "es-es", label: "Español (España)", flag: "🇪🇸", langName: "Spanish (Spain)", hl: "es", countries: [{ gl: "es", name: "España" }] },
  { id: "en-na", label: "English — USA + Canada", flag: "🇺🇸", langName: "English (North America)", hl: "en", countries: [{ gl: "us", name: "USA" }, { gl: "ca", name: "Canada" }] },
  { id: "en-uk", label: "English (UK)", flag: "🇬🇧", langName: "English (UK)", hl: "en", countries: [{ gl: "gb", name: "UK" }] },
  { id: "fr-fr", label: "Français (FR)", flag: "🇫🇷", langName: "French", hl: "fr", countries: [{ gl: "fr", name: "Francia" }] },
  { id: "ko-kr", label: "한국어 (KR)", flag: "🇰🇷", langName: "Korean", hl: "ko", countries: [{ gl: "kr", name: "Corea" }] },
  { id: "it-it", label: "Italiano (IT)", flag: "🇮🇹", langName: "Italian", hl: "it", countries: [{ gl: "it", name: "Italia" }] },
  { id: "pt-br", label: "Português (BR)", flag: "🇧🇷", langName: "Portuguese (Brazil)", hl: "pt", countries: [{ gl: "br", name: "Brasil" }] },
  { id: "sv-se", label: "Svenska (SE)", flag: "🇸🇪", langName: "Swedish", hl: "sv", countries: [{ gl: "se", name: "Suecia" }] },
];

async function fetchSuggestions(query: string, hl: string, gl: string): Promise<string[]> {
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=${hl}&gl=${gl}&q=${encodeURIComponent(query)}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; iLingueRelax-SEO/1.0)" },
      signal: ctrl.signal,
    });
    if (!res.ok) return [];
    const text = await res.text();
    const parsed = JSON.parse(text);
    const list = Array.isArray(parsed) && Array.isArray(parsed[1]) ? parsed[1] : [];
    return list.filter((s: unknown): s is string => typeof s === "string");
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function translateSeedToAll(seed: string): Promise<Record<string, string>> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return {};
  const targets = GROUPS.map((g) => g.langName);
  const prompt = `Translate the search keyword below to each target language as a NATIVE SPEAKER would type it into Google. Keep it short (2-5 words). Return ONLY a JSON object mapping each language name to the translation.

Keyword: "${seed}"

Target languages: ${JSON.stringify(targets)}

Example: {"Spanish (Latin America)":"aprender coreano","English (North America)":"learn korean"}`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return {};
    const data = await res.json();
    return JSON.parse(data?.choices?.[0]?.message?.content ?? "{}");
  } catch (e) {
    console.error("translate failed:", e);
    return {};
  }
}

serve(withAdminLogging("google-suggest", async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const { adminKey, query, translate = true } = await req.json().catch(() => ({}));
    const expectedKey = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expectedKey || adminKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const q = String(query ?? "").trim().slice(0, 120);
    if (!q) {
      return new Response(JSON.stringify({ error: "query requerido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const translations = translate ? await translateSeedToAll(q) : {};

    const results = await Promise.all(GROUPS.map(async (g) => {
      const localSeed = translations[g.langName] || q;
      // Query every country in the group in parallel
      const perCountry = await Promise.all(
        g.countries.map(async (c) => ({
          country: c.name, gl: c.gl,
          suggestions: await fetchSuggestions(localSeed, g.hl, c.gl),
        })),
      );
      // Aggregate: keyword frequency across countries = "alto volumen"
      const freq = new Map<string, { keyword: string; count: number; countries: string[] }>();
      for (const pc of perCountry) {
        for (const s of pc.suggestions) {
          const key = s.toLowerCase().trim();
          const entry = freq.get(key) ?? { keyword: s, count: 0, countries: [] };
          entry.count += 1;
          if (!entry.countries.includes(pc.country)) entry.countries.push(pc.country);
          freq.set(key, entry);
        }
      }
      const aggregated = Array.from(freq.values())
        .sort((a, b) => b.count - a.count || a.keyword.length - b.keyword.length);
      const totalUnique = aggregated.length;
      const maxCount = aggregated[0]?.count ?? 1;
      return {
        id: g.id, label: g.label, flag: g.flag,
        translatedSeed: localSeed,
        countryCount: g.countries.length,
        popularity: totalUnique, // # unique keywords surfaced
        maxCount,
        keywords: aggregated.slice(0, 15),
      };
    }));

    return new Response(
      JSON.stringify({ query: q, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    console.error("google-suggest error:", err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}));
