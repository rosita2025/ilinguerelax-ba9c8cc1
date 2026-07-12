// Canonical digital-product SKU helpers shared by payment webhooks and delivery.
// Checkout/cart IDs are user-facing aliases; `digital_products.sku` stores the
// real admin SKU used to resolve Drive links and bonuses.

const SKU_ALIASES: Record<string, string> = {
  "patrones-especiales-ingles": "patrones-especiales",
  "upsell-patrones-ingles": "patrones-especiales",
  "prueba-patrones-es": "patrones-especiales",

  "1000-verbos-ingles": "1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion",
  "upsell-1000-verbos": "1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion",

  "500-preguntas-ingles": "500-preguntas-en-ingles-con-pronunciacion-para-hispanohablantes",
  "upsell-500-preguntas": "500-preguntas-en-ingles-con-pronunciacion-para-hispanohablantes",

  "5000-spanish-words": "5-000-spanish-words-with-english-pronunciation-digital",
  "100-mapas-coreano": "100-mapas-mentales-para-aprender-coreano-hangul-c1",
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