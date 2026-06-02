import { useEffect, useState } from "react";

export type CampaignCurrency =
  | "USD" | "EUR" | "GBP" | "CAD" | "AUD"
  | "COP" | "ARS" | "PEN" | "MXN" | "CLP" | "BRL"
  | "UYU" | "BOB" | "PYG" | "GTQ" | "DOP" | "CRC"
  | "HNL" | "NIO" | "VES";

export interface CampaignPrice {
  currency: CampaignCurrency;
  symbol: string;
  price: string;        // e.g. "$29.99" or "COP$119.900"
  originalPrice: string; // e.g. "$54"
  priceWithCurrency: string;
  originalWithCurrency: string;
  numericPrice: number;  // local currency value
  numericPriceUSD: number; // original USD (for tracking/checkout)
  countryCode: string;
  setCurrency: (c: CampaignCurrency) => void;
}

const STORAGE_KEY = "campaign_currency_v5";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Module-level dedupe: share a single ipapi.co fetch across all hook instances
let inflightDetection: Promise<{ currency: CampaignCurrency; country: string } | null> | null = null;
function detectOnce(): Promise<{ currency: CampaignCurrency; country: string } | null> {
  if (inflightDetection) return inflightDetection;
  inflightDetection = (async () => {
    try {
      const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return null;
      const data = await res.json();
      const country = (data.country_code || "US").toUpperCase();
      const currency = COUNTRY_TO_CURRENCY[country] || "USD";
      return { currency, country };
    } catch {
      return null;
    }
  })();
  return inflightDetection;
}

// Fixed marketing exchange rates (NOT live). Charge always happens in USD.
const RATES: Record<CampaignCurrency, { symbol: string; rate: number; decimals: number; nice: (n: number) => number }> = {
  USD: { symbol: "$",    rate: 1,    decimals: 2, nice: (n) => Math.round(n * 100) / 100 },
  EUR: { symbol: "€",    rate: 0.86, decimals: 2, nice: (n) => Math.round(n * 100) / 100 },
  GBP: { symbol: "£",    rate: 0.80, decimals: 2, nice: (n) => Math.round(n * 100) / 100 },
  CAD: { symbol: "$",    rate: 1.36, decimals: 2, nice: (n) => Math.round(n * 100) / 100 },
  AUD: { symbol: "$",    rate: 1.40, decimals: 2, nice: (n) => Math.round(n * 100) / 100 },
  // COP: tasa oficial ~4.000, redondeo a múltiplos de 100 terminados en 900
  COP: { symbol: "$",    rate: 4000, decimals: 0, nice: (n) => {
    const rounded = Math.round(n / 1000) * 1000;
    return Math.max(900, rounded - 100); // termina en .900
  }},
  // ARS: dólar blue ~1.200, redondeo a centenas terminadas en 90
  ARS: { symbol: "$",    rate: 1200, decimals: 0, nice: (n) => {
    const rounded = Math.round(n / 100) * 100;
    return Math.max(90, rounded - 10); // termina en .90 (ej: 16.790)
  }},
  // PEN (Sol peruano) ~3.75, redondeo a terminaciones .90
  PEN: { symbol: "S/",   rate: 3.75, decimals: 2, nice: (n) => {
    const rounded = Math.round(n);
    return rounded - 0.10; // termina en .90
  }},
  // MXN (Peso mexicano) ~20, redondeo psicológico terminado en 9
  MXN: { symbol: "$",    rate: 20, decimals: 0, nice: (n) => {
    const rounded = Math.round(n / 10) * 10;
    return Math.max(9, rounded - 1); // termina en 9 (psicológico)
  }},
  // CLP (Peso chileno) ~900, redondeo a múltiplos de 1000 - 10 => .990
  CLP: { symbol: "$",    rate: 900, decimals: 0, nice: (n) => {
    const rounded = Math.round(n / 1000) * 1000;
    return Math.max(990, rounded - 10);
  }},
  // BRL (Real brasileño) ~5.0, redondeo .90
  BRL: { symbol: "R$",   rate: 5.0, decimals: 2, nice: (n) => {
    const rounded = Math.round(n);
    return rounded - 0.10;
  }},
  // UYU (Peso uruguayo) ~40
  UYU: { symbol: "$U",   rate: 40, decimals: 0, nice: (n) => {
    const rounded = Math.round(n / 10) * 10;
    return Math.max(9, rounded - 1);
  }},
  // BOB (Boliviano) ~6.9
  BOB: { symbol: "Bs",   rate: 6.9, decimals: 2, nice: (n) => {
    const rounded = Math.round(n);
    return rounded - 0.10;
  }},
  // PYG (Guaraní paraguayo) ~7300
  PYG: { symbol: "₲",    rate: 7300, decimals: 0, nice: (n) => {
    const rounded = Math.round(n / 1000) * 1000;
    return Math.max(900, rounded - 100);
  }},
  // GTQ (Quetzal guatemalteco) ~7.7
  GTQ: { symbol: "Q",    rate: 7.7, decimals: 2, nice: (n) => {
    const rounded = Math.round(n);
    return rounded - 0.10;
  }},
  // DOP (Peso dominicano) ~60
  DOP: { symbol: "RD$",  rate: 60, decimals: 0, nice: (n) => {
    const rounded = Math.round(n / 10) * 10;
    return Math.max(9, rounded - 1);
  }},
  // CRC (Colón costarricense) ~520
  CRC: { symbol: "₡",    rate: 520, decimals: 0, nice: (n) => {
    const rounded = Math.round(n / 100) * 100;
    return Math.max(99, rounded - 1);
  }},
  // HNL (Lempira hondureño) ~26.5
  HNL: { symbol: "L",    rate: 26.5, decimals: 2, nice: (n) => {
    const rounded = Math.round(n);
    return rounded - 0.10;
  }},
  // NIO (Córdoba nicaragüense) ~36.7
  NIO: { symbol: "C$",   rate: 36.7, decimals: 2, nice: (n) => {
    const rounded = Math.round(n);
    return rounded - 0.10;
  }},
  // VES (Bolívar venezolano) — alta volatilidad; mantener conservador
  VES: { symbol: "Bs.S", rate: 100, decimals: 2, nice: (n) => Math.round(n * 100) / 100 },
};

const COUNTRY_TO_CURRENCY: Record<string, CampaignCurrency> = {
  US: "USD",
  GB: "GBP",
  UK: "GBP",
  CA: "CAD",
  CO: "COP",
  AR: "ARS",
  PE: "PEN",
  MX: "MXN",
  CL: "CLP",
  BR: "BRL",
  UY: "UYU",
  BO: "BOB",
  PY: "PYG",
  GT: "GTQ",
  DO: "DOP",
  CR: "CRC",
  HN: "HNL",
  NI: "NIO",
  VE: "VES",
  PA: "USD", // Panamá usa USD
  EC: "USD", // Ecuador usa USD
  SV: "USD", // El Salvador usa USD
  AU: "AUD",
  NZ: "AUD",
  // Eurozona
  ES: "EUR", FR: "EUR", DE: "EUR", IT: "EUR", PT: "EUR", IE: "EUR",
  NL: "EUR", BE: "EUR", AT: "EUR", FI: "EUR", GR: "EUR", LU: "EUR",
  SK: "EUR", SI: "EUR", EE: "EUR", LV: "EUR", LT: "EUR", MT: "EUR", CY: "EUR", HR: "EUR",
};

// Map IANA timezones to country codes for an instant, synchronous best-guess
// (avoids the $USD → local currency flicker before the IP lookup resolves).
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  "America/Lima": "PE",
  "America/Bogota": "CO",
  "America/Mexico_City": "MX", "America/Monterrey": "MX", "America/Cancun": "MX", "America/Tijuana": "MX", "America/Chihuahua": "MX", "America/Hermosillo": "MX", "America/Merida": "MX", "America/Mazatlan": "MX",
  "America/Argentina/Buenos_Aires": "AR", "America/Argentina/Cordoba": "AR", "America/Argentina/Mendoza": "AR", "America/Argentina/Salta": "AR", "America/Argentina/Tucuman": "AR", "America/Argentina/Ushuaia": "AR", "America/Argentina/Rio_Gallegos": "AR", "America/Argentina/San_Juan": "AR", "America/Argentina/San_Luis": "AR", "America/Argentina/La_Rioja": "AR", "America/Argentina/Catamarca": "AR", "America/Argentina/Jujuy": "AR", "America/Buenos_Aires": "AR",
  "America/Santiago": "CL", "Pacific/Easter": "CL",
  "America/Sao_Paulo": "BR", "America/Bahia": "BR", "America/Fortaleza": "BR", "America/Recife": "BR", "America/Manaus": "BR", "America/Belem": "BR", "America/Cuiaba": "BR", "America/Maceio": "BR", "America/Noronha": "BR", "America/Porto_Velho": "BR", "America/Rio_Branco": "BR", "America/Araguaina": "BR",
  "America/Montevideo": "UY",
  "America/La_Paz": "BO",
  "America/Asuncion": "PY",
  "America/Guatemala": "GT",
  "America/Santo_Domingo": "DO",
  "America/Costa_Rica": "CR",
  "America/Tegucigalpa": "HN",
  "America/Managua": "NI",
  "America/Caracas": "VE",
  "America/Panama": "PA",
  "America/Guayaquil": "EC", "Pacific/Galapagos": "EC",
  "America/El_Salvador": "SV",
  "America/Toronto": "CA", "America/Vancouver": "CA", "America/Edmonton": "CA", "America/Winnipeg": "CA", "America/Halifax": "CA", "America/St_Johns": "CA", "America/Montreal": "CA",
  "Europe/Madrid": "ES", "Europe/Paris": "FR", "Europe/Berlin": "DE", "Europe/Rome": "IT", "Europe/Lisbon": "PT", "Europe/Dublin": "IE", "Europe/Amsterdam": "NL", "Europe/Brussels": "BE", "Europe/Vienna": "AT", "Europe/Helsinki": "FI", "Europe/Athens": "GR", "Europe/Luxembourg": "LU", "Europe/Bratislava": "SK", "Europe/Ljubljana": "SI", "Europe/Tallinn": "EE", "Europe/Riga": "LV", "Europe/Vilnius": "LT", "Europe/Malta": "MT", "Asia/Nicosia": "CY", "Europe/Zagreb": "HR",
  "Europe/London": "GB",
  "Australia/Sydney": "AU", "Australia/Melbourne": "AU", "Australia/Brisbane": "AU", "Australia/Perth": "AU", "Australia/Adelaide": "AU", "Australia/Hobart": "AU", "Australia/Darwin": "AU",
  "Pacific/Auckland": "NZ",
};

function guessCountryFromTimezone(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONE_TO_COUNTRY[tz] || null;
  } catch { return null; }
}

export function readInitialCampaignCurrency(): CampaignCurrency {
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search);
      const forced = params.get("currency")?.toUpperCase() as CampaignCurrency | undefined;
      if (forced && RATES[forced]) return forced;
    } catch {
      // ignore malformed URLs
    }
  }

  const cached = readCache();
  if (cached?.currency && RATES[cached.currency]) return cached.currency;

  const guessedCountry = typeof window !== "undefined" ? guessCountryFromTimezone() : null;
  if (guessedCountry) {
    return COUNTRY_TO_CURRENCY[guessedCountry] || "USD";
  }

  return "USD";
}

interface CachedDetection {
  currency: CampaignCurrency;
  countryCode: string;
  timestamp: number;
}

function readCache(): CachedDetection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedDetection;
    if (!parsed?.currency || !RATES[parsed.currency]) return null;
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function format(currency: CampaignCurrency, usdAmount: number): { str: string; numeric: number } {
  const cfg = RATES[currency];
  const local = cfg.nice(usdAmount * cfg.rate);
  const formatted = cfg.decimals > 0
    ? local.toFixed(cfg.decimals)
    : Math.round(local).toLocaleString("es-CO");
  return { str: `${cfg.symbol}${formatted}`, numeric: local };
}

function build(
  currency: CampaignCurrency,
  countryCode: string,
  priceUSD: number,
  originalUSD: number,
): Omit<CampaignPrice, "setCurrency"> {
  const p = format(currency, priceUSD);
  const o = format(currency, originalUSD);
  return {
    currency,
    symbol: RATES[currency].symbol,
    price: p.str,
    originalPrice: o.str,
    priceWithCurrency: `${p.str} ${currency}`,
    originalWithCurrency: `${o.str} ${currency}`,
    numericPrice: p.numeric,
    numericPriceUSD: priceUSD,
    countryCode,
  };
}

export const CAMPAIGN_CURRENCIES: CampaignCurrency[] = [
  "USD", "EUR", "GBP", "CAD", "AUD",
  "MXN", "COP", "ARS", "PEN", "CLP", "BRL",
  "UYU", "BOB", "PYG", "GTQ", "DOP", "CRC", "HNL", "NIO", "VES",
];

/**
 * Auto-detects visitor country via IP and returns the product price in their local
 * marketing currency. Charge still happens in USD via Hotmart/Shopify.
 *
 * @param priceUSD     The current/sale price in USD (e.g. 29.99)
 * @param originalUSD  The original/strikethrough price in USD (e.g. 54)
 *
 * Backwards compatibility: called with no args defaults to (34.99, 54) — the
 * Spanish 5000 product. Existing callers keep working.
 */
export function useCampaignPrice(priceUSD: number = 34.99, originalUSD: number = 54): CampaignPrice {
  type State = Omit<CampaignPrice, "setCurrency">;
  const [state, setState] = useState<State>(() => {
    if (typeof window !== "undefined") {
      const forced = new URLSearchParams(window.location.search).get("currency")?.toUpperCase() as CampaignCurrency | undefined;
      if (forced && RATES[forced]) return build(forced, "", priceUSD, originalUSD);
    }
    const cached = readCache();
    if (cached) return build(cached.currency, cached.countryCode, priceUSD, originalUSD);
    // No cache yet: use synchronous timezone guess so first paint already
    // shows the visitor's local currency (avoids the USD → local flicker).
    const guessedCountry = typeof window !== "undefined" ? guessCountryFromTimezone() : null;
    if (guessedCountry) {
      const guessedCurrency = COUNTRY_TO_CURRENCY[guessedCountry] || "USD";
      return build(guessedCurrency, guessedCountry, priceUSD, originalUSD);
    }
    return build("USD", "US", priceUSD, originalUSD);
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forced = params.get("currency")?.toUpperCase() as CampaignCurrency | undefined;
    if (forced && RATES[forced]) {
      setState(build(forced, "", priceUSD, originalUSD));
      return;
    }

    let cancelled = false;
    (async () => {
      const detected = await detectOnce();
      if (cancelled || !detected) return;
      const payload: CachedDetection = { currency: detected.currency, countryCode: detected.country, timestamp: Date.now() };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch { /* ignore */ }
      // Only re-render if IP detection actually changed the currency vs our
      // synchronous guess — prevents an unnecessary re-paint.
      setState((prev) => {
        if (prev.currency === detected.currency && prev.countryCode === detected.country) return prev;
        return build(detected.currency, detected.country, priceUSD, originalUSD);
      });
    })();

    // Listen for currency changes from header selector (or other tabs)
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as string | undefined;
      const next = (detail || readCache()?.currency) as CampaignCurrency | undefined;
      if (next && RATES[next]) {
        setState((prev) => build(next, prev.countryCode, priceUSD, originalUSD));
      }
    };
    window.addEventListener("campaign-currency-change", onChange);
    window.addEventListener("storage", onChange);

    return () => {
      cancelled = true;
      window.removeEventListener("campaign-currency-change", onChange);
      window.removeEventListener("storage", onChange);
    };
    // Re-run when prices change (different products on same page navigation)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceUSD, originalUSD]);

  const setCurrency = (c: CampaignCurrency) => {
    if (!RATES[c]) return;
    const payload: CachedDetection = { currency: c, countryCode: state.countryCode, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setState(build(c, state.countryCode, priceUSD, originalUSD));
  };

  return { ...state, setCurrency };
}
