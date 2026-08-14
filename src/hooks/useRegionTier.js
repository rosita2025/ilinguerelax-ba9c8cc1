import { useEffect, useState } from "react";
import { detectCountryByIp } from "@/lib/geoDetection";
const STORAGE_KEY = "region_tier_v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
// Países que compran vía Hotmart LATAM (USD reducido latam).
const LATAM = new Set([
    "AR", "BO", "BR", "CL", "CO", "CR", "DO", "EC", "SV",
    "GT", "HN", "MX", "PA", "PY", "PE", "PR", "UY",
]);
// Países con tier "tienda" (USD aún más reducido, sin acceso Hotmart).
const TIENDA = new Set(["VE", "CU", "NI"]);
function classify(country) {
    const c = country.toUpperCase();
    if (TIENDA.has(c))
        return "tienda";
    return LATAM.has(c) ? "latam" : "global";
}
function readCache() {
    if (typeof window === "undefined")
        return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.tier || Date.now() - parsed.timestamp > CACHE_TTL_MS)
            return null;
        return parsed;
    }
    catch {
        return null;
    }
}
let inflight = null;
async function detect() {
    if (inflight)
        return inflight;
    inflight = (async () => {
        const detected = await detectCountryByIp({ fallbackCountry: "US" });
        if (!detected?.countryCode)
            return null;
        return { tier: classify(detected.countryCode), country: detected.countryCode };
    })();
    return inflight;
}
/**
 * Detects visitor region via IP → returns "latam" or "global" pricing tier.
 * Cached 24h. This is source-of-truth for regional pricing — the user cannot
 * change it manually (the header currency selector only affects display).
 */
// Subdominios regionales desactivados — usamos solo ilinguerelax.com y detección por IP.
const MANUAL_KEY = "ilr_country_manual";
export function getManualCountryOverride() {
    if (typeof window === "undefined")
        return null;
    try {
        const v = localStorage.getItem(MANUAL_KEY);
        return v ? v.toUpperCase() : null;
    }
    catch {
        return null;
    }
}
export function setManualCountryOverride(country) {
    if (typeof window === "undefined")
        return;
    try {
        localStorage.setItem(MANUAL_KEY, country.toUpperCase());
        localStorage.setItem("ilr_country", country.toUpperCase());
        // Invalidate the IP cache so the new choice takes over completely.
        localStorage.removeItem(STORAGE_KEY);
    }
    catch { /* ignore */ }
}
export function clearManualCountryOverride() {
    if (typeof window === "undefined")
        return;
    try {
        localStorage.removeItem(MANUAL_KEY);
        localStorage.removeItem(STORAGE_KEY);
    }
    catch { /* ignore */ }
}
export function useRegionTier() {
    const [state, setState] = useState(() => {
        if (typeof window !== "undefined") {
            // Limpia overrides antiguos que quedaban persistidos para siempre y
            // hacían que la IP nunca ganara (ej. un ?country=ES de un test viejo).
            try {
                localStorage.removeItem("ilr_country_override");
            }
            catch { /* ignore */ }
            // ?country=XX sigue funcionando pero SÓLO en esta carga (no se persiste).
            const params = new URLSearchParams(window.location.search);
            const urlOverride = params.get("country")?.toUpperCase();
            if (urlOverride) {
                try {
                    localStorage.setItem("ilr_country", urlOverride);
                }
                catch { /* ignore */ }
                return { tier: classify(urlOverride), country: urlOverride, loading: false };
            }
            // Manual override (from CountryPicker) beats IP detection.
            const manual = getManualCountryOverride();
            if (manual) {
                try {
                    localStorage.setItem("ilr_country", manual);
                }
                catch { /* ignore */ }
                return { tier: classify(manual), country: manual, loading: false };
            }
        }
        // Prioridad: cache de detección por IP
        const cached = readCache();
        if (cached)
            return { tier: cached.tier, country: cached.country, loading: false };
        return { tier: "global", country: "", loading: true };
    });
    useEffect(() => {
        if (!state.loading)
            return;
        let cancelled = false;
        (async () => {
            const result = await detect();
            if (cancelled)
                return;
            if (!result) {
                setState({ tier: "global", country: "", loading: false });
                return;
            }
            try {
                const payload = { ...result, timestamp: Date.now() };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
                // Also mirror to legacy key so pages that read `ilr_country` still work.
                localStorage.setItem("ilr_country", result.country);
            }
            catch { /* ignore */ }
            setState({ tier: result.tier, country: result.country, loading: false });
        })();
        return () => { cancelled = true; };
    }, [state.loading]);
    return state;
}
