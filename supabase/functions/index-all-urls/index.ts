/**
 * index-all-urls — reindexación automática de TODO el sitio.
 *
 * Recoge las URLs desde los sitemaps publicados (páginas + productos + blog),
 * añade los productos activos y los posts publicados desde la base de datos
 * (para reflejar altas que aún no están en el sitemap estático) y las envía a:
 *   1. Google Indexing API (URL_UPDATED)  — respeta la cuota de 200/día
 *   2. IndexNow (Bing/Yandex/Seznam/Naver)
 *   3. Ping de sitemaps + reenvío a Search Console
 *
 * Acceso: solo interno (service role o CRON_SHARED_SECRET) o con ADMIN_REVIEW_KEY
 * en el body, para poder lanzarlo a mano desde /admin/seo.
 *
 * Programado por pg_cron (ver migración) para que cada día se reindexen las
 * páginas más recientes y las que llevan más tiempo sin avisar a Google.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa", "Access-Control-Allow-Methods": "POST, OPTIONS" };
import { pingIndexNow, pingSitemap, productUrl } from "../_shared/indexnow.ts";
import { resubmitSitemapsGSC } from "../_shared/gsc.ts";
import { notifyGoogleIndexing, indexingApiQuota } from "../_shared/googleIndexing.ts";
import { assertInternalCall } from "../_shared/internalAuth.ts";

const HOST = "https://ilinguerelax.com";
const SITEMAPS = [
  `${HOST}/sitemaps/sitemap-pages.xml`,
  `${HOST}/sitemaps/sitemap-products-1.xml`,
  `${HOST}/sitemaps/sitemap-blog.xml`,
];

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function urlsFromSitemaps(): Promise<string[]> {
  const out: string[] = [];
  await Promise.allSettled(
    SITEMAPS.map(async (sm) => {
      try {
        const xml = await fetch(sm, { cache: "no-store" }).then((r) => (r.ok ? r.text() : ""));
        for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) out.push(m[1]);
      } catch { /* noop */ }
    }),
  );
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const adminKey = typeof body.adminKey === "string" ? body.adminKey : "";
  const expectedAdmin = Deno.env.get("ADMIN_REVIEW_KEY") ?? "";
  const isAdmin = !!expectedAdmin && adminKey === expectedAdmin;
  if (!isAdmin) {
    const blocked = await assertInternalCall(req);
    if (blocked) return blocked;
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Scope: "all" | "products" | "blog" | "pages"
    const scope = typeof body.scope === "string" ? body.scope : "all";
    const limit = Math.max(1, Math.min(200, Number(body.limit) || 200));

    const set = new Set<string>();

    if (scope === "all" || scope === "pages") {
      set.add(`${HOST}/`);
      set.add(`${HOST}/blog`);
      set.add(`${HOST}/products`);
    }

    // Sitemaps publicados (páginas estáticas, productos y blog).
    if (scope === "all") {
      for (const u of await urlsFromSitemaps()) set.add(u);
    }

    // Productos activos en base de datos (incluye los aún no presentes en el sitemap).
    if (scope === "all" || scope === "products") {
      const { data } = await supabase.from("digital_products").select("sku").eq("active", true);
      for (const r of (data ?? []) as Array<{ sku: string }>) {
        if (r.sku) set.add(productUrl(r.sku));
      }
    }

    // Posts publicados (los más recientes primero).
    if (scope === "all" || scope === "blog") {
      const { data } = await supabase
        .from("generated_blog_posts")
        .select("slug,created_at")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(300);
      for (const r of (data ?? []) as Array<{ slug: string }>) {
        if (r.slug) set.add(`${HOST}/blog/${r.slug}`);
      }
    }

    const all = Array.from(set).filter((u) => /^https:\/\/(www\.)?ilinguerelax\.com\//.test(u));

    // Prioriza las URLs con el aviso a Google más antiguo (o sin aviso).
    const { data: lastEvents } = await supabase
      .from("indexing_events")
      .select("url,created_at")
      .eq("channel", "google_indexing")
      .eq("status", "sent")
      .order("created_at", { ascending: false })
      .limit(2000);
    const lastSeen = new Map<string, string>();
    for (const e of (lastEvents ?? []) as Array<{ url: string; created_at: string }>) {
      if (!lastSeen.has(e.url)) lastSeen.set(e.url, e.created_at);
    }
    all.sort((a, b) => (lastSeen.get(a) ?? "").localeCompare(lastSeen.get(b) ?? ""));

    const quota = await indexingApiQuota();
    const budget = quota.enabled ? Math.min(limit, Math.max(0, quota.remaining)) : 0;
    const target = all.slice(0, budget || limit);

    await Promise.allSettled([
      budget > 0 ? notifyGoogleIndexing(all.slice(0, budget), "URL_UPDATED") : Promise.resolve(),
      pingIndexNow(all.slice(0, 1000)),
      pingSitemap(),
      resubmitSitemapsGSC(),
    ]);

    return json({
      ok: true,
      scope,
      discovered: all.length,
      indexingApi: { enabled: quota.enabled, sent: budget, remainingBefore: quota.remaining },
      sample: target.slice(0, 10),
    });
  } catch (e) {
    console.error("[index-all-urls]", e);
    return json({ error: (e as Error).message }, 500);
  }
});
