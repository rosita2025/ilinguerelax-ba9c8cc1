// Generate a compact SEO content brief for a keyword (H1, H2s, outline, FAQs, CTA)
// using Lovable AI Gateway. Optionally biased toward selected iLingue Relax products.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { assertAdminCsrf } from "../_shared/adminCsrf.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const LANG_MAP: Record<string, string> = {
  es: "español neutro (LATAM/España)",
  en: "English (US/UK neutral)",
  fr: "français standard",
  pt: "português (BR/PT neutro)",
  it: "italiano standard",
  de: "Hochdeutsch",
  ko: "한국어",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const body = await req.json().catch(() => ({}));
    const {
      adminKey,
      keyword,
      language = "es",
      productSkus = [],
    } = body as {
      adminKey?: string;
      keyword?: string;
      language?: string;
      productSkus?: string[];
    };

    const expected = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expected || adminKey !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!keyword || keyword.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Missing keyword" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch product context (title + slug + subtitle) if requested.
    let productsCtx = "";
    if (Array.isArray(productSkus) && productSkus.length) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data } = await supabase
        .from("digital_products")
        .select("sku,title,slug,subtitle")
        .in("sku", productSkus.slice(0, 6));
      if (data?.length) {
        productsCtx = `\n\nPRODUCTOS iLINGUE RELAX A INTEGRAR EN EL CTA (usa el título exacto y enlaza a /products/{slug}):\n${
          data.map((p) => `- ${p.title} → /products/${p.slug}${p.subtitle ? " · " + p.subtitle : ""}`).join("\n")
        }`;
      }
    }

    const L = LANG_MAP[language] ?? LANG_MAP.es;

    const system = `You are a senior SEO strategist. Given ONE target keyword, produce a compact CONTENT BRIEF in ${L}.
Return ONLY valid JSON (no markdown fences) with this exact shape:
{
  "h1": "Attractive H1 with the exact keyword",
  "metaTitle": "≤60 chars",
  "metaDescription": "≤155 chars",
  "searchIntent": "informational|transactional|navigational|commercial + 1 sentence why",
  "targetAudience": "1 sentence",
  "h2Outline": [
    { "h2": "Section title", "bullets": ["3-5 short bullets of what to cover"] }
  ],
  "faqs": ["6 real long-tail questions people search"],
  "semanticKeywords": ["8-12 LSI / secondary keywords"],
  "internalLinks": [{ "anchor": "text", "url": "/products/{slug} or /blog/..." }],
  "cta": "2-3 sentence CTA integrating the iLingue Relax products naturally (if provided)",
  "wordCount": "1500-2000",
  "notes": "1-2 EEAT / differentiation tips"
}
Rules:
- Everything in ${L}. Do NOT switch languages.
- 5-7 H2 sections, each with actionable bullets.
- FAQs must be REAL questions users google (long-tail, natural).
- If products are provided, the CTA and at least one internalLinks entry MUST reference them.`;

    const user = `Keyword objetivo: "${keyword.trim()}"${productsCtx}`;

    const aiRes = await fetch(AI_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit de IA. Reintenta en 1 min." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos IA agotados." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      return new Response(JSON.stringify({ error: `AI error: ${t.slice(0, 300)}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const raw = await aiRes.json();
    const content: string = raw?.choices?.[0]?.message?.content ?? "{}";
    let brief: unknown;
    try {
      brief = JSON.parse(content);
    } catch {
      brief = { raw: content };
    }

    return new Response(JSON.stringify({ keyword: keyword.trim(), language, brief }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
