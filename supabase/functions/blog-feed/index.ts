/**
 * Feeds vivos del blog (no requieren rebuild del sitio):
 *   ?format=rss      -> RSS 2.0 con los últimos posts publicados
 *   ?format=sitemap  -> urlset XML con todas las URLs de blog publicadas
 *
 * Público y de solo lectura: sirve exactamente lo mismo que ya es visible
 * en /blog. Nunca expone borradores (published = true) ni datos privados.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa", "Access-Control-Allow-Methods": "POST, OPTIONS" };

const BASE_URL = "https://ilinguerelax.com";

function xmlEscape(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface Row {
  slug: string;
  title: string | null;
  excerpt: string | null;
  image: string | null;
  created_at: string | null;
  updated_at: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const format = new URL(req.url).searchParams.get("format") === "sitemap" ? "sitemap" : "rss";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("generated_blog_posts")
      .select("slug,title,excerpt,created_at,updated_at")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;

    // --- Validación de entrada: descarta filas rotas y las registra en el log ---
    const problems: string[] = [];
    const seen = new Set<string>();
    const rows: Row[] = [];
    for (const r of (data ?? []) as Row[]) {
      const slug = (r.slug ?? "").trim();
      if (!/^[a-z0-9][a-z0-9\-_]*$/i.test(slug)) {
        problems.push(`slug inválido: "${slug}"`);
        continue;
      }
      if (seen.has(slug)) {
        problems.push(`slug duplicado omitido: "${slug}"`);
        continue;
      }
      const when = r.created_at ?? r.updated_at ?? "";
      if (when && Number.isNaN(new Date(when).getTime())) {
        problems.push(`fecha inválida en "${slug}": ${when}`);
        continue;
      }
      if (!((r.title ?? "").trim())) {
        problems.push(`post sin título: "${slug}"`);
        continue;
      }
      seen.add(slug);
      rows.push({ ...r, slug });
    }
    for (const p of problems) console.error(`[blog-feed] ERROR ${p}`);

    let xml: string;
    if (format === "sitemap") {
      xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...rows.map((r) =>
          [
            "  <url>",
            `    <loc>${BASE_URL}/blog/${xmlEscape(r.slug)}</loc>`,
            `    <lastmod>${(r.updated_at ?? r.created_at ?? new Date().toISOString()).slice(0, 10)}</lastmod>`,
            "    <changefreq>monthly</changefreq>",
            "    <priority>0.7</priority>",
            "  </url>",
          ].join("\n")
        ),
        "</urlset>",
      ].join("\n");
    } else {
      const items = rows.slice(0, 100);
      const latest = items[0]?.created_at ?? new Date().toISOString();
      xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">',
        "  <channel>",
        "    <title>Blog iLingue Relax</title>",
        `    <link>${BASE_URL}/blog</link>`,
        "    <description>Guías y recursos para aprender idiomas con iLingue Relax.</description>",
        "    <language>es</language>",
        `    <lastBuildDate>${new Date(latest).toUTCString()}</lastBuildDate>`,
        `    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />`,
        ...items.map((r) => {
          const itemUrl = `${BASE_URL}/blog/${xmlEscape(r.slug)}`;
          const imgUrl = r.image ? (r.image.startsWith("http") ? r.image : `${BASE_URL}${r.image}`) : "";
          return [
            "    <item>",
            `      <title>${xmlEscape(r.title ?? r.slug)}</title>`,
            `      <link>${itemUrl}</link>`,
            `      <guid isPermaLink="true">${itemUrl}</guid>`,
            `      <pubDate>${new Date(r.created_at ?? latest).toUTCString()}</pubDate>`,
            `      <description>${xmlEscape(r.excerpt ?? "")}</description>`,
            ...(imgUrl ? [
              `      <enclosure url="${xmlEscape(imgUrl)}" type="image/jpeg" length="0" />`,
              `      <media:content url="${xmlEscape(imgUrl)}" medium="image" />`
            ] : []),
            "    </item>",
          ].join("\n");
        }),
        "  </channel>",
        "</rss>",
      ].join("\n");
    }

    // --- Validación estructural de salida: nunca servimos un feed roto ---
    const structural: string[] = [];
    if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) structural.push("falta declaración XML");
    if (/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/.test(xml)) structural.push("'&' sin escapar");
    if (format === "rss") {
      if (!xml.includes('<rss version="2.0"')) structural.push("falta <rss version=\"2.0\">");
      if (!xml.trimEnd().endsWith("</rss>")) structural.push("no cierra con </rss>");
      const o = (xml.match(/<item>/g) ?? []).length;
      const c = (xml.match(/<\/item>/g) ?? []).length;
      if (o !== c) structural.push(`items desbalanceados (${o}/${c})`);
      for (const m of xml.matchAll(/<link>([^<]*)<\/link>/g)) {
        if (!m[1].startsWith(`${BASE_URL}/`)) structural.push(`link no canónico: ${m[1]}`);
      }
    } else {
      if (!xml.trimEnd().endsWith("</urlset>")) structural.push("no cierra con </urlset>");
      for (const m of xml.matchAll(/<loc>([^<]*)<\/loc>/g)) {
        if (!m[1].startsWith(`${BASE_URL}/blog/`)) structural.push(`loc no canónico: ${m[1]}`);
      }
    }

    if (structural.length > 0) {
      for (const s of structural) console.error(`[blog-feed] ERROR estructura: ${s}`);
      return new Response(
        JSON.stringify({ error: "feed_invalid", issues: structural.slice(0, 10) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(
      `[blog-feed] ${format} OK (${rows.length} posts` +
        `${problems.length ? `, ${problems.length} descartados` : ""}).`,
    );

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=60",
      },
    });

  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
