import { useEffect, useState } from "react";

export type RegionTier = "latam" | "global";

const STORAGE_KEY = "region_tier_v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Latinoamérica = países con precio reducido
const LATAM = new Set([
  "AR", "BO", "BR", "CL", "CO", "CR", "CU", "DO", "EC", "SV",
  "GT", "HN", "MX", "NI", "PA", "PY", "PE", "PR", "UY", "VE",
]);

interface Cached {
  tier: RegionTier;
  country: string;
  timestamp: number;
}

function classify(country: string): RegionTier {
  return LATAM.has(country.toUpperCase()) ? "latam" : "global";
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
    // Try ipapi.co, then ipwho.is
    for (const url of ["https://ipapi.co/json/", "https://ipwho.is/"]) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (!res.ok) continue;
        const data = await res.json();
        if (data?.error || data?.success === false) continue;
        const country = (data.country_code || data.country || "").toUpperCase();
        if (!country) continue;
        return { tier: classify(country), country };
      } catch {
        // try next
      }
    }
    return null;
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
// Subdominios activos → país ISO
// us → US, pe → PE, mx → MX, uk → GB (Reino Unido), eu → ES (Europa/EUR)
// Cualquier otro subdominio (o dominio raíz ilinguerelax.com) usa detección por IP.
const SUBDOMAIN_MAP: Record<string, string> = {
  US: "US",
  PE: "PE",
  MX: "MX",
  UK: "GB",
  EU: "ES",
  // Reservados por si se agregan más subdominios:
  CA: "CA", AU: "AU", BR: "BR", CO: "CO", AR: "AR", CL: "CL",
  ES: "ES", FR: "FR", DE: "DE", IT: "IT", PT: "PT",
  JP: "JP", KR: "KR", CN: "CN", IN: "IN",
};

function detectFromSubdomain(): string {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname.toLowerCase();
  const parts = host.split(".");
  if (parts.length < 3) return "";
  const sub = parts[0].toUpperCase();
  if (sub.length !== 2) return "";
  return SUBDOMAIN_MAP[sub] || "";
}

export function useRegionTier(): RegionInfo {
  const [state, setState] = useState<RegionInfo>(() => {
    if (typeof window !== "undefined") {
      // Prioridad 1: subdominio (us.ilinguerelax.com, pe.ilinguerelax.com…)
      const fromSub = detectFromSubdomain();
      if (fromSub) {
        try { localStorage.setItem("ilr_country", fromSub); } catch { /* ignore */ }
        return { tier: classify(fromSub), country: fromSub, loading: false };
      }
      // Prioridad 2: ?country=XX manual (pruebas)
      const params = new URLSearchParams(window.location.search);
      const urlOverride = params.get("country")?.toUpperCase();
      if (urlOverride) {
        try { localStorage.setItem("ilr_country_override", urlOverride); } catch { /* ignore */ }
      }
      const override = urlOverride || (() => {
        try { return localStorage.getItem("ilr_country_override")?.toUpperCase() || ""; } catch { return ""; }
      })();
      if (override) {
        try { localStorage.setItem("ilr_country", override); } catch { /* ignore */ }
        return { tier: classify(override), country: override, loading: false };
      }
    }
    // Prioridad 3: cache de detección por IP
    const cached = readCache();
    if (cached) return { tier: cached.tier, country: cached.country, loading: false };
    return { tier: "global", country: "", loading: true };
  });

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
