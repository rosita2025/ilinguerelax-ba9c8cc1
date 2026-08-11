// Núcleo de generación de artículos SEO (Lovable AI Gateway → generated_blog_posts).
//
// Lo usan dos entradas:
//   - generate-blog-post   → generación manual desde /admin/seo
//   - process-blog-queue   → cola programada (10 posts/día durante 10 días)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { pingIndexNow, pingSitemap, pingWebSub } from "./indexnow.ts";
import { pingPinterestAndCms } from "./pinterestPing.ts";
import { notifyGoogleIndexing } from "./googleIndexing.ts";
import { resubmitSitemapsGSC, inspectUrlGSC } from "./gsc.ts";

const AI_URL = "https://api.apimart.ai/v1/chat/completions";

export class BlogGenError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

// Apimart a veces devuelve SSE aunque se pida JSON. Normalizamos ambos formatos
// a la forma estándar { choices: [{ message: { content } }] }.
// deno-lint-ignore no-explicit-any
/**
 * Repara y parsea el JSON que devuelve el modelo.
 * Los LLM suelen romper el JSON con saltos de línea reales o comillas sin
 * escapar dentro de los strings (típico en `content` markdown largo).
 */
function repairJsonString(src: string): string {
  let out = "";
  let inString = false;
  let escaped = false;
  
  // Limpieza inicial: eliminamos caracteres de control que suelen romper JSON.parse
  // pero preservamos saltos de línea y tabs para manejarlos después.
  const cleanSrc = src.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "");

  for (let i = 0; i < cleanSrc.length; i++) {
    const ch = cleanSrc[i];
    if (escaped) { out += ch; escaped = false; continue; }
    if (ch === "\\") { out += ch; escaped = true; continue; }
    
    if (ch === '"') {
      if (!inString) {
        inString = true;
        out += ch;
      } else {
        // ¿Es un cierre real? Miramos el siguiente carácter no-blanco
        let nextChar = "";
        for (let j = i + 1; j < cleanSrc.length; j++) {
          if (!/\s/.test(cleanSrc[j])) {
            nextChar = cleanSrc[j];
            break;
          }
        }
        
        // Si el siguiente es , : } ] o fin de string, es cierre probable
        if (nextChar === "," || nextChar === ":" || nextChar === "}" || nextChar === "]" || nextChar === "") {
          inString = false;
          out += ch;
        } else {
          // Es una comilla dentro de un string sin escapar
          out += '\\"';
        }
      }
      continue;
    }
    
    if (inString) {
      if (ch === "\n") { out += "\\n"; continue; }
      if (ch === "\r") { out += "\\r"; continue; }
      if (ch === "\t") { out += "\\t"; continue; }
      // Caracteres especiales que deben escaparse en JSON strings
      if (ch === "\b") { out += "\\b"; continue; }
      if (ch === "\f") { out += "\\f"; continue; }
    }
    out += ch;
  }
  
  // Si el string quedó abierto, intentamos cerrarlo
  if (inString) out += '"';
  
  return out;
}

function parseModelJson(raw: string): any {
  let text = String(raw).replace(/```json\s*|```/g, "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start > 0 || (end !== -1 && end < text.length - 1)) {
    if (start !== -1 && end > start) text = text.slice(start, end + 1);
  }
  try {
    return JSON.parse(text);
  } catch (_e) {
    try {
      return JSON.parse(repairJsonString(text));
    } catch (e2) {
      console.error("[BlogGen] JSON del modelo irreparable:", text.slice(0, 500));
      throw new BlogGenError(
        `La IA devolvió un JSON inválido: ${(e2 as Error).message}. Reintenta la generación.`,
        502,
      );
    }
  }
}

function parseAiResponse(text: string): any {

  const trimmed = text.trim();
  if (!trimmed) throw new BlogGenError("Respuesta vacía del proveedor de IA", 502);

  // Intentamos parsear como JSON directo primero
  if (!trimmed.startsWith("data:")) {
    try {
      return JSON.parse(repairJsonString(trimmed));
    } catch {
      // Si falla, quizás es un error de formato pero tiene data: oculto o es texto plano
      if (!trimmed.includes("data:")) {
        console.error("[BlogGen] Respuesta IA no parseable (no JSON ni SSE):", trimmed.slice(0, 500));
        throw new BlogGenError(`La IA no devolvió un formato válido. Reintenta.`, 502);
      }
    }
  }

  // Manejo robusto de SSE (data: { ... })
  let content = "";
  let last: any = null;
  
  // Dividimos por líneas y procesamos cada fragmento "data:"
  const lines = trimmed.split("\n");
  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;
    
    // Si la línea empieza con "data:", es SSE
    if (l.startsWith("data:")) {
      const payload = l.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      
      try {
        const chunk = JSON.parse(payload);
        last = chunk;
        
        // Apimart/OpenAI suelen usar delta para streams y message para respuestas completas
        const choice = chunk.choices?.[0];
        const piece = choice?.delta?.content ?? choice?.message?.content ?? "";
        if (typeof piece === "string") content += piece;
      } catch {
        // Fragmento JSON incompleto o corrupto en el stream, lo ignoramos para intentar rescatar el resto
      }
    } else if (l.startsWith("{") && l.endsWith("}")) {
      // Intento de rescate si hay un JSON puro en medio del stream
      try {
        const chunk = JSON.parse(l);
        last = chunk;
        const choice = chunk.choices?.[0];
        const piece = choice?.message?.content ?? choice?.delta?.content ?? "";
        if (typeof piece === "string") content += piece;
      } catch { /* ignore */ }
    }
  }

  // Fallback: si no acumulamos nada con deltas pero el último chunk tiene el mensaje completo
  if (!content && last?.choices?.[0]?.message?.content) {
    content = last.choices[0].message.content;
  }
  
  if (!content) {
    // Caso desesperado: si no hay "data:" estructurado pero hay un JSON válido perdido en el texto
    // Buscamos cualquier bloque que parezca JSON de OpenAI/Apimart
    const matches = trimmed.match(/\{"id":.*?"content":.*?\}/sg);
    if (matches) {
      for (const match of matches) {
        try {
          const rescued = JSON.parse(match);
          const piece = rescued.choices?.[0]?.message?.content ?? rescued.choices?.[0]?.delta?.content ?? rescued.content ?? "";
          if (piece) content += piece;
        } catch { /* ignore */ }
      }
    }
  }

  if (!content) throw new BlogGenError("Stream de IA sin contenido utilizable", 502);

  return { choices: [{ message: { content } }] };
}


async function generateImage(prompt: string, slug: string): Promise<string | null> {
  const apimartToken = Deno.env.get("APIMART_TOKEN");
  if (!apimartToken || !prompt) {
    console.warn("[BlogGen] APIMART_TOKEN no configurado o prompt vacío, saltando imagen.");
    return null;
  }

  try {
    console.log(`[BlogGen] Generando imagen con APIMART para: ${slug}...`);
    // Usamos el endpoint de gpt-image-2-ext en APIMART para mayor disponibilidad
    const res = await fetch("https://api.apimart.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apimartToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-2-ext",
        prompt: `Professional educational photography, high quality, clean, 1024x1024, no text, no captions. Subject: ${prompt}. Relevant to language learning for iLingue Relax, using soft teal and coral accents in the environment.`,
        n: 1,
        size: "1024x1024",
        response_format: "url"
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[BlogGen] Error APIMART imagen (Status ${res.status}):`, errorText);
      return null;
    }

    const text = await res.text();
    console.log("[BlogGen] Respuesta cruda de imagen:", text.slice(0, 500));
    
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.log("[BlogGen] Respuesta de imagen no es JSON directo, intentando parsear SSE...");
      const parsed = parseAiResponse(text);
      try {
        const contentStr = parsed.choices?.[0]?.message?.content;
        data = (typeof contentStr === 'string' && (contentStr.trim().startsWith('{') || contentStr.trim().startsWith('[')))
          ? JSON.parse(contentStr)
          : contentStr || parsed;
      } catch {
        data = parsed;
      }
    }

    // Estructuras comunes de Apimart/OpenAI:
    // 1. { data: [{ url: "..." }] }
    // 2. { choices: [{ message: { content: "..." } }] }
    // 3. Texto plano que es una URL
    let tempUrl = data?.data?.[0]?.url || data?.url;
    
    if (!tempUrl && data?.choices?.[0]?.message?.content) {
       const content = data.choices[0].message.content.trim();
       if (content.startsWith("http")) {
         tempUrl = content;
       } else {
         try {
           const nested = JSON.parse(content);
           tempUrl = nested?.data?.[0]?.url || nested?.url || nested?.image_url;
         } catch { /* ignore */ }
       }
    }

    // Si data mismo es un string que empieza por http
    if (!tempUrl && typeof data === 'string' && data.trim().startsWith("http")) {
      tempUrl = data.trim();
    }

    if (!tempUrl) {
      console.error("[BlogGen] APIMART no devolvió URL de imagen. Estructura recibida:", JSON.stringify(data).slice(0, 500));
      return null;
    }

    // Descargar y subir a Storage
    const imgRes = await fetch(tempUrl);
    if (!imgRes.ok) throw new Error(`Error descargando imagen de APIMART: ${imgRes.status}`);
    const blob = await imgRes.blob();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const fileName = `${slug}-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("blog-images")
      .upload(fileName, blob, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("[BlogGen] Error upload imagen:", uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("blog-images")
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (err) {
    console.error("[BlogGen] generateImage error:", err);
    return null;
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
  imagePrompt?: string; // Nuevo campo para generación de imagen
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

  const apimartToken = Deno.env.get("APIMART_TOKEN");
  if (!apimartToken) throw new BlogGenError("APIMART_TOKEN missing", 500);


  const L = LANG_MAP[language] ?? LANG_MAP.es;
  const productsList = (Array.isArray(productCards) && productCards.length > 0) ? productCards : [];

  const system = `You are a SENIOR SEO WRITER with 15+ years of experience. Write the ENTIRE article in ${L.name} for ${L.audience}.
CRITICAL: Since we are generating 300 articles, this topic might repeat. Ensure this specific article has a UNIQUE perspective, different examples, and a fresh hook even if the keyword is common.
CRITICAL: You MUST naturally integrate exactly 1 or 2 product cards from the provided list using the format [PRODUCT_CARD:slug] within the content body (not just at the end).



Writing rules:
- Length: Target 1800 words of high-quality, comprehensive content. Deeply cover the topic without filler.
- 100% original, useful content. No generic AI-sounding phrases.
- Clear structure: ONE H1 (# ) with the main keyword, several descriptive H2 (## ) with semantic variants, and H3 (### ) for internal breakdowns.
- Introduction: Hook the reader in the first paragraph while including the primary keyword naturally.
- Professional, close, humanized tone (never "as an AI", "in this article we will discuss", "in conclusion I have presented").
  - Include bullet lists with "- " and at least ONE comparative markdown table where it adds value.
  - Add a "## ${L.faqHeading}" section with 4-6 real questions using ### for each question.
  - Close with "## ${L.conclusionHeading}" and a natural CTA toward iLingue Relax (5,000 / 8,000 word dictionaries with Spanish pronunciation and UK/USA phonetics) written ${L.ctaLang}.
  - IMPORTANT: You MUST use the [PRODUCT_CARD:slug] format at least twice in the text to embed products from our catalog.
  - Optimize for the main keyword (density ~1.5%) and related secondary keywords.
- Fulfill EEAT: Cite official sources or common industry standards when relevant.
- Ready to rank on Google and maximize dwell time.
- NEVER mention that you are an AI nor explain the process.

Return ONLY a valid JSON (no surrounding markdown) with this exact shape. ALL string values (title, metaTitle, metaDescription, excerpt, content, category, tags, anchors, imagePrompt) MUST be written in ${L.name}:
{
  "title": "Full attractive H1 title",
  "metaTitle": "Max 60 chars for <title>",
  "metaDescription": "Max 155 chars for meta description",
  "slug": "url-friendly-lowercase-with-hyphens",
  "excerpt": "150-200 char summary for blog card",
  "content": "# H1...\\n\\n## H2...\\n\\n(full article in markdown, around 1800 words, with table, lists, FAQ and conclusion + CTA. INTEGRATE product cards naturally using the format [PRODUCT_CARD:slug] where appropriate)",
  "category": "...",
  "tags": ["main keyword","secondary 1","secondary 2","..."],
  "readTime": "8 min",
  "imagePrompt": "Highly descriptive prompt for an AI image generator (1024x1024). Include style (realistic educational photography or clean 3D isometric), lighting, and brand colors (teal/coral hints). NO TEXT in image. Make it relevant to the topic of language learning.",
  "internalLinks": [{"anchor":"anchor text","url":"/internal-path"}],
  "externalLinks": [{"anchor":"anchor text","url":"https://official-source.com"}]
}


The content field MUST start with "# " (H1) and contain the full article ready to publish. Do NOT explain anything outside the JSON.`;

  const productsCtx = productsList.length > 0
    ? `\n\nPRODUCTOS iLINGUE RELAX A MENCIONAR NATURALMENTE en el CTA y "Recursos recomendados" (usa los títulos exactos y enlaza internamente usando el formato [PRODUCT_CARD:slug]):\n${productsList.map((p) => `- ${p.title} (slug: ${p.slug})${p.description ? " · " + p.description : ""}`).join("\n")}`
    : "";

  const user = `📝 Título del artículo: ${topic}
Keyword principal SEO: ${keyword || topic}
Categoría sugerida: ${category}${productsCtx}

Genera el artículo completo siguiendo TODAS las reglas del sistema.`;

  const aiRes = await fetch(AI_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apimartToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-2-ext",
      stream: false,
      temperature: 0.7, // Añadimos un poco de variedad para que no sean idénticos
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (aiRes.status === 429) throw new BlogGenError("Rate limit del gateway de IA. Intenta en 1 min.", 429);
  if (aiRes.status === 402 || aiRes.status === 401) {
    const text = await aiRes.text();
    if (text.includes("balance") || text.includes("credits") || text.includes("quota")) {
      throw new BlogGenError("Créditos de Apimart agotados o token inválido.", 402);
    }
  }

  if (!aiRes.ok) {
    const t = await aiRes.text();
    throw new BlogGenError(`AI ${aiRes.status}: ${t.slice(0, 300)}`, 502);
  }

  // Apimart puede responder con JSON normal o con un stream SSE ("data: {...}").
  const aiText = await aiRes.text();
  let aiJson;
  try {
    aiJson = parseAiResponse(aiText);
  } catch (e) {
    console.error("[BlogGen] Error parseando respuesta de Apimart:", aiText.slice(0, 500));
    throw e;
  }
  const raw = aiJson.choices?.[0]?.message?.content || "{}";

  const parsed: GenPayload = typeof raw === "string" ? parseModelJson(raw) : (raw as GenPayload);


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

  // Generación de imagen opcional pero recomendada
  const generatedImageUrl = parsed.imagePrompt 
    ? await generateImage(parsed.imagePrompt, baseSlug)
    : null;

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
        image: generatedImageUrl || parsed.image || "https://ilinguerelax.com/og-image.png",
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
