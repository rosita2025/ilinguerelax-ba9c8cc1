import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { pingIndexNow } from '../_shared/indexnow.ts';
import { notifyGoogleIndexing } from '../_shared/googleIndexing.ts';

const ADMIN_REVIEW_KEY = Deno.env.get('ADMIN_REVIEW_KEY') ?? '';
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { adminKey, urls } = await req.json();
    if (!adminKey || adminKey !== ADMIN_REVIEW_KEY) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cap per request: cada URL dispara varias llamadas externas (IndexNow,
    // Indexing API, inspección). Sin tope la función excede el tiempo límite y
    // el cliente ve "Failed to send a request to the Edge Function".
    const MAX_URLS = 10;
    const requestedList: string[] = (Array.isArray(urls) ? urls.filter((u) => typeof u === 'string') : [])
      .slice(0, MAX_URLS);
    const list = Array.from(new Set(requestedList.filter((rawUrl) => {
      try {
        const parsed = new URL(rawUrl);
        return parsed.protocol === 'https:' &&
          (parsed.hostname === 'ilinguerelax.com' || parsed.hostname === 'www.ilinguerelax.com');
      } catch {
        return false;
      }
    })));
    const skipped = requestedList.length - list.length;
    if (list.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, skipped }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // El reintento manual notifica únicamente la URL solicitada. No vuelve a
    // enviar todos los sitemaps ni hace inspecciones secuenciales: esas tareas
    // eran las que agotaban el tiempo de la función incluso para una sola URL.
    await Promise.allSettled([
      pingIndexNow(list),
      notifyGoogleIndexing(list, 'URL_UPDATED'),
    ]);
    return new Response(JSON.stringify({
      ok: true,
      sent: list.length,
      truncated: Array.isArray(urls) ? Math.max(0, urls.length - MAX_URLS) : 0,
      skipped,
      indexnow: 'sent',
      indexingApi: 'attempted',
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[request-google-indexing]', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
