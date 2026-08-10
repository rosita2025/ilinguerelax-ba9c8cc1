/**
 * Auto-publicación en Pinterest (cron).
 *
 * Cada ejecución:
 *  1) Busca posts del blog publicados y productos activos que aún NO se han
 *     publicado en Pinterest (tabla public.pinterest_publications).
 *  2) Refresca los feeds RSS que Pinterest consume (/rss.xml, /rss-productos.xml
 *     y los feeds vivos de las funciones) — así el contenido nuevo entra solo.
 *  3) Si hay PINTEREST_ACCESS_TOKEN + board configurado, crea el Pin vía API v5.
 *  4) Registra el resultado para no duplicar pines.
 *
 * Acceso: solo cron / service-role (no público).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa", "Access-Control-Allow-Methods": "POST, OPTIONS" };
import { pingPinterestAndCms, createPinterestPin } from "../_shared/pinterestPing.ts";

const HOST = "https://ilinguerelax.com";
const MAX_PER_RUN = 10;

function bearer(req: Request): string {
  return (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
}

function authorizedByEnv(req: Request): boolean {
  const token = bearer(req);
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (service && token === service) return true;
  const cronSecret = Deno.env.get("CRON_SHARED_SECRET") ?? "";
  if (cronSecret && req.headers.get("x-cron-secret") === cronSecret) return true;
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  let ok = authorizedByEnv(req);
  if (!ok) {
    // El cron de Postgres firma con la clave guardada en Vault.
    const token = bearer(req);
    if (token) {
      const { data } = await supabase.rpc("verify_cron_key", { _key: token });
      if (data === true) ok = true;
    }
  }

  if (!ok) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }


  try {
    // Solo los pines realmente creados bloquean el reintento: si quedó
    // "skipped" (faltaba token/imagen) o "error", se vuelve a intentar.
    const { data: done } = await supabase
      .from("pinterest_publications")
      .select("url")
      .eq("status", "created")
      .limit(5000);
    const published = new Set((done ?? []).map((r: { url: string }) => r.url));

    type Candidate = {
      url: string;
      kind: "blog" | "product";
      title: string;
      description: string;
      image: string | null;
    };
    const queue: Candidate[] = [];

    const { data: posts } = await supabase
      .from("generated_blog_posts")
      .select("slug,title,excerpt,image,created_at")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(50);

    for (const p of (posts ?? []) as Array<Record<string, string | null>>) {
      if (!p.slug || !p.title) continue;
      const url = `${HOST}/blog/${p.slug}`;
      if (published.has(url)) continue;
      queue.push({
        url,
        kind: "blog",
        title: String(p.title).slice(0, 100),
        description: String(p.excerpt ?? p.title).slice(0, 480),
        image: p.image ?? null,
      });
    }

    const { data: products } = await supabase
      .from("digital_products")
      .select("sku,name,description,cover_image_url")
      .eq("active", true)
      .limit(200);

    for (const p of (products ?? []) as Array<Record<string, string | null>>) {
      if (!p.sku || !p.name) continue;
      const url = `${HOST}/products/${p.sku}`;
      if (published.has(url)) continue;
      queue.push({
        url,
        kind: "product",
        title: String(p.name).slice(0, 100),
        description: String(p.description ?? p.name).replace(/\s+/g, " ").slice(0, 480),
        image: p.cover_image_url ?? null,
      });
    }

    const batch = queue.slice(0, MAX_PER_RUN);
    if (!batch.length) {
      return new Response(JSON.stringify({ ok: true, pending: 0, processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Array<Record<string, unknown>> = [];
    for (const item of batch) {
      // Refresca feeds + scrape hint (siempre)
      await pingPinterestAndCms({
        url: item.url,
        title: item.title,
        image: item.image ?? undefined,
        type: item.kind,
      });

      const pin = await createPinterestPin({
        url: item.url,
        title: item.title,
        description: item.description,
        image: item.image ?? undefined,
        type: item.kind,
      });

      await supabase.from("pinterest_publications").upsert(
        {
          url: item.url,
          kind: item.kind,
          title: item.title,
          image_url: item.image,
          pin_id: pin.pinId ?? null,
          status: pin.status,
          detail: pin.detail ?? null,
        },
        { onConflict: "url" },
      );

      results.push({ url: item.url, kind: item.kind, status: pin.status });
    }

    return new Response(
      JSON.stringify({ ok: true, pending: queue.length, processed: batch.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[pinterest-autopublish]", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
