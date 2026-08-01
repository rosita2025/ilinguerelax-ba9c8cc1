/**
 * Runs before `vite dev` and `vite build` (predev/prebuild hooks).
 *
 * Writes a sitemap INDEX at public/sitemap.xml that references segmented
 * child sitemaps under public/sitemaps/:
 *   - sitemap-pages.xml       (static institutional + catalog routes)
 *   - sitemap-products-N.xml  (product URLs, auto-chunked at 5,000 each)
 *   - sitemap-blog.xml        (blog posts)
 *
 * Each child sitemap stays well under Google's 50,000-URL / 50 MB limit,
 * and the index scales as the catalog grows.
 *
 * Never fails the build: on error we fall back to a minimal index + pages.
 */

import { writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from "fs";
import { resolve, join } from "path";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

loadEnv();

const BASE_URL = "https://ilinguerelax.com";
const TODAY = new Date().toISOString().slice(0, 10);
const URLS_PER_SITEMAP = 5000; // Google allows up to 50,000; keep files small.

const PUBLIC_DIR = resolve("public");
const SITEMAPS_DIR = resolve("public/sitemaps");

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

// --------------------------------------------------------------------------
// Static routes (curated from src/App.tsx — excludes /admin, /checkouts,
// /descarga, /payment-success, /hotmart-*, /amazon, /dejar-resena, /*)
// --------------------------------------------------------------------------
const LEARN_PAIR_SLUGS = [
  "es-en", "es-ko", "es-fr", "es-de", "es-it", "es-pt", "es-nl", "en-es",
];

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/products", changefreq: "weekly", priority: "0.95" },
  { path: "/aprender", changefreq: "weekly", priority: "0.9" },
  ...LEARN_PAIR_SLUGS.map((s) => ({
    path: `/aprender/${s}`,
    changefreq: "weekly" as const,
    priority: "0.9",
  })),
  { path: "/sobre-nosotros", changefreq: "monthly", priority: "0.7" },
  { path: "/contacto", changefreq: "monthly", priority: "0.6" },
  { path: "/faq", changefreq: "monthly", priority: "0.6" },
  { path: "/privacidad", changefreq: "yearly", priority: "0.3" },
  { path: "/condiciones", changefreq: "yearly", priority: "0.3" },
  { path: "/copyright", changefreq: "yearly", priority: "0.3" },
  { path: "/trademark", changefreq: "yearly", priority: "0.3" },
  { path: "/licencias-y-avisos-legales", changefreq: "yearly", priority: "0.3" },
  { path: "/envios-y-entregas", changefreq: "yearly", priority: "0.4" },
  { path: "/devoluciones-y-reembolsos", changefreq: "yearly", priority: "0.4" },
  { path: "/dejar-resena", changefreq: "monthly", priority: "0.4" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
  { path: "/vista-previa/patrones-especiales", changefreq: "monthly", priority: "0.6" },
  { path: "/vista-previa/coreano-100-mapas-mentales", changefreq: "monthly", priority: "0.6" },
];

const hardcodedProductSlugs: string[] = [
  "5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa",
  "8-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa",
  "5-000-palabras-libro-fisico",
  "8-000-palabras-libro-fisico",
  "5-000-spanish-words-with-english-pronunciation-physical",
  "5-000-spanish-words-with-english-pronunciation-digital",
  "3-000-spanish-verbs-mastery-physical-book-preorder",
  "spanish-grammar-patterns-a1-c1-mastery-preorder",
  "1-000-verbs-in-spanish-past-present-future-with-english-pronunciation",
  "500-questions-in-spanish-with-english-pronunciation",
  "1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion",
  "500-preguntas-en-ingles-con-pronunciacion-para-hispanohablantes",
  "5-000-palabras-en-aleman-con-pronunciacion-para-hispanohablantes",
  "5-000-palabras-en-portugues-con-pronunciacion-para-hispanohablantes",
  "5-000-palabras-en-italiano-con-pronunciacion-para-hispanohablantes",
  "5-000-palabras-en-frances-con-pronunciacion-para-hispanohablantes",
  "5-000-palabras-en-neerlandes-con-pronunciacion-para-hispanohablantes",
  "patrones-especiales-alfabeto-combinaciones-secretas-ingles",
  "100-mapas-mentales-para-aprender-coreano-hangul-c1",
  "estructuras-gramaticales-ingles-a1-c1",
];

// --------------------------------------------------------------------------
// Blog posts (static data file)
// --------------------------------------------------------------------------
interface FeedItem {
  path: string;
  title: string;
  description: string;
  date: string; // ISO
  image?: string; // URL absoluta de la imagen (Pinterest / lectores RSS)
}

const feedItems: FeedItem[] = [];

/** Convierte rutas relativas en URLs absolutas; descarta valores no http. */
function absoluteImage(src?: string | null): string | undefined {
  const v = (src ?? "").trim();
  if (!v) return undefined;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (v.startsWith("/")) return `${BASE_URL}${v}`;
  return undefined;
}

async function getBlogEntries(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [];

  // Static blog data
  try {
    const mod = await import("../src/data/blogPosts");
    const posts: Array<{ slug: string; date?: string; title?: string; excerpt?: string; image?: string }> =
      (mod as any).blogPosts ?? [];
    for (const p of posts) {
      entries.push({
        path: `/blog/${p.slug}`,
        lastmod: p.date ?? TODAY,
        changefreq: "monthly",
        priority: "0.7",
      });
      feedItems.push({
        path: `/blog/${p.slug}`,
        title: p.title ?? p.slug,
        description: p.excerpt ?? "",
        date: p.date ?? TODAY,
        image: absoluteImage(p.image),
      });
    }
  } catch (err) {
    console.warn("[sitemap] Could not import blogPosts:", (err as Error).message);
  }

  // AI-generated posts from Supabase (published only)
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (url && key) {
    try {
      const supabase = createClient(url, key);
      const { data, error } = await supabase
        .from("generated_blog_posts")
        .select("slug, title, excerpt, image, updated_at, created_at, published")
        .eq("published", true);
      if (error) {
        console.warn("[sitemap] generated_blog_posts error:", error.message);
      } else {
        for (const r of data ?? []) {
          const row = r as {
            slug: string;
            title?: string;
            excerpt?: string;
            image?: string;
            updated_at?: string;
            created_at?: string;
          };
          if (!row.slug) continue;
          const lm = (row.updated_at ?? row.created_at ?? TODAY).slice(0, 10);
          entries.push({
            path: `/blog/${row.slug}`,
            lastmod: lm,
            changefreq: "monthly",
            priority: "0.7",
          });
          feedItems.push({
            path: `/blog/${row.slug}`,
            title: row.title ?? row.slug,
            description: row.excerpt ?? "",
            date: row.created_at ?? row.updated_at ?? TODAY,
            image: absoluteImage(row.image),
          });
        }
      }
    } catch (err) {
      console.warn("[sitemap] generated_blog_posts fetch failed:", (err as Error).message);
    }
  }

  // Dedupe by path (static wins order-wise, but keep most recent lastmod)
  const bySlug = new Map<string, SitemapEntry>();
  for (const e of entries) {
    const prev = bySlug.get(e.path);
    if (!prev || (e.lastmod ?? "") > (prev.lastmod ?? "")) bySlug.set(e.path, e);
  }
  return Array.from(bySlug.values());
}

// --------------------------------------------------------------------------
// RSS feed (public/rss.xml) — se regenera junto al sitemap
// --------------------------------------------------------------------------
function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Descarta items inválidos (slug/link/fecha/título) y reporta el motivo. */
function sanitizeFeedItems(
  items: FeedItem[],
  pathPrefix: "blog" | "products" = "blog",
): { items: FeedItem[]; errors: string[] } {
  const errors: string[] = [];
  const seen = new Set<string>();
  const ok: FeedItem[] = [];

  for (const i of items) {
    const path = (i.path ?? "").trim();
    const title = (i.title ?? "").trim();
    const pathRe = new RegExp(`^/${pathPrefix}/[a-z0-9][a-z0-9\\-_/]*$`, "i");
    if (!pathRe.test(path)) {
      errors.push(`item con path inválido: "${path}"`);
      continue;
    }
    let link: string;
    try {
      link = new URL(`${BASE_URL}${path}`).toString();
    } catch {
      errors.push(`item con URL inválida: "${BASE_URL}${path}"`);
      continue;
    }
    if (!title) {
      errors.push(`item sin título: ${link}`);
      continue;
    }
    const date = new Date(i.date ?? "");
    if (Number.isNaN(date.getTime())) {
      errors.push(`item con fecha inválida (${i.date}): ${link}`);
      continue;
    }
    if (seen.has(link)) {
      errors.push(`item duplicado omitido: ${link}`);
      continue;
    }
    seen.add(link);
    ok.push({
      path,
      title,
      description: i.description ?? "",
      date: date.toISOString(),
      image: i.image,
    });
  }

  return { items: ok, errors };
}

/** Validación estructural del XML antes de escribirlo a disco. */
function validateRssXml(xml: string, expectedItems: number, pathPrefix = "blog"): string[] {
  const errors: string[] = [];
  if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) errors.push("falta la declaración XML");
  if (!xml.includes("<rss version=\"2.0\"")) errors.push("falta el elemento <rss version=\"2.0\">");
  for (const tag of ["channel", "title", "link", "description"]) {
    if (!xml.includes(`<${tag}>`)) errors.push(`falta <${tag}> en el canal`);
  }
  if (!xml.trimEnd().endsWith("</rss>")) errors.push("el documento no cierra con </rss>");

  const opens = (xml.match(/<item>/g) ?? []).length;
  const closes = (xml.match(/<\/item>/g) ?? []).length;
  if (opens !== closes) errors.push(`etiquetas <item> desbalanceadas (${opens} abiertas / ${closes} cerradas)`);
  if (opens !== expectedItems) errors.push(`se esperaban ${expectedItems} items y hay ${opens}`);

  // Ampersands sin escapar rompen el parseo en la mayoría de lectores.
  if (/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/.test(xml)) {
    errors.push("hay '&' sin escapar en el XML");
  }
  // Todos los <link> deben ser absolutos y del dominio canónico.
  for (const m of xml.matchAll(/<link>([^<]*)<\/link>/g)) {
    if (!m[1].startsWith(`${BASE_URL}/`)) errors.push(`link no canónico: "${m[1]}"`);
  }
  for (const m of xml.matchAll(/<guid[^>]*>([^<]*)<\/guid>/g)) {
    if (!m[1].startsWith(`${BASE_URL}/${pathPrefix}/`)) errors.push(`guid inválido: "${m[1]}"`);
  }
  return errors;
}

interface ChannelMeta {
  title: string;
  link: string;
  description: string;
  self: string;
}

const BLOG_CHANNEL: ChannelMeta = {
  title: "Blog iLingue Relax",
  link: `${BASE_URL}/blog`,
  description: "Guías y recursos para aprender idiomas con iLingue Relax.",
  self: `${BASE_URL}/rss.xml`,
};

const PRODUCTS_CHANNEL: ChannelMeta = {
  title: "Productos iLingue Relax",
  link: `${BASE_URL}/products`,
  description:
    "Libros digitales y físicos de iLingue Relax: vocabulario, pronunciación y fonética para aprender idiomas sin estrés.",
  self: `${BASE_URL}/rss-productos.xml`,
};

function rssXml(items: FeedItem[], channel: ChannelMeta = BLOG_CHANNEL): string {
  const sorted = [...items]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 100);
  const entries = sorted.map((i) =>
    [
      "    <item>",
      `      <title>${xmlEscape(i.title)}</title>`,
      `      <link>${BASE_URL}${i.path}</link>`,
      `      <guid isPermaLink="true">${BASE_URL}${i.path}</guid>`,
      `      <pubDate>${new Date(i.date).toUTCString()}</pubDate>`,
      `      <description>${xmlEscape(i.description)}</description>`,
      ...(i.image
        ? [
            `      <enclosure url="${xmlEscape(i.image)}" type="image/jpeg" length="0" />`,
            `      <media:content url="${xmlEscape(i.image)}" medium="image" />`,
            `      <media:thumbnail url="${xmlEscape(i.image)}" />`,
          ]
        : []),
      "    </item>",
    ].join("\n"),
  );
  const latest = sorted[0]?.date ?? TODAY;
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" xmlns:content="http://purl.org/rss/1.0/modules/content/">',
    "  <channel>",
    `    <title>${xmlEscape(channel.title)}</title>`,
    `    <link>${channel.link}</link>`,
    `    <description>${xmlEscape(channel.description)}</description>`,
    "    <language>es</language>",
    `    <lastBuildDate>${new Date(latest).toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${channel.self}" rel="self" type="application/rss+xml" />`,
    ...entries,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}




// --------------------------------------------------------------------------
// Dynamic products from Supabase
// --------------------------------------------------------------------------
interface DbProduct {
  sku: string;
  updated_at?: string;
  name?: string;
  description?: string;
  image?: string;
  created_at?: string;
  price?: number;
  is_physical?: boolean;
  target_language?: string;
}
async function getDbProducts(): Promise<DbProduct[]> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.warn("[sitemap] Missing Supabase env; skipping DB products.");
    return [];
  }
  try {
    const supabase = createClient(url, key);
    const columns =
      "sku, updated_at, created_at, name, description, cover_image_url, active, price_usd, price_usd_tienda, is_physical, target_language";
    let { data, error } = await supabase.from("digital_products").select(columns).eq("active", true);
    if (error) {
      // Fallback: si alguna columna comercial no es legible en público,
      // seguimos generando sitemap/RSS con los campos básicos.
      console.warn("[sitemap] Supabase error (retry sin precios):", error.message);
      ({ data, error } = await supabase
        .from("digital_products")
        .select("sku, updated_at, created_at, name, description, cover_image_url, active")
        .eq("active", true));
    }
    if (error) {
      console.warn("[sitemap] Supabase error:", error.message);
      return [];
    }
    return (data ?? [])
      .filter((r: any) => r.sku)
      .map((r: any) => ({
        sku: r.sku,
        updated_at: r.updated_at,
        created_at: r.created_at,
        name: r.name,
        description: r.description,
        image: absoluteImage(r.cover_image_url),
        price: Number(r.price_usd_tienda ?? r.price_usd ?? 0) || undefined,
        is_physical: Boolean(r.is_physical),
        target_language: r.target_language ?? undefined,
      }));
  } catch (err) {
    console.warn("[sitemap] Supabase fetch failed:", (err as Error).message);
    return [];
  }
}

// --------------------------------------------------------------------------
// Catálogo de productos para Pinterest (RSS 2.0 + namespace g:)
// URL para "Catálogos > Fuentes de datos > Proporcione un enlace URL".
// --------------------------------------------------------------------------
function catalogXml(products: DbProduct[]): string {
  const items = products
    .filter((p) => p.sku && p.name && p.image && p.price && p.price > 0)
    .slice(0, 1000)
    .map((p) => {
      const link = `${BASE_URL}/products/${p.sku}`;
      const type = p.is_physical
        ? `Libros > Idiomas > ${p.target_language ?? "Idiomas"}`
        : `Libros Digitales > Idiomas > ${p.target_language ?? "Idiomas"}`;
      return [
        "    <item>",
        `      <g:id>${xmlEscape(p.sku)}</g:id>`,
        `      <g:title>${xmlEscape(String(p.name).slice(0, 150))}</g:title>`,
        `      <g:description>${xmlEscape(
          String(p.description ?? p.name).replace(/\s+/g, " ").trim().slice(0, 480),
        )}</g:description>`,
        `      <g:link>${link}</g:link>`,
        `      <g:image_link>${xmlEscape(p.image!)}</g:image_link>`,
        "      <g:condition>new</g:condition>",
        "      <g:availability>in stock</g:availability>",
        `      <g:price>${p.price!.toFixed(2)} USD</g:price>`,
        "      <g:brand>iLingue Relax</g:brand>",
        `      <g:mpn>${xmlEscape(p.sku)}</g:mpn>`,
        `      <g:google_product_category>Media &gt; Books${
          p.is_physical ? "" : " &gt; E-books"
        }</g:google_product_category>`,
        `      <g:product_type>${xmlEscape(type)}</g:product_type>`,
        "    </item>",
      ].join("\n");
    });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    "  <channel>",
    "    <title>iLingue Relax - Catálogo</title>",
    `    <link>${BASE_URL}</link>`,
    "    <description>Libros digitales y físicos para aprender idiomas sin estrés.</description>",
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}

// --------------------------------------------------------------------------
// XML builders
// --------------------------------------------------------------------------
function urlsetXml(entries: SitemapEntry[], hostBase: string = BASE_URL): string {
  const urls = entries.map((e) =>
    [
      "  <url>",
      `    <loc>${hostBase}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

function indexXml(children: Array<{ file: string; lastmod?: string }>): string {
  // <lastmod> solo se emite cuando viene de un dato real (updated_at / fecha de
  // publicación). Inventar la fecha de build hace que Google desconfíe de la señal.
  const items = children.map(
    (c) =>
      `  <sitemap>\n    <loc>${BASE_URL}/sitemaps/${c.file}</loc>` +
      (c.lastmod ? `\n    <lastmod>${c.lastmod}</lastmod>` : "") +
      `\n  </sitemap>`,
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...items,
    "</sitemapindex>",
    "",
  ].join("\n");
}

function chunk<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------
async function main() {
  if (!existsSync(SITEMAPS_DIR)) mkdirSync(SITEMAPS_DIR, { recursive: true });

  // Wipe stale sitemap-*.xml segments so removed chunks don't linger.
  for (const f of readdirSync(SITEMAPS_DIR)) {
    if (/^sitemap-.*\.xml$/.test(f)) unlinkSync(join(SITEMAPS_DIR, f));
  }

  const [blogEntries, dbProducts] = await Promise.all([getBlogEntries(), getDbProducts()]);

  const lastmodBySlug = new Map<string, string>();
  for (const p of dbProducts) {
    if (p.updated_at) lastmodBySlug.set(p.sku, p.updated_at.slice(0, 10));
  }
  const dbSlugs = dbProducts.map((p) => p.sku);
  const productSlugs = Array.from(new Set([...hardcodedProductSlugs, ...dbSlugs]));
  const productEntries: SitemapEntry[] = productSlugs.map((slug) => ({
    path: `/products/${slug}`,
    // Only publish a lastmod when it comes from a real database update.
    // Inventing today's date on every build makes crawlers distrust the signal.
    lastmod: lastmodBySlug.get(slug),
    changefreq: "weekly",
    priority: "0.85",
  }));

  const children: Array<{ file: string; lastmod?: string }> = [];

  // Pages (sin lastmod: no hay timestamp real por página)
  writeFileSync(join(SITEMAPS_DIR, "sitemap-pages.xml"), urlsetXml(staticEntries));
  children.push({ file: "sitemap-pages.xml" });

  // Products (chunked) — lastmod = updated_at real más reciente del bloque
  const productChunks = chunk(productEntries, URLS_PER_SITEMAP);
  productChunks.forEach((entries, i) => {
    const file = `sitemap-products-${i + 1}.xml`;
    writeFileSync(join(SITEMAPS_DIR, file), urlsetXml(entries));
    const latest = entries
      .map((e) => e.lastmod)
      .filter((d): d is string => Boolean(d))
      .sort()
      .pop();
    children.push({ file, lastmod: latest });
  });

  // Blog
  if (blogEntries.length > 0) {
    writeFileSync(join(SITEMAPS_DIR, "sitemap-blog.xml"), urlsetXml(blogEntries));
    const latest = blogEntries
      .map((e) => e.lastmod)
      .filter((d): d is string => Boolean(d))
      .sort()
      .pop();
    children.push({ file: "sitemap-blog.xml", lastmod: latest });
  }


  // RSS feed (blog) — validado antes de escribirse: nunca publicamos un feed roto.
  if (feedItems.length > 0) {
    const { items: validItems, errors: itemErrors } = sanitizeFeedItems(feedItems);
    for (const e of itemErrors) console.error(`[rss] ERROR ${e}`);

    if (validItems.length === 0) {
      console.error("[rss] ERROR no hay items válidos; se conserva el rss.xml anterior.");
    } else {
      const xml = rssXml(validItems);
      const xmlErrors = validateRssXml(xml, Math.min(validItems.length, 100));
      if (xmlErrors.length > 0) {
        for (const e of xmlErrors) console.error(`[rss] ERROR estructura: ${e}`);
        console.error("[rss] ERROR feed inválido; NO se sobrescribe public/rss.xml.");
      } else {
        writeFileSync(join(PUBLIC_DIR, "rss.xml"), xml);
        // Alias sin extensión y /feed.xml: Pinterest y otros lectores suelen
        // pedir /rss o /feed.xml en lugar de /rss.xml.
        writeFileSync(join(PUBLIC_DIR, "rss"), xml);
        writeFileSync(join(PUBLIC_DIR, "feed.xml"), xml);
        console.log(
          `[rss] rss.xml escrito y validado (${Math.min(validItems.length, 100)} items` +
            `${itemErrors.length ? `, ${itemErrors.length} descartados` : ""}).`,
        );
      }
    }
  }



  // RSS de PRODUCTOS (public/rss-productos.xml) — pensado para que Pinterest
  // "Importar contenido > RSS" cree pines automáticamente de cada producto.
  const productFeedItems: FeedItem[] = dbProducts
    .filter((p) => p.sku && p.name)
    .map((p) => ({
      path: `/products/${p.sku}`,
      title: p.name as string,
      description: (p.description ?? p.name ?? "").replace(/\s+/g, " ").trim().slice(0, 480),
      date: p.updated_at ?? p.created_at ?? TODAY,
      image: p.image,
    }));

  if (productFeedItems.length > 0) {
    const { items: validProducts, errors: prodErrors } = sanitizeFeedItems(productFeedItems, "products");
    for (const e of prodErrors) console.error(`[rss-productos] ERROR ${e}`);
    if (validProducts.length === 0) {
      console.error("[rss-productos] ERROR sin items válidos; se conserva el feed anterior.");
    } else {
      const xml = rssXml(validProducts, PRODUCTS_CHANNEL);
      const xmlErrors = validateRssXml(xml, Math.min(validProducts.length, 100), "products");
      if (xmlErrors.length > 0) {
        for (const e of xmlErrors) console.error(`[rss-productos] ERROR estructura: ${e}`);
      } else {
        writeFileSync(join(PUBLIC_DIR, "rss-productos.xml"), xml);
        writeFileSync(join(PUBLIC_DIR, "rss-products.xml"), xml);
        writeFileSync(join(PUBLIC_DIR, "rss-productos"), xml);
        writeFileSync(join(PUBLIC_DIR, "rss-products"), xml);
        console.log(`[rss-productos] feed escrito (${Math.min(validProducts.length, 100)} productos).`);
      }
    }
  }

  // Regional subdomains disabled — single canonical domain only.


  // Root index
  writeFileSync(join(PUBLIC_DIR, "sitemap.xml"), indexXml(children));

  console.log(
    `[sitemap] Index written with ${children.length} child sitemaps ` +
      `(${staticEntries.length} pages, ${productEntries.length} products in ${productChunks.length} file(s) ` +
      `[${dbSlugs.length} from DB], ${blogEntries.length} blog).`,
  );
}

main().catch((err) => {
  console.error("[sitemap] generation failed:", err);
  // Fallback: minimal index pointing at a pages-only child, so /sitemap.xml
  // remains a valid index even if the DB / blog imports break.
  try {
    if (!existsSync(SITEMAPS_DIR)) mkdirSync(SITEMAPS_DIR, { recursive: true });
    writeFileSync(join(SITEMAPS_DIR, "sitemap-pages.xml"), urlsetXml(staticEntries));
    writeFileSync(
      join(PUBLIC_DIR, "sitemap.xml"),
      indexXml([{ file: "sitemap-pages.xml" }]),
    );
  } catch {
    /* keep previous file */
  }
  process.exit(0);
});
