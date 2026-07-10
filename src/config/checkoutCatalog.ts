import type { PruebaItem } from "@/stores/checkoutPruebaStore";

/**
 * Central checkout catalog — Shopify-style.
 * URL: /checkouts/:slug  →  auto-loads the matching product into the cart.
 *
 * Add new products by extending this map. Slugs should be short, kebab-case,
 * and stable (they appear in URLs, analytics and shared links).
 */
export const CHECKOUT_CATALOG: Record<string, Omit<PruebaItem, "quantity">> = {
  "patrones-ingles": {
    id: "patrones-especiales-ingles",
    name: "Patrones Especiales, Alfabeto y Combinaciones Secretas en Inglés (PDF)",
    price: 8, // ≈ S/29.90 PEN (Stripe/MP convierten auto)
    image: "/images/product-patrones-especiales.webp",
    description: "Guía PDF de patrones, alfabeto y combinaciones del inglés",
  },
  "1000-verbos": {
    id: "1000-verbos-ingles",
    name: "Inglés Relax · 1,000 Verbos Esenciales (Digital PDF)",
    price: 10,
    image: "/images/product-1000-verbos.webp",
    description: "1,000 verbos en presente, pasado y futuro con pronunciación",
  },
  "5000-spanish-words": {
    id: "5000-spanish-words",
    name: "5,000 Spanish Words with English Pronunciation (Digital PDF)",
    price: 22,
    image: "/images/product-5000-spanish.webp",
    description: "5,000 vocabulary words in Spanish with English pronunciation",
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

export function getCatalogItem(slug: string | undefined): Omit<PruebaItem, "quantity"> | null {
  if (!slug) return null;
  return CHECKOUT_CATALOG[slug] ?? null;
}
