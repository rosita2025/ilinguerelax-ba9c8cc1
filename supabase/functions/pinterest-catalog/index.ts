// Catálogo de productos para Pinterest (RSS 2.0 con namespace g:).
// URL pública para pegar en Pinterest Business > Catálogos > Fuente de datos.
// Se genera en vivo desde public.digital_products (solo columnas públicas).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const HOST = "https://ilinguerelax.com";
const BRAND = "iLingue Relax";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

type Row = {
  sku: string;
  name: string;
  description: string | null;
  price_usd: number | null;
  price_usd_tienda: number | null;
  cover_image_url: string | null;
  is_physical: boolean | null;
  target_language: string | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  // ?format=rss → RSS 2.0 clásico (Pinterest "Importar contenido > RSS").
  // Por defecto → RSS con namespace g: (Pinterest "Catálogos").
  const params = new URL(req.url).searchParams;
  const format = params.get("format") ?? "catalog";
  // ?lang=en → catálogo con textos/canal en inglés (misma lista de g:id, así
  // Pinterest no duplica pines entre las dos fuentes de datos).
  const feedLang: "es" | "en" = params.get("lang") === "en" ? "en" : "es";

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data, error } = await supabase
      .from("digital_products")
      .select(
        "sku, name, description, price_usd, price_usd_tienda, cover_image_url, is_physical, target_language",
      )
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;

    const rows = ((data ?? []) as Row[]).filter((p) => p.sku && p.name);

    if (format === "rss") {
      const pins = rows
        .map((p) => {
          const link = `${HOST}/products/${p.sku}`;
          const img = p.cover_image_url?.startsWith("http")
            ? p.cover_image_url
            : `${HOST}${p.cover_image_url ?? "/placeholder.svg"}`;
          const desc = (p.description ?? p.name).replace(/\s+/g, " ").trim().slice(0, 480);
          return `    <item>
      <title>${esc(p.name)}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="true">${esc(link)}</guid>
      <description>${esc(desc)}</description>
      <enclosure url="${esc(img)}" type="image/jpeg" length="0" />
      <media:content url="${esc(img)}" medium="image" />
      <media:thumbnail url="${esc(img)}" />
    </item>`;
        })
        .join("\n");

      const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Productos ${BRAND}</title>
    <link>${HOST}/products</link>
    <description>Libros digitales y físicos de ${BRAND}: vocabulario, pronunciación y fonética para aprender idiomas sin estrés.</description>
    <language>es</language>
    <atom:link href="${HOST}/rss-productos.xml" rel="self" type="application/rss+xml" />
${pins}
  </channel>
</rss>`;

      return new Response(rss, {
        headers: {
          ...cors,
          "Content-Type": "application/rss+xml; charset=utf-8",
          "Cache-Control": "public, max-age=900",
        },
      });
    }

    const items = rows
      .map((p) => {
        const price = Number(p.price_usd_tienda ?? p.price_usd ?? 0).toFixed(2);
        const link = `${HOST}/products/${p.sku}`;
        const img = p.cover_image_url?.startsWith("http")
          ? p.cover_image_url
          : `${HOST}${p.cover_image_url ?? "/placeholder.svg"}`;
        const type = p.is_physical
          ? `Libros > Idiomas > ${p.target_language ?? "Idiomas"}`
          : `Libros Digitales > Idiomas > ${p.target_language ?? "Idiomas"}`;
        return `    <item>
      <g:id>${esc(p.sku)}</g:id>
      <g:title>${esc(p.name)}</g:title>
      <g:description>${esc((p.description ?? p.name).slice(0, 480))}</g:description>
      <g:link>${esc(link)}</g:link>
      <g:image_link>${esc(img)}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>in stock</g:availability>
      <g:price>${price} USD</g:price>
      <g:brand>${BRAND}</g:brand>
      <g:mpn>${esc(p.sku)}</g:mpn>
      <g:google_product_category>Media &gt; Books${p.is_physical ? "" : " &gt; E-books"}</g:google_product_category>
      <g:product_type>${esc(type)}</g:product_type>
      <g:identifier_exists>no</g:identifier_exists>
      <g:adult>no</g:adult>
      <g:content_language>${feedLang}</g:content_language>
    </item>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${BRAND} - ${feedLang === "en" ? "Catalog" : "Catálogo"}</title>
    <link>${HOST}</link>
    <description>${feedLang === "en"
      ? "Digital and printed books to learn languages stress-free."
      : "Libros digitales y físicos para aprender idiomas sin estrés."}</description>
    <language>${feedLang}</language>
${items}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        ...cors,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=900",
      },
    });
  } catch (e) {
    console.error("[pinterest-catalog]", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
