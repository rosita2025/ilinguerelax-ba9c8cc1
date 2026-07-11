import { REGIONS } from "@/lib/countryRegions";
import { COUNTRY_INFO } from "@/lib/countryInfo";

export type PolicyPreset = "standard" | "worldwide" | "custom" | "off";

export interface PolicyInput {
  hotmart_url?: string | null;
  store_enabled?: boolean;
  store_excluded_countries?: string[] | null;
  hotmart_excluded_countries?: string[] | null;
}

export function detectPolicyPreset(p: PolicyInput): PolicyPreset {
  const storeOn = !!p.store_enabled;
  const hotOn = !!p.hotmart_url?.trim();
  if (!storeOn && !hotOn) return "off";

  const LATAM = REGIONS.latam.codes;
  const HOTMART_BLOCKED = ["CU", "VE", "NI"];
  const expectedStore = new Set(LATAM.filter((c) => c !== "PE" && !HOTMART_BLOCKED.includes(c)));
  const expectedHot = new Set([
    ...Object.keys(COUNTRY_INFO).filter((c) => !LATAM.includes(c)),
    ...HOTMART_BLOCKED,
  ]);
  const store = new Set(p.store_excluded_countries ?? []);
  const hot = new Set(p.hotmart_excluded_countries ?? []);
  const eq = (a: Set<string>, b: Set<string>) =>
    a.size === b.size && [...a].every((x) => b.has(x));

  if (storeOn && hotOn && eq(store, expectedStore) && eq(hot, expectedHot)) return "standard";
  if (storeOn && !hotOn && store.size === 0) return "worldwide";
  return "custom";
}

export const POLICY_META: Record<PolicyPreset, { label: string; icon: string; className: string; description: string }> = {
  standard: {
    label: "Estándar",
    icon: "⚡",
    className: "bg-amber-100 text-amber-800 border-amber-300",
    description: "LATAM → Hotmart · Resto del mundo + Perú → Tienda",
  },
  worldwide: {
    label: "Tienda mundial",
    icon: "🌍",
    className: "bg-emerald-100 text-emerald-800 border-emerald-300",
    description: "Todos los países → Tienda interna (sin Hotmart)",
  },
  custom: {
    label: "Personalizada",
    icon: "🛠️",
    className: "bg-sky-100 text-sky-800 border-sky-300",
    description: "Configuración manual de países",
  },
  off: {
    label: "Sin venta",
    icon: "⛔",
    className: "bg-red-100 text-red-800 border-red-300",
    description: "Ni tienda ni Hotmart activos",
  },
};
