import { assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa",
};

// Google Suggest is a free public endpoint. We proxy it to avoid CORS
// and to run 1 call per language in parallel.
const LANGUAGES: { hl: string; gl: string; label: string; flag: string }[] = [
  { hl: "es", gl: "es", label: "Español (ES)", flag: "🇪🇸" },
  { hl: "es", gl: "mx", label: "Español (MX)", flag: "🇲🇽" },
  { hl: "es", gl: "pe", label: "Español (PE)", flag: "🇵🇪" },
  { hl: "en", gl: "us", label: "English (US)", flag: "🇺🇸" },
  { hl: "en", gl: "gb", label: "English (UK)", flag: "🇬🇧" },
  { hl: "fr", gl: "fr", label: "Français", flag: "🇫🇷" },
  { hl: "ko", gl: "kr", label: "한국어", flag: "🇰🇷" },
  { hl: "it", gl: "it", label: "Italiano", flag: "🇮🇹" },
  { hl: "pt", gl: "br", label: "Português (BR)", flag: "🇧🇷" },
  { hl: "de", gl: "de", label: "Deutsch", flag: "🇩🇪" },
];

async function fetchSuggestions(query: string, hl: string, gl: string): Promise<string[]> {
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=${hl}&gl=${gl}&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      // Firefox client responds JSON; UA helps avoid HTML fallback
      "User-Agent": "Mozilla/5.0 (compatible; iLingueRelax-SEO/1.0)",
    },
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const { adminKey, query, languages } = await req.json().catch(() => ({}));
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

    const results = await Promise.all(
      selectedLangs.map(async (l) => {
        try {
          const suggestions = await fetchSuggestions(q, l.hl, l.gl);
          return { ...l, suggestions, error: null };
        } catch (e) {
          return { ...l, suggestions: [], error: String((e as Error).message ?? e) };
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
