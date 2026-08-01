// Núcleo de generación de artículos SEO (Lovable AI Gateway → generated_blog_posts).
//
// Lo usan dos entradas:
//   - generate-blog-post   → generación manual desde /admin/seo
//   - process-blog-queue   → cola programada (10 posts/día durante 5 días)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { pingIndexNow, pingSitemap, pingWebSub } from "./indexnow.ts";
import { pingPinterestAndCms } from "./pinterestPing.ts";
import { notifyGoogleIndexing } from "./googleIndexing.ts";
import { resubmitSitemapsGSC, inspectUrlGSC } from "./gsc.ts";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export class BlogGenError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

export function slugify(input: string): string {
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

export interface GenerateArgs {
  topic: string;
  keyword?: string;
  category?: string;
  language?: string;
  publish?: boolean;
  relatedProducts?: string[];
  productCards?: Array<{ id: string; title: string; slug: string; description?: string }>;
}

const LANG_MAP: Record<string, { name: string; audience: string; faqHeading: string; conclusionHeading: string; ctaLang: string }> = {
  es: { name: "español neutro", audience: "hispanohablantes de LATAM y España", faqHeading: "Preguntas frecuentes", conclusionHeading: "Conclusión", ctaLang: "en español" },
  en: { name: "English (US/UK neutral)", audience: "English learners and Spanish speakers learning English worldwide", faqHeading: "Frequently Asked Questions", conclusionHeading: "Conclusion", ctaLang: "in English" },
  fr: { name: "français standard", audience: "francophones apprenant les langues", faqHeading: "Questions fréquentes", conclusionHeading: "Conclusion", ctaLang: "en français" },
  pt: { name: "português (BR/PT neutro)", audience: "falantes de português do Brasil e Portugal", faqHeading: "Perguntas frequentes", conclusionHeading: "Conclusão", ctaLang: "em português" },
  it: { name: "italiano standard", audience: "italiani che imparano le lingue", faqHeading: "Domande frequenti", conclusionHeading: "Conclusione", ctaLang: "in italiano" },
  de: { name: "Hochdeutsch", audience: "deutschsprachige Sprachlerner", faqHeading: "Häufig gestellte Fragen", conclusionHeading: "Fazit", ctaLang: "auf Deutsch" },
};

export async function generateAndStorePost(args: GenerateArgs): Promise<Record<string, unknown>> {
  const {
    topic,
    keyword,
    category = "Aprendizaje",
    language = "es",
    publish = false,
    relatedProducts = [],
    productCards = [],
  } = args;

  if (!topic || topic.trim().length < 4) throw new BlogGenError("Missing topic", 400);

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableKey) throw new BlogGenError("LOVABLE_API_KEY missing", 500);

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

  if (aiRes.status === 429) throw new BlogGenError("Rate limit del gateway de IA. Intenta en 1 min.", 429);
  if (aiRes.status === 402) throw new BlogGenError("Créditos IA agotados. Recárgalos en Settings → Workspace → Usage.", 402);
  if (!aiRes.ok) {
    const t = await aiRes.text();
    throw new BlogGenError(`AI ${aiRes.status}: ${t.slice(0, 300)}`, 502);
  }

  const aiJson = await aiRes.json();
  const raw = aiJson.choices?.[0]?.message?.content || "{}";
  let parsed: GenPayload = {};
  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    const cleaned = String(raw).replace(/```json\s*|```/g, "").trim();
    parsed = JSON.parse(cleaned);
  }

  if (!parsed.title || !parsed.content) throw new BlogGenError("Respuesta IA inválida", 502);

  let content = parsed.content.trim();
  if (!content.startsWith("# ")) content = `# ${parsed.title}\n\n${content}`;

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

  const baseSlug = (parsed.slug ? slugify(parsed.slug) : "") || slugify(parsed.title);
  const excerpt = (parsed.metaDescription || parsed.excerpt || content.replace(/^#.*$/m, "").trim().slice(0, 180)).slice(0, 240);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Evita colisiones de slug en la cola automática (mismo tema, distinto ángulo).
  let slug = baseSlug;
  let inserted: Record<string, unknown> | null = null;
  for (let attempt = 0; attempt < 3 && !inserted; attempt++) {
    const { data, error } = await supabase
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

    if (!error) { inserted = data as Record<string, unknown>; break; }
    if ((error as { code?: string }).code !== "23505") throw error;
    slug = `${baseSlug.slice(0, 70)}-${attempt + 2}`;
  }

  if (!inserted) throw new BlogGenError(`Ya existe un post con slug "${baseSlug}"`, 409);

  if (publish) {
    const postUrl = `https://ilinguerelax.com/blog/${slug}`;
    await Promise.allSettled([
      pingIndexNow([postUrl, "https://ilinguerelax.com/blog"]),
      pingSitemap(),
      pingWebSub(),
      // Google Indexing API (cuenta de servicio GOOGLE_INDEXING_SA_JSON)
      notifyGoogleIndexing([postUrl], "URL_UPDATED"),
      resubmitSitemapsGSC(),
      inspectUrlGSC(postUrl),
      // Pinterest + webhook del CMS
      pingPinterestAndCms({ url: postUrl, title: parsed.title, type: "blog" }),
    ]);
    await supabase
      .from("generated_blog_posts")
      .update({ google_index_requested_at: new Date().toISOString() })
      .eq("id", inserted.id as string)
      .is("google_index_requested_at", null);
  }

  return inserted;
}
