import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "../_shared/brevo.ts";

const FROM = 'iLingue Relax <hola@ilinguerelax.com>';
const REPLY_TO = 'hola@ilinguerelax.com';

Deno.serve(async (req) => {
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // 1. Obtener configuraciones
  const { data: config } = await admin.from('marketing_drip_config').select('*').eq('enabled', true);
  
  // 2. Obtener compradores recientes (últimos 30 días)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  
  const { data: purchases } = await admin
    .from('hotmart_purchases')
    .select('email, purchased_at, product_code')
    .gte('purchased_at', cutoff.toISOString())
    .eq('status', 'approved');

  let sentCount = 0;

  for (const purchase of purchases || []) {
    const purchasedAt = new Date(purchase.purchased_at).getTime();
    const daysSince = Math.floor((Date.now() - purchasedAt) / 86400000);
    
    // Categorizar compra
    let cat = 'otro';
    if (purchase.product_code?.includes('1000')) cat = '1000_verbos';
    else if (purchase.product_code?.includes('5000')) cat = '5000_palabras';
    else if (purchase.product_code?.includes('coreano')) cat = 'coreano_mapas';
    
    const steps = (config || []).filter(c => c.category === cat && c.day_offset <= daysSince);
    
    for (const step of steps) {
        // Verificar si ya se envió
        const { data: sent } = await admin.from('marketing_drip_sends')
            .select('id').eq('email', purchase.email).eq('category', cat).eq('step_name', step.step_name).maybeSingle();
        
        if (!sent) {
            // Enviar email
            try {
              await sendEmail({ 
                from: FROM, 
                to: purchase.email, 
                replyTo: REPLY_TO, 
                subject: `Día ${step.day_offset}: Sigamos con tu aprendizaje`, 
                html: `<p>Hola, han pasado ${step.day_offset} días desde tu compra de ${cat}. Sigue practicando...</p>`, 
                text: `Hola, han pasado ${step.day_offset} días desde tu compra de ${cat}. Sigue practicando...` 
              });
              
              // Registrar envío exitoso
              await admin.from('marketing_drip_sends').insert({
                  email: purchase.email,
                  category: cat,
                  step_name: step.step_name,
                  status: 'sent',
                  sent_at: new Date().toISOString()
              });
              sentCount++;
            } catch (e) {
              console.error('Error enviando marketing drip:', e);
            }
        }
    }
  }

  return new Response(JSON.stringify({ ok: true, sent: sentCount }));
});
