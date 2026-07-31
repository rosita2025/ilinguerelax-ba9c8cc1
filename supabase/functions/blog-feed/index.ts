/**
 * Feeds vivos del blog (no requieren rebuild del sitio):
 *   ?format=rss      -> RSS 2.0 con los últimos posts publicados
 *   ?format=sitemap  -> urlset XML con todas las URLs de blog publicadas
 *
 * Público y de solo lectura: sirve exactamente lo mismo que ya es visible
 * en /blog. Nunca expone borradores (published = true) ni datos privados.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

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

    const rows = ((data ?? []) as Row[]).filter((r) => !!r.slug);

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
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
        "  <channel>",
        "    <title>Blog iLingue Relax</title>",
        `    <link>${BASE_URL}/blog</link>`,
        "    <description>Guías y recursos para aprender idiomas con iLingue Relax.</description>",
        "    <language>es</language>",
        `    <lastBuildDate>${new Date(latest).toUTCString()}</lastBuildDate>`,
        `    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />`,
        ...items.map((r) =>
          [
            "    <item>",
            `      <title>${xmlEscape(r.title ?? r.slug)}</title>`,
            `      <link>${BASE_URL}/blog/${xmlEscape(r.slug)}</link>`,
            `      <guid isPermaLink="true">${BASE_URL}/blog/${xmlEscape(r.slug)}</guid>`,
            `      <pubDate>${new Date(r.created_at ?? latest).toUTCString()}</pubDate>`,
            `      <description>${xmlEscape(r.excerpt ?? "")}</description>`,
            "    </item>",
          ].join("\n")
        ),
        "  </channel>",
        "</rss>",
      ].join("\n");
    }

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
