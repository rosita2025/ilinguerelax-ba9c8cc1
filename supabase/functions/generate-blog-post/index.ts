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
  excerpt?: string;
  content?: string;
  category?: string;
  tags?: string[];
  readTime?: string;
  image?: string;
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
      publish = true,
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

    const system = `Eres un editor SEO experto para iLingue Relax (aprender inglés y coreano con pronunciación en español). Escribes artículos ${language === "es" ? "en español" : "en " + language} orientados a hispanohablantes, con estructura clara para Google:
- Un único H1 con la keyword principal (línea que empieza con "# ").
- Subtítulos H2 ("## ") descriptivos con variantes semánticas de la keyword.
- H3 ("### ") para desgloses.
- Párrafos cortos (2-4 líneas), listas con "- ", tablas markdown cuando aporte.
- Menciona sutilmente productos iLingue Relax (5,000 y 8,000 palabras con pronunciación, fonética UK/USA) cuando encaje, sin sonar a spam.
- Longitud objetivo: 900-1400 palabras.
- Devuelve SOLO un JSON válido, sin markdown alrededor, con esta forma exacta:
{"title":"...","excerpt":"...","content":"# H1...\\n\\n## H2...","category":"...","tags":["..."],"readTime":"6 min"}
El campo content DEBE usar markdown con # ## ### y arrancar con el H1.`;

    const user = `Tema: ${topic}\nKeyword principal SEO: ${keyword || topic}\nCategoría sugerida: ${category}\nGenera el artículo optimizado para SEO.`;

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

    const slug = slugify(parsed.title);
    const excerpt = (parsed.excerpt || content.replace(/^#.*$/m, "").trim().slice(0, 180)).slice(0, 240);

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
