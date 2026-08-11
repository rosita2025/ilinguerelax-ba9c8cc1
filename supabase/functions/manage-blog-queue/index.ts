// Administración de la cola programada del blog (/admin/seo).
//
// Acciones: list | seed | delete | clear | run-now
// La agenda por defecto: 5 días × 5 turnos (08:00, 09:00, 11:00, 13:00, 20:00
// hora de Perú, UTC-5) × 2 artículos por turno = 10 al día = 50 en total.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { invokeInternalFunction } from "../_shared/invokeInternal.ts";
import { pingIndexNow, pingSitemap, pingWebSub } from "../_shared/indexnow.ts";
import { pingPinterestAndCms } from "../_shared/pinterestPing.ts";
import { notifyGoogleIndexing } from "../_shared/googleIndexing.ts";
import { resubmitSitemapsGSC, inspectUrlGSC } from "../_shared/gsc.ts";
import { BlogGenError, generateAndStorePost } from "../_shared/blogGenerator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa",
};

/** Turnos diarios en hora de Perú (UTC-5). */
export const SLOTS_PERU = [8, 9, 11, 13, 20];
const POSTS_PER_SLOT = 2;
const DAYS = 30; // Aseguramos 30 días para completar 300 posts (10 al día)
const PERU_OFFSET_HOURS = 5;

/** Palabras clave reales de Search Console (con su idioma objetivo). */
const KEYWORDS: Array<{ kw: string; lang: string; category: string }> = [
  { kw: "aprender coreano desde cero", lang: "es", category: "Coreano" },
  { kw: "vocabulario coreano básico", lang: "es", category: "Coreano" },
  { kw: "pronunciación coreana paso a paso", lang: "es", category: "Coreano" },
  { kw: "mejores aplicaciones para aprender coreano", lang: "es", category: "Coreano" },
  { kw: "frases comunes en coreano para viajar", lang: "es", category: "Coreano" },
  { kw: "easiest way to learn spanish fast", lang: "en", category: "Spanish" },
  { kw: "how to learn spanish effectively", lang: "en", category: "Spanish" },
  { kw: "best resources to learn spanish 2026", lang: "en", category: "Spanish" },
  { kw: "spanish pronunciation guide for beginners", lang: "en", category: "Spanish" },
  { kw: "learn spanish vocabulary quickly", lang: "en", category: "Spanish" },
  { kw: "aprender inglés para el trabajo", lang: "es", category: "Inglés" },
  { kw: "verbos más usados en inglés", lang: "es", category: "Inglés" },
  { kw: "cómo mejorar la pronunciación en inglés", lang: "es", category: "Inglés" },
  { kw: "diccionario de inglés con pronunciación", lang: "es", category: "Inglés" },
  { kw: "ilingue relax opiniones y beneficios", lang: "es", category: "Marca" },
  { kw: "métodos para aprender idiomas rápido", lang: "es", category: "General" },
  { kw: "ventajas de ser bilingüe en 2026", lang: "es", category: "General" },
  { kw: "aprender francés básico", lang: "es", category: "Francés" },
  { kw: "gramática francesa para hispanohablantes", lang: "es", category: "Francés" },
  { kw: "consejos para aprender portugués", lang: "es", category: "Portugués" },
];

/** Ángulos editoriales para que 50 artículos no se repitan entre sí. */
const ANGLES: Record<string, string[]> = {
  es: [
    "Guía completa 2026: {kw} paso a paso desde cero",
    "{kw}: método de 30 días con rutina diaria realista",
    "Errores más comunes al {kw} y cómo evitarlos",
    "{kw} con pronunciación: técnicas que sí funcionan",
    "Plan de estudio semanal para {kw} trabajando o estudiando",
  ],
  en: [
    "{kw}: the complete step-by-step 2026 guide",
    "{kw} in 30 days: a realistic daily routine that works",
    "Common mistakes when trying {kw} (and how to fix them)",
    "{kw} with pronunciation: proven techniques for real conversations",
    "A weekly study plan for {kw} when you have a full-time job",
  ],
};

function titleCaseFirst(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Construye 50 tareas repartidas en la agenda, empezando el día indicado. */
function buildSchedule(startFrom: Date) {
  const items: Array<{ topic: string; keyword: string; language: string; category: string; scheduled_at: string }> = [];
  let idx = 0;

  for (let day = 0; day < DAYS; day++) {
    for (const hourPeru of SLOTS_PERU) {
      for (let n = 0; n < POSTS_PER_SLOT; n++) {
        const k = KEYWORDS[idx % KEYWORDS.length];
        const angles = ANGLES[k.lang] ?? ANGLES.es;
        const angle = angles[Math.floor(idx / KEYWORDS.length) % angles.length];
        const topic = titleCaseFirst(angle.replace("{kw}", k.kw));

        // hora Perú → UTC
        const d = new Date(startFrom);
        d.setUTCDate(d.getUTCDate() + day);
        d.setUTCHours(hourPeru + PERU_OFFSET_HOURS, n * 20, 0, 0);

        items.push({
          topic,
          keyword: k.kw,
          language: k.lang,
          category: k.category,
          scheduled_at: d.toISOString(),
        });
        idx++;
      }
    }
  }
  return items;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;



  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const body = await req.json().catch(() => ({})) as {
      adminKey?: string;
      action?: string;
      id?: string;
      startTomorrow?: boolean;
      force?: boolean;
      count?: number;
    };

    const expected = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expected || body.adminKey !== expected) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    switch (body.action) {
      case "list": {
        const { data, error } = await supabase
          .from("blog_post_queue")
          .select("id,topic,keyword,language,category,scheduled_at,status,attempts,error,post_id,post_slug")
          .order("scheduled_at", { ascending: true })
          .limit(200);
        if (error) throw error;
        return json({ items: data ?? [] });
      }

      case "seed": {
        const start = new Date();
        start.setUTCHours(0, 0, 0, 0);
        if (body.startTomorrow !== false) start.setUTCDate(start.getUTCDate() + 1);

        const batch = `lote-${new Date().toISOString().slice(0, 16)}`;
        const startFrom = start;
        const rows = buildSchedule(startFrom).map((r) => ({ ...r, batch }));

        const { data, error } = await supabase
          .from("blog_post_queue")
          .insert(rows)
          .select("id");
        if (error) throw error;
        return json({ created: data?.length ?? 0, batch, count: rows.length });
      }

      case "delete": {
        if (!body.id) return json({ error: "Missing id" }, 400);
        const { error } = await supabase.from("blog_post_queue").delete().eq("id", body.id);
        if (error) throw error;
        return json({ ok: true });
      }

      case "clear": {
        const { error } = await supabase
          .from("blog_post_queue")
          .delete()
          .in("status", ["pending", "failed", "done", "processing"]);
        if (error) throw error;
        return json({ ok: true });
      }

      case "retry": {
        if (!body.id) return json({ error: "Missing id" }, 400);
        const { error } = await supabase
          .from("blog_post_queue")
          .update({ status: "pending", attempts: 0, error: null })
          .eq("id", body.id);
        if (error) throw error;
        return json({ ok: true });
      }

      case "run-now": {
        // Con `force`, adelanta los próximos pendientes a "ahora" para que la
        // cola los genere de inmediato (si no, solo corre lo que ya vencía).
        let forced = 0;
        if (body.force) {
          const take = Math.min(Math.max(Number(body.count ?? 2) || 2, 1), 5);
          const { data: next } = await supabase
            .from("blog_post_queue")
            .select("id")
            .eq("status", "pending")
            .order("scheduled_at", { ascending: true })
            .limit(take);
          const ids = (next ?? []).map((r) => r.id as string);
          if (ids.length) {
            await supabase
              .from("blog_post_queue")
              .update({ scheduled_at: new Date().toISOString() })
              .in("id", ids);
            forced = ids.length;
          }
        }

        const res = await invokeInternalFunction("process-blog-queue", {});
        if (res.error) return json({ error: res.error.message }, 502);
        const result = (res.data ?? {}) as { processed?: number };
        return json({ ok: true, forced, processed: result.processed ?? 0, result: res.data });
      }

      // Genera al instante SOLO ese item de la agenda y devuelve el borrador.
      // Se genera en línea (sin pasar por process-blog-queue) para no esperar
      // un segundo salto HTTP ni la generación de otros artículos de la cola.
      case "generate-one": {
        if (!body.id) return json({ error: "Missing id" }, 400);
        const { data: item, error: itemErr } = await supabase
          .from("blog_post_queue")
          .select("id,status,post_id,topic,keyword,language,category,attempts")
          .eq("id", body.id)
          .maybeSingle();
        if (itemErr) throw itemErr;
        if (!item) return json({ error: "Item no encontrado" }, 404);

        let postId = item.post_id as string | null;

        if (!postId) {
          const { data: products } = await supabase
            .from("digital_products")
            .select("id,name,sku,description")
            .eq("active", true)
            .limit(10);

          const productCards = (products ?? []).map(p => ({
            id: p.id,
            title: p.name,
            slug: p.sku,
            description: p.description
          }));

          await supabase
            .from("blog_post_queue")
            .update({ status: "processing", attempts: (item.attempts ?? 0) + 1, error: null })
            .eq("id", body.id);
          try {
            const generated = await generateAndStorePost({
              topic: item.topic as string,
              keyword: item.keyword as string,
              category: item.category as string,
               language: item.language as string,
              publish: false,
              productCards,
            });
            postId = generated.id as string;
            await supabase
              .from("blog_post_queue")
              .update({ status: "done", error: null, post_id: postId, post_slug: generated.slug as string })
              .eq("id", body.id);
          } catch (e) {
            const message = e instanceof BlogGenError ? e.message : String((e as Error).message ?? e);
            await supabase
              .from("blog_post_queue")
              .update({ status: "pending", error: message.slice(0, 1000) })
              .eq("id", body.id);
            return json({ error: message }, 500);
          }
        }

        const { data: post } = await supabase
          .from("generated_blog_posts")
          .select("id,slug,title,excerpt,content,category,keyword,read_time,published")
          .eq("id", postId!)
          .maybeSingle();
        if (!post) return json({ error: "Borrador no encontrado" }, 404);
        return json({ post });
      }




      // ---- Flujo de aprobación editorial ----
      case "list-drafts": {
        const { data, error } = await supabase
          .from("generated_blog_posts")
          .select("id,slug,title,excerpt,category,keyword,read_time,published,created_at")
          .eq("published", false)
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        return json({ drafts: data ?? [] });
      }

      case "preview": {
        if (!body.id) return json({ error: "Missing id" }, 400);
        const { data, error } = await supabase
          .from("generated_blog_posts")
          .select("id,slug,title,excerpt,content,category,keyword,published")
          .eq("id", body.id)
          .maybeSingle();
        if (error) throw error;
        if (!data) return json({ error: "Artículo no encontrado" }, 404);
        return json({ post: data });
      }

      case "approve": {
        if (!body.id) return json({ error: "Missing id" }, 400);
        const { data, error } = await supabase
          .from("generated_blog_posts")
          .update({ published: true })
          .eq("id", body.id)
          .eq("published", false)
          .select("id,slug")
          .maybeSingle();
        if (error) throw error;
        if (!data) return json({ error: "El artículo no existe o ya está publicado" }, 409);

        const postUrl = `https://ilinguerelax.com/blog/${data.slug}`;
        await Promise.allSettled([
          pingIndexNow([postUrl, "https://ilinguerelax.com/blog"]),
          pingSitemap(),
          pingWebSub(),
          // Indexing API: aviso directo a Google (URL_UPDATED)
          notifyGoogleIndexing([postUrl], "URL_UPDATED"),
          resubmitSitemapsGSC(),
          inspectUrlGSC(postUrl),
          // Pinterest (refresco de feeds + re-scrape) y webhook del CMS
          pingPinterestAndCms({ url: postUrl, type: "blog" }),
        ]);
        await supabase
          .from("generated_blog_posts")
          .update({ google_index_requested_at: new Date().toISOString() })
          .eq("id", data.id)
          .is("google_index_requested_at", null);

        return json({ ok: true, slug: data.slug });
      }

      case "unpublish": {
        if (!body.id) return json({ error: "Missing id" }, 400);
        const { data, error } = await supabase
          .from("generated_blog_posts")
          .update({ published: false })
          .eq("id", body.id)
          .select("slug")
          .maybeSingle();
        if (error) throw error;
        // La página deja de existir públicamente: pedimos su retirada.
        if (data?.slug) {
          await notifyGoogleIndexing(
            [`https://ilinguerelax.com/blog/${data.slug}`],
            "URL_DELETED",
          );
        }
        return json({ ok: true });
      }



      case "reject": {
        if (!body.id) return json({ error: "Missing id" }, 400);
        const { data, error } = await supabase
          .from("generated_blog_posts")
          .delete()
          .eq("id", body.id)
          .eq("published", false)
          .select("slug")
          .maybeSingle();
        if (error) throw error;
        if (data?.slug) {
          await notifyGoogleIndexing(
            [`https://ilinguerelax.com/blog/${data.slug}`],
            "URL_DELETED",
          );
        }
        return json({ ok: true });
      }


      default:
        return json({ error: "Acción no válida" }, 400);
    }
  } catch (err) {
    console.error("manage-blog-queue error:", err);
    return json({ error: String((err as Error).message ?? err) }, 500);
  }
});
