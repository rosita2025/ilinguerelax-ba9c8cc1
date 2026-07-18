// Generate SEO-optimized blog post using Lovable AI Gateway and store it in
// generated_blog_posts. Admin-only.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { pingIndexNow, pingSitemap } from "../_shared/indexnow.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

interface GenPayload {
  title?: string;
  metaTitle?: string;
  metaDescription?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  tags?: string[];
  readTime?: string;
  image?: string;
  internalLinks?: Array<{ anchor: string; url: string }>;
  externalLinks?: Array<{ anchor: string; url: string }>;
}


serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const body = await req.json().catch(() => ({}));
    const {
      adminKey,
      topic,
      keyword,
      category = "Aprendizaje",
      language = "es",
      publish = false,
      relatedProducts = [],
      productCards = [],
    } = body as {
      adminKey?: string;
      topic?: string;
      keyword?: string;
      category?: string;
      language?: string;
      publish?: boolean;
      relatedProducts?: string[];
      productCards?: Array<{ id: string; title: string; slug: string; description?: string }>;
    };


    const expected = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expected || adminKey !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!topic || topic.trim().length < 4) {
      return new Response(JSON.stringify({ error: "Missing topic" }), {
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

    const LANG_MAP: Record<string, { name: string; audience: string; faqHeading: string; conclusionHeading: string; ctaLang: string }> = {
      es: { name: "español neutro", audience: "hispanohablantes de LATAM y España", faqHeading: "Preguntas frecuentes", conclusionHeading: "Conclusión", ctaLang: "en español" },
      en: { name: "English (US/UK neutral)", audience: "English learners and Spanish speakers learning English worldwide", faqHeading: "Frequently Asked Questions", conclusionHeading: "Conclusion", ctaLang: "in English" },
      fr: { name: "français standard", audience: "francophones apprenant les langues", faqHeading: "Questions fréquentes", conclusionHeading: "Conclusion", ctaLang: "en français" },
      pt: { name: "português (BR/PT neutro)", audience: "falantes de português do Brasil e Portugal", faqHeading: "Perguntas frequentes", conclusionHeading: "Conclusão", ctaLang: "em português" },
      it: { name: "italiano standard", audience: "italiani che imparano le lingue", faqHeading: "Domande frequenti", conclusionHeading: "Conclusione", ctaLang: "in italiano" },
      de: { name: "Hochdeutsch", audience: "deutschsprachige Sprachlerner", faqHeading: "Häufig gestellte Fragen", conclusionHeading: "Fazit", ctaLang: "auf Deutsch" },
    };
    const L = LANG_MAP[language] ?? LANG_MAP.es;

    const system = `You are a SENIOR SEO WRITER with 15+ years of experience in web positioning, content marketing, EEAT, and Google AdSense monetization. Write the ENTIRE article in ${L.name} for ${L.audience}. Do NOT switch languages mid-article.

Writing rules:
- Length: 1500-2000 real words of content.
- 100% original, useful content. No filler, no repetitive phrases.
- Clear structure: ONE H1 (# ) with the main keyword, several descriptive H2 (## ) with semantic variants, and H3 (### ) for internal breakdowns.
- Introduction that hooks the reader from the first line.
- Develop each section with depth and practical examples.
- Professional, close, humanized tone (never "as an AI", "in this article we will discuss", "in conclusion I have presented").
- Include bullet lists with "- " and at least ONE comparative markdown table where it adds value.
- Add a "## ${L.faqHeading}" section with 4-6 real questions using ### for each question.
- Close with "## ${L.conclusionHeading}" and a natural CTA toward iLingue Relax (5,000 / 8,000 word dictionaries with Spanish pronunciation and UK/USA phonetics) written ${L.ctaLang}, NEVER spammy.
- Optimize for the main keyword + related secondary keywords naturally (density ~1-2%).
- Fulfill EEAT: experience, authority, trust. Cite official sources when relevant.
- Ready to rank on Google, maximize dwell time, and monetize with AdSense.
- NEVER mention that you are an AI nor explain the process.

Return ONLY a valid JSON (no surrounding markdown) with this exact shape. ALL string values (title, metaTitle, metaDescription, excerpt, content, category, tags, anchors) MUST be written in ${L.name}:
{
  "title": "Full attractive H1 title",
  "metaTitle": "Max 60 chars for <title>",
  "metaDescription": "Max 155 chars for meta description",
  "slug": "url-friendly-lowercase-with-hyphens",
  "excerpt": "150-200 char summary for blog card",
  "content": "# H1...\\n\\n## H2...\\n\\n(full article in markdown, 1500-2000 words, with table, lists, FAQ and conclusion + CTA)",
  "category": "...",
  "tags": ["main keyword","secondary 1","secondary 2","..."],
  "readTime": "8 min",
  "internalLinks": [{"anchor":"anchor text","url":"/internal-path"}],
  "externalLinks": [{"anchor":"anchor text","url":"https://official-source.com"}]
}

The content field MUST start with "# " (H1) and contain the full article ready to publish. Do NOT explain anything outside the JSON.`;

    const productsCtx = Array.isArray(productCards) && productCards.length
      ? `\n\nPRODUCTOS iLINGUE RELAX A MENCIONAR NATURALMENTE en el CTA y "Recursos recomendados" (usa los títulos exactos y enlaza con la ruta /products/{slug}):\n${productCards.map((p) => `- ${p.title} → /products/${p.slug}${p.description ? " · " + p.description : ""}`).join("\n")}`
      : "";

    const user = `📝 Título del artículo: ${topic}
Keyword principal SEO: ${keyword || topic}
Categoría sugerida: ${category}${productsCtx}

Genera el artículo completo siguiendo TODAS las reglas del sistema.`;


    const aiRes = await fetch(AI_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit del gateway de IA. Intenta en 1 min." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos IA agotados. Recárgalos en Settings → Workspace → Usage." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      throw new Error(`AI ${aiRes.status}: ${t.slice(0, 300)}`);
    }

    const aiJson = await aiRes.json();
    const raw = aiJson.choices?.[0]?.message?.content || "{}";
    let parsed: GenPayload = {};
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      // try to strip code fences
      const cleaned = String(raw).replace(/```json\s*|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    }

    if (!parsed.title || !parsed.content) {
      throw new Error("Respuesta IA inválida");
    }

    // Ensure H1 exists at top
    let content = parsed.content.trim();
    if (!content.startsWith("# ")) {
      content = `# ${parsed.title}\n\n${content}`;
    }

    // Append internal + external link suggestions at the bottom for the editor
    const iLinks = Array.isArray(parsed.internalLinks) ? parsed.internalLinks.slice(0, 8) : [];
    const eLinks = Array.isArray(parsed.externalLinks) ? parsed.externalLinks.slice(0, 6) : [];
    if (iLinks.length || eLinks.length) {
      content += `\n\n---\n\n<!-- SUGERENCIAS SEO PARA EL EDITOR -->\n`;
      if (iLinks.length) {
        content += `\n**Enlaces internos sugeridos:**\n${iLinks.map((l) => `- [${l.anchor}](${l.url})`).join("\n")}\n`;
      }
      if (eLinks.length) {
        content += `\n**Enlaces externos sugeridos:**\n${eLinks.map((l) => `- [${l.anchor}](${l.url})`).join("\n")}\n`;
      }
    }

    const slug = (parsed.slug ? slugify(parsed.slug) : "") || slugify(parsed.title);
    const excerpt = (parsed.metaDescription || parsed.excerpt || content.replace(/^#.*$/m, "").trim().slice(0, 180)).slice(0, 240);


    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: inserted, error: dbErr } = await supabase
      .from("generated_blog_posts")
      .insert({
        slug,
        title: parsed.title,
        excerpt,
        content,
        category: parsed.category || category,
        tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 10) : [],
        read_time: parsed.readTime || "6 min",
        keyword: keyword || topic,
        image: parsed.image || "https://ilinguerelax.com/og-image.png",
        published: !!publish,
        related_products: Array.isArray(relatedProducts) ? relatedProducts.slice(0, 12) : [],
      })
      .select()
      .single();

    if (dbErr) {
      // handle duplicate slug
      if ((dbErr as { code?: string }).code === "23505") {
        return new Response(JSON.stringify({ error: `Ya existe un post con slug "${slug}"` }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw dbErr;
    }


    // On publish, notify search engines immediately (IndexNow + sitemap ping).
    // Failures are swallowed inside the helpers — never block the response.
    if (publish) {
      const postUrl = `https://ilinguerelax.com/blog/${slug}`;
      await Promise.allSettled([
        pingIndexNow([postUrl, "https://ilinguerelax.com/blog"]),
        pingSitemap(),
      ]);
    }

    return new Response(JSON.stringify({ post: inserted }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-blog-post error:", err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
