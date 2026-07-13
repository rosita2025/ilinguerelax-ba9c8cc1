import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { upsertBrevoContact } from '../_shared/brevoContact.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || '').trim().toLowerCase();
    const name = body?.name ? String(body.name).trim() : undefined;
    const source = body?.source ? String(body.source).slice(0, 60) : 'popup';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'invalid_email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (name && name.length > 120) {
      return new Response(JSON.stringify({ error: 'invalid_name' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await upsertBrevoContact({
      email,
      name,
      productName: `newsletter:${source}`,
      provider: 'popup',
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('subscribe-newsletter error', e);
    return new Response(JSON.stringify({ error: 'server_error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
