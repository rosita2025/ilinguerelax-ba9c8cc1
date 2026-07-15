import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { upsertBrevoContact } from '../_shared/brevoContact.ts';
import { sendEmail } from '../_shared/brevo.ts';

const FROM = 'iLingue Relax <hola@ilinguerelax.com>';
const REPLY_TO = 'hola@ilinguerelax.com';
const COUPON = 'NEW10';

type Lang = 'es' | 'en' | 'fr' | 'pt';
const SUPPORTED: Lang[] = ['es', 'en', 'fr', 'pt'];

const FALLBACK_COUNTRY_LANG: Record<string, Lang> = {
  ES: 'es', MX: 'es', AR: 'es', CL: 'es', CO: 'es', PE: 'es', VE: 'es', UY: 'es',
  BO: 'es', EC: 'es', PY: 'es', CR: 'es', PA: 'es', DO: 'es', GT: 'es', HN: 'es',
  NI: 'es', SV: 'es', CU: 'es', PR: 'es',
  US: 'en', CA: 'en', GB: 'en', AU: 'en', NZ: 'en', IE: 'en', IN: 'en', ZA: 'en',
  PH: 'en', SG: 'en',
  FR: 'fr', BE: 'fr', CH: 'fr', LU: 'fr', MC: 'fr', SN: 'fr', CI: 'fr', CM: 'fr',
  BR: 'pt', PT: 'pt', AO: 'pt', MZ: 'pt',
};

const T: Record<Lang, {
  subject: string;
  hello: (n?: string) => string;
  welcome: string;
  giftIntro: string;
  couponCta: string;
  helpLine: string;
  signoff: string;
  productsUrl: string;
}> = {
  es: {
    subject: '¡Bienvenidos a iLingue Relax! Te daré el cupón 10% de descuento 🎁',
    hello: (n) => (n ? `Hola ${n} 👋` : 'Hola 👋'),
    welcome: '¡Bienvenid@ a iLingue Relax! Gracias por suscribirte.',
    giftIntro: 'Como regalo de bienvenida, aquí tienes tu cupón del 10% de descuento en todos nuestros productos digitales:',
    couponCta: 'Úsalo al finalizar tu compra en',
    helpLine: 'Si necesitas cualquier cosa, escríbenos a',
    signoff: 'Un saludo,\nEl equipo de iLingue Relax',
    productsUrl: 'https://ilinguerelax.com/products',
  },
  en: {
    subject: 'Welcome to iLingue Relax! Here is your 10% discount coupon 🎁',
    hello: (n) => (n ? `Hi ${n} 👋` : 'Hi there 👋'),
    welcome: 'Welcome to iLingue Relax! Thanks for subscribing.',
    giftIntro: 'As a welcome gift, here is your 10% discount coupon on all our digital products:',
    couponCta: 'Use it at checkout on',
    helpLine: 'If you need anything, write to us at',
    signoff: 'Best,\nThe iLingue Relax team',
    productsUrl: 'https://ilinguerelax.com/products',
  },
  fr: {
    subject: 'Bienvenue chez iLingue Relax ! Voici votre coupon de 10 % de réduction 🎁',
    hello: (n) => (n ? `Bonjour ${n} 👋` : 'Bonjour 👋'),
    welcome: 'Bienvenue chez iLingue Relax ! Merci de vous être inscrit(e).',
    giftIntro: 'En cadeau de bienvenue, voici votre coupon de 10 % de réduction sur tous nos produits numériques :',
    couponCta: 'Utilisez-le au moment du paiement sur',
    helpLine: 'Pour toute question, écrivez-nous à',
    signoff: 'Cordialement,\nL\'équipe iLingue Relax',
    productsUrl: 'https://ilinguerelax.com/products',
  },
  pt: {
    subject: 'Bem-vindo(a) à iLingue Relax! Aqui está seu cupom de 10% de desconto 🎁',
    hello: (n) => (n ? `Olá ${n} 👋` : 'Olá 👋'),
    welcome: 'Bem-vindo(a) à iLingue Relax! Obrigado por se inscrever.',
    giftIntro: 'Como presente de boas-vindas, aqui está seu cupom de 10% de desconto em todos os nossos produtos digitais:',
    couponCta: 'Use-o ao finalizar a compra em',
    helpLine: 'Se precisar de algo, escreva para',
    signoff: 'Um abraço,\nA equipe iLingue Relax',
    productsUrl: 'https://ilinguerelax.com/products',
  },
};

function buildWelcomeEmail(lang: Lang, name?: string) {
  const t = T[lang];
  const hola = t.hello(name);
  const text = `${hola}

${t.welcome}

${t.giftIntro}

    ${COUPON}

${t.couponCta} ${t.productsUrl}

${t.helpLine} ${REPLY_TO}.

${t.signoff}`;

  const html = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color: #111; max-width: 600px;">
  <p>${hola}</p>
  <p>${t.welcome}</p>
  <p>${t.giftIntro}</p>
  <p style="font-family: monospace; font-size: 22px; padding: 12px 0;"><strong>${COUPON}</strong></p>
  <p>${t.couponCta} <a href="${t.productsUrl}">ilinguerelax.com/products</a>.</p>
  <p>${t.helpLine} <a href="mailto:${REPLY_TO}">${REPLY_TO}</a>.</p>
  <p>${t.signoff.replace(/\n/g, '<br/>')}<br/>${REPLY_TO}</p>
</div>`;

  return { subject: t.subject, text, html };
}

async function detectFromIP(ip: string): Promise<string | undefined> {
  try {
    const r = await fetch(`https://ipapi.co/${ip}/json/`, { headers: { 'user-agent': 'ilinguerelax/1.0' } });
    if (!r.ok) return undefined;
    const j = await r.json();
    return (j?.country_code || j?.country || '').toString().toUpperCase() || undefined;
  } catch { return undefined; }
}

async function resolveLang(
  supabase: ReturnType<typeof createClient>,
  bodyLang?: string,
  countryHint?: string,
  ip?: string,
): Promise<Lang> {
  const norm = (v?: string): Lang | undefined => {
    const c = (v || '').toLowerCase().slice(0, 2);
    return SUPPORTED.includes(c as Lang) ? (c as Lang) : undefined;
  };
  const explicit = norm(bodyLang);
  if (explicit) return explicit;

  let cc = (countryHint || '').toUpperCase();
  if (!cc && ip) cc = (await detectFromIP(ip)) || '';

  if (cc) {
    try {
      const { data } = await supabase
        .from('country_language_map')
        .select('language')
        .eq('country_code', cc)
        .maybeSingle();
      const dbLang = norm(data?.language as string | undefined);
      if (dbLang) return dbLang;
    } catch { /* ignore */ }
    const fb = FALLBACK_COUNTRY_LANG[cc];
    if (fb) return fb;
  }
  return 'es';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || '').trim().toLowerCase();
    const name = body?.name ? String(body.name).trim() : undefined;
    const source = body?.source ? String(body.source).slice(0, 60) : 'popup';
    const bodyLang = body?.language ? String(body.language) : undefined;
    const countryHint = body?.country ? String(body.country) : undefined;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'invalid_email' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (name && name.length > 120) {
      return new Response(JSON.stringify({ error: 'invalid_name' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim()
      || req.headers.get('cf-connecting-ip') || '';
    const lang = await resolveLang(supabase, bodyLang, countryHint, ip || undefined);

    await upsertBrevoContact({
      email,
      name,
      country: countryHint,
      productName: `newsletter:${source}`,
      provider: 'popup',
      ...({ language: lang } as Record<string, unknown>),
    } as Parameters<typeof upsertBrevoContact>[0]);

    const { subject, text, html } = buildWelcomeEmail(lang, name);
    const result = await sendEmail({
      from: FROM,
      to: email,
      replyTo: REPLY_TO,
      subject,
      html,
      text,
    } as any);
    if ((result as any)?.error) {
      console.warn('welcome email send failed', (result as any).error);
    }

    return new Response(JSON.stringify({ ok: true, lang }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('subscribe-newsletter error', e);
    return new Response(JSON.stringify({ error: 'server_error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
