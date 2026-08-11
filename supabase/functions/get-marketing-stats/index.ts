import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { adminCorsHeaders, assertAdminCsrf } from '../_shared/adminCsrf.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: adminCorsHeaders });

  const adminBlock = await assertAdminCsrf(req);
  if (adminBlock) return adminBlock;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const [newsletter, marketing, abandoned] = await Promise.all([
      supabase.from('newsletter_drip_sends').select('id', { count: 'exact' }).gte('sent_at', todayIso).eq('status', 'sent'),
      supabase.from('marketing_drip_sends').select('id', { count: 'exact' }).gte('sent_at', todayIso).eq('status', 'sent'),
      supabase.from('brevo_abandoned_logs').select('id', { count: 'exact' }).gte('created_at', todayIso).or('status.eq.ok,status.eq.success'),
    ]);

    const [totalNewsletter, totalMarketing] = await Promise.all([
      supabase.from('newsletter_drip_sends').select('id', { count: 'exact' }).eq('status', 'sent'),
      supabase.from('marketing_drip_sends').select('id', { count: 'exact' }).eq('status', 'sent'),
    ]);

    return new Response(JSON.stringify({
      today: {
        newsletter: newsletter.count || 0,
        marketing: marketing.count || 0,
        abandoned: abandoned.count || 0,
        total: (newsletter.count || 0) + (marketing.count || 0) + (abandoned.count || 0)
      },
      lifetime: {
        newsletter: totalNewsletter.count || 0,
        marketing: totalMarketing.count || 0
      }
    }), {
      headers: { ...adminCorsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...adminCorsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
