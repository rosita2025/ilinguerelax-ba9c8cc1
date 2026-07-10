import type { PruebaItem } from "@/stores/checkoutPruebaStore";

export interface UpsellItem {
  id: string;
  name: string;
  price: number;
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
    price: 8,
    image: "/images/product-patrones-especiales.webp",
    description: "Guía PDF de patrones, alfabeto y combinaciones del inglés",
    productPath: "/products/patrones-especiales-alfabeto-combinaciones-secretas-ingles",

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
    name: "5,000 Spanish Words with English Pronunciation (Digital PDF)",
    price: 22,
    image: "/images/product-5000-spanish.webp",
    description: "5,000 vocabulary words in Spanish with English pronunciation",
    productPath: "/products/5-000-spanish-words-with-english-pronunciation",
  },
  "patrones-espanol": {
    id: "prueba-patrones-es",
    name: "Patrones en Español · Precio por región",
    price: 15,
    regionPrices: { latam: 10, global: 15 },
    image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=200&h=200&fit=crop",
    description: "Precio ajustado por IP: LatAm $10 · Resto $15",
  },
};

export function getCatalogItem(slug: string | undefined): CatalogItem | null {
  if (!slug) return null;
  return CHECKOUT_CATALOG[slug] ?? null;
}
