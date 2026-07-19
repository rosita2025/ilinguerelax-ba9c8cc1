/**
 * IndexNow ping helper.
 *
 * IndexNow is a lightweight open protocol supported by Bing, Yandex, Seznam
 * and Naver. Google doesn't consume the protocol directly but discovers new
 * URLs faster once they're announced to the shared index.
 *
 * Setup:
 *  - A key file lives at https://ilinguerelax.com/ilinguerelax-indexnow-key.txt
 *  - The file contents (a 32-char token) match INDEXNOW_KEY below.
 *  - Any change to that file requires updating the constant.
 *
 * Usage (from an edge function):
 *   await pingIndexNow(["https://ilinguerelax.com/products/foo"]);
 *
 * Failures are swallowed — SEO pings must never block the caller.
 */

const INDEXNOW_KEY = "ilr7k3n9x2q8w5m4v6b1p0d3s7z4h2y8";
const HOST = "ilinguerelax.com";
const KEY_LOCATION = `https://${HOST}/ilinguerelax-indexnow-key.txt`;
// IndexNow accepts submissions at any participating engine's endpoint and
// syndicates them across the network. We hit multiple explicitly so a single
// engine outage doesn't drop the submission.
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
    urlList: clean.slice(0, 10_000), // hard cap per IndexNow spec
  });

  await Promise.allSettled(
    ENDPOINTS.map(async ({ name, url }) => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body,
        });
        const ok = res.status === 200 || res.status === 202;
        console.log(`[indexnow:${name}]`, res.status, ok ? "OK" : await res.text().catch(() => ""));
      } catch (err) {
        console.warn(`[indexnow:${name}] fetch failed:`, (err as Error).message);
      }
    })
  );
}

export function productUrl(sku: string): string {
  return `https://${HOST}/products/${sku}`;
}

/**
 * Best-effort sitemap discovery ping across every major search engine
 * that still accepts unauthenticated pings:
 *   - Google (deprecated but tolerated)
 *   - Bing (also covered by IndexNow)
 *   - Yandex (RU + IndexNow)
 *   - Baidu (CN) — the only way to nudge Baiduspider without an
 *     authenticated Zhanzhang push account.
 *   - Naver (KR) — Seznam / Yeti fallback discovery.
 *
 * All calls swallow errors; SEO pings must never block the caller.
 */
export async function pingSitemap(): Promise<void> {
  const sitemap = `https://${HOST}/sitemap.xml`;
  const encoded = encodeURIComponent(sitemap);
  const endpoints = [
    `https://www.google.com/ping?sitemap=${encoded}`,
    `https://www.bing.com/ping?sitemap=${encoded}`,
    `https://blogsearch.google.com/ping/RPC2?name=iLingueRelax&url=${encoded}`,
    `https://ping.blogs.yandex.ru/RPC2?sitemap=${encoded}`,
    `http://ping.baidu.com/ping/RPC2?sitemap=${encoded}`,
    `https://searchadvisor.naver.com/indexnow?url=${encoded}&keyLocation=${encodeURIComponent(KEY_LOCATION)}&key=${INDEXNOW_KEY}`,
  ];
  await Promise.allSettled(
    endpoints.map((url) => fetch(url, { method: "GET" }).catch(() => null))
  );
}
