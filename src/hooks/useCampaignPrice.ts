import { useEffect, useState } from "react";

export type CampaignCurrency = "USD" | "GBP" | "CAD" | "COP" | "ARS";

export interface CampaignPrice {
  currency: CampaignCurrency;
  symbol: string;
  price: string;        // e.g. "$29.99"
  originalPrice: string; // e.g. "$54"
  priceWithCurrency: string; // e.g. "$29.99 USD"
  originalWithCurrency: string; // e.g. "$54 USD"
  numericPrice: number;
  countryCode: string;
  setCurrency: (c: CampaignCurrency) => void;
}

const STORAGE_KEY = "campaign_currency_v3";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

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
    if (!parsed?.currency || !PRICING[parsed.currency]) return null;
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

// Fixed marketing prices per currency (NOT live conversion).
// Charge always happens in USD via Hotmart/Shopify; this is display-only.
const PRICING: Record<CampaignCurrency, { symbol: string; price: number; original: number }> = {
  USD: { symbol: "$",  price: 29.99, original: 54 },
  GBP: { symbol: "£",  price: 23.99, original: 43 },
  CAD: { symbol: "CA$", price: 39.99, original: 72 },
  // Fixed marketing prices for LATAM campaigns. Charge still happens in USD.
  // COP: tasa oficial ~4.000 COP/USD → 29.99 USD ≈ 119.900 COP, original 54 USD ≈ 215.900 COP
  COP: { symbol: "COP$", price: 119900, original: 215900 },
  // ARS: dólar blue ~1.200 ARS/USD → 29.99 USD ≈ 35.990 ARS, original 54 USD ≈ 64.900 ARS
  ARS: { symbol: "AR$",  price: 35990, original: 64900 },
};

const COUNTRY_TO_CURRENCY: Record<string, CampaignCurrency> = {
  US: "USD",
  GB: "GBP",
  UK: "GBP",
  CA: "CAD",
  CO: "COP",
  AR: "ARS",
};

function build(currency: CampaignCurrency, countryCode: string): Omit<CampaignPrice, "setCurrency"> {
  const cfg = PRICING[currency];
  // COP/ARS use thousand separators and no decimals; USD/GBP/CAD keep 2 decimals.
  const noDecimals = currency === "COP" || currency === "ARS";
  const priceFmt = noDecimals
    ? Math.round(cfg.price).toLocaleString("es-CO")
    : cfg.price.toFixed(2);
  const originalFmt = noDecimals
    ? Math.round(cfg.original).toLocaleString("es-CO")
    : String(cfg.original);
  const priceStr = `${cfg.symbol}${priceFmt}`;
  const originalStr = `${cfg.symbol}${originalFmt}`;
  return {
    currency,
    symbol: cfg.symbol,
    price: priceStr,
    originalPrice: originalStr,
    priceWithCurrency: `${priceStr} ${currency}`,
    originalWithCurrency: `${originalStr} ${currency}`,
    numericPrice: cfg.price,
    countryCode,
  };
}

/**
 * Detects visitor country via IP and returns a fixed marketing price
 * in USD / GBP / CAD. Defaults to USD for everything else.
 * Display-only — actual checkout still charges in USD.
 */
export const CAMPAIGN_CURRENCIES: CampaignCurrency[] = ["USD", "GBP", "CAD", "COP", "ARS"];

export function useCampaignPrice(): CampaignPrice {
  type State = Omit<CampaignPrice, "setCurrency">;
  const [state, setState] = useState<State>(() => {
    const cached = readCache();
    if (cached) return build(cached.currency, cached.countryCode);
    return build("USD", "US");
  });

  useEffect(() => {
    // Always revalidate IP on mount; cache only short-circuits initial render.
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("https://ipapi.co/json/", {
          signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) return;
        const data = await res.json();
        const country = (data.country_code || "US").toUpperCase();
        const currency = COUNTRY_TO_CURRENCY[country] || "USD";
        if (cancelled) return;
        const payload: CachedDetection = {
          currency,
          countryCode: country,
          timestamp: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        setState(build(currency, country));
      } catch {
        /* keep default USD */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setCurrency = (c: CampaignCurrency) => {
    if (!PRICING[c]) return;
    const payload: CachedDetection = {
      currency: c,
      countryCode: state.countryCode,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setState(build(c, state.countryCode));
  };

  return { ...state, setCurrency };
}