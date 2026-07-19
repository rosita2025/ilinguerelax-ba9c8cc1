// Newsletter drip processor — runs every 6h via pg_cron.
// - Reads subscribers from email_contacts where source='newsletter_welcome'
// - For each configured step, checks days_since >= day_offset
// - Atomic claim via unique(lower(email), step) on newsletter_drip_sends
// - Skips: already-purchased product SKU, active abandoned cart (72h),
//   suppression/opt-out, and any email sent to this address in last 24h.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { sendEmail } from '../_shared/brevo.ts';
import { getPurchasedSkus } from '../_shared/purchasedSkus.ts';
import { getDripCopy, type DripLang, type DripStepKey } from '../_shared/dripTemplates.ts';
import { adminCorsHeaders, assertAdminCsrf } from '../_shared/adminCsrf.ts';

const FROM = 'iLingue Relax <hola@ilinguerelax.com>';
const REPLY_TO = 'hola@ilinguerelax.com';
const BATCH_LIMIT = 40; // subscribers processed per invocation
const DAILY_THROTTLE_HOURS = 24;
const ABANDONED_CART_HOLD_HOURS = 72;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: adminCorsHeaders });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // ---------- Manual mode: test-send or force-resend a specific step ----------
  if (req.method === 'POST') {
    let body: any = null;
    try { body = await req.json(); } catch (_) { body = null; }
    const mode = body?.mode as 'test' | 'resend' | undefined;
    if (mode === 'test' || mode === 'resend') {
      const adminBlock = await assertAdminCsrf(req);
      if (adminBlock) return adminBlock;

      const email = String(body?.email || '').trim().toLowerCase();
      const stepKey = String(body?.template_key || '') as DripStepKey;
      const stepNum = Number(body?.step ?? 0);
      const lang = normalizeLang(body?.language);
      const name = body?.name ? String(body.name) : undefined;
      if (!email || !stepKey) {
        return json({ ok: false, error: 'email and template_key are required' }, 400);
      }
      try {
        const { subject, html, text } = getDripCopy(stepKey, lang, name);
        const finalSubject = mode === 'test' ? `[TEST] ${subject}` : subject;
        const res = await sendEmail({ from: FROM, to: email, replyTo: REPLY_TO, subject: finalSubject, html, text } as any);
        if ((res as any)?.error) throw new Error((res as any).error.message || 'send failed');

        if (mode === 'resend' && stepNum > 0) {
          const { data: existing } = await admin
            .from('newsletter_drip_sends').select('id').ilike('email', email).eq('step', stepNum).maybeSingle();
          if (existing) {
            await admin.from('newsletter_drip_sends')
              .update({ status: 'sent', sent_at: new Date().toISOString(), error: null,
                        metadata: { template: stepKey, manual_resend: true } })
              .eq('id', (existing as any).id);
          } else {
            await admin.from('newsletter_drip_sends').insert({
              email, step: stepNum, status: 'sent', sent_at: new Date().toISOString(),
              metadata: { template: stepKey, manual_resend: true },
            });
          }
        }
        return json({ ok: true, mode, email, template_key: stepKey, lang });
      } catch (e: any) {
        return json({ ok: false, error: String(e?.message || e) }, 500);
      }
    }
  }

  const stats = { processed: 0, sent: 0, skipped: 0, failed: 0 };

  try {
    // 1) Active step config
    const { data: configRows, error: cfgErr } = await admin
      .from('newsletter_drip_config')
      .select('step, day_offset, template_key, product_sku, enabled')
      .eq('enabled', true)
      .order('step', { ascending: true });
    if (cfgErr) throw cfgErr;
    const configs = configRows ?? [];
    if (!configs.length) {
      return json({ ok: true, note: 'no active drip config', stats });
    }
    const maxDayOffset = Math.max(...configs.map((c: any) => c.day_offset));
    const oldestCutoff = new Date(Date.now() - (maxDayOffset + 5) * 86400_000).toISOString();
    const newestCutoff = new Date(Date.now() - 86400_000).toISOString(); // subscribed >= 1 day ago

    // 2) Candidate subscribers
    const { data: subs, error: subsErr } = await admin
      .from('email_contacts')
      .select('email, name, language, created_at, unsubscribed, marketing_opt_in')
      .eq('source', 'newsletter_welcome')
      .gte('created_at', oldestCutoff)
      .lte('created_at', newestCutoff)
      .order('created_at', { ascending: true })
      .limit(BATCH_LIMIT);
    if (subsErr) throw subsErr;

    for (const sub of subs ?? []) {
      stats.processed++;
      const email = String(sub.email || '').trim().toLowerCase();
      if (!email) continue;

      // Opt-out / marketing off
      if (sub.unsubscribed === true) { stats.skipped++; continue; }
      if (sub.marketing_opt_in === false) { stats.skipped++; continue; }

      // Suppression list
      try {
        const { data: supp } = await admin
          .from('suppressed_emails')
          .select('email')
          .eq('email', email)
          .maybeSingle();
        if (supp) { stats.skipped++; continue; }
      } catch (_) { /* table may not exist */ }

      const subscribedAt = new Date(sub.created_at as string).getTime();
      const daysSince = Math.floor((Date.now() - subscribedAt) / 86400_000);

      // 3) Pick the highest step whose day_offset <= daysSince and not yet sent
      const eligible = configs.filter((c: any) => c.day_offset <= daysSince);
      if (!eligible.length) continue;

      // Load already-sent steps for this email
      const { data: sentRows } = await admin
        .from('newsletter_drip_sends')
        .select('step, sent_at, status, created_at')
        .ilike('email', email);
      const doneSteps = new Set((sentRows ?? []).map((r: any) => r.step));
      // Global 24h throttle: any email row within window?
      const throttleCutoff = Date.now() - DAILY_THROTTLE_HOURS * 3600_000;
      const recentlySent = (sentRows ?? []).some((r: any) => {
        const t = new Date(r.sent_at ?? r.created_at).getTime();
        return r.status === 'sent' && t >= throttleCutoff;
      });
      if (recentlySent) { stats.skipped++; continue; }

      const nextStep = eligible.find((c: any) => !doneSteps.has(c.step));
      if (!nextStep) continue;

      // 4) Abandoned cart hold — if active cart within last 72h, wait one more cycle
      try {
        const holdCutoff = new Date(Date.now() - ABANDONED_CART_HOLD_HOURS * 3600_000).toISOString();
        const { data: cart } = await admin
          .from('persistent_carts')
          .select('id, status, updated_at')
          .ilike('email', email)
          .neq('status', 'converted')
          .gte('updated_at', holdCutoff)
          .limit(1)
          .maybeSingle();
        if (cart) { stats.skipped++; continue; }
      } catch (_) { /* ignore */ }

      // 5) Product-specific: skip if already purchased
      if (nextStep.product_sku) {
        try {
          const purchased = await getPurchasedSkus(admin, email);
          if (purchased.has(String(nextStep.product_sku).toLowerCase())) {
            // Mark as skipped so we do not re-try infinitely
            await admin.from('newsletter_drip_sends').insert({
              email, step: nextStep.step, status: 'skipped', sent_at: new Date().toISOString(),
              metadata: { reason: 'already_purchased', sku: nextStep.product_sku },
            }).select().maybeSingle().catch(() => {});
            stats.skipped++;
            continue;
          }
        } catch (_) { /* ignore */ }
      }

      // 6) Atomic claim: insert pending row; unique(email, step) prevents dupes
      const { error: claimErr } = await admin
        .from('newsletter_drip_sends')
        .insert({ email, step: nextStep.step, status: 'pending', metadata: { template: nextStep.template_key } });
      if (claimErr) {
        // Likely another worker already claimed it
        stats.skipped++;
        continue;
      }

      // 7) Render + send
      const lang: DripLang = normalizeLang(sub.language);
      const name = (sub.name as string | null) || undefined;
      const { subject, html, text } = getDripCopy(nextStep.template_key as DripStepKey, lang, name || undefined);

      try {
        const res = await sendEmail({
          from: FROM, to: email, replyTo: REPLY_TO, subject, html, text, provider: 'resend',
        } as any);
        if ((res as any)?.error) throw new Error((res as any).error.message || 'send failed');

        await admin.from('newsletter_drip_sends')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('step', nextStep.step)
          .ilike('email', email);
        stats.sent++;
      } catch (e: any) {
        stats.failed++;
        await admin.from('newsletter_drip_sends')
          .update({ status: 'failed', error: String(e?.message || e).slice(0, 500), sent_at: new Date().toISOString() })
          .eq('step', nextStep.step)
          .ilike('email', email);
      }
    }

    return json({ ok: true, stats });
  } catch (e: any) {
    console.error('send-newsletter-drip error', e);
    return json({ ok: false, error: String(e?.message || e), stats }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...adminCorsHeaders, 'Content-Type': 'application/json' },
  });
}

function normalizeLang(v: unknown): DripLang {
  const s = String(v || '').toLowerCase().slice(0, 2);
  const supported: DripLang[] = ['es','en','fr','pt','de','it','nl','ja','ko','zh','ru','ar','hi','tr'];
  return (supported.includes(s as DripLang) ? s : 'es') as DripLang;
}
