// Regiones de precio — COPIA ESPEJO de src/lib/priceRegions.ts (mismas listas y misma regla).
// Si cambias una lista aquí, cámbiala también allá. Lo que el navegador muestra y lo que el servidor cobra debe coincidir.

export type PriceRegion = "latam" | "europe" | "northam" | "asia" | "rest";
export type PriceTier = "latam" | "global" | "tienda";

const LATAM = new Set(["MX", "GT", "HN", "SV", "NI", "CR", "PA", "CU", "DO", "PR", "CO", "VE", "EC", "PE", "BO", "BR", "PY", "UY", "AR", "CL"]);
const EUROPE = new Set(["ES", "PT", "FR", "GB", "IE", "DE", "IT", "NL", "BE", "CH", "AT", "SE", "NO", "DK", "FI", "PL", "CZ", "RO", "GR", "TR", "UA"]);
const NORTHAM = new Set(["US", "CA"]);
const ASIA = new Set(["CN", "JP", "KR", "TW", "HK", "SG", "MY", "TH", "VN", "ID", "PH", "IN", "PK", "BD", "AE", "SA", "IL"]);
const ENGLISH_SPEAKING = new Set(["US", "CA", "GB", "IE", "AU", "NZ", "ZA"]);
/** Angloparlantes que hoy ya pagan el precio global. */
const GLOBAL_ANGLO = new Set(["AU", "NZ", "ZA"]);

export function priceRegionOf(country: string | null | undefined): PriceRegion {
  const c = String(country || "").toUpperCase().slice(0, 2);
  if (LATAM.has(c)) return "latam";
  if (NORTHAM.has(c)) return "northam";
  if (EUROPE.has(c)) return "europe";
  if (ASIA.has(c)) return "asia";
  return "rest";
}

export function priceTierOf(country: string | null | undefined): PriceTier {
  const c = String(country || "").toUpperCase().slice(0, 2);
  if (GLOBAL_ANGLO.has(c) || ENGLISH_SPEAKING.has(c)) return "global";
  const r = priceRegionOf(c);
  if (r === "latam") return "latam";
  if (r === "europe" || r === "northam") return "global";
  return "tienda";
}
