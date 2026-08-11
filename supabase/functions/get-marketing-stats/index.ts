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

  const stats = { 
    today: { newsletter: 0, marketing: 0, abandoned: 0, total: 0 },
    lifetime: { newsletter: 0, marketing: 0 },
    account: null as any
  };

  const GATEWAY_URL = "https://connector-gateway.lovable.dev/brevo";
  async function brevoGet(path: string) {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    if (!LOVABLE_API_KEY || !BREVO_API_KEY) return null;
    try {
      const res = await fetch(`${GATEWAY_URL}${path}`, {
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": BREVO_API_KEY,
          "Accept": "application/json",
        },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const [newsletter, marketing, abandoned, accountRes, totalNewsletter, totalMarketing] = await Promise.all([
      supabase.from('newsletter_drip_sends').select('id', { count: 'exact', head: true }).gte('sent_at', todayIso).eq('status', 'sent'),
      supabase.from('marketing_drip_sends').select('id', { count: 'exact', head: true }).gte('sent_at', todayIso).eq('status', 'sent'),
      supabase.from('brevo_sync_logs').select('id', { count: 'exact', head: true }).gte('created_at', todayIso).in('event_type', ['hotmart_abandoned', 'tienda_abandoned']).or('status.eq.ok,status.eq.success'),
      brevoGet('/account'),
      supabase.from('newsletter_drip_sends').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
      supabase.from('marketing_drip_sends').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
    ]);

    // Extract plan info
    if (accountRes) {
      const plans = accountRes.plan ?? [];
      for (const p of plans) {
        if (p.type && String(p.type).toLowerCase().includes("sms")) continue;
        if (typeof p.credits === "number") {
          stats.account = {
            emailsLeft: p.credits,
            planType: p.type ?? null,
            planEndDate: p.endDate ?? null,
          };
          break;
        }
      }
    }

    stats.today = {
      newsletter: newsletter.count || 0,
      marketing: marketing.count || 0,
      abandoned: abandoned.count || 0,
      total: (newsletter.count || 0) + (marketing.count || 0) + (abandoned.count || 0)
    };
    stats.lifetime = {
      newsletter: totalNewsletter.count || 0,
      marketing: totalMarketing.count || 0
    };

    return new Response(JSON.stringify(stats), {
      headers: { ...adminCorsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...adminCorsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
