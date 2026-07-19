import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { upsertBrevoContact } from '../_shared/brevoContact.ts';
import { sendEmail } from '../_shared/brevo.ts';

const FROM = 'iLingue Relax <hola@ilinguerelax.com>';
const REPLY_TO = 'hola@ilinguerelax.com';
const COUPON = 'NEW10';

type Lang = 'es' | 'en' | 'fr' | 'pt' | 'de' | 'it' | 'nl' | 'ja' | 'ko' | 'zh' | 'ru' | 'ar' | 'hi' | 'tr';
const SUPPORTED: Lang[] = ['es','en','fr','pt','de','it','nl','ja','ko','zh','ru','ar','hi','tr'];

const FALLBACK_COUNTRY_LANG: Record<string, Lang> = {
  // Spanish
  ES: 'es', MX: 'es', AR: 'es', CL: 'es', CO: 'es', PE: 'es', VE: 'es', UY: 'es',
  BO: 'es', EC: 'es', PY: 'es', CR: 'es', PA: 'es', DO: 'es', GT: 'es', HN: 'es',
  NI: 'es', SV: 'es', CU: 'es', PR: 'es',
  // English
  US: 'en', CA: 'en', GB: 'en', AU: 'en', NZ: 'en', IE: 'en', ZA: 'en', PH: 'en', SG: 'en',
  // French
  FR: 'fr', BE: 'fr', LU: 'fr', MC: 'fr', SN: 'fr', CI: 'fr', CM: 'fr',
  // Portuguese
  BR: 'pt', PT: 'pt', AO: 'pt', MZ: 'pt',
  // German
  DE: 'de', AT: 'de', CH: 'de', LI: 'de',
  // Italian
  IT: 'it', SM: 'it', VA: 'it',
  // Dutch
  NL: 'nl',
  // Japanese
  JP: 'ja',
  // Korean
  KR: 'ko',
  // Chinese
  CN: 'zh', TW: 'zh', HK: 'zh', MO: 'zh',
  // Russian
  RU: 'ru', BY: 'ru', KZ: 'ru', KG: 'ru',
  // Arabic
  SA: 'ar', AE: 'ar', EG: 'ar', MA: 'ar', DZ: 'ar', TN: 'ar', QA: 'ar', KW: 'ar',
  BH: 'ar', OM: 'ar', JO: 'ar', LB: 'ar', IQ: 'ar', LY: 'ar', SY: 'ar', YE: 'ar', SD: 'ar',
  // Hindi
  IN: 'hi',
  // Turkish
  TR: 'tr',
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
  de: {
    subject: 'Willkommen bei iLingue Relax! Hier ist Ihr 10% Rabatt-Gutschein 🎁',
    hello: (n) => (n ? `Hallo ${n} 👋` : 'Hallo 👋'),
    welcome: 'Willkommen bei iLingue Relax! Danke für Ihre Anmeldung.',
    giftIntro: 'Als Willkommensgeschenk erhalten Sie 10% Rabatt auf alle unsere digitalen Produkte:',
    couponCta: 'Verwenden Sie ihn beim Bezahlen auf',
    helpLine: 'Bei Fragen schreiben Sie uns an',
    signoff: 'Herzliche Grüße,\nIhr iLingue Relax Team',
    productsUrl: 'https://ilinguerelax.com/products',
  },
  it: {
    subject: 'Benvenuto in iLingue Relax! Ecco il tuo coupon del 10% di sconto 🎁',
    hello: (n) => (n ? `Ciao ${n} 👋` : 'Ciao 👋'),
    welcome: 'Benvenuto in iLingue Relax! Grazie per esserti iscritto.',
    giftIntro: 'Come regalo di benvenuto, ecco il tuo coupon del 10% di sconto su tutti i nostri prodotti digitali:',
    couponCta: 'Usalo al checkout su',
    helpLine: 'Per qualsiasi cosa, scrivici a',
    signoff: 'Cordiali saluti,\nIl team di iLingue Relax',
    productsUrl: 'https://ilinguerelax.com/products',
  },
  nl: {
    subject: 'Welkom bij iLingue Relax! Hier is je 10% kortingsbon 🎁',
    hello: (n) => (n ? `Hallo ${n} 👋` : 'Hallo 👋'),
    welcome: 'Welkom bij iLingue Relax! Bedankt voor je inschrijving.',
    giftIntro: 'Als welkomstcadeau ontvang je 10% korting op al onze digitale producten:',
    couponCta: 'Gebruik hem bij het afrekenen op',
    helpLine: 'Voor vragen kun je ons mailen op',
    signoff: 'Vriendelijke groet,\nHet iLingue Relax team',
    productsUrl: 'https://ilinguerelax.com/products',
  },
  ja: {
    subject: 'iLingue Relaxへようこそ！10%割引クーポンをお届けします 🎁',
    hello: (n) => (n ? `${n} さん、こんにちは 👋` : 'こんにちは 👋'),
    welcome: 'iLingue Relaxへようこそ！ご登録ありがとうございます。',
    giftIntro: 'ご登録の特典として、すべてのデジタル商品でご利用いただける10%割引クーポンをプレゼントします：',
    couponCta: 'こちらでご購入時にご利用ください：',
    helpLine: 'ご不明な点がございましたら、お気軽にご連絡ください：',
    signoff: 'よろしくお願いいたします。\niLingue Relax チーム',
    productsUrl: 'https://ilinguerelax.com/products',
  },
  ko: {
    subject: 'iLingue Relax에 오신 것을 환영합니다! 10% 할인 쿠폰을 드립니다 🎁',
    hello: (n) => (n ? `${n}님, 안녕하세요 👋` : '안녕하세요 👋'),
    welcome: 'iLingue Relax에 오신 것을 환영합니다! 구독해 주셔서 감사합니다.',
    giftIntro: '환영 선물로 모든 디지털 상품에 사용 가능한 10% 할인 쿠폰을 드립니다:',
    couponCta: '결제 시 사용하세요:',
    helpLine: '문의사항이 있으시면 아래로 연락 주세요:',
    signoff: '감사합니다,\niLingue Relax 팀',
    productsUrl: 'https://ilinguerelax.com/products',
  },
  zh: {
    subject: '欢迎来到 iLingue Relax！这是您的 10% 折扣券 🎁',
    hello: (n) => (n ? `${n} 您好 👋` : '您好 👋'),
    welcome: '欢迎来到 iLingue Relax！感谢您的订阅。',
    giftIntro: '作为欢迎礼物，这是您所有数字产品的 10% 折扣券：',
    couponCta: '结账时使用：',
    helpLine: '如有任何问题，请联系：',
    signoff: '此致敬礼,\niLingue Relax 团队',
    productsUrl: 'https://ilinguerelax.com/products',
  },
  ru: {
    subject: 'Добро пожаловать в iLingue Relax! Ваш купон на скидку 10% 🎁',
    hello: (n) => (n ? `Здравствуйте, ${n} 👋` : 'Здравствуйте 👋'),
    welcome: 'Добро пожаловать в iLingue Relax! Спасибо за подписку.',
    giftIntro: 'В качестве приветственного подарка вот ваш купон на скидку 10% на все наши цифровые продукты:',
    couponCta: 'Используйте его при оформлении заказа на',
    helpLine: 'Если вам что-то нужно, напишите нам на',
    signoff: 'С уважением,\nКоманда iLingue Relax',
    productsUrl: 'https://ilinguerelax.com/products',
  },
  ar: {
    subject: 'مرحبًا بكم في iLingue Relax! إليك قسيمة خصم 10٪ 🎁',
    hello: (n) => (n ? `مرحبًا ${n} 👋` : 'مرحبًا 👋'),
    welcome: 'مرحبًا بكم في iLingue Relax! شكرًا لاشتراكك.',
    giftIntro: 'كهدية ترحيبية، إليك قسيمة خصم 10٪ على جميع منتجاتنا الرقمية:',
    couponCta: 'استخدمها عند الدفع على',
    helpLine: 'إذا احتجت أي شيء، راسلنا على',
    signoff: 'مع أطيب التحيات،\nفريق iLingue Relax',
    productsUrl: 'https://ilinguerelax.com/products',
  },
  hi: {
    subject: 'iLingue Relax में आपका स्वागत है! यह रहा आपका 10% छूट कूपन 🎁',
    hello: (n) => (n ? `नमस्ते ${n} 👋` : 'नमस्ते 👋'),
    welcome: 'iLingue Relax में आपका स्वागत है! सदस्यता लेने के लिए धन्यवाद।',
    giftIntro: 'स्वागत उपहार के रूप में, हमारे सभी डिजिटल उत्पादों पर आपका 10% छूट कूपन:',
    couponCta: 'चेकआउट पर इसका उपयोग करें:',
    helpLine: 'किसी भी सहायता के लिए हमें लिखें:',
    signoff: 'सादर,\niLingue Relax टीम',
    productsUrl: 'https://ilinguerelax.com/products',
  },
  tr: {
    subject: 'iLingue Relax\'e hoş geldiniz! İşte %10 indirim kuponunuz 🎁',
    hello: (n) => (n ? `Merhaba ${n} 👋` : 'Merhaba 👋'),
    welcome: 'iLingue Relax\'e hoş geldiniz! Abone olduğunuz için teşekkürler.',
    giftIntro: 'Hoş geldin hediyesi olarak, tüm dijital ürünlerimizde geçerli %10 indirim kuponunuz:',
    couponCta: 'Ödeme sırasında kullanın:',
    helpLine: 'Herhangi bir şeye ihtiyacınız olursa bize yazın:',
    signoff: 'Saygılarımızla,\niLingue Relax ekibi',
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

  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const html = `<div dir="${dir}" style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color: #111; max-width: 600px;">

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

    // Dedupe welcome email: only send once per email address, ever.
    // Uses email_contacts with source='newsletter_welcome' (unique on lower(email)+source).
    let alreadyWelcomed = false;
    try {
      const { error: insErr } = await supabase
        .from('email_contacts')
        .insert({
          email,
          name: name || null,
          source: 'newsletter_welcome',
          language: lang,
          metadata: { coupon: COUPON, origin: source },
        });
      if (insErr) {
        // 23505 = unique violation → already sent before
        if ((insErr as any).code === '23505' || /duplicate|unique/i.test(insErr.message || '')) {
          alreadyWelcomed = true;
        } else {
          console.warn('welcome dedupe insert warn', insErr);
        }
      }
    } catch (e) {
      console.warn('welcome dedupe check failed', e);
    }

    if (!alreadyWelcomed) {
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
    } else {
      console.log('welcome email skipped (already sent):', email);
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
