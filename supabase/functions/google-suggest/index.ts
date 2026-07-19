import { adminCorsHeaders, assertAdminCsrf, withAdminLogging } from "../_shared/adminCsrf.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = adminCorsHeaders;

// Grouped markets. Countries inside a group share a language & are aggregated
// (dedup by frequency = "alto volumen" within the group).
type Country = { gl: string; name: string; weight: number };
type Group = {
  id: string;
  label: string;
  flag: string;
  langName: string; // for AI translation
  hl: string;
  countries: Country[];
};

// Country weight ≈ relative internet-search market size (population × Google share, normalized).
// Bigger markets contribute more to the "alto volumen" score.
const GROUPS: Group[] = [
  {
    id: "es-latam",
    label: "Español — LATAM (14 países)",
    flag: "🌎",
    langName: "Spanish (Latin America)",
    hl: "es",
    countries: [
      { gl: "mx", name: "México", weight: 13 }, { gl: "ar", name: "Argentina", weight: 4.5 },
      { gl: "co", name: "Colombia", weight: 5 }, { gl: "cl", name: "Chile", weight: 2 },
      { gl: "pe", name: "Perú", weight: 3.3 }, { gl: "ve", name: "Venezuela", weight: 2.8 },
      { gl: "ec", name: "Ecuador", weight: 1.7 }, { gl: "uy", name: "Uruguay", weight: 0.35 },
      { gl: "py", name: "Paraguay", weight: 0.7 }, { gl: "bo", name: "Bolivia", weight: 1.2 },
      { gl: "cr", name: "Costa Rica", weight: 0.5 }, { gl: "gt", name: "Guatemala", weight: 1.7 },
      { gl: "do", name: "R. Dominicana", weight: 1.1 }, { gl: "pa", name: "Panamá", weight: 0.43 },
    ],
  },
  { id: "es-es", label: "Español (España)", flag: "🇪🇸", langName: "Spanish (Spain)", hl: "es", countries: [{ gl: "es", name: "España", weight: 4.7 }] },
  { id: "en-na", label: "English — USA + Canada", flag: "🇺🇸", langName: "English (North America)", hl: "en", countries: [{ gl: "us", name: "USA", weight: 33 }, { gl: "ca", name: "Canada", weight: 3.8 }] },
  { id: "en-uk", label: "English (UK)", flag: "🇬🇧", langName: "English (UK)", hl: "en", countries: [{ gl: "gb", name: "UK", weight: 6.7 }] },
  { id: "fr-fr", label: "Français (FR)", flag: "🇫🇷", langName: "French", hl: "fr", countries: [{ gl: "fr", name: "Francia", weight: 6.5 }] },
  { id: "ko-kr", label: "한국어 (KR)", flag: "🇰🇷", langName: "Korean", hl: "ko", countries: [{ gl: "kr", name: "Corea", weight: 5.1 }] },
  { id: "it-it", label: "Italiano (IT)", flag: "🇮🇹", langName: "Italian", hl: "it", countries: [{ gl: "it", name: "Italia", weight: 6 }] },
  { id: "pt-br", label: "Português (BR)", flag: "🇧🇷", langName: "Portuguese (Brazil)", hl: "pt", countries: [{ gl: "br", name: "Brasil", weight: 21 }] },
  { id: "sv-se", label: "Svenska (SE)", flag: "🇸🇪", langName: "Swedish", hl: "sv", countries: [{ gl: "se", name: "Suecia", weight: 1 }] },
];

// Intent modifiers that mark high-value keywords for content writing.
// "informational + commercial" bias — great for blog posts targeting SEO.
const INTENT_TOKENS = [
  // ES
  "como", "cómo", "que", "qué", "por que", "por qué", "cual", "cuál", "mejor", "mejores",
  "gratis", "pdf", "curso", "cursos", "aprender", "libro", "libros", "online", "app",
  "para principiantes", "principiantes", "rapido", "rápido", "facil", "fácil",
  "ejercicios", "ejemplos", "guia", "guía", "trucos", "tips",
  // EN
  "how", "what", "why", "best", "free", "learn", "course", "book", "online",
  "for beginners", "beginners", "fast", "easy", "tips", "guide", "examples", "practice",
  // FR
  "comment", "meilleur", "gratuit", "apprendre", "cours", "livre", "débutant",
  // IT
  "come", "migliore", "gratis", "imparare", "corso", "libro", "principianti",
  // PT
  "como", "melhor", "grátis", "aprender", "curso", "livro", "iniciantes",
  // KO
  "무료", "배우기", "공부", "책", "강의",
  // SV
  "hur", "bäst", "gratis", "lära", "kurs", "bok",
];

function scoreKeyword(opts: {
  keyword: string;
  seed: string;
  positionsByCountry: { country: Country; position: number }[];
}): number {
  const { keyword, seed, positionsByCountry } = opts;
  const kw = keyword.toLowerCase().trim();
  const seedTokens = seed.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

  // 1) Weighted country presence + position decay (Google returns most-searched first).
  //    score contribution = countryWeight * (1 / (1 + position))
  let base = 0;
  for (const { country, position } of positionsByCountry) {
    const posDecay = 1 / (1 + position); // pos 0 => 1.0, pos 9 => 0.1
    base += country.weight * posDecay;
  }

  // 2) Seed relevance — must contain at least one seed token (else penalize hard)
  const hasSeedToken = seedTokens.some((t) => kw.includes(t));
  const seedBoost = hasSeedToken ? 1 : 0.3;

  // 3) Intent modifier boost (commercial/informational)
  const hasIntent = INTENT_TOKENS.some((t) => kw.includes(t));
  const intentBoost = hasIntent ? 1.35 : 1;

  // 4) Length shape: 2-6 words = sweet spot; 1 word = too generic; >8 = too long-tail
  const wordCount = kw.split(/\s+/).length;
  let lengthMul = 1;
  if (wordCount <= 1) lengthMul = 0.5;
  else if (wordCount === 2) lengthMul = 0.9;
  else if (wordCount <= 6) lengthMul = 1.1;
  else if (wordCount <= 8) lengthMul = 0.85;
  else lengthMul = 0.6;

  // 5) Char sanity — kill weird stubs
  if (kw.length < 4) return 0;

  return base * seedBoost * intentBoost * lengthMul;
}

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
          country: c, // full Country object (includes weight)
          suggestions: await fetchSuggestions(localSeed, g.hl, c.gl),
        })),
      );
      // Aggregate keyword occurrences with position + country weight.
      type Agg = {
        keyword: string;
        count: number;
        countries: string[];
        positions: { country: Country; position: number }[];
      };
      const freq = new Map<string, Agg>();
      for (const pc of perCountry) {
        pc.suggestions.forEach((s, idx) => {
          const key = s.toLowerCase().trim();
          const entry = freq.get(key) ?? { keyword: s, count: 0, countries: [], positions: [] };
          entry.count += 1;
          if (!entry.countries.includes(pc.country.name)) entry.countries.push(pc.country.name);
          entry.positions.push({ country: pc.country, position: idx });
          freq.set(key, entry);
        });
      }

      // Compute weighted score and normalize 0-100 per group.
      const scored = Array.from(freq.values()).map((e) => ({
        ...e,
        score: scoreKeyword({ keyword: e.keyword, seed: localSeed, positionsByCountry: e.positions }),
      }));
      const maxScore = scored.reduce((m, x) => Math.max(m, x.score), 0) || 1;
      const ranked = scored
        .map((x) => ({
          keyword: x.keyword,
          count: x.count,
          countries: x.countries,
          score: Math.round((x.score / maxScore) * 100), // 0-100 relative
        }))
        .sort((a, b) => b.score - a.score || b.count - a.count || a.keyword.length - b.keyword.length);

      return {
        id: g.id, label: g.label, flag: g.flag,
        translatedSeed: localSeed,
        countryCount: g.countries.length,
        popularity: ranked.reduce((s, r) => s + r.score, 0), // total group weight
        maxCount: ranked[0]?.count ?? 1,
        keywords: ranked.slice(0, 15),
      };
    }));

    // Global "Top palabras de alto volumen" — best keywords across ALL groups,
    // weighted by group popularity so LATAM/US/BR bubble up.
    const globalMap = new Map<string, { keyword: string; score: number; groups: string[]; countries: string[] }>();
    for (const g of results) {
      for (const k of g.keywords) {
        const key = k.keyword.toLowerCase().trim();
        const entry = globalMap.get(key) ?? { keyword: k.keyword, score: 0, groups: [], countries: [] };
        entry.score += k.score; // sum of normalized 0-100 across groups
        if (!entry.groups.includes(g.label)) entry.groups.push(g.label);
        for (const c of k.countries) if (!entry.countries.includes(c)) entry.countries.push(c);
        globalMap.set(key, entry);
      }
    }
    const globalTop = Array.from(globalMap.values())
      .sort((a, b) => b.score - a.score || b.groups.length - a.groups.length)
      .slice(0, 20);

    return new Response(
      JSON.stringify({ query: q, results, globalTop }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    console.error("google-suggest error:", err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}));
