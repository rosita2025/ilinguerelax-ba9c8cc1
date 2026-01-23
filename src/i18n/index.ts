import { es } from "./translations/es";
import { en } from "./translations/en";
import { fr } from "./translations/fr";
import { pt } from "./translations/pt";

export type Language = "es" | "en" | "fr" | "pt";
export type Currency = "USD" | "EUR" | "BRL" | "MXN" | "COP" | "ARS" | "GBP" | "CAD";

export const translations = {
  es,
  en,
  fr,
  pt,
};

export type Translations = typeof es;

// Language detection from browser
export const detectLanguage = (): Language => {
  if (typeof navigator === "undefined") return "es";
  
  const browserLang = navigator.language.toLowerCase().split("-")[0];
  
  if (browserLang === "en") return "en";
  if (browserLang === "fr") return "fr";
  if (browserLang === "pt") return "pt";
  
  return "es"; // Default to Spanish
};

// Country to currency mapping
const countryToCurrency: Record<string, Currency> = {
  // USD countries
  US: "USD",
  EC: "USD", // Ecuador uses USD
  SV: "USD", // El Salvador uses USD
  PA: "USD", // Panama uses USD
  
  // EUR countries
  ES: "EUR",
  FR: "EUR",
  DE: "EUR",
  IT: "EUR",
  PT: "EUR",
  NL: "EUR",
  BE: "EUR",
  AT: "EUR",
  IE: "EUR",
  FI: "EUR",
  GR: "EUR",
  
  // GBP
  GB: "GBP",
  UK: "GBP",
  
  // BRL
  BR: "BRL",
  
  // MXN
  MX: "MXN",
  
  // COP
  CO: "COP",
  
  // ARS
  AR: "ARS",
  
  // CAD
  CA: "CAD",
};

// Currency symbols and formatting
export const currencyConfig: Record<Currency, { symbol: string; position: "before" | "after"; decimals: number }> = {
  USD: { symbol: "$", position: "before", decimals: 2 },
  EUR: { symbol: "€", position: "after", decimals: 2 },
  BRL: { symbol: "R$", position: "before", decimals: 2 },
  MXN: { symbol: "$", position: "before", decimals: 2 },
  COP: { symbol: "$", position: "before", decimals: 0 },
  ARS: { symbol: "$", position: "before", decimals: 0 },
  GBP: { symbol: "£", position: "before", decimals: 2 },
  CAD: { symbol: "$", position: "before", decimals: 2 },
};

// Exchange rates from USD (approximate - would ideally fetch from API)
export const exchangeRates: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  BRL: 4.95,
  MXN: 17.15,
  COP: 3950,
  ARS: 850,
  GBP: 0.79,
  CAD: 1.36,
};

// Detect currency from country
export const detectCurrency = (countryCode: string): Currency => {
  return countryToCurrency[countryCode.toUpperCase()] || "USD";
};

// Format price with currency
export const formatPrice = (priceInUSD: number, currency: Currency): string => {
  const config = currencyConfig[currency];
  const rate = exchangeRates[currency];
  const convertedPrice = priceInUSD * rate;
  
  const formattedNumber = convertedPrice.toLocaleString(undefined, {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  });
  
  if (config.position === "before") {
    return `${config.symbol}${formattedNumber}`;
  }
  return `${formattedNumber} ${config.symbol}`;
};

// Language names for selector
export const languageNames: Record<Language, string> = {
  es: "Español",
  en: "English",
  fr: "Français",
  pt: "Português",
};

// Language flags
export const languageFlags: Record<Language, string> = {
  es: "🇪🇸",
  en: "🇬🇧",
  fr: "🇫🇷",
  pt: "🇧🇷",
};
