/**
 * IndexNow ping helper + best-effort event logging to indexing_events.
 * Failures are swallowed — SEO pings must never block the caller.
 */
import { logIndexingEvents, type IndexingEvent } from "./indexingLog.ts";

const INDEXNOW_KEY = "ilr7k3n9x2q8w5m4v6b1p0d3s7z4h2y8";
const HOST = "ilinguerelax.com";
const KEY_LOCATION = `https://${HOST}/ilinguerelax-indexnow-key.txt`;
const ENDPOINTS = [
  { name: "indexnow", url: "https://api.indexnow.org/indexnow" },
  { name: "bing",     url: "https://www.bing.com/indexnow" },
  { name: "yandex",   url: "https://yandex.com/indexnow" },
  { name: "seznam",   url: "https://search.seznam.cz/indexnow" },
  { name: "naver",    url: "https://searchadvisor.naver.com/indexnow" },
];

export async function pingIndexNow(urls: string[]): Promise<void> {
  const clean = Array.from(new Set(urls.filter(Boolean)));
  if (clean.length === 0) return;

  const body = JSON.stringify({
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: clean.slice(0, 10_000),
  });

  const events: IndexingEvent[] = [];

  await Promise.allSettled(
    ENDPOINTS.map(async ({ name, url }) => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body,
        });
        const ok = res.status === 200 || res.status === 202;
        console.log(`[indexnow:${name}]`, res.status, ok ? "OK" : "");
        for (const u of clean) {
          events.push({
            url: u,
            channel: "indexnow",
            target: name,
            status: ok ? "sent" : "error",
            http_status: res.status,
          });
        }
      } catch (err) {
        console.warn(`[indexnow:${name}] fetch failed:`, (err as Error).message);
        for (const u of clean) {
          events.push({
            url: u,
            channel: "indexnow",
            target: name,
            status: "error",
            detail: (err as Error).message.slice(0, 240),
          });
        }
      }
    })
  );

  await logIndexingEvents(events);
}

export function productUrl(sku: string): string {
  return `https://${HOST}/products/${sku}`;
}

/**
 * Feed VIVO del blog (Edge Function): refleja el post recién aprobado al
 * instante, sin esperar el rebuild que regenera /sitemaps/sitemap-blog.xml.
 */
export const LIVE_BLOG_SITEMAP =
  "https://opyitzdvvurdyyyzkwwv.supabase.co/functions/v1/blog-feed?format=sitemap";
export const LIVE_BLOG_RSS =
  "https://opyitzdvvurdyyyzkwwv.supabase.co/functions/v1/blog-feed?format=rss";

export async function pingSitemap(
  feeds: string[] = [
    // Primero los feeds vivos: ya contienen el post nuevo.
    LIVE_BLOG_SITEMAP,
    LIVE_BLOG_RSS,
    `https://${HOST}/sitemap.xml`,
    `https://${HOST}/sitemaps/sitemap-blog.xml`,
    `https://${HOST}/rss.xml`,
  ],
): Promise<void> {

  const events: IndexingEvent[] = [];

  await Promise.allSettled(
    feeds.map(async (sitemap) => {
      const encoded = encodeURIComponent(sitemap);
      const endpoints: Array<{ name: string; url: string }> = [
        { name: "google", url: `https://www.google.com/ping?sitemap=${encoded}` },
        { name: "bing",   url: `https://www.bing.com/ping?sitemap=${encoded}` },
        { name: "google_blogs", url: `https://blogsearch.google.com/ping/RPC2?name=iLingueRelax&url=${encoded}` },
        { name: "yandex", url: `https://ping.blogs.yandex.ru/RPC2?sitemap=${encoded}` },
        { name: "baidu",  url: `http://ping.baidu.com/ping/RPC2?sitemap=${encoded}` },
        { name: "naver",  url: `https://searchadvisor.naver.com/indexnow?url=${encoded}&keyLocation=${encodeURIComponent(KEY_LOCATION)}&key=${INDEXNOW_KEY}` },
      ];

      await Promise.allSettled(
        endpoints.map(async ({ name, url }) => {
          try {
            const res = await fetch(url, { method: "GET" });
            console.log(`[sitemap-ping:${name}]`, sitemap, res.status);
            events.push({
              url: sitemap,
              channel: "sitemap_ping",
              target: name,
              status: res.ok ? "sent" : "error",
              http_status: res.status,
            });
          } catch (err) {
            console.warn(`[sitemap-ping:${name}] ${sitemap} failed:`, (err as Error).message);
            events.push({
              url: sitemap,
              channel: "sitemap_ping",
              target: name,
              status: "error",
              detail: (err as Error).message.slice(0, 240),
            });
          }
        })
      );
    })
  );

  await logIndexingEvents(events);
}

/**
 * Notificación completa tras publicar un post del blog:
 * 0) Calienta y verifica el sitemap VIVO (que ya incluye el post nuevo)
 * 1) IndexNow (Bing/Yandex/Seznam/Naver) con la URL del post + índice del blog
 * 2) Ping de sitemap y RSS (vivos + estáticos) a Google y Bing
 * Nunca lanza: los fallos se registran en logs / indexing_events.
 */
export async function pingPostPublished(slug: string): Promise<void> {
  const clean = String(slug || "").replace(/^\/+|\/+$/g, "");
  if (!clean) return;
  const postUrl = `https://${HOST}/blog/${clean}`;
  try {
    // 0) El feed vivo se genera desde la base de datos: confirmamos que el
    //    post ya aparece antes de avisar a los buscadores.
    try {
      const res = await fetch(`${LIVE_BLOG_SITEMAP}&t=${Date.now()}`, { cache: "no-store" });
      const xml = await res.text();
      console.log(
        `[pingPostPublished] live sitemap ${res.status}, contiene el post: ${xml.includes(postUrl)}`,
      );
    } catch (err) {
      console.warn("[pingPostPublished] no se pudo verificar el feed vivo:", (err as Error).message);
    }

    await Promise.allSettled([
      pingIndexNow([postUrl, `https://${HOST}/blog`]),
      pingSitemap(),
    ]);
    console.log("[pingPostPublished] done for", postUrl);
  } catch (err) {
    console.warn("[pingPostPublished] failed:", (err as Error).message);
  }
}


