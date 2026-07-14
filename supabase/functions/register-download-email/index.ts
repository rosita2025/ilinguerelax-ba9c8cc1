// Captures email from download-access pages and upserts contact into Brevo
// so the owner can later send marketing emails about new products.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { upsertBrevoContact } from "../_shared/brevoContact.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? '').trim().toLowerCase();
    const name = body.name ? String(body.name).trim().slice(0, 120) : undefined;
    const productName = body.productName ? String(body.productName).slice(0, 200) : undefined;
    const productSlug = body.productSlug ? String(body.productSlug).slice(0, 80) : undefined;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
      return new Response(JSON.stringify({ error: 'Correo inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await upsertBrevoContact({
      email,
      name,
      productName,
      skus: productSlug ? [productSlug] : undefined,
      provider: 'download-page',
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[register-download-email]', e);
    return new Response(JSON.stringify({ error: 'internal' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
