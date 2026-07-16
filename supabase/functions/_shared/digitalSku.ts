// Canonical digital-product SKU helpers shared by payment webhooks and delivery.
// Checkout/cart IDs are user-facing aliases; `digital_products.sku` stores the
// real admin SKU used to resolve Drive links and bonuses.

// Keep in sync with src/config/checkoutCatalog.ts — each cart/catalog id must
// map to a real `digital_products.sku`. A missing alias silently breaks the
// automatic digital delivery for that product across ALL payment methods
// (Stripe, PayPal, Mercado Pago, Yape/Plin), because send-digital-ilinguerelax
// returns 404 "no products found" when the SKU doesn't exist.
const SKU_ALIASES: Record<string, string> = {
  // Patrones Especiales (inglés)
  "patrones-especiales-ingles": "patrones-especiales-alfabeto-combinaciones-secretas-ingles",
  "upsell-patrones-ingles": "patrones-especiales-alfabeto-combinaciones-secretas-ingles",
  "prueba-patrones-es": "patrones-especiales-alfabeto-combinaciones-secretas-ingles",

  // 1.000 Verbos
  "1000-verbos-ingles": "1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion",
  "upsell-1000-verbos": "1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion",

  // 500 Preguntas
  "500-preguntas-ingles": "500-preguntas-en-ingles-con-pronunciacion-para-hispanohablantes",
  "upsell-500-preguntas": "500-preguntas-en-ingles-con-pronunciacion-para-hispanohablantes",

  // 5.000 palabras (español + inglés)
  "5000-spanish-words": "5-000-spanish-words-with-english-pronunciation-digital",
  "5000-palabras-ingles": "5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa",

  // 8.000 palabras
  "8000-palabras-ingles": "8-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa",

  // 100 mapas mentales coreano
  "coreano-100-mapas": "100-mapas-mentales-para-aprender-coreano-hangul-c1",
  "100-mapas-coreano": "100-mapas-mentales-para-aprender-coreano-hangul-c1",

  // 1,000 palabras esenciales coreano (Hangul)
  "1000-palabras-coreano": "1-000-palabras-esenciales-para-aprender-coreano",
  "coreano-1000-palabras": "1-000-palabras-esenciales-para-aprender-coreano",
  "palabras-coreano": "1-000-palabras-esenciales-para-aprender-coreano",

  // Versión en español (para angloparlantes)
  "500-questions-spanish": "500-questions-in-spanish-with-english-pronunciation",
  "1000-verbs-spanish": "1-000-verbs-in-spanish-past-present-future-with-english-pronunciation",
  "1000-palabras-hispano": "1-000-palabras-en-ingles-con-pronunciacion-espa-ol-con-pronunciacion-hispano",
};

export function normalizeSku(sku: string | null | undefined): string | null {
  const raw = String(sku || "").trim();
  if (!raw) return null;
  return SKU_ALIASES[raw] || raw;
}

export function normalizeSkus(values: Array<string | null | undefined>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const normalized = normalizeSku(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

export function splitSkuList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v));
  if (typeof value !== "string") return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}