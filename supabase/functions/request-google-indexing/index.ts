import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { pingIndexNow, pingSitemap } from '../_shared/indexnow.ts';

const ADMIN_REVIEW_KEY = Deno.env.get('ADMIN_REVIEW_KEY') ?? '';
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY') ?? '';
const GSC_KEY = Deno.env.get('GOOGLE_SEARCH_CONSOLE_API_KEY') ?? '';
const GATEWAY = 'https://connector-gateway.lovable.dev/google_search_console';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { adminKey, urls, siteUrl } = await req.json();
    if (!adminKey || adminKey !== ADMIN_REVIEW_KEY) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const list: string[] = Array.isArray(urls) ? urls.filter((u) => typeof u === 'string') : [];
    if (list.length === 0) {
      return new Response(JSON.stringify({ error: 'urls required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1) IndexNow (Bing/Yandex/Seznam/Naver) — accelerates discovery.
    await pingIndexNow(list);
    // 2) Resubmit sitemap so Google re-checks the canonical set.
    await pingSitemap();

    // 3) Attempt Google Indexing API through the gateway. Officially it
    //    only accepts JobPosting/BroadcastEvent but many sites use it as
    //    a nudge. Failures are non-fatal.
    const indexingResults: Array<{ url: string; status: number; ok: boolean; body?: string }> = [];
    if (LOVABLE_API_KEY && GSC_KEY) {
      for (const url of list.slice(0, 100)) {
        try {
          const res = await fetch(`${GATEWAY}/v3/urlNotifications:publish`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'X-Connection-Api-Key': GSC_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, type: 'URL_UPDATED' }),
          });
          const bodyText = await res.text().catch(() => '');
          indexingResults.push({ url, status: res.status, ok: res.ok, body: res.ok ? undefined : bodyText.slice(0, 300) });
        } catch (err) {
          indexingResults.push({ url, status: 0, ok: false, body: (err as Error).message });
        }
      }
    }

    // 4) If a siteUrl was provided, re-inspect so the admin sees updated verdicts on next load.
    const inspections: Array<{ url: string; verdict?: string; coverageState?: string }> = [];
    if (siteUrl && LOVABLE_API_KEY && GSC_KEY) {
      for (const url of list.slice(0, 25)) {
        try {
          const res = await fetch(`${GATEWAY}/v1/urlInspection/index:inspect`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'X-Connection-Api-Key': GSC_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inspectionUrl: url, siteUrl }),
          });
          if (res.ok) {
            const data = await res.json();
            const idx = data?.inspectionResult?.indexStatusResult ?? {};
            inspections.push({ url, verdict: idx.verdict, coverageState: idx.coverageState });
          }
        } catch { /* noop */ }
      }
    }

    const okCount = indexingResults.filter((r) => r.ok).length;
    return new Response(JSON.stringify({
      ok: true,
      indexnow: 'sent',
      sitemap: 'resubmitted',
      indexingApi: { attempted: indexingResults.length, ok: okCount, results: indexingResults },
      inspections,
      note: okCount === 0 && indexingResults.length > 0
        ? 'Google Indexing API rechazó los envíos (normal para páginas que no son JobPosting/BroadcastEvent). Usa el enlace "Solicitar indexación" para hacerlo manualmente.'
        : undefined,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[request-google-indexing]', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
