// Generate SEO-optimized blog post using Lovable AI Gateway and store it in
// generated_blog_posts. Admin-only.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { assertAdminCsrf } from "../_shared/adminCsrf.ts";

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
    } = body as {
      adminKey?: string;
      topic?: string;
      keyword?: string;
      category?: string;
      language?: string;
      publish?: boolean;
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

    const system = `Actúa como un REDACTOR SEO SENIOR con más de 15 años de experiencia en posicionamiento web, marketing de contenidos, EEAT y monetización con Google AdSense. Escribes ${language === "es" ? "en español neutro" : "en " + language} para hispanohablantes de LATAM y España.

Reglas de redacción:
- Extensión: entre 1500 y 2000 palabras reales de contenido.
- Contenido 100% original, útil, sin relleno ni frases repetitivas.
- Estructura clara: UN SOLO H1 (# ) con la keyword principal, varios H2 (## ) descriptivos con variantes semánticas, y H3 (### ) para desgloses internos.
- Introducción que enganche al lector desde la primera línea.
- Desarrolla cada apartado con profundidad y ejemplos prácticos.
- Tono profesional, cercano, humanizado (nada de "como IA", "en este artículo hablaremos", "en conclusión he expuesto").
- Incluye listas con "- ", y al menos UNA tabla markdown comparativa cuando aporte valor.
- Añade una sección "## Preguntas frecuentes" con 4-6 preguntas reales usando ### para cada pregunta.
- Cierra con "## Conclusión" y una llamada a la acción natural hacia iLingue Relax (diccionarios 5.000 / 8.000 palabras con pronunciación en español y fonética UK/USA) SIN sonar a spam.
- Optimiza para la keyword principal + secundarias relacionadas de forma natural (densidad ~1-2%).
- Cumple EEAT: experiencia, autoridad, confianza. Cita fuentes oficiales cuando corresponda.
- Preparado para posicionar en Google, maximizar dwell time y monetizar con AdSense.
- NUNCA menciones que eres una IA ni expliques el proceso.

Devuelve SOLO un JSON válido (sin markdown alrededor) con esta forma exacta:
{
  "title": "Título H1 completo, atractivo",
  "metaTitle": "Máx 60 caracteres para <title>",
  "metaDescription": "Máx 155 caracteres para meta description",
  "slug": "url-amigable-en-minusculas-con-guiones",
  "excerpt": "Resumen de 150-200 caracteres para tarjeta del blog",
  "content": "# H1...\\n\\n## H2...\\n\\n(artículo completo en markdown, 1500-2000 palabras, con tabla, listas, FAQ y conclusión + CTA)",
  "category": "...",
  "tags": ["keyword principal","secundaria 1","secundaria 2","..."],
  "readTime": "8 min",
  "internalLinks": [{"anchor":"texto ancla","url":"/ruta-interna"}],
  "externalLinks": [{"anchor":"texto ancla","url":"https://fuente-oficial.com"}]
}

El campo content DEBE arrancar con "# " (H1) y contener el artículo completo listo para publicar. NO expliques nada fuera del JSON.`;

    const user = `📝 Título del artículo: ${topic}
Keyword principal SEO: ${keyword || topic}
Categoría sugerida: ${category}

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
