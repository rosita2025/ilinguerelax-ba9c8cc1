// Drip newsletter templates — 9 steps, multi-language.
// Product-focused steps render a card grid (image + name + button, no prices)
// so subscribers see all our best products regardless of native language.

export type DripLang = 'es' | 'en' | 'fr' | 'pt' | 'de' | 'it' | 'nl' | 'ja' | 'ko' | 'zh' | 'ru' | 'ar' | 'hi' | 'tr';
export const DRIP_LANGS: DripLang[] = ['es','en','fr','pt','de','it','nl','ja','ko','zh','ru','ar','hi','tr'];

export type DripStepKey =
  | 'know-us' | 'catalog' | 'product-1000-en' | 'product-5000-en'
  | 'special-offer' | 'pain-patterns' | 'product-coreano'
  | 'testimonials' | 'vip-final';

const BASE = 'https://ilinguerelax.com';
const BRAND = 'iLingue Relax';
const HELP_EMAIL = 'hola@ilinguerelax.com';

interface Copy {
  subject: string;
  hello: (n?: string) => string;
  intro: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
  footer: string;
  showcase?: 'hispano' | 'english' | 'all'; // when set, render product cards grid
}

type Bundle = Partial<Record<DripLang, Copy>>;

// -------- Curated product cards (image + name + slug). No prices. --------
interface Card { name: string; slug: string; cover: string; }

const CARDS_HISPANO: Card[] = [
  {
    name: '5,000 Palabras en Inglés',
    slug: '5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa',
    cover: 'https://ilinguerelax.com/assets/oferta-5000-ingles-gramatica-DbJkqSMV.webp',
  },
  {
    name: '1,000 Verbos Esenciales en Inglés',
    slug: '1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion',
    cover: 'https://cdn.phototourl.com/free/2026-07-10-a588d91f-0197-46c0-9301-7e532a84faf3.webp',
  },
  {
    name: '500 Preguntas en Inglés',
    slug: '500-preguntas-en-ingles-con-pronunciacion-para-hispanohablantes',
    cover: 'https://cdn.phototourl.com/free/2026-07-10-2d0b8766-7c77-4905-9a06-f40fdce6bc90.webp',
  },
  {
    name: 'Patrones Especiales en Inglés',
    slug: 'patrones-especiales-alfabeto-combinaciones-secretas-ingles',
    cover: 'https://ilinguerelax.com/images/product-patrones-especiales.webp',
  },
  {
    name: '100 Mapas Mentales para Coreano',
    slug: '100-mapas-mentales-para-aprender-coreano-hangul-c1',
    cover: 'https://cdn.phototourl.com/free/2026-07-10-5f5094b8-a227-48c8-a17d-b580c92702af.png',
  },
];

const CARDS_ENGLISH: Card[] = [
  {
    name: '5,000 Spanish Words',
    slug: '5-000-spanish-words-with-english-pronunciation-digital',
    cover: 'https://ilinguerelax.com/assets/spanish-5000-digital-only-CmEswQ2b.webp',
  },
  {
    name: '1,000 Spanish Verbs',
    slug: '1-000-verbs-in-spanish-past-present-future-with-english-pronunciation',
    cover: 'https://cdn.phototourl.com/free/2026-07-11-6f5adb93-f1bd-4f93-ab90-23e90dd05a1c.png',
  },
  {
    name: '500 Questions in Spanish',
    slug: '500-questions-in-spanish-with-english-pronunciation',
    cover: 'https://ilinguerelax.com/images/product-spanish-500-questions.png',
  },
  {
    name: '100 Mind Maps to Learn Korean',
    slug: '100-mapas-mentales-para-aprender-coreano-hangul-c1',
    cover: 'https://cdn.phototourl.com/free/2026-07-10-5f5094b8-a227-48c8-a17d-b580c92702af.png',
  },
  {
    name: '1,000 Essential Words for Korean',
    slug: '1-000-palabras-esenciales-para-aprender-coreano',
    cover: 'https://opyitzdvvurdyyyzkwwv.supabase.co/storage/v1/object/public/product-images/1-000-palabras-esenciales-para-aprender-coreano/1784178628839-09lsq.webp',
  },
];

// Spanish-native languages get hispano cards; everyone else gets english-native cards.
const HISPANO_LANGS: DripLang[] = ['es', 'pt', 'it'];
function cardsFor(lang: DripLang): Card[] {
  return HISPANO_LANGS.includes(lang) ? CARDS_HISPANO : CARDS_ENGLISH;
}

// ---------------- Per-step + per-language copy ----------------
const STEPS: Record<DripStepKey, Bundle> = {
  'know-us': {
    es: {
      subject: 'Conoce iLingue Relax — tu método relajado para aprender idiomas 🌱',
      hello: (n) => n ? `Hola ${n} 👋` : 'Hola 👋',
      intro: 'Somos iLingue Relax, un método bilingüe para aprender idiomas sin estrés, con audio, imágenes y contexto real.',
      body: 'Explora todo lo que tenemos para ti:',
      ctaText: 'Ver todos los productos',
      ctaUrl: `${BASE}/products`,
      footer: 'Menú rápido: Home · Productos · Blog · Contacto',
    },
    en: {
      subject: 'Meet iLingue Relax — your relaxed method to learn languages 🌱',
      hello: (n) => n ? `Hi ${n} 👋` : 'Hi there 👋',
      intro: 'We are iLingue Relax, a bilingual method to learn languages without stress, with audio, images and real context.',
      body: 'Explore everything we have for you:',
      ctaText: 'See all products',
      ctaUrl: `${BASE}/products`,
      footer: 'Quick menu: Home · Products · Blog · Contact',
    },
  },

  // --- CATALOG (day 3): full grid, no prices ---
  'catalog': {
    es: {
      subject: '📚 Nuestro catálogo — descubre todos nuestros productos',
      hello: (n) => n ? `${n}, mira nuestro catálogo 👇` : 'Mira nuestro catálogo 👇',
      intro: 'Estos son los productos digitales más queridos por miles de estudiantes.',
      body: 'Elige el que más te interese — todos con acceso de por vida.',
      ctaText: 'Ver catálogo completo',
      ctaUrl: `${BASE}/products`,
      footer: `Cualquier duda: ${HELP_EMAIL}`,
      showcase: 'all',
    },
    en: {
      subject: '📚 Our catalog — discover all our products',
      hello: (n) => n ? `${n}, check our catalog 👇` : 'Check our catalog 👇',
      intro: 'These are the digital products loved by thousands of students.',
      body: 'Pick the one you love most — all include lifetime access.',
      ctaText: 'See full catalog',
      ctaUrl: `${BASE}/products`,
      footer: `Any questions: ${HELP_EMAIL}`,
      showcase: 'all',
    },
  },

  // --- DAY 7 (was product-1000-en): now a mini showcase, no prices ---
  'product-1000-en': {
    es: {
      subject: '🚀 Elige tu próximo idioma — mira nuestros productos',
      hello: (n) => n ? `Hola ${n} 👋` : 'Hola 👋',
      intro: 'Cada estudiante empieza donde quiere: vocabulario, verbos, preguntas o coreano.',
      body: 'Mira los productos y elige el que más se adapte a ti:',
      ctaText: 'Ver todos los productos',
      ctaUrl: `${BASE}/products`,
      footer: 'Acceso inmediato y de por vida.',
      showcase: 'all',
    },
    en: {
      subject: '🚀 Pick your next language — see our products',
      hello: (n) => n ? `Hi ${n} 👋` : 'Hi 👋',
      intro: 'Every learner starts somewhere: vocabulary, verbs, questions, or Korean.',
      body: 'Take a look at our products and pick the one that fits you:',
      ctaText: 'See all products',
      ctaUrl: `${BASE}/products`,
      footer: 'Instant, lifetime access.',
      showcase: 'all',
    },
  },

  // --- DAY 15 (was product-5000-en): catalog grid, generic ---
  'product-5000-en': {
    es: {
      subject: '📘 Amplía tu vocabulario — descubre nuestros productos',
      hello: (n) => n ? `${n}, mira nuestro catálogo` : 'Mira nuestro catálogo',
      intro: 'Vocabulario, verbos, preguntas, patrones y coreano — todo en un solo lugar.',
      body: 'Estos son nuestros productos más populares:',
      ctaText: 'Ver catálogo',
      ctaUrl: `${BASE}/products`,
      footer: 'Método relajado, sin estrés.',
      showcase: 'all',
    },
    en: {
      subject: '📘 Grow your vocabulary — discover our products',
      hello: (n) => n ? `${n}, check our catalog` : 'Check our catalog',
      intro: 'Vocabulary, verbs, questions, patterns and Korean — all in one place.',
      body: 'These are our most popular products:',
      ctaText: 'See catalog',
      ctaUrl: `${BASE}/products`,
      footer: 'Relaxed method, no stress.',
      showcase: 'all',
    },
  },

  // --- DAY 30 (special offer): keep coupon + show cards ---
  'special-offer': {
    es: {
      subject: '🎁 Oferta especial 15% extra — elige tu producto',
      hello: (n) => n ? `${n}, esto es para ti 🎁` : 'Esto es para ti 🎁',
      intro: 'Como agradecimiento por seguirnos, aquí tienes un cupón adicional del 15% válido 48 horas.',
      body: 'Código: FRIEND15. Aplica a cualquiera de nuestros productos:',
      ctaText: 'Comprar con descuento',
      ctaUrl: `${BASE}/products`,
      footer: 'Válido durante 48 horas.',
      showcase: 'all',
    },
    en: {
      subject: '🎁 Special 15% extra offer — pick any product',
      hello: (n) => n ? `${n}, this is for you 🎁` : 'This is for you 🎁',
      intro: 'As a thank-you, here is an extra 15% coupon valid for 48 hours.',
      body: 'Code: FRIEND15. Works on any of our products:',
      ctaText: 'Shop with discount',
      ctaUrl: `${BASE}/products`,
      footer: 'Valid for 48 hours.',
      showcase: 'all',
    },
  },

  // --- DAY 40 (pain-patterns): now catalog-focused ---
  'pain-patterns': {
    es: {
      subject: '💡 ¿Buscas resultados reales? Elige tu producto',
      hello: (n) => n ? `${n}, tenemos algo para ti 💬` : 'Tenemos algo para ti 💬',
      intro: 'Aprender un idioma no es cuestión de escuelas caras — sino de método y práctica constante.',
      body: 'Estos son los materiales que están cambiando la forma de aprender:',
      ctaText: 'Ver productos',
      ctaUrl: `${BASE}/products`,
      footer: 'Un cambio real en tu forma de aprender.',
      showcase: 'all',
    },
    en: {
      subject: '💡 Want real results? Pick your product',
      hello: (n) => n ? `${n}, we have something for you 💬` : 'We have something for you 💬',
      intro: 'Learning a language is not about expensive schools — it is about method and consistent practice.',
      body: 'These are the materials changing how students learn:',
      ctaText: 'See products',
      ctaUrl: `${BASE}/products`,
      footer: 'A real shift in how you learn.',
      showcase: 'all',
    },
  },

  // --- DAY 60 (product-coreano): catalog grid ---
  'product-coreano': {
    es: {
      subject: '🌏 Idiomas del mundo — inglés, coreano y más',
      hello: (n) => n ? `${n}, explora nuestros idiomas` : 'Explora nuestros idiomas',
      intro: 'Miles de estudiantes ya están aprendiendo con nuestro método visual y bilingüe.',
      body: 'Estos son los productos más queridos:',
      ctaText: 'Ver todos los productos',
      ctaUrl: `${BASE}/products`,
      footer: 'Con bonos gratis en cada compra.',
      showcase: 'all',
    },
    en: {
      subject: '🌏 Languages of the world — English, Korean and more',
      hello: (n) => n ? `${n}, explore our languages` : 'Explore our languages',
      intro: 'Thousands of students already learn with our visual, bilingual method.',
      body: 'These are our most-loved products:',
      ctaText: 'See all products',
      ctaUrl: `${BASE}/products`,
      footer: 'Free bonuses with every purchase.',
      showcase: 'all',
    },
  },

  // --- DAY 90 (testimonials): keep clean, no cards ---
  'testimonials': {
    es: {
      subject: '⭐ Lo que dicen nuestros estudiantes',
      hello: (n) => n ? `${n}, mira estas reseñas` : 'Mira estas reseñas',
      intro: 'Miles de estudiantes de Perú, México, Colombia, España, USA y más ya usan iLingue Relax.',
      body: 'Reseñas reales, testimonios en video y compradores verificados.',
      ctaText: 'Ver reseñas y productos',
      ctaUrl: `${BASE}/products`,
      footer: 'Únete a nuestra comunidad.',
    },
    en: {
      subject: '⭐ What our students say',
      hello: (n) => n ? `${n}, look at these reviews` : 'Look at these reviews',
      intro: 'Thousands of students from Peru, Mexico, Colombia, Spain, USA and more use iLingue Relax.',
      body: 'Real reviews, video testimonials and verified buyers.',
      ctaText: 'See reviews and products',
      ctaUrl: `${BASE}/products`,
      footer: 'Join our community.',
    },
  },

  // --- DAY 120 (vip-final): VIP coupon + cards ---
  'vip-final': {
    es: {
      subject: '💎 Cupón VIP de bienvenida — elige tu producto',
      hello: (n) => n ? `${n}, gracias por estar aquí 💎` : 'Gracias por estar aquí 💎',
      intro: 'Después de estos meses con nosotros, queremos darte un último regalo.',
      body: 'Cupón VIP: VIP20 (20% de descuento, válido 7 días). Elige el producto que quieras:',
      ctaText: 'Usar cupón VIP',
      ctaUrl: `${BASE}/products`,
      footer: 'Gracias por confiar en iLingue Relax.',
      showcase: 'all',
    },
    en: {
      subject: '💎 VIP welcome coupon — pick your product',
      hello: (n) => n ? `${n}, thanks for being here 💎` : 'Thanks for being here 💎',
      intro: 'After these months with us, we want to give you one last gift.',
      body: 'VIP coupon: VIP20 (20% off, valid 7 days). Choose any product:',
      ctaText: 'Use VIP coupon',
      ctaUrl: `${BASE}/products`,
      footer: 'Thank you for trusting iLingue Relax.',
      showcase: 'all',
    },
  },
};

// ---------------- Rendering ----------------
function renderCards(lang: DripLang): string {
  const cards = cardsFor(lang);
  const label = HISPANO_LANGS.includes(lang) ? 'Ver producto' : 'View product';
  const rows: string[] = [];
  for (let i = 0; i < cards.length; i += 2) {
    const pair = cards.slice(i, i + 2)
      .map((c) => `
      <td style="width:50%;padding:6px;vertical-align:top;">
        <div style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;background:#ffffff;">
          <a href="${BASE}/products/${c.slug}" style="text-decoration:none;color:inherit;display:block;">
            <img src="${c.cover}" alt="${c.name.replace(/"/g,'&quot;')}" style="display:block;width:100%;height:150px;object-fit:cover;" />
            <div style="padding:12px 14px;">
              <p style="margin:0 0 10px;font-size:14px;font-weight:600;color:#1a1a1a;line-height:1.35;min-height:38px;">${c.name}</p>
              <div style="text-align:center;">
                <span style="display:inline-block;background:#000000;color:#ffffff;padding:8px 18px;border-radius:999px;font-size:13px;font-weight:600;letter-spacing:0.02em;">${label}</span>
              </div>
            </div>
          </a>
        </div>
      </td>`).join('');
    const filler = cards.slice(i, i + 2).length < 2 ? '<td style="width:50%;padding:6px;"></td>' : '';
    rows.push(`<tr>${pair}${filler}</tr>`);
  }
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:20px 0;">${rows.join('')}</table>`;
}

export function getDripCopy(step: DripStepKey, lang: DripLang, name?: string): { subject: string; html: string; text: string } {
  const bundle = STEPS[step];
  const c: Copy = bundle[lang] ?? bundle.es ?? bundle.en!;
  const hello = c.hello(name);
  const cardsHtml = c.showcase ? renderCards(lang) : '';

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:'Segoe UI',Arial,sans-serif;color:#1a1a1a;">
  <div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#1e6f6f 0%,#2fa7a7 100%);padding:28px 24px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${BRAND}</h1>
    </div>
    <div style="padding:32px 28px;line-height:1.6;">
      <p style="font-size:16px;margin:0 0 12px;">${hello}</p>
      <p style="font-size:15px;color:#374151;margin:0 0 16px;">${c.intro}</p>
      <p style="font-size:15px;color:#374151;margin:0 0 8px;">${c.body}</p>
      ${cardsHtml}
      <div style="text-align:center;margin:24px 0;">
        <a href="${c.ctaUrl}" style="display:inline-block;background:#e85d3c;color:#ffffff;text-decoration:none;padding:14px 34px;border-radius:50px;font-weight:600;font-size:15px;">${c.ctaText}</a>
      </div>
      <div style="border-top:1px solid #e5e7eb;margin-top:24px;padding-top:16px;text-align:center;">
        <p style="font-size:13px;color:#6b7280;margin:0 0 8px;">${c.footer}</p>
        <p style="font-size:12px;color:#9ca3af;margin:8px 0 0;">
          <a href="${BASE}" style="color:#1e6f6f;text-decoration:none;">Home</a> ·
          <a href="${BASE}/products" style="color:#1e6f6f;text-decoration:none;">Productos</a> ·
          <a href="${BASE}/blog" style="color:#1e6f6f;text-decoration:none;">Blog</a> ·
          <a href="${BASE}/contact" style="color:#1e6f6f;text-decoration:none;">Contacto</a>
        </p>
        <p style="font-size:11px;color:#9ca3af;margin:12px 0 0;">
          ${BRAND} · <a href="mailto:${HELP_EMAIL}" style="color:#9ca3af;">${HELP_EMAIL}</a><br>
          <a href="${BASE}/unsubscribe" style="color:#9ca3af;">Darse de baja</a>
        </p>
      </div>
    </div>
  </div>
</body></html>`;

  const cardsText = c.showcase
    ? '\n\n' + cardsFor(lang).map((cd) => `- ${cd.name}: ${BASE}/products/${cd.slug}`).join('\n')
    : '';
  const text = `${hello}\n\n${c.intro}\n\n${c.body}${cardsText}\n\n${c.ctaText}: ${c.ctaUrl}\n\n${c.footer}\n\n${BRAND} · ${HELP_EMAIL}`;

  return { subject: c.subject, html, text };
}
