/**
 * Ping automático a Pinterest (+ webhook del CMS) cada vez que se publica
 * contenido nuevo (post del blog o producto).
 *
 * Estrategia (todo best-effort, nunca lanza):
 *  1) Calienta/refresca los feeds que Pinterest consume (RSS del blog y
 *     catálogo de productos) con cache-bust, para que la próxima lectura de
 *     Pinterest ya traiga el contenido nuevo.
 *  2) Si existen los secretos PINTEREST_ACCESS_TOKEN (+ PINTEREST_FEED_ID),
 *     dispara el reprocesado del feed vía API v5 de Pinterest.
 *  3) Pide a Pinterest que vuelva a leer la URL nueva (scrape hint).
 *  4) Envía un webhook al CMS si CMS_PING_WEBHOOK_URL está configurado.
 */
import { logIndexingEvents, type IndexingEvent } from "./indexingLog.ts";

const HOST = "ilinguerelax.com";
const FETCH_TIMEOUT_MS = 6_000;

const PROJECT_FN = "https://opyitzdvvurdyyyzkwwv.supabase.co/functions/v1";

export const PINTEREST_FEEDS = [
  `https://${HOST}/rss.xml`,
  `https://${HOST}/rss`,
  `https://${HOST}/feed.xml`,
  `${PROJECT_FN}/blog-feed?format=rss`,
  `https://${HOST}/rss-productos.xml`,
  `https://${HOST}/rss-products.xml`,
  `${PROJECT_FN}/pinterest-catalog`,

];

async function safeFetch(
  url: string,
  init: RequestInit = {},
): Promise<{ status: number; ok: boolean; error?: string }> {
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    await res.text().catch(() => "");
    return { status: res.status, ok: res.ok };
  } catch (err) {
    return { status: 0, ok: false, error: (err as Error).message };
  }
}

export interface ContentPing {
  /** URL pública del contenido recién publicado */
  url: string;
  title?: string;
  image?: string;
  type?: "blog" | "product";
}

export async function pingPinterestAndCms(item: ContentPing): Promise<void> {
  const url = String(item?.url || "").trim();
  if (!url) return;

  const events: IndexingEvent[] = [];
  const push = (
    target: string,
    r: { status: number; ok: boolean; error?: string },
    forUrl = url,
  ) =>
    events.push({
      url: forUrl,
      channel: "sitemap_ping",
      target,
      status: r.ok ? "sent" : "error",
      http_status: r.status || undefined,
      detail: r.ok ? undefined : (r.error ?? `HTTP ${r.status}`).slice(0, 240),
    });

  try {
    // 1) Refresca los feeds que Pinterest lee (cache-bust).
    await Promise.allSettled(
      PINTEREST_FEEDS.map(async (feed) => {
        const bust = feed.includes("?") ? `&t=${Date.now()}` : `?t=${Date.now()}`;
        const r = await safeFetch(feed + bust, {
          method: "GET",
          headers: { "Cache-Control": "no-cache" },
        });
        console.log("[pinterest:feed-warm]", feed, r.status);
        push("pinterest_feed_warm", r, feed);
      }),
    );

    // 2) Reprocesado del feed vía API v5 (si hay credenciales).
    const token = Deno.env.get("PINTEREST_ACCESS_TOKEN");
    const feedId = Deno.env.get("PINTEREST_FEED_ID");
    if (token && feedId) {
      const r = await safeFetch(
        `https://api.pinterest.com/v5/catalogs/feeds/${encodeURIComponent(feedId)}/process`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: "{}",
        },
      );
      console.log("[pinterest:feed-process]", r.status);
      push("pinterest_feed_process", r);
    }

    // 3) Scrape hint: Pinterest vuelve a leer los OG tags de la URL nueva.
    const hint = await safeFetch(
      `https://www.pinterest.com/pin/find/?url=${encodeURIComponent(url)}`,
      { method: "GET", headers: { "User-Agent": "iLingueRelax-Publisher/1.0" } },
    );
    console.log("[pinterest:scrape-hint]", url, hint.status);
    push("pinterest_scrape", hint);

    // 4) Webhook al CMS del usuario.
    const cms = Deno.env.get("CMS_PING_WEBHOOK_URL");
    if (cms) {
      const secret = Deno.env.get("CMS_PING_WEBHOOK_SECRET");
      const r = await safeFetch(cms, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(secret ? { "X-Webhook-Secret": secret } : {}),
        },
        body: JSON.stringify({
          event: "content.published",
          type: item.type ?? "blog",
          url,
          title: item.title ?? null,
          image: item.image ?? null,
          feeds: PINTEREST_FEEDS,
          published_at: new Date().toISOString(),
        }),
      });
      console.log("[cms:webhook]", r.status);
      push("cms_webhook", r);
    }
  } catch (err) {
    console.warn("[pingPinterestAndCms] failed:", (err as Error).message);
  }

  await logIndexingEvents(events);
}
