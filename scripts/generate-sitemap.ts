/**
 * Runs before `vite dev` and `vite build` (predev/prebuild hooks).
 * Writes public/sitemap.xml with:
 *  - Static indexable routes (from App.tsx, excluding admin/checkout/utility)
 *  - All blog posts (from src/data/blogPosts.ts)
 *  - All active products (from Supabase digital_products table)
 *
 * Never fails the build: if Supabase is unreachable, we keep the static routes
 * plus the previously generated sitemap's product URLs (best-effort).
 */

import { writeFileSync, readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

loadEnv();

const BASE_URL = "https://ilinguerelax.com";
const TODAY = new Date().toISOString().slice(0, 10);

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
const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/products", changefreq: "weekly", priority: "0.95" },
  { path: "/sobre-nosotros", changefreq: "monthly", priority: "0.7" },
  { path: "/contacto", changefreq: "monthly", priority: "0.6" },
  { path: "/faq", changefreq: "monthly", priority: "0.6" },
  { path: "/privacidad", changefreq: "yearly", priority: "0.3" },
  { path: "/condiciones", changefreq: "yearly", priority: "0.3" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
  { path: "/vista-previa/patrones-especiales", changefreq: "monthly", priority: "0.6" },
  { path: "/vista-previa/coreano-100-mapas-mentales", changefreq: "monthly", priority: "0.6" },
];

// Product routes hard-coded in App.tsx (typed pages). Dynamic products from the
// DB are appended after this list.
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
async function getBlogEntries(): Promise<SitemapEntry[]> {
  try {
    const mod = await import("../src/data/blogPosts");
    const posts: Array<{ slug: string; date?: string }> = (mod as any).blogPosts ?? [];
    return posts.map((p) => ({
      path: `/blog/${p.slug}`,
      lastmod: p.date ?? TODAY,
      changefreq: "monthly" as const,
      priority: "0.7",
    }));
  } catch (err) {
    console.warn("[sitemap] Could not import blogPosts:", (err as Error).message);
    return [];
  }
}

// --------------------------------------------------------------------------
// Dynamic products from Supabase
// --------------------------------------------------------------------------
async function getDbProductSlugs(): Promise<string[]> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.warn("[sitemap] Missing Supabase env; skipping DB products.");
    return [];
  }
  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from("digital_products")
      .select("sku, active")
      .eq("active", true);
    if (error) {
      console.warn("[sitemap] Supabase error:", error.message);
      return [];
    }
    return (data ?? []).map((r: any) => r.sku).filter(Boolean);
  } catch (err) {
    console.warn("[sitemap] Supabase fetch failed:", (err as Error).message);
    return [];
  }
}

// --------------------------------------------------------------------------
// XML build + write
// --------------------------------------------------------------------------
function toXml(entries: SitemapEntry[]): string {
  const urls = entries.map((e) =>
    [
      "  <url>",
      `    <loc>${BASE_URL}${e.path}</loc>`,
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

async function main() {
  const blogEntries = await getBlogEntries();
  const dbSlugs = await getDbProductSlugs();

  // Merge hardcoded + DB product slugs, dedupe, preserve order (hardcoded first).
  const productSlugs = Array.from(new Set([...hardcodedProductSlugs, ...dbSlugs]));
  const productEntries: SitemapEntry[] = productSlugs.map((slug) => ({
    path: `/products/${slug}`,
    lastmod: TODAY,
    changefreq: "weekly",
    priority: "0.85",
  }));

  const all: SitemapEntry[] = [...staticEntries, ...productEntries, ...blogEntries];
  const outPath = resolve("public/sitemap.xml");
  writeFileSync(outPath, toXml(all));
  console.log(
    `[sitemap] Wrote ${all.length} entries (${staticEntries.length} static, ${productEntries.length} products [${dbSlugs.length} from DB], ${blogEntries.length} blog) → public/sitemap.xml`,
  );
}

main().catch((err) => {
  console.error("[sitemap] generation failed:", err);
  // Don't fail the build — a stale sitemap is better than none.
  if (!existsSync(resolve("public/sitemap.xml"))) {
    writeFileSync(resolve("public/sitemap.xml"), toXml(staticEntries));
  }
  process.exit(0);
});
