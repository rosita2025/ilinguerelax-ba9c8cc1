import { useRegionTier } from "./useRegionTier";

/**
 * Muestra el precio en la moneda local del visitante (aprox., basado en país por IP).
 * La conversión REAL la hacen Stripe (adaptive_pricing) y Mercado Pago en checkout.
 * Estos valores son solo referenciales para aumentar la conversión antes del pago.
 */

interface CurrencyInfo {
  code: string;
  symbol: string;
  rate: number; // 1 USD = rate en moneda local (aproximado, actualizar trimestralmente)
  locale: string;
}

// Tabla estática de referencia. Se actualiza cada trimestre.
const COUNTRY_TO_CURRENCY: Record<string, CurrencyInfo> = {
  // Latinoamérica
  PE: { code: "PEN", symbol: "S/", rate: 3.75, locale: "es-PE" },
  MX: { code: "MXN", symbol: "$", rate: 18.5, locale: "es-MX" },
  CO: { code: "COP", symbol: "$", rate: 4100, locale: "es-CO" },
  AR: { code: "ARS", symbol: "$", rate: 1050, locale: "es-AR" },
  CL: { code: "CLP", symbol: "$", rate: 950, locale: "es-CL" },
  BR: { code: "BRL", symbol: "R$", rate: 5.4, locale: "pt-BR" },
  UY: { code: "UYU", symbol: "$U", rate: 40, locale: "es-UY" },
  PY: { code: "PYG", symbol: "₲", rate: 7300, locale: "es-PY" },
  BO: { code: "BOB", symbol: "Bs", rate: 6.9, locale: "es-BO" },
  EC: { code: "USD", symbol: "$", rate: 1, locale: "es-EC" },
  VE: { code: "VES", symbol: "Bs.S", rate: 100, locale: "es-VE" },
  CR: { code: "CRC", symbol: "₡", rate: 520, locale: "es-CR" },
  GT: { code: "GTQ", symbol: "Q", rate: 7.8, locale: "es-GT" },
  DO: { code: "DOP", symbol: "RD$", rate: 60, locale: "es-DO" },
  PA: { code: "USD", symbol: "$", rate: 1, locale: "es-PA" },
  SV: { code: "USD", symbol: "$", rate: 1, locale: "es-SV" },
  HN: { code: "HNL", symbol: "L", rate: 24.7, locale: "es-HN" },
  NI: { code: "NIO", symbol: "C$", rate: 36.7, locale: "es-NI" },
  CU: { code: "CUP", symbol: "$", rate: 24, locale: "es-CU" },
  PR: { code: "USD", symbol: "$", rate: 1, locale: "es-PR" },
  HT: { code: "HTG", symbol: "G", rate: 132, locale: "fr-HT" },
  JM: { code: "JMD", symbol: "J$", rate: 158, locale: "en-JM" },
  TT: { code: "TTD", symbol: "TT$", rate: 6.8, locale: "en-TT" },
  BB: { code: "BBD", symbol: "Bds$", rate: 2, locale: "en-BB" },
  BZ: { code: "BZD", symbol: "BZ$", rate: 2, locale: "en-BZ" },
  GY: { code: "GYD", symbol: "G$", rate: 209, locale: "en-GY" },
  SR: { code: "SRD", symbol: "Sr$", rate: 37, locale: "nl-SR" },

  // Norteamérica
  US: { code: "USD", symbol: "$", rate: 1, locale: "en-US" },
  CA: { code: "CAD", symbol: "C$", rate: 1.37, locale: "en-CA" },

  // Europa
  ES: { code: "EUR", symbol: "€", rate: 0.92, locale: "es-ES" },
  FR: { code: "EUR", symbol: "€", rate: 0.92, locale: "fr-FR" },
  DE: { code: "EUR", symbol: "€", rate: 0.92, locale: "de-DE" },
  IT: { code: "EUR", symbol: "€", rate: 0.92, locale: "it-IT" },
  PT: { code: "EUR", symbol: "€", rate: 0.92, locale: "pt-PT" },
  NL: { code: "EUR", symbol: "€", rate: 0.92, locale: "nl-NL" },
  BE: { code: "EUR", symbol: "€", rate: 0.92, locale: "nl-BE" },
  IE: { code: "EUR", symbol: "€", rate: 0.92, locale: "en-IE" },
  AT: { code: "EUR", symbol: "€", rate: 0.92, locale: "de-AT" },
  GR: { code: "EUR", symbol: "€", rate: 0.92, locale: "el-GR" },
  FI: { code: "EUR", symbol: "€", rate: 0.92, locale: "fi-FI" },
  LU: { code: "EUR", symbol: "€", rate: 0.92, locale: "fr-LU" },
  SK: { code: "EUR", symbol: "€", rate: 0.92, locale: "sk-SK" },
  SI: { code: "EUR", symbol: "€", rate: 0.92, locale: "sl-SI" },
  EE: { code: "EUR", symbol: "€", rate: 0.92, locale: "et-EE" },
  LV: { code: "EUR", symbol: "€", rate: 0.92, locale: "lv-LV" },
  LT: { code: "EUR", symbol: "€", rate: 0.92, locale: "lt-LT" },
  MT: { code: "EUR", symbol: "€", rate: 0.92, locale: "mt-MT" },
  CY: { code: "EUR", symbol: "€", rate: 0.92, locale: "el-CY" },
  HR: { code: "EUR", symbol: "€", rate: 0.92, locale: "hr-HR" },
  GB: { code: "GBP", symbol: "£", rate: 0.79, locale: "en-GB" },
  CH: { code: "CHF", symbol: "CHF", rate: 0.88, locale: "de-CH" },
  SE: { code: "SEK", symbol: "kr", rate: 10.5, locale: "sv-SE" },
  NO: { code: "NOK", symbol: "kr", rate: 10.8, locale: "nb-NO" },
  DK: { code: "DKK", symbol: "kr", rate: 6.9, locale: "da-DK" },
  PL: { code: "PLN", symbol: "zł", rate: 4.0, locale: "pl-PL" },
  CZ: { code: "CZK", symbol: "Kč", rate: 23, locale: "cs-CZ" },

  // Asia
  JP: { code: "JPY", symbol: "¥", rate: 155, locale: "ja-JP" },
  CN: { code: "CNY", symbol: "¥", rate: 7.2, locale: "zh-CN" },
  KR: { code: "KRW", symbol: "₩", rate: 1380, locale: "ko-KR" },
  IN: { code: "INR", symbol: "₹", rate: 83, locale: "en-IN" },
  ID: { code: "IDR", symbol: "Rp", rate: 15800, locale: "id-ID" },
  TH: { code: "THB", symbol: "฿", rate: 36, locale: "th-TH" },
  VN: { code: "VND", symbol: "₫", rate: 25000, locale: "vi-VN" },
  PH: { code: "PHP", symbol: "₱", rate: 58, locale: "en-PH" },
  MY: { code: "MYR", symbol: "RM", rate: 4.7, locale: "ms-MY" },
  SG: { code: "SGD", symbol: "S$", rate: 1.35, locale: "en-SG" },
  HK: { code: "HKD", symbol: "HK$", rate: 7.8, locale: "en-HK" },
  TW: { code: "TWD", symbol: "NT$", rate: 32, locale: "zh-TW" },
  AE: { code: "USD", symbol: "$", rate: 1, locale: "en-AE" },
  SA: { code: "USD", symbol: "$", rate: 1, locale: "ar-SA" },

  // Oceanía
  AU: { code: "AUD", symbol: "A$", rate: 1.52, locale: "en-AU" },
  NZ: { code: "NZD", symbol: "NZ$", rate: 1.65, locale: "en-NZ" },
};

const DEFAULT: CurrencyInfo = { code: "USD", symbol: "$", rate: 1, locale: "en-US" };

/** Formatea un monto USD a la moneda local del país (no-hook, útil dentro de .map()). */
export function formatLocalAmount(usdAmount: number, country: string): { formatted: string; isUsd: boolean } {
  const info = COUNTRY_TO_CURRENCY[country] || DEFAULT;
  const amount = roundNicely(usdAmount * info.rate);
  const isUsd = info.code === "USD";
  let formatted: string;
  try {
    formatted = new Intl.NumberFormat(info.locale, {
      style: "currency",
      currency: info.code,
      maximumFractionDigits: amount >= 100 ? 0 : 2,
    }).format(amount);
  } catch {
    formatted = `${info.symbol} ${amount.toLocaleString()}`;
  }
  return { formatted, isUsd };
}

export interface LocalPrice {
  country: string;
  currency: string;
  symbol: string;
  amount: number;
  formatted: string;
  isUsd: boolean;
  loading: boolean;
}

function roundNicely(amount: number): number {
  if (amount >= 1000) return Math.round(amount / 10) * 10;
  if (amount >= 100) return Math.round(amount);
  return Math.round(amount * 100) / 100;
}

/** Convierte un monto USD a la moneda local aproximada del visitante (por IP). */
export function useLocalCurrency(usdAmount: number): LocalPrice {
  const { country, loading } = useRegionTier();
  const info = COUNTRY_TO_CURRENCY[country] || DEFAULT;
  const amount = roundNicely(usdAmount * info.rate);
  const isUsd = info.code === "USD";

  let formatted: string;
  try {
    formatted = new Intl.NumberFormat(info.locale, {
      style: "currency",
      currency: info.code,
      maximumFractionDigits: amount >= 100 ? 0 : 2,
    }).format(amount);
  } catch {
    formatted = `${info.symbol} ${amount.toLocaleString()}`;
  }

  return {
    country,
    currency: info.code,
    symbol: info.symbol,
    amount,
    formatted,
    isUsd,
    loading,
  };
}
