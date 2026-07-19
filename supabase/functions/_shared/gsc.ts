/**
 * Google Search Console helpers.
 *
 * Uses the Lovable connector gateway (google_search_console) so tokens
 * refresh automatically. All calls swallow errors — SEO propagation must
 * never block the caller.
 */

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

/**
 * Resubmit every sitemap to Google Search Console. Google will re-crawl
 * within hours and discover the new/updated product URLs.
 */
export async function resubmitSitemapsGSC(): Promise<void> {
  const h = headers();
  if (!h) return;
  const tasks: Promise<unknown>[] = [];
  for (const site of SITE_CANDIDATES) {
    for (const sitemap of SITEMAPS) {
      const url = `${GATEWAY}/webmasters/v3/sites/${encodeURIComponent(site)}/sitemaps/${encodeURIComponent(sitemap)}`;
      tasks.push(fetch(url, { method: "PUT", headers: h }).catch(() => null));
    }
  }
  await Promise.allSettled(tasks);
}

/** Read Google's current URL status. The Inspection API cannot request
 * indexing and does not add the URL to Google's crawl queue. */
export async function inspectUrlGSC(inspectionUrl: string): Promise<void> {
  const h = headers();
  if (!h) return;
  for (const site of SITE_CANDIDATES) {
    try {
      const res = await fetch(`${GATEWAY}/v1/urlInspection/index:inspect`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({ inspectionUrl, siteUrl: site }),
      });
      if (res.ok) return;
    } catch {
      /* swallow */
    }
  }
}
