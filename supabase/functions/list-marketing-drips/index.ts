import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { adminCorsHeaders, assertAdminCsrf } from "../_shared/adminCsrf.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: adminCorsHeaders });

  const adminBlock = await assertAdminCsrf(req);
  if (adminBlock) return adminBlock;

  try {
    const { adminKey, limit = 100, search = "" } = await req.json().catch(() => ({}));
    const expected = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expected || adminKey !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const s = typeof search === "string" ? search.trim().toLowerCase() : "";

    // 1) Load Configs
    const { data: mConfig } = await admin.from('marketing_drip_config').select('*').order('day_offset');
    const { data: nConfig } = await admin.from('newsletter_drip_config').select('*').order('day_offset');

    // 2) Load Sends (Recent activity)
    // We combine marketing and newsletter sends for a unified view
    const { data: mSends } = await admin.from('marketing_drip_sends').select('*').order('sent_at', { ascending: false }).limit(limit);
    const { data: nSends } = await admin.from('newsletter_drip_sends').select('*').order('sent_at', { ascending: false }).limit(limit);

    // 3) Normalización
    const unifiedSends = [
      ...(mSends ?? []).map(s => ({ ...s, category: s.category || 'marketing' })),
      ...(nSends ?? []).map(s => ({ ...s, category: 'newsletter', step_name: `Paso ${s.step}` }))
    ].sort((a, b) => new Date(b.sent_at || 0).getTime() - new Date(a.sent_at || 0).getTime())
     .slice(0, limit);

    // 4) Filter sends if search is present
    const filteredSends = s ? unifiedSends.filter(item => 
      item.email?.toLowerCase().includes(s) || 
      item.category?.toLowerCase().includes(s) ||
      item.metadata?.country?.toLowerCase().includes(s)
    ) : unifiedSends;

    // 5) Stats
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const { count: mToday } = await admin.from('marketing_drip_sends').select('*', { count: 'exact', head: true }).gte('sent_at', today);
    const { count: nToday } = await admin.from('newsletter_drip_sends').select('*', { count: 'exact', head: true }).gte('sent_at', today);
    
    // 6) Abandoned Logs
    const { data: abLogs } = await admin.from('brevo_sync_logs')
      .select('*')
      .in('event_type', ['tienda_abandoned', 'hotmart_abandoned'])
      .order('created_at', { ascending: false })
      .limit(limit);

    const filteredAbandoned = s ? (abLogs ?? []).filter(item => 
      item.email?.toLowerCase().includes(s) || 
      item.product_name?.toLowerCase().includes(s) ||
      item.attributes?.COUNTRY_CODE?.toLowerCase().includes(s)
    ) : abLogs;

    return new Response(JSON.stringify({
      configs: {
        marketing: mConfig ?? [],
        newsletter: nConfig ?? [],
      },
      sends: filteredSends,
      abandonedLogs: filteredAbandoned ?? [],
      stats: {
        sentToday: (mToday ?? 0) + (nToday ?? 0),
        marketingToday: mToday ?? 0,
        newsletterToday: nToday ?? 0
      }
    }), {
      status: 200, headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("list-marketing-drips error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
    });
  }
});
