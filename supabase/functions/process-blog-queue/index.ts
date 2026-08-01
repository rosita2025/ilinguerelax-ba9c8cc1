// Cola programada del blog: publica los artículos cuya hora ya llegó.
//
// Se invoca desde pg_cron cada 15 minutos. Toma como máximo 2 artículos por
// ejecución (los turnos de la agenda son de 2 posts) para no saturar el
// gateway de IA. Solo llamadas internas (service role / CRON_SHARED_SECRET).

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { assertInternalCall, internalCors } from "../_shared/internalAuth.ts";
import { BlogGenError, generateAndStorePost } from "../_shared/blogGenerator.ts";

const MAX_PER_RUN = 2;
const MAX_ATTEMPTS = 3;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: internalCors });

  const blocked = await assertInternalCall(req);
  if (blocked) return blocked;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const results: Array<Record<string, unknown>> = [];

  try {
    const { data: due, error } = await supabase
      .from("blog_post_queue")
      .select("id,topic,keyword,language,category,attempts")
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(MAX_PER_RUN);

    if (error) throw error;

    for (const row of due ?? []) {
      // Reserva optimista: si otra ejecución ya lo tomó, saltamos.
      const { data: claimed } = await supabase
        .from("blog_post_queue")
        .update({ status: "processing", attempts: (row.attempts ?? 0) + 1 })
        .eq("id", row.id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();
      if (!claimed) continue;

      try {
        const post = await generateAndStorePost({
          topic: row.topic,
          keyword: row.keyword,
          category: row.category,
          language: row.language,
          // Flujo de aprobación: el artículo queda como borrador hasta que
          // un admin lo revisa y lo aprueba en /admin/seo.
          publish: false,
        });
        await supabase
          .from("blog_post_queue")
          .update({
            status: "done",
            error: null,
            post_id: post.id as string,
            post_slug: post.slug as string,
          })
          .eq("id", row.id);
        results.push({ id: row.id, slug: post.slug, status: "done" });
      } catch (e) {
        const message = e instanceof BlogGenError ? e.message : String((e as Error).message ?? e);
        const attempts = (row.attempts ?? 0) + 1;
        await supabase
          .from("blog_post_queue")
          .update({
            status: attempts >= MAX_ATTEMPTS ? "failed" : "pending",
            error: message.slice(0, 1000),
          })
          .eq("id", row.id);
        results.push({ id: row.id, status: "error", error: message });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      status: 200,
      headers: { ...internalCors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("process-blog-queue error:", err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), {
      status: 500,
      headers: { ...internalCors, "Content-Type": "application/json" },
    });
  }
});
