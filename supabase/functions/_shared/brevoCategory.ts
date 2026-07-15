// Infiere la categoría/tipo de oferta para agrupar compradores en Brevo.
// Se usa desde brevoContact.ts y brevoAbandonedCart.ts. La categoría entra
// como atributo CATEGORIA/PRODUCT_CATEGORY y también se agrega a las notas.

export type BrevoProductCategory =
  | "8000_palabras"
  | "5000_palabras"
  | "1000_verbos"
  | "coreano_mapas"
  | "patrones_ingles"
  | "pack"
  | "libro_fisico"
  | "upsell"
  | "otro";

interface InferArgs {
  productName?: string;
  sku?: string;
  skus?: string[];
  explicit?: string;
}

// Etiqueta legible por humanos para incluir en notas de Brevo.
export const CATEGORY_LABEL: Record<BrevoProductCategory, string> = {
  "8000_palabras": "8,000 palabras",
  "5000_palabras": "5,000 palabras",
  "1000_verbos": "1,000 verbos",
  "coreano_mapas": "Coreano · 100 mapas mentales",
  "patrones_ingles": "Patrones especiales inglés",
  "pack": "Pack / Bundle",
  "libro_fisico": "Libro físico",
  "upsell": "Upsell",
  "otro": "Otro",
};

export function inferProductCategory(a: InferArgs): BrevoProductCategory {
  const explicit = (a.explicit || "").toLowerCase().trim();
  if (explicit) {
    // Aceptar valores explícitos válidos
    if ((CATEGORY_LABEL as Record<string, string>)[explicit]) {
      return explicit as BrevoProductCategory;
    }
  }

  const haystack = [
    a.productName || "",
    a.sku || "",
    ...(a.skus || []),
  ]
    .join(" ")
    .toLowerCase();

  if (!haystack.trim()) return "otro";

  if (/\bpack\b|bundle|combo|kit/.test(haystack)) return "pack";
  if (/upsell|complement|extra/.test(haystack)) return "upsell";
  if (/8[.,]?000|8k\b|ocho\s?mil/.test(haystack) && /palabra/.test(haystack)) return "8000_palabras";
  if (/5[.,]?000|5k\b|cinco\s?mil/.test(haystack) && /palabra/.test(haystack)) return "5000_palabras";
  if (/1[.,]?000|mil/.test(haystack) && /verbo/.test(haystack)) return "1000_verbos";
  if (/coreano|korean|hangul|mapa/.test(haystack)) return "coreano_mapas";
  if (/patr(o|ó)n|pattern/.test(haystack) && /ingl(e|é)s|english/.test(haystack)) return "patrones_ingles";
  if (/libro|book|f(i|í)sico|paperback|tapa/.test(haystack)) return "libro_fisico";

  return "otro";
}
