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

const MAX_ATTEMPTS = 3;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * fetch con reintentos y backoff exponencial (2^n * 500ms) para 429 / 5xx y
 * errores de red. Devuelve el último resultado o el último error.
 */
async function fetchRetry(
  url: string,
  init: RequestInit,
  label: string,
): Promise<{ status: number; ok: boolean; attempts: number; error?: string }> {
  let lastError = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, init);
      const ok = res.status === 200 || res.status === 202 || res.ok;
      const retryable = res.status === 429 || res.status >= 500;
      // Consumimos el body para liberar la conexión en Deno.
      await res.text().catch(() => "");
      if (ok || !retryable || attempt === MAX_ATTEMPTS) {
        return { status: res.status, ok, attempts: attempt };
      }
      console.warn(`[${label}] ${res.status} reintento ${attempt}/${MAX_ATTEMPTS}`);
      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastError = (err as Error).message;
      console.warn(`[${label}] error de red (${lastError}) intento ${attempt}/${MAX_ATTEMPTS}`);
      if (attempt === MAX_ATTEMPTS) break;
    }
    await sleep(Math.min(2 ** attempt * 500, 4000));
  }
  return { status: 0, ok: false, attempts: MAX_ATTEMPTS, error: lastError };
}

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
      const r = await fetchRetry(
        url,
        {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body,
        },
        `indexnow:${name}`,
      );
      console.log(`[indexnow:${name}]`, r.status, r.ok ? "OK" : `FALLO tras ${r.attempts} intentos`);
      // Dead-letter: si tras 3 intentos sigue fallando, queda registrado con
      // detalle para poder reintentar manualmente desde /admin/seo.
      const detail = r.ok
        ? undefined
        : `dead_letter after ${r.attempts} attempts${r.error ? `: ${r.error}` : ""}`.slice(0, 240);
      for (const u of clean) {
        events.push({
          url: u,
          channel: "indexnow",
          target: name,
          status: r.ok ? "sent" : "error",
          http_status: r.status || undefined,
          detail,
        });
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
          const r = await fetchRetry(url, { method: "GET" }, `sitemap-ping:${name}`);
          console.log(`[sitemap-ping:${name}]`, sitemap, r.status, r.ok ? "OK" : "FALLO");
          events.push({
            url: sitemap,
            channel: "sitemap_ping",
            target: name,
            status: r.ok ? "sent" : "error",
            http_status: r.status || undefined,
            detail: r.ok
              ? undefined
              : `dead_letter after ${r.attempts} attempts${r.error ? `: ${r.error}` : ""}`.slice(0, 240),
          });
        })
      );
    })
  );

  await logIndexingEvents(events);
}

/**
 * WebSub / PubSubHubbub: notifica a los hubs para que los agregadores y
 * Google News descubran el post en segundos vía RSS.
 */
export async function pingWebSub(
  feeds: string[] = [`https://${HOST}/rss.xml`, LIVE_BLOG_RSS],
): Promise<void> {
  const hubs = [
    { name: "pubsubhubbub", url: "https://pubsubhubbub.appspot.com/" },
    { name: "websubhub", url: "https://websubhub.com/hub" },
  ];
  const events: IndexingEvent[] = [];

  await Promise.allSettled(
    feeds.flatMap((feed) =>
      hubs.map(async ({ name, url }) => {
        const body = new URLSearchParams({ "hub.mode": "publish", "hub.url": feed }).toString();
        const r = await fetchRetry(
          url,
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body,
          },
          `websub:${name}`,
        );
        console.log(`[websub:${name}]`, feed, r.status, r.ok ? "OK" : "FALLO");
        events.push({
          url: feed,
          channel: "sitemap_ping",
          target: `websub_${name}`,
          status: r.ok ? "sent" : "error",
          http_status: r.status || undefined,
          detail: r.ok
            ? undefined
            : `dead_letter after ${r.attempts} attempts${r.error ? `: ${r.error}` : ""}`.slice(0, 240),
        });
      })
    )
  );

  await logIndexingEvents(events);
}

/**
 * Notificación completa tras publicar un post del blog:
 * 0) Calienta y verifica el sitemap VIVO (que ya incluye el post nuevo)
 * 1) IndexNow (Bing/Yandex/Seznam/Naver) con reintentos + dead-letter
 * 2) Ping de sitemap y RSS (vivos + estáticos) a Google y Bing
 * 3) WebSub para agregadores / Google News
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
      pingWebSub(),
    ]);
    console.log("[pingPostPublished] done for", postUrl);
  } catch (err) {
    console.warn("[pingPostPublished] failed:", (err as Error).message);
  }
}



