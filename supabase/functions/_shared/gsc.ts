/**
 * Google Search Console helpers + indexing_events logging.
 */
import { logIndexingEvents, type IndexingEvent } from "./indexingLog.ts";

const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";
const SITE_CANDIDATES = [
  "sc-domain:ilinguerelax.com",
  "https://ilinguerelax.com/",
  "https://www.ilinguerelax.com/",
];
const SITEMAPS = [
  "https://ilinguerelax.com/sitemap.xml",
  "https://ilinguerelax.com/sitemaps/sitemap-pages.xml",
  "https://ilinguerelax.com/sitemaps/sitemap-products-1.xml",
  "https://ilinguerelax.com/sitemaps/sitemap-blog.xml",
];

function headers() {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const gscKey = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");
  if (!lovableKey || !gscKey) return null;
  return {
    "Authorization": `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": gscKey,
    "Content-Type": "application/json",
  };
}

export async function resubmitSitemapsGSC(): Promise<void> {
  const h = headers();
  if (!h) return;
  const events: IndexingEvent[] = [];
  const tasks: Promise<unknown>[] = [];
  for (const site of SITE_CANDIDATES) {
    for (const sitemap of SITEMAPS) {
      const url = `${GATEWAY}/webmasters/v3/sites/${encodeURIComponent(site)}/sitemaps/${encodeURIComponent(sitemap)}`;
      tasks.push(
        fetch(url, { method: "PUT", headers: h })
          .then((res) => {
            events.push({
              url: sitemap,
              channel: "gsc_sitemap",
              target: site,
              status: res.ok ? "sent" : "error",
              http_status: res.status,
            });
          })
          .catch((err) => {
            events.push({
              url: sitemap,
              channel: "gsc_sitemap",
              target: site,
              status: "error",
              detail: (err as Error).message.slice(0, 240),
            });
          })
      );
    }
  }
  await Promise.allSettled(tasks);
  await logIndexingEvents(events);
}

/** Read Google's current URL status via the Inspection API. */
export async function inspectUrlGSC(inspectionUrl: string): Promise<void> {
  const h = headers();
  if (!h) return;
  const events: IndexingEvent[] = [];
  for (const site of SITE_CANDIDATES) {
    try {
      const res = await fetch(`${GATEWAY}/v1/urlInspection/index:inspect`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({ inspectionUrl, siteUrl: site }),
      });
      if (res.ok) {
        let verdict = "sent";
        try {
          const data = await res.clone().json();
          const state = data?.inspectionResult?.indexStatusResult?.coverageState as string | undefined;
          if (state) {
            const lower = state.toLowerCase();
            verdict = lower.includes("submitted and indexed") || lower.includes("indexed") ? "validated" : "sent";
            events.push({
              url: inspectionUrl,
              channel: "gsc_inspect",
              target: site,
              status: verdict as IndexingEvent["status"],
              http_status: res.status,
              detail: state.slice(0, 240),
            });
          } else {
            events.push({ url: inspectionUrl, channel: "gsc_inspect", target: site, status: "sent", http_status: res.status });
          }
        } catch {
          events.push({ url: inspectionUrl, channel: "gsc_inspect", target: site, status: "sent", http_status: res.status });
        }
        await logIndexingEvents(events);
        return;
      }
    } catch (err) {
      events.push({
        url: inspectionUrl,
        channel: "gsc_inspect",
        target: site,
        status: "error",
        detail: (err as Error).message.slice(0, 240),
      });
    }
  }
  await logIndexingEvents(events);
}
