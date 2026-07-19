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

export async function pingSitemap(): Promise<void> {
  const sitemap = `https://${HOST}/sitemap.xml`;
  const encoded = encodeURIComponent(sitemap);
  const endpoints: Array<{ name: string; url: string }> = [
    { name: "google", url: `https://www.google.com/ping?sitemap=${encoded}` },
    { name: "bing",   url: `https://www.bing.com/ping?sitemap=${encoded}` },
    { name: "google_blogs", url: `https://blogsearch.google.com/ping/RPC2?name=iLingueRelax&url=${encoded}` },
    { name: "yandex", url: `https://ping.blogs.yandex.ru/RPC2?sitemap=${encoded}` },
    { name: "baidu",  url: `http://ping.baidu.com/ping/RPC2?sitemap=${encoded}` },
    { name: "naver",  url: `https://searchadvisor.naver.com/indexnow?url=${encoded}&keyLocation=${encodeURIComponent(KEY_LOCATION)}&key=${INDEXNOW_KEY}` },
  ];

  const events: IndexingEvent[] = [];
  await Promise.allSettled(
    endpoints.map(async ({ name, url }) => {
      try {
        const res = await fetch(url, { method: "GET" });
        events.push({
          url: sitemap,
          channel: "sitemap_ping",
          target: name,
          status: res.ok ? "sent" : "error",
          http_status: res.status,
        });
      } catch (err) {
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
  await logIndexingEvents(events);
}
