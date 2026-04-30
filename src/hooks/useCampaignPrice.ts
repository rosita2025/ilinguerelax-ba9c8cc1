import { useEffect, useState } from "react";

export type CampaignCurrency = "USD" | "GBP" | "CAD" | "COP" | "ARS";

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

const STORAGE_KEY = "campaign_currency_v3";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Fixed marketing exchange rates (NOT live). Charge always happens in USD.
const RATES: Record<CampaignCurrency, { symbol: string; rate: number; decimals: number; nice: (n: number) => number }> = {
  USD: { symbol: "$",    rate: 1,    decimals: 2, nice: (n) => Math.round(n * 100) / 100 },
  GBP: { symbol: "£",    rate: 0.80, decimals: 2, nice: (n) => Math.round(n * 100) / 100 },
  CAD: { symbol: "CA$",  rate: 1.36, decimals: 2, nice: (n) => Math.round(n * 100) / 100 },
  // COP: tasa oficial ~4.000, redondeo a múltiplos de 100 terminados en 900
  COP: { symbol: "COP$", rate: 4000, decimals: 0, nice: (n) => {
    const rounded = Math.round(n / 1000) * 1000;
    return Math.max(900, rounded - 100); // termina en .900
  }},
  // ARS: dólar blue ~1.200, redondeo a terminaciones .990
  ARS: { symbol: "AR$",  rate: 1200, decimals: 0, nice: (n) => {
    const rounded = Math.round(n / 1000) * 1000;
    return rounded - 10; // termina en .990
  }},
};

const COUNTRY_TO_CURRENCY: Record<string, CampaignCurrency> = {
  US: "USD",
  GB: "GBP",
  UK: "GBP",
  CA: "CAD",
  CO: "COP",
  AR: "ARS",
};

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

export const CAMPAIGN_CURRENCIES: CampaignCurrency[] = ["USD", "GBP", "CAD", "COP", "ARS"];

/**
 * Auto-detects visitor country via IP and returns the product price in their local
 * marketing currency. Charge still happens in USD via Hotmart/Shopify.
 *
 * @param priceUSD     The current/sale price in USD (e.g. 29.99)
 * @param originalUSD  The original/strikethrough price in USD (e.g. 54)
 *
 * Backwards compatibility: called with no args defaults to (29.99, 54) — the
 * Spanish 5000 product. Existing callers keep working.
 */
export function useCampaignPrice(priceUSD: number = 29.99, originalUSD: number = 54): CampaignPrice {
  type State = Omit<CampaignPrice, "setCurrency">;
  const [state, setState] = useState<State>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const forced = params.get("currency")?.toUpperCase() as CampaignCurrency | undefined;
      if (forced && RATES[forced]) return build(forced, "", priceUSD, originalUSD);
    }
    const cached = readCache();
    if (cached) return build(cached.currency, cached.countryCode, priceUSD, originalUSD);
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
      try {
        const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
        if (!res.ok) return;
        const data = await res.json();
        const country = (data.country_code || "US").toUpperCase();
        const currency = COUNTRY_TO_CURRENCY[country] || "USD";
        if (cancelled) return;
        const payload: CachedDetection = { currency, countryCode: country, timestamp: Date.now() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        setState(build(currency, country, priceUSD, originalUSD));
      } catch {
        /* keep default */
      }
    })();

    return () => { cancelled = true; };
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
