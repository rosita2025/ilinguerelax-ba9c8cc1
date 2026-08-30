import { useEffect, useState } from "react";
import { detectCountryByIp } from "@/lib/geoDetection";

export type RegionTier = "latam" | "global" | "tienda";

const STORAGE_KEY = "region_tier_v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

import { REGIONS } from "@/lib/countryRegions";

// Clasificación UNIFICADA de 3 tiers (misma lista `REGIONS` que usan las
// tarjetas de homepage/all-products y las páginas estáticas):
//   LATAM                    -> price_usd_latam
//   Angloparlantes + Europa  -> price_usd (global)
//   Asia / África / resto    -> price_usd_tienda
// Antes este hook solo distinguía LATAM vs "todo lo demás" (y VE/CU/NI como
// "tienda"), así que un visitante de Asia/África veía el precio GLOBAL en la
// página de producto mientras las tarjetas y el admin prometían el precio
// TIENDA — precios distintos para el mismo producto en el mismo momento.
const LATAM = new Set(REGIONS.latam.codes);
const ANGLO_EU = new Set([
  ...REGIONS.english_speaking.codes,
  ...REGIONS.europe.codes,
]);

interface Cached {
  tier: RegionTier;
  country: string;
  timestamp: number;
}

function classify(country: string): RegionTier {
  const c = country.toUpperCase();
  if (LATAM.has(c)) return "latam";
  if (ANGLO_EU.has(c)) return "global";
  return "tienda";
}

function readCache(): Cached | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cached;
    if (!parsed?.tier || Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

let inflight: Promise<{ tier: RegionTier; country: string } | null> | null = null;

async function detect(): Promise<{ tier: RegionTier; country: string } | null> {
  if (inflight) return inflight;
  inflight = (async () => {
    const detected = await detectCountryByIp({ fallbackCountry: "US" });
    if (!detected?.countryCode) return null;
    return { tier: classify(detected.countryCode), country: detected.countryCode };
  })();
  return inflight;
}

export interface RegionInfo {
  tier: RegionTier;
  country: string;
  loading: boolean;
}

/**
 * Detects visitor region via IP → returns "latam" or "global" pricing tier.
 * Cached 24h. This is source-of-truth for regional pricing — the user cannot
 * change it manually (the header currency selector only affects display).
 */
// Subdominios regionales desactivados — usamos solo ilinguerelax.com y detección por IP.

const MANUAL_KEY = "ilr_country_manual";

export function getManualCountryOverride(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(MANUAL_KEY);
    return v ? v.toUpperCase() : null;
  } catch {
    return null;
  }
}

export function setManualCountryOverride(country: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MANUAL_KEY, country.toUpperCase());
    localStorage.setItem("ilr_country", country.toUpperCase());
    // Invalidate the IP cache so the new choice takes over completely.
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

export function clearManualCountryOverride() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(MANUAL_KEY);
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

export function useRegionTier(): RegionInfo {
  const [state, setState] = useState<RegionInfo>(() => {
    if (typeof window !== "undefined") {
      try { localStorage.removeItem("ilr_country_override"); } catch { /* ignore */ }

      const params = new URLSearchParams(window.location.search);
      const urlOverride = params.get("country")?.toUpperCase();
      if (urlOverride) {
        try { localStorage.setItem("ilr_country", urlOverride); } catch { /* ignore */ }
        return { tier: classify(urlOverride), country: urlOverride, loading: false };
      }

      const manual = getManualCountryOverride();
      if (manual) {
        try { localStorage.setItem("ilr_country", manual); } catch { /* ignore */ }
        return { tier: classify(manual), country: manual, loading: false };
      }
    }
    const cached = readCache();
    if (cached) return { tier: cached.tier, country: cached.country, loading: false };
    return { tier: "global", country: "", loading: true };
  });

  // Re-sync if the manual override changes in localStorage (e.g. from another component)
  useEffect(() => {
    const sync = () => {
      const manual = getManualCountryOverride();
      if (manual && manual !== state.country) {
        setState({ tier: classify(manual), country: manual, loading: false });
      }
    };
    window.addEventListener("storage", sync);
    window.addEventListener("country_changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("country_changed", sync);
    };
  }, [state.country]);

  useEffect(() => {
    if (!state.loading) return;
    let cancelled = false;
    (async () => {
      const result = await detect();
      if (cancelled) return;
      if (!result) {
        setState({ tier: "global", country: "", loading: false });
        return;
      }
      try {
        const payload: Cached = { ...result, timestamp: Date.now() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        // Also mirror to legacy key so pages that read `ilr_country` still work.
        localStorage.setItem("ilr_country", result.country);
      } catch { /* ignore */ }
      setState({ tier: result.tier, country: result.country, loading: false });
    })();
    return () => { cancelled = true; };
  }, [state.loading]);

  return state;
}

export const countries = [
  { code: "US", name: "Estados Unidos", flag: "🇺🇸" },
  { code: "MX", name: "México", flag: "🇲🇽" },
  { code: "ES", name: "España", flag: "🇪🇸" },
  { code: "PE", name: "Perú", flag: "🇵🇪" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
  { code: "DO", name: "Rep. Dominicana", flag: "🇩🇴" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹" },
  { code: "HN", name: "Honduras", flag: "🇭🇳" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮" },
  { code: "PA", name: "Panamá", flag: "🇵🇦" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },
  { code: "PR", name: "Puerto Rico", flag: "🇵🇷" },
  { code: "CA", name: "Canadá", flag: "🇨🇦" },
  { code: "GB", name: "Reino Unido", flag: "🇬🇧" },
  { code: "FR", name: "Francia", flag: "🇫🇷" },
  { code: "DE", name: "Alemania", flag: "🇩🇪" },
  { code: "IT", name: "Italia", flag: "🇮🇹" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "BR", name: "Brasil", flag: "🇧🇷" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "NZ", name: "Nueva Zelanda", flag: "🇳🇿" },
  { code: "JP", name: "Japón", flag: "🇯🇵" },
  { code: "KR", name: "Corea del Sur", flag: "🇰🇷" },
];

