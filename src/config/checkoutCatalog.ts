import type { PruebaItem } from "@/stores/checkoutStore";

export interface UpsellItem {
  id: string;
  name: string;
  price: number;
  /** Optional native PEN price for Peru display. */
  pricePen?: number;
  /** Precio original (tachado) para mostrar el ahorro. Si no se define, no se muestra descuento. */
  originalPrice?: number;
  image: string;
  description?: string;
  badge?: string;
}

export interface CatalogItem extends Omit<PruebaItem, "quantity"> {
  upsells?: UpsellItem[];
  /** Ruta de la página del producto para el enlace "Volver al producto". */
  productPath?: string;
  /** SKU real en admin/products (digital_products.sku) cuando difiere del slug del checkout. */
  adminSku?: string;
  /** Precio original (tachado) para mostrar el ahorro. */
  originalPrice?: number;
}



/**
 * Central checkout catalog — Shopify-style.
 * URL: /checkouts/:slug  →  auto-loads the matching product into the cart.
 * Optional `upsells` render as order-bumps the buyer can toggle.
 */
export const CHECKOUT_CATALOG: Record<string, CatalogItem> = {
  "patrones-ingles": {
    id: "patrones-especiales-ingles",
    name: "Patrones Especiales, Alfabeto y Combinaciones Secretas en Inglés (PDF)",
    price: 15,
    pricePen: 25,
    regionPrices: { latam: 10, global: 15, tienda: 7 },
    image: "/images/product-patrones-especiales.webp",
    description: "Guía PDF de patrones, alfabeto y combinaciones del inglés",
    productPath: "/products/patrones-especiales-alfabeto-combinaciones-secretas-ingles",
    adminSku: "patrones-especiales-alfabeto-combinaciones-secretas-ingles",


    upsells: [
      {
        id: "upsell-1000-verbos",
        name: "1,000 Verbos Esenciales en Inglés (PDF)",
        price: 5,
        originalPrice: 10,
        image: "/images/product-1000-verbos.webp",
        description: "Presente, pasado y futuro con pronunciación",
        badge: "Más vendido",
      },
      {
        id: "upsell-500-preguntas",
        name: "500 Preguntas en Inglés (PDF)",
        price: 4,
        originalPrice: 8,
        image: "/images/product-500-preguntas.webp",
        description: "Preguntas comunes con pronunciación adaptada",
        badge: "Recomendado",
      },
    ],
  },
  "1000-verbos": {
    id: "1000-verbos-ingles",
    name: "Inglés Relax · 1,000 Verbos Esenciales (Digital PDF)",
    price: 10,
    image: "/images/product-1000-verbos.webp",
    description: "1,000 verbos en presente, pasado y futuro con pronunciación",
    productPath: "/products/1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion",
    adminSku: "1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion",

    upsells: [
      {
        id: "upsell-patrones-ingles",
        name: "Patrones Especiales en Inglés (PDF)",
        price: 5,
        originalPrice: 8,
        image: "/images/product-patrones-especiales.webp",
        description: "Alfabeto + combinaciones secretas del inglés",
        badge: "Más vendido",
      },
      {
        id: "upsell-500-preguntas",
        name: "500 Preguntas en Inglés (PDF)",
        price: 4,
        originalPrice: 8,
        image: "/images/product-500-preguntas.webp",
        description: "Refuerza tu conversación diaria",
        badge: "Combo perfecto",
      },
    ],
  },
  "5000-spanish-words": {
    id: "5000-spanish-words",
    name: "Spanish Mastery System - 5,000 Spanish Words (Digital PDF)",
    price: 72.99,
    originalPrice: 97,
    regionPrices: { latam: 72.99, global: 72.99, tienda: 72.99 },
    image: "/images/product-5000-spanish.webp",
    description: "5,000 vocabulary words in Spanish with English pronunciation",
    productPath: "/products/5-000-spanish-words-with-english-pronunciation-digital",
    adminSku: "5-000-spanish-words-with-english-pronunciation-digital",
  },
  "1000-palabras-coreano": {
    id: "coreano-1000-palabras",
    name: "Coreano Sin Complicaciones · 1,000 Palabras Esenciales (PDF)",
    price: 12,
    pricePen: 28.90,
    regionPrices: { latam: 9, global: 12, tienda: 5 },
    image: "https://opyitzdvvurdyyyzkwwv.supabase.co/storage/v1/object/public/product-images/1-000-palabras-esenciales-para-aprender-coreano/1784178628839-09lsq.webp",
    description: "Domina las 1,000 palabras más importantes del coreano con Hangul y pronunciación adaptada.",
    productPath: "/products/1-000-palabras-esenciales-para-aprender-coreano",
    adminSku: "1-000-palabras-esenciales-para-aprender-coreano",
    upsells: [
      {
        id: "upsell-coreano-100-mapas",
        name: "+100 Mapas Mentales de Coreano (PDF)",
        price: 5,
        originalPrice: 15,
        image: "/images/product-coreano-100-mapas.webp",
        description: "Visualiza y memoriza más rápido con mapas temáticos",
        badge: "Recomendado",
      },
    ],
  },
  "coreano-100-mapas": {
    id: "coreano-100-mapas",
    name: "100 Mapas Mentales para Aprender Coreano (PDF)",
    price: 12,
    pricePen: 28.90,
    regionPrices: { latam: 9, global: 12, tienda: 5 },
    image: "/images/product-coreano-100-mapas.webp",
    description: "100 mapas mentales visuales para dominar el coreano.",
    productPath: "/products/100-mapas-mentales-para-aprender-coreano-hangul-c1",
    adminSku: "100-mapas-mentales-para-aprender-coreano-hangul-c1",
  },
  "500-preguntas": {
    id: "500-preguntas-ingles",
    name: "iLingue Relax · 500 Preguntas en Inglés (Digital PDF)",
    price: 9,
    pricePen: 33,
    regionPrices: { latam: 9, global: 9, tienda: 9 },
    image: "/images/product-500-preguntas.webp",
    description: "500 preguntas en inglés con pronunciación para hispanohablantes",
    productPath: "/products/spanish-relax-500-questions-in-spanish-with-english-pronunciation-guide",
    adminSku: "500-preguntas-en-ingles-con-pronunciacion-para-hispanohablantes",
  },

  "5000-palabras": {
    id: "5000-palabras-ingles",
    name: "Inglés Relax · 5,000 Palabras (Digital PDF)",
    price: 20,
    pricePen: 35,
    regionPrices: { latam: 15, global: 20, tienda: 20 },
    image: "/images/product-5000-book.webp",
    description: "5,000 palabras del inglés con pronunciación en español y fonética UK/USA",
    productPath: "/products/5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa",
    adminSku: "5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa",
  },

  "8000-palabras": {
    id: "8000-palabras-ingles",
    name: "Inglés Relax · 8,000 Palabras Esenciales (Digital PDF)",
    price: 25,
    pricePen: 45,
    regionPrices: { latam: 15, global: 25, tienda: 25 },
    image: "/images/product-8000.webp",
    description: "8,000 palabras del inglés con pronunciación en español y fonética UK/USA",
    productPath: "/products/8-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa",
    adminSku: "8-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa",
  },
  "500-questions-spanish": {
    id: "500-questions-spanish",
    name: "Spanish Relax · 500 Questions in Spanish (Digital PDF)",
    price: 12,
    pricePen: 35,
    regionPrices: { latam: 12, global: 12, tienda: 12 },
    image: "/images/product-spanish-500-questions.webp",
    description: "500 essential Spanish questions with English pronunciation",
    productPath: "/products/500-questions-in-spanish-with-english-pronunciation",
    adminSku: "500-questions-in-spanish-with-english-pronunciation",
  },
  "1000-verbs-spanish": {
    id: "1000-verbs-spanish",
    name: "Spanish Relax · 1,000 Verbs in Spanish (Digital PDF)",
    price: 12,
    pricePen: 39,
    regionPrices: { latam: 12, global: 12, tienda: 12 },
    image: "/images/product-spanish-1000-verbs.webp",
    description: "1,000 Spanish verbs (past, present, future) with English pronunciation",
    productPath: "/products/1-000-verbs-in-spanish-past-present-future-with-english-pronunciation",
    adminSku: "1-000-verbs-in-spanish-past-present-future-with-english-pronunciation",
  },
  "1000-palabras-hispano": {
    id: "1000-palabras-hispano",
    name: "Inglés Relax · 1,000 Palabras Esenciales (Digital PDF)",
    price: 6,
    pricePen: 14,
    regionPrices: { latam: 4.5, global: 6, tienda: 6 },
    image: "/placeholder.svg",
    description: "1,000 palabras del inglés con pronunciación en español para hispanohablantes",
    productPath: "/products/1-000-palabras-en-ingles-con-pronunciacion-espa-ol-con-pronunciacion-hispano",
    adminSku: "1-000-palabras-en-ingles-con-pronunciacion-espa-ol-con-pronunciacion-hispano",
  },
  "patrones-espanol": {
    id: "prueba-patrones-es",
    name: "Patrones en Español · Precio por región",
    price: 15,
    regionPrices: { latam: 10, global: 15, tienda: 7 },
    image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=200&h=200&fit=crop",
    description: "Precio ajustado por IP: LatAm $10 · Resto $15",
  },
};


// Alias de slugs legacy/cortos → SKU real registrado en /admin/products.
// Evita el error "Producto no encontrado" cuando un botón o un enlace antiguo
// usa un identificador que ya no existe en el catálogo.
export const CHECKOUT_SLUG_ALIASES: Record<string, string> = {
  spanish_5000_physical: "5-000-spanish-words-with-english-pronunciation-physical",
  spanish_5000_digital: "5-000-spanish-words-with-english-pronunciation-digital",
  spanish_grammar: "spanish-relax-structural-spanish-grammar-a1-c1-book-physical-n9ct",
  english_5000: "5-000-palabras-libro-fisico",
  english_8000: "8-000-palabras-libro-fisico",
  spanish_3000_verbs: "spanish-3000-verbs-book", // Alias for future active SKU
};

export function resolveCheckoutSlug(slug: string | undefined): string {
  const raw = String(slug ?? "").trim();
  if (!raw) return raw;
  
  // Normalizar: inglés_5000 -> inglés-5000, 5,000-palabras -> 5-000-palabras
  const normalized = raw.toLowerCase().replace(/_/g, '-');
  
  return CHECKOUT_SLUG_ALIASES[raw] ?? 
         CHECKOUT_SLUG_ALIASES[raw.toLowerCase()] ?? 
         CHECKOUT_SLUG_ALIASES[normalized] ??
         normalized;
}

export function getCatalogItem(slug: string | undefined): CatalogItem | null {
  if (!slug) return null;
  const resolved = resolveCheckoutSlug(slug);
  return CHECKOUT_CATALOG[resolved] ?? CHECKOUT_CATALOG[slug] ?? null;
}
