export type LangCode = "es" | "en" | "fr" | "pt" | "ko" | "de" | "it" | "ja" | "nl" | "zh";

export interface Product {
  id: string;
  slug: string;
  name: string;
  flag: string;
  country: string;
  image: string;
  title: string;
  subtitle: string;
  description: string;
  rating: number;
  reviews: number;
  price: number;
  originalPrice: number | null;
  discount: number | null;
  badge: string;
  features: string[];
  isPhysical: boolean;
  comingSoon?: boolean;
  externalUrl?: string;
  /** Optional group key — products sharing the same groupId render in a single card with Digital + Physical options. */
  groupId?: string;
  /** Optional explicit format tags shown on product cards. Defaults to ['physical'] or ['digital'] based on isPhysical. */
  formats?: ('digital' | 'physical')[];
  /** Idioma nativo del comprador objetivo (para filtro "Hablo"). */
  learnerLanguage?: LangCode;
  /** Idioma que enseña el producto (para filtro "Quiero aprender"). */
  targetLanguage?: LangCode;
  active?: boolean;
}

export const products: Product[] = [
  {
    id: "coreano-relax",
    slug: "100-mapas-mentales-para-aprender-coreano-hangul-c1",
    name: "Coreano Relax",
    flag: "🇰🇷",
    country: "Coreano para Hispanohablantes",
    image: "/__l5e/assets-v1/bffb011a-f4ef-4850-92c0-682061849269/coreano-100-mapas-cover.webp",
    title: "Coreano Sin Complicaciones · +100 Mapas Mentales Visuales",
    subtitle: "Aprende coreano de forma fácil, visual y efectiva",
    description: "+100 mapas mentales con Hangul, romanización y pronunciación para hispanohablantes. Conecta el idioma con K-dramas, K-pop y cultura coreana. Incluye 2 bonos.",
    rating: 5.0,
    reviews: 0,
    price: 10.00,
    originalPrice: 54.00,
    discount: 81,
    badge: "🇰🇷 Nuevo Lanzamiento",
    features: ["+100 mapas mentales", "Hangul desde cero", "Pronunciación hispanohablante", "2 bonos incluidos"],
    isPhysical: false,
    comingSoon: false,
  },
  {
    id: "patrones-especiales",
    slug: "patrones-especiales-alfabeto-combinaciones-secretas-ingles",
    name: "Patrones Especiales",
    flag: "🇬🇧",
    country: "Inglés para Hispanohablantes",
    image: "/images/product-patrones-especiales.webp",
    title: "Patrones Especiales, Alfabeto y Combinaciones Secretas en Inglés",
    subtitle: "Ingles Relax by iLingue Relax",
    description: "Aprende patrones especiales, el alfabeto y combinaciones secretas en inglés con pronunciación clara y práctica.",
    rating: 4.9,
    reviews: 0,
    price: 10.00,
    originalPrice: 19.99,
    discount: 50,
    badge: "🆕 Nuevo",
    features: ["Patrones especiales", "Alfabeto completo", "Combinaciones secretas", "Pronunciación clara"],
    isPhysical: false,
    externalUrl: "https://pay.hotmart.com/Q105880946X",
  },
  {
    id: "5000",
    slug: "5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa",
    name: "5,000 Palabras",
    flag: "🇬🇧",
    country: "Inglés UK / USA",
    image: "/images/product-5000.webp",
    title: "Inglés Relax - 5,000 Palabras Digital",
    subtitle: "Nivel Básico a Intermedio",
    description: "Vocabulario esencial con pronunciación",
    rating: 4.8,
    reviews: 1247,
    price: 14.30,
    originalPrice: 54.00,
    discount: 74,
    badge: "Más Vendido",
    features: ["5,000 palabras", "4 Bonus gratis", "Acceso de por vida"],
    isPhysical: false,
    groupId: "ingles-5000",
  },
  {
    id: "8000",
    slug: "8-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa",
    name: "8,000 Palabras",
    flag: "🇬🇧",
    country: "Inglés UK / USA",
    image: "/images/product-8000.webp",
    title: "Inglés Relax - 8,000 Palabras Digital",
    subtitle: "Libro Digital Completo",
    description: "Vocabulario completo + gramática",
    rating: 4.9,
    reviews: 892,
    price: 20.00,
    originalPrice: 54.00,
    discount: 63,
    badge: "Premium",
    features: ["8,000 palabras", "Pronunciación español", "Fonética UK/USA"],
    isPhysical: false,
    groupId: "ingles-8000",
  },
  {
    id: "5000-book",
    slug: "5-000-palabras-libro-fisico",
    name: "5,000 Palabras Libro",
    flag: "🇬🇧",
    country: "Inglés UK / USA",
    image: "/images/product-5000-book-hero.webp",
    title: "Inglés Relax - 5,000 Palabras",
    subtitle: "Libro Físico Tapa Blanda",
    description: "📖 Libro físico + 📱 Digital GRATIS",
    rating: 0,
    reviews: 0,
    price: 24.00,
    originalPrice: null,
    discount: null,
    badge: "📖 Libro Físico",
    features: ["Tapa blanda", "250-300 páginas", "Incluye PDF"],
    isPhysical: true,
    groupId: "ingles-5000",
  },
  {
    id: "8000-book",
    slug: "8-000-palabras-libro-fisico",
    name: "8,000 Palabras Libro",
    flag: "🇬🇧",
    country: "Inglés UK / USA",
    image: "/images/8000-book-fisico-digital.webp",
    title: "Inglés Relax - 8,000 Palabras",
    subtitle: "Libro Físico Tapa Blanda",
    description: "📖 Libro físico + 📱 Digital GRATIS",
    rating: 0,
    reviews: 0,
    price: 34.99,
    originalPrice: null,
    discount: null,
    badge: "📖 Libro Físico",
    features: ["Tapa blanda", "300-350 páginas", "Incluye PDF"],
    isPhysical: true,
    groupId: "ingles-8000",
  },
  {
    id: "spanish-5000",
    slug: "5-000-spanish-words-with-english-pronunciation-physical",
    name: "5,000 Words",
    flag: "🇪🇸",
    country: "Spanish for English Speakers",
    image: "/images/product-spanish-5000-physical.webp",
    title: "Spanish Relax - 5,000 Words",
    subtitle: "Spanish for English Speakers",
    description: "With English Pronunciation",
    rating: 4.8,
    reviews: 500,
    price: 34.99,
    originalPrice: 54.00,
    discount: 48,
    badge: "🆕 New",
    features: ["5,000 words", "English pronunciation", "For English speakers"],
    isPhysical: false,
    formats: ['digital', 'physical'],
  },
  {
    id: "spanish-5000-digital",
    slug: "5-000-spanish-words-with-english-pronunciation-digital",
    name: "5,000 Words (Digital)",
    flag: "🇪🇸",
    country: "Spanish for English Speakers",
    image: "/images/product-spanish-5000.webp",
    title: "Spanish Relax - 5,000 Words (Digital PDF)",
    subtitle: "Digital PDF · Instant download",
    description: "With English Pronunciation",
    rating: 4.8,
    reviews: 500,
    price: 22.00,
    originalPrice: 35.00,
    discount: 37,
    badge: "📥 Digital",
    features: ["Instant PDF", "5,000 words", "English pronunciation", "3 free bonuses"],
    isPhysical: false,
    formats: ['digital'],
  },
  {
    id: "spanish-1000-verbs",
    slug: "1-000-verbs-in-spanish-past-present-future-with-english-pronunciation",
    name: "1,000 Verbs",
    flag: "🇪🇸",
    country: "Spanish for English Speakers",
    image: "/images/product-spanish-1000-verbs.webp",
    title: "Spanish Relax - 1,000 Verbs in Spanish",
    subtitle: "Past, Present and Future with English Pronunciation",
    description: "Master the 1,000 most-used Spanish verbs with English pronunciation",
    rating: 4.8,
    reviews: 0,
    price: 12.00,
    originalPrice: 54.00,
    discount: 78,
    badge: "🆕 New",
    features: ["1,000 essential verbs", "Past, present & future", "English pronunciation"],
    isPhysical: false,
  },
  {
    id: "spanish-500-questions",
    slug: "500-questions-in-spanish-with-english-pronunciation",
    name: "500 Questions",
    flag: "🇪🇸",
    country: "Spanish for English Speakers",
    image: "/images/product-spanish-500-questions.webp",
    title: "Spanish Relax - 500 Questions in Spanish",
    subtitle: "With English Pronunciation Guide",
    description: "Your essential guide to mastering questions in Spanish",
    rating: 4.8,
    reviews: 0,
    price: 12.00,
    originalPrice: 40.00,
    discount: 70,
    badge: "🆕 New",
    features: ["500 practical questions", "English pronunciation", "Real-life situations"],
    isPhysical: false,
  },
  {
    id: "1000-verbos",
    slug: "1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion",
    name: "1,000 Verbos",
    flag: "🇬🇧",
    country: "Inglés para Hispanohablantes",
    image: "/images/product-1000-verbos.webp",
    title: "Inglés Relax - 1,000 Verbos Esenciales",
    subtitle: "Presente, Pasado y Futuro con Pronunciación",
    description: "Verbos esenciales con pronunciación para hispanohablantes",
    rating: 4.8,
    reviews: 350,
    price: 10.00,
    originalPrice: 54.00,
    discount: 81,
    badge: "🆕 Nuevo",
    features: ["1,000 verbos esenciales", "Presente, pasado y futuro", "Pronunciación hispanohablante"],
    isPhysical: false,
  },
  {
    id: "500-preguntas",
    slug: "500-preguntas-en-ingles-con-pronunciacion-para-hispanohablantes",
    name: "500 Preguntas",
    flag: "🇬🇧",
    country: "Inglés para Hispanohablantes",
    image: "/images/product-500-preguntas.webp",
    title: "Inglés Relax - 500 Preguntas en Inglés",
    subtitle: "Con Pronunciación para Hispanohablantes",
    description: "Habla sin miedo en situaciones reales",
    rating: 4.7,
    reviews: 280,
    price: 10.00,
    originalPrice: 54.00,
    discount: 81,
    badge: "🆕 Nuevo",
    features: ["500 preguntas prácticas", "Pronunciación adaptada", "Situaciones reales"],
    isPhysical: false,
  },
];

// Attach learner/target language metadata. Keeps the product blocks above untouched
// while enabling the "Hablo → Quiero aprender" filter on /products.
const LEARNER_TARGET: Record<string, [LangCode, LangCode]> = {
  "coreano-relax": ["es", "ko"],
  "patrones-especiales": ["es", "en"],
  "5000": ["es", "en"],
  "8000": ["es", "en"],
  "5000-book": ["es", "en"],
  "8000-book": ["es", "en"],
  "spanish-5000": ["en", "es"],
  "spanish-5000-digital": ["en", "es"],
  "spanish-1000-verbs": ["en", "es"],
  "spanish-500-questions": ["en", "es"],
  "1000-verbos": ["es", "en"],
  "500-preguntas": ["es", "en"],
};
for (const p of products) {
  const lt = LEARNER_TARGET[p.id];
  if (lt) {
    p.learnerLanguage = lt[0];
    p.targetLanguage = lt[1];
  }
}

export const comingSoonLanguages = [
  { name: "Japonés", flag: "🇯🇵" },
  { name: "Chino", flag: "🇨🇳" },
  { name: "Ruso", flag: "🇷🇺" },
  { name: "Árabe", flag: "🇸🇦" },
  { name: "Hindi", flag: "🇮🇳" },
];


// Helper to get product link
export const getProductLink = (product: Product) => {
  // Internal path override (e.g. products from the admin panel routed to /checkouts/:sku)
  if (product.externalUrl && product.externalUrl.startsWith("/")) return product.externalUrl;
  return `/products/${product.slug}`;
};

// Helper to get product by slug
export const getProductBySlug = (slug: string) => products.find(p => p.slug === slug);

// Helper to get product by id
export const getProductById = (id: string) => products.find(p => p.id === id);
