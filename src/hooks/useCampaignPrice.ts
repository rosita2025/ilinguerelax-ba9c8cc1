import { useEffect, useState } from "react";

export type CampaignCurrency = "USD" | "GBP" | "CAD";

export interface CampaignPrice {
  currency: CampaignCurrency;
  symbol: string;
  price: string;        // e.g. "$29.99"
  originalPrice: string; // e.g. "$54"
  priceWithCurrency: string; // e.g. "$29.99 USD"
  originalWithCurrency: string; // e.g. "$54 USD"
  numericPrice: number;
  countryCode: string;
}

const STORAGE_KEY = "campaign_currency_us_uk_ca";

// Fixed marketing prices per currency (NOT live conversion).
// Charge always happens in USD via Hotmart/Shopify; this is display-only.
const PRICING: Record<CampaignCurrency, { symbol: string; price: number; original: number }> = {
  USD: { symbol: "$",  price: 29.99, original: 54 },
  GBP: { symbol: "£",  price: 23.99, original: 43 },
  CAD: { symbol: "CA$", price: 39.99, original: 72 },
};

const COUNTRY_TO_CURRENCY: Record<string, CampaignCurrency> = {
  US: "USD",
  GB: "GBP",
  UK: "GBP",
  CA: "CAD",
};

function build(currency: CampaignCurrency, countryCode: string): CampaignPrice {
  const cfg = PRICING[currency];
  const priceStr = `${cfg.symbol}${cfg.price.toFixed(2)}`;
  const originalStr = `${cfg.symbol}${cfg.original}`;
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
export function useCampaignPrice(): CampaignPrice {
  const [state, setState] = useState<CampaignPrice>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(STORAGE_KEY) as CampaignCurrency | null;
      if (cached && PRICING[cached]) return build(cached, "");
    }
    return build("USD", "US");
  });

  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY) as CampaignCurrency | null;
    if (cached && PRICING[cached]) return;

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
        localStorage.setItem(STORAGE_KEY, currency);
        setState(build(currency, country));
      } catch {
        /* keep default USD */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}