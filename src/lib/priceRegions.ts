import { REGIONS } from "@/lib/countryRegions";

/**
 * Regiones de precio (UNA sola regla para el navegador y el servidor).
 *
 * Copia espejo en `supabase/functions/_shared/priceRegions.ts`: si cambias una lista, cámbiala en los dos archivos
 * (el test `src/test/price-regions.test.ts` compara que den el mismo resultado para todos los países).
 *
 * Qué precio USD usa cada región (si el campo del producto está vacío, se usa el precio global `price_usd`):
 *   LATAM                                   → price_usd_latam
 *   Europa, USA y Canadá, AU/NZ/ZA          → price_usd (global)
 *   Asia y resto del mundo                  → price_usd_tienda
 */
export type PriceRegion = "latam" | "europe" | "northam" | "asia" | "rest";
/** Los 3 precios que existen hoy en el producto. */
export type PriceTier = "latam" | "global" | "tienda";

export const PRICE_REGION_LABEL: Record<PriceRegion, string> = {
  latam: "LATAM",
  europe: "Europa",
  northam: "USA y Canadá",
  asia: "Asia",
  rest: "Resto del mundo",
};

const LATAM = new Set(REGIONS.latam.codes);
const EUROPE = new Set(REGIONS.europe.codes);
const NORTHAM = new Set(["US", "CA"]);
const ASIA = new Set(REGIONS.asia.codes);
/** Países angloparlantes que hoy ya pagan el precio global (se mantiene hasta tener precios propios por región). */
const GLOBAL_ANGLO = new Set(["AU", "NZ", "ZA"]);

export function priceRegionOf(country: string | null | undefined): PriceRegion {
  const c = String(country || "").toUpperCase().slice(0, 2);
  if (LATAM.has(c)) return "latam";
  if (NORTHAM.has(c)) return "northam";
  if (EUROPE.has(c)) return "europe";
  if (ASIA.has(c)) return "asia";
  return "rest";
}

/** Precio (de los 3 que tiene el producto) que paga cada país. */
export function priceTierOf(country: string | null | undefined): PriceTier {
  const c = String(country || "").toUpperCase().slice(0, 2);
  if (GLOBAL_ANGLO.has(c) || REGIONS.english_speaking.codes.includes(c)) return "global";
  const r = priceRegionOf(c);
  if (r === "latam") return "latam";
  if (r === "europe" || r === "northam") return "global";
  return "tienda";
}

type PriceRow = { price_usd?: unknown; price_usd_latam?: unknown; price_usd_tienda?: unknown };
const pos = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Precio USD de un producto para un tier. Regla única: sin precio propio de la región, se usa el global. */
export function tierUsd(row: PriceRow, tier: PriceTier): number {
  const global = pos(row.price_usd) ?? 0;
  if (tier === "latam") return pos(row.price_usd_latam) ?? global;
  if (tier === "tienda") return pos(row.price_usd_tienda) ?? global;
  return global;
}
