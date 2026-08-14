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

    // 2. Obtener contactos que compraron productos
    const { data: purchases, error: pErr } = await admin
      .from('email_contacts')
      .select('email, name, country, created_at, product_type, source, language')
      .or('source.eq.store_purchase,source.eq.hotmart_purchase,source.eq.manual_payment,source.eq.shopify_sale')
      .order('created_at', { ascending: false })
      .limit(BATCH_LIMIT);

    // Complementar con persistent_carts marcados como convertidos
    const { data: cCarts } = await admin
      .from('persistent_carts')
      .select('email, last_activity, items, buyer, country, language')
      .eq('converted', true)
      .order('last_activity', { ascending: false })
      .limit(BATCH_LIMIT);

    const merged = new Map<string, { email: string; name?: string; country?: string; created_at: string; product_type: string; source?: string; language?: string }>();
    (purchases || []).forEach(p => merged.set(p.email.toLowerCase().trim(), p));
    (cCarts || []).forEach(c => {
      const email = c.email.toLowerCase().trim();
      if (!merged.has(email)) {
        merged.set(email, {
          email: email,
          name: (c.buyer as any)?.name,
          country: c.country,
          created_at: c.last_activity,
          product_type: Array.isArray(c.items) && c.items[0]?.id ? String(c.items[0].id) : 'tienda',
          source: 'persistent_cart',
          language: c.language
        });
      }
    });

    // Añadir ventas de Shopify directamente
    const { data: sSales } = await admin
      .from('shopify_sales')
      .select('customer_email, customer_name, country_code, created_at, product_name, sku')
      .order('created_at', { ascending: false })
      .limit(BATCH_LIMIT);
    
    (sSales || []).forEach(s => {
      const email = s.customer_email.toLowerCase().trim();
      if (!merged.has(email)) {
        merged.set(email, {
          email: email,
          name: s.customer_name,
          country: s.country_code,
          created_at: s.created_at,
          product_type: s.sku || s.product_name,
          source: 'shopify'
        });
      }
    });

    for (const p of merged.values()) {
      stats.processed++;
      const email = p.email.toLowerCase().trim();
      
      // 2.5. Skip if suppression exists
      const { data: supp } = await admin
        .from('suppressed_emails')
        .select('email')
        .eq('email', email)
        .maybeSingle();
      if (supp) {
        console.log(`[marketing-drip] skipping ${email} - suppressed`);
        stats.skipped++;
        continue;
      }

      const purchasedAt = new Date(p.created_at).getTime();
      const daysSince = Math.floor((Date.now() - purchasedAt) / 86400000);

      // 3. Inferir categoría (basado en brevoCategory.ts logic)
      let category = 'otro';
      const haystack = `${p.product_type}`.toLowerCase();
      if (haystack.includes('verbo') || haystack.includes('1000')) category = '1000_verbos';
      else if (haystack.includes('5000') || haystack.includes('palabras')) category = '5000_palabras';
      else if (haystack.includes('coreano')) category = 'coreano_mapas';
      else if (haystack.includes('patron')) category = 'patrones';
      else if (haystack.includes('fisico') || haystack.includes('physical') || haystack.includes('book')) category = 'libros_fisicos';

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
            text: template.text,
            supabase: admin, // Enable global throttle
          } as any);

          await admin.from('marketing_drip_sends').insert({
            email,
            category,
            step_name: step.step_name,
            status: 'sent',
            sent_at: new Date().toISOString(),
            metadata: { name: p.name, country: p.country, source: p.source }
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
