import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { pingIndexNow, pingSitemap } from '../_shared/indexnow.ts';
import { logIndexingEvents, type IndexingEvent } from '../_shared/indexingLog.ts';
import { notifyGoogleIndexing } from '../_shared/googleIndexing.ts';

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

    // Cap per request: cada URL dispara varias llamadas externas (IndexNow,
    // Indexing API, inspección). Sin tope la función excede el tiempo límite y
    // el cliente ve "Failed to send a request to the Edge Function".
    const MAX_URLS = 25;
    const requestedList: string[] = (Array.isArray(urls) ? urls.filter((u) => typeof u === 'string') : [])
      .slice(0, MAX_URLS);
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    const slugs = requestedList.flatMap((rawUrl) => {
      try {
        const match = new URL(rawUrl).pathname.match(/^\/blog\/([^/]+)\/?$/);
        return match ? [decodeURIComponent(match[1])] : [];
      } catch {
        return [];
      }
    });
    const { data: claimed, error: claimError } = slugs.length > 0
      ? await admin
          .from('generated_blog_posts')
          .update({ google_index_requested_at: new Date().toISOString() })
          .in('slug', slugs)
          .is('google_index_requested_at', null)
          .select('slug')
      : { data: [], error: null };
    if (claimError) throw claimError;
    const claimedSlugs = new Set((claimed ?? []).map((row) => row.slug));
    const list = requestedList.filter((rawUrl) => {
      try {
        const match = new URL(rawUrl).pathname.match(/^\/blog\/([^/]+)\/?$/);
        return !match || claimedSlugs.has(decodeURIComponent(match[1]));
      } catch {
        return true;
      }
    });
    const skipped = requestedList.length - list.length;
    if (list.length === 0) {
      return new Response(JSON.stringify({ ok: true, alreadyRequested: true, sent: 0, skipped }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1) IndexNow (Bing/Yandex/Seznam/Naver) — accelerates discovery.
    // Fallos externos no deben tumbar la respuesta al admin.
    await Promise.allSettled([
      pingIndexNow(list),
      // 2) Resubmit sitemap so Google re-checks the canonical set.
      pingSitemap(),
      // 2b) Google Indexing API oficial (cuenta de servicio) — funciona para
      //     cualquier URL del sitio: blog, productos y páginas.
      notifyGoogleIndexing(list, 'URL_UPDATED'),
    ]);

    // 3) Attempt Google Indexing API through the gateway. Officially it
    //    only accepts JobPosting/BroadcastEvent but many sites use it as
    //    a nudge. Failures are non-fatal.
    const indexingResults: Array<{ url: string; status: number; ok: boolean; body?: string }> = [];
    if (LOVABLE_API_KEY && GSC_KEY) {
      for (const url of list) {
        try {
          const res = await fetch(`${GATEWAY}/v3/urlNotifications:publish`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'X-Connection-Api-Key': GSC_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, type: 'URL_UPDATED' }),
            signal: AbortSignal.timeout(10_000),
          });
          const bodyText = await res.text().catch(() => '');
          indexingResults.push({ url, status: res.status, ok: res.ok, body: res.ok ? undefined : bodyText.slice(0, 300) });
        } catch (err) {
          indexingResults.push({ url, status: 0, ok: false, body: (err as Error).message });
        }
      }
    }

    // Log every requested URL as a gsc_request event so /admin/seo can audit history.
    const reqEvents: IndexingEvent[] = list.map((url) => {
      const hit = indexingResults.find((r) => r.url === url);
      return {
        url,
        channel: 'gsc_request',
        target: 'urlNotifications',
        status: hit ? (hit.ok ? 'sent' : 'error') : 'pending',
        http_status: hit?.status,
        detail: hit?.body?.slice(0, 240),
      };
    });
    await logIndexingEvents(reqEvents);

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
            signal: AbortSignal.timeout(10_000),
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
      sent: list.length,
      truncated: Array.isArray(urls) ? Math.max(0, urls.length - MAX_URLS) : 0,
      skipped,
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
