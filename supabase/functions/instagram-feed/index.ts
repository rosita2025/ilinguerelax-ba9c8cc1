import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const CACHE_TTL_MS = 30 * 60 * 1000;
let cache: { at: number; data: unknown } | null = null;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get('INSTAGRAM_ACCESS_TOKEN');
    const userId = Deno.env.get('INSTAGRAM_USER_ID');

    if (!token || !userId) {
      return new Response(
        JSON.stringify({ configured: false, items: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      );
    }

    if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
      return new Response(JSON.stringify(cache.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
    const url = `https://graph.instagram.com/v21.0/${encodeURIComponent(userId)}/media?fields=${fields}&limit=12&access_token=${encodeURIComponent(token)}`;

    const res = await fetch(url);
    if (!res.ok) {
      const details = await res.text();
      console.error(`Instagram API failed [${res.status}]: ${details}`);
      return new Response(
        JSON.stringify({ error: 'Instagram request failed', status: res.status, details }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: res.status },
      );
    }

    const json = await res.json();
    const items = (json.data ?? [])
      .filter((m: any) => m.media_type !== 'VIDEO' || m.thumbnail_url)
      .map((m: any) => ({
        id: m.id,
        caption: m.caption ?? '',
        permalink: m.permalink,
        image: m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url,
        mediaType: m.media_type,
        timestamp: m.timestamp,
      }));

    const payload = { configured: true, items };
    cache = { at: Date.now(), data: payload };

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    console.error('instagram-feed error:', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
