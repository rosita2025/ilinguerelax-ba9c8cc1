// Drip newsletter templates — 9 steps, multi-language.
// Kept intentionally simple: same HTML skeleton, per-step + per-language copy.

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
}

// Compact per-step + per-language copy. Non-Spanish/English fall back to English.
type Bundle = Partial<Record<DripLang, Copy>>;

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
  'catalog': {
    es: {
      subject: '📚 Nuestro catálogo completo — inglés, coreano y más',
      hello: (n) => n ? `${n}, mira esto 👇` : 'Mira esto 👇',
      intro: 'Estos son nuestros productos digitales más queridos por miles de estudiantes.',
      body: '1,000 y 5,000 Palabras en Inglés · Patrones Especiales · Coreano 100 Mapas Mentales · y más.',
      ctaText: 'Explorar catálogo',
      ctaUrl: `${BASE}/products`,
      footer: `Cualquier duda: ${HELP_EMAIL}`,
    },
    en: {
      subject: '📚 Full catalog — English, Korean and more',
      hello: (n) => n ? `${n}, check this out 👇` : 'Check this out 👇',
      intro: 'These are our most-loved digital products by thousands of students.',
      body: '1,000 & 5,000 English Words · Special Patterns · Korean 100 Mind Maps · and more.',
      ctaText: 'Explore catalog',
      ctaUrl: `${BASE}/products`,
      footer: `Any questions: ${HELP_EMAIL}`,
    },
  },
  'product-1000-en': {
    es: {
      subject: '🚀 1,000 Verbos Esenciales en Inglés — presente, pasado, futuro',
      hello: (n) => n ? `Hola ${n} 👋` : 'Hola 👋',
      intro: 'Domina los 1,000 verbos más usados del inglés con pronunciación y ejemplos reales.',
      body: 'Ideal si estás empezando o quieres consolidar tu base. Compra única, acceso de por vida.',
      ctaText: 'Ver 1,000 Verbos',
      ctaUrl: `${BASE}/products/1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion`,
      footer: '¿Ya lo tienes? Descubre nuestras 5,000 Palabras.',
    },
    en: {
      subject: '🚀 1,000 Essential English Verbs — present, past, future',
      hello: (n) => n ? `Hi ${n} 👋` : 'Hi 👋',
      intro: 'Master the 1,000 most-used English verbs with pronunciation and real examples.',
      body: 'Perfect if you are starting out or want to solidify your base. One-time purchase, lifetime access.',
      ctaText: 'Get 1,000 Verbs',
      ctaUrl: `${BASE}/products/1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion`,
      footer: 'Already have it? Discover our 5,000 Words.',
    },
  },
  'product-5000-en': {
    es: {
      subject: '📘 5,000 Palabras en Inglés — vocabulario para hablar de todo',
      hello: (n) => n ? `${n}, sube tu nivel 📈` : 'Sube tu nivel 📈',
      intro: 'Con 5,000 palabras podrás entender películas, series y conversaciones reales en inglés.',
      body: 'Organizado por temas, con pronunciación y traducción bilingüe.',
      ctaText: 'Ver 5,000 Palabras',
      ctaUrl: `${BASE}/products/5000-palabras-en-ingles-relax-vocabulario-bilingue-con-pronunciacion`,
      footer: 'Método relajado, sin estrés.',
    },
    en: {
      subject: '📘 5,000 English Words — vocabulary to talk about anything',
      hello: (n) => n ? `${n}, level up 📈` : 'Level up 📈',
      intro: 'With 5,000 words you will understand movies, series and real English conversations.',
      body: 'Organized by topic, with pronunciation and bilingual translation.',
      ctaText: 'Get 5,000 Words',
      ctaUrl: `${BASE}/products/5000-palabras-en-ingles-relax-vocabulario-bilingue-con-pronunciacion`,
      footer: 'Relaxed method, no stress.',
    },
  },
  'special-offer': {
    es: {
      subject: '🎁 Oferta especial solo para ti — 15% extra por 48h',
      hello: (n) => n ? `${n}, esto es para ti 🎁` : 'Esto es para ti 🎁',
      intro: 'Como agradecimiento por seguirnos, aquí tienes un cupón adicional del 15% válido 48 horas.',
      body: 'Código: FRIEND15',
      ctaText: 'Comprar con descuento',
      ctaUrl: `${BASE}/products`,
      footer: 'Válido durante 48 horas desde ahora.',
    },
    en: {
      subject: '🎁 Special offer just for you — extra 15% for 48h',
      hello: (n) => n ? `${n}, this is for you 🎁` : 'This is for you 🎁',
      intro: 'As a thank-you, here is an extra 15% coupon valid for 48 hours.',
      body: 'Code: FRIEND15',
      ctaText: 'Shop with discount',
      ctaUrl: `${BASE}/products`,
      footer: 'Valid for 48 hours from now.',
    },
  },
  'pain-patterns': {
    es: {
      subject: '😩 ¿Sigues sin hablar inglés fluido? Esto te va a ayudar',
      hello: (n) => n ? `${n}, hablemos claro 💬` : 'Hablemos claro 💬',
      intro: 'Aprender vocabulario no basta. El inglés tiene patrones que la mayoría de escuelas no enseña.',
      body: 'Nuestro producto de Patrones Especiales te muestra letras mudas, contracciones y sufijos.',
      ctaText: 'Ver Patrones Especiales',
      ctaUrl: `${BASE}/products/patrones-especiales-en-ingles`,
      footer: 'Un cambio real en tu forma de hablar.',
    },
    en: {
      subject: '😩 Still not speaking fluent English? This will help',
      hello: (n) => n ? `${n}, let us be honest 💬` : 'Let us be honest 💬',
      intro: 'Learning vocabulary is not enough. English has patterns most schools do not teach.',
      body: 'Our Special Patterns product shows silent letters, contractions and suffixes.',
      ctaText: 'Get Special Patterns',
      ctaUrl: `${BASE}/products/patrones-especiales-en-ingles`,
      footer: 'A real shift in how you speak.',
    },
  },
  'product-coreano': {
    es: {
      subject: '🇰🇷 Aprende coreano con 100 mapas mentales',
      hello: (n) => n ? `¿Curiosidad por el coreano, ${n}?` : '¿Curiosidad por el coreano?',
      intro: '100 mapas mentales visuales para aprender coreano desde cero: hangul, familia, escuela, ropa y más.',
      body: 'Miles de estudiantes ya están aprendiendo con este método visual.',
      ctaText: 'Ver Coreano 100 Mapas',
      ctaUrl: `${BASE}/products/coreano-relax-100-mapas-mentales`,
      footer: 'Con bonos gratis de hangul y guía completa.',
    },
    en: {
      subject: '🇰🇷 Learn Korean with 100 mind maps',
      hello: (n) => n ? `Curious about Korean, ${n}?` : 'Curious about Korean?',
      intro: '100 visual mind maps to learn Korean from scratch: hangul, family, school, clothes and more.',
      body: 'Thousands of students are already learning with this visual method.',
      ctaText: 'Get Korean 100 Maps',
      ctaUrl: `${BASE}/products/coreano-relax-100-mapas-mentales`,
      footer: 'With free bonuses: hangul and full guide.',
    },
  },
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
  'vip-final': {
    es: {
      subject: '💎 Última oportunidad — cupón VIP de bienvenida',
      hello: (n) => n ? `${n}, gracias por estar aquí 💎` : 'Gracias por estar aquí 💎',
      intro: 'Después de 120 días con nosotros, queremos darte un último regalo.',
      body: 'Cupón VIP: VIP20 (20% de descuento, válido 7 días).',
      ctaText: 'Usar cupón VIP',
      ctaUrl: `${BASE}/products`,
      footer: 'Gracias por confiar en iLingue Relax.',
    },
    en: {
      subject: '💎 Last chance — VIP welcome coupon',
      hello: (n) => n ? `${n}, thanks for being here 💎` : 'Thanks for being here 💎',
      intro: 'After 120 days with us, we want to give you one last gift.',
      body: 'VIP coupon: VIP20 (20% off, valid 7 days).',
      ctaText: 'Use VIP coupon',
      ctaUrl: `${BASE}/products`,
      footer: 'Thank you for trusting iLingue Relax.',
    },
  },
};

export function getDripCopy(step: DripStepKey, lang: DripLang, name?: string): { subject: string; html: string; text: string } {
  const bundle = STEPS[step];
  // Fallback chain: lang → es → en
  const c: Copy = bundle[lang] ?? bundle.es ?? bundle.en!;
  const hello = c.hello(name);

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:'Segoe UI',Arial,sans-serif;color:#1a1a1a;">
  <div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#1e6f6f 0%,#2fa7a7 100%);padding:28px 24px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${BRAND}</h1>
    </div>
    <div style="padding:32px 28px;line-height:1.6;">
      <p style="font-size:16px;margin:0 0 12px;">${hello}</p>
      <p style="font-size:15px;color:#374151;margin:0 0 16px;">${c.intro}</p>
      <p style="font-size:15px;color:#374151;margin:0 0 24px;">${c.body}</p>
      <div style="text-align:center;margin:28px 0;">
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

  const text = `${hello}\n\n${c.intro}\n\n${c.body}\n\n${c.ctaText}: ${c.ctaUrl}\n\n${c.footer}\n\n${BRAND} · ${HELP_EMAIL}`;

  return { subject: c.subject, html, text };
}
