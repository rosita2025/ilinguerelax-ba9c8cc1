import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendEmail } from "../_shared/brevo.ts";
import { MARKETING_TEMPLATES } from "../_shared/marketingTemplates.ts";

const FROM = 'iLingue Relax <hola@ilinguerelax.com>';
const REPLY_TO = 'hola@ilinguerelax.com';
const BATCH_LIMIT = 50;

Deno.serve(async (req) => {
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const stats = { processed: 0, sent: 0, skipped: 0, failed: 0 };

  try {
    // 1. Obtener configuración activa
    const { data: configs } = await admin
      .from('marketing_drip_config')
      .select('*')
      .eq('enabled', true);

    if (!configs || configs.length === 0) {
      return new Response(JSON.stringify({ ok: true, note: 'No active config', stats }));
    }

    // 2. Obtener contactos que compraron productos (usamos email_contacts con source=hotmart_purchase o similar)
    // O directamente desde hotmart_purchases para mayor precisión en la fecha
    const { data: purchases, error: pErr } = await admin
      .from('hotmart_purchases')
      .select('email, purchased_at, product_id, product_code')
      .eq('status', 'approved')
      .order('purchased_at', { ascending: false })
      .limit(BATCH_LIMIT);

    if (pErr) throw pErr;

    for (const p of purchases || []) {
      stats.processed++;
      const email = p.email.toLowerCase().trim();
      const purchasedAt = new Date(p.purchased_at).getTime();
      const daysSince = Math.floor((Date.now() - purchasedAt) / 86400000);

      // 3. Inferir categoría (basado en brevoCategory.ts logic)
      let category = 'otro';
      const haystack = `${p.product_id} ${p.product_code}`.toLowerCase();
      if (haystack.includes('verbo') || haystack.includes('1000')) category = '1000_verbos';
      else if (haystack.includes('5000')) category = '5000_palabras';
      else if (haystack.includes('coreano')) category = 'coreano_mapas';

      // 4. Buscar pasos que le tocan hoy
      const eligibleSteps = configs.filter(c => c.category === category && c.day_offset <= daysSince);
      
      for (const step of eligibleSteps) {
        // Evitar duplicados atómicos
        const { data: alreadySent } = await admin
          .from('marketing_drip_sends')
          .select('id')
          .eq('email', email)
          .eq('category', category)
          .eq('step_name', step.step_name)
          .maybeSingle();

        if (alreadySent) continue;

        const template = MARKETING_TEMPLATES[step.template_key];
        if (!template) {
          console.warn(`Template ${step.template_key} not found`);
          continue;
        }

        try {
          await sendEmail({
            from: FROM,
            to: email,
            replyTo: REPLY_TO,
            subject: template.subject,
            html: template.html,
            text: template.text
          } as any);

          await admin.from('marketing_drip_sends').insert({
            email,
            category,
            step_name: step.step_name,
            status: 'sent',
            sent_at: new Date().toISOString()
          });
          stats.sent++;
        } catch (e) {
          console.error(`Failed to send marketing drip to ${email}:`, e);
          stats.failed++;
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, stats }));
  } catch (e) {
    console.error('send-marketing-drip error', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
