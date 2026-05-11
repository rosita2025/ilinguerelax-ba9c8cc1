import { es } from "./translations/es";
import { en } from "./translations/en";
import { fr } from "./translations/fr";
import { pt } from "./translations/pt";

export type Language = "es" | "en" | "fr" | "pt";
export type Currency = "USD" | "EUR" | "BRL" | "MXN" | "COP" | "ARS" | "GBP" | "CAD" | "AUD";

export const translations = {
  es,
  en,
  fr,
  pt,
};

export type Translations = typeof es;

// Language detection from browser (fallback)
export const detectLanguage = (): Language => {
  if (typeof navigator === "undefined") return "es";
  
  const browserLang = navigator.language.toLowerCase().split("-")[0];
  
  if (browserLang === "en") return "en";
  if (browserLang === "fr") return "fr";
  if (browserLang === "pt") return "pt";
  
  return "es"; // Default to Spanish
};

// Country to language mapping based on geographic location
const countryToLanguage: Record<string, Language> = {
  // Spanish-speaking countries (Latin America + Spain)
  ES: "es", // Spain
  MX: "es", // Mexico
  AR: "es", // Argentina
  CO: "es", // Colombia
  PE: "es", // Peru
  VE: "es", // Venezuela
  CL: "es", // Chile
  EC: "es", // Ecuador
  GT: "es", // Guatemala
  CU: "es", // Cuba
  BO: "es", // Bolivia
  DO: "es", // Dominican Republic
  HN: "es", // Honduras
  PY: "es", // Paraguay
  SV: "es", // El Salvador
  NI: "es", // Nicaragua
  CR: "es", // Costa Rica
  PA: "es", // Panama
  UY: "es", // Uruguay
  PR: "es", // Puerto Rico
  
  // English-speaking countries
  US: "en", // United States
  GB: "en", // United Kingdom
  UK: "en", // United Kingdom (alt)
  AU: "en", // Australia
  CA: "en", // Canada
  NZ: "en", // New Zealand
  IE: "en", // Ireland
  ZA: "en", // South Africa
  
  // French-speaking countries
  FR: "fr", // France
  BE: "fr", // Belgium (French)
  CH: "fr", // Switzerland (could be French)
  LU: "fr", // Luxembourg
  MC: "fr", // Monaco
  
  // Portuguese-speaking countries
  BR: "pt", // Brazil
  PT: "pt", // Portugal
  AO: "pt", // Angola
  MZ: "pt", // Mozambique
  
  // European countries - default to English
  DE: "en", // Germany
  IT: "en", // Italy
  NL: "en", // Netherlands
  AT: "en", // Austria
  PL: "en", // Poland
  SE: "en", // Sweden
  NO: "en", // Norway
  DK: "en", // Denmark
  FI: "en", // Finland
  GR: "en", // Greece
  CZ: "en", // Czech Republic
  RO: "en", // Romania
  HU: "en", // Hungary
  SK: "en", // Slovakia
  BG: "en", // Bulgaria
  HR: "en", // Croatia
};

// Detect language from country code
export const detectLanguageFromCountry = (countryCode: string): Language => {
  const upperCountry = countryCode.toUpperCase();
  return countryToLanguage[upperCountry] || "en"; // Default to English for unknown countries
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

  // AUD
  AU: "AUD",
  NZ: "AUD",
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
  AUD: { symbol: "A$", position: "before", decimals: 2 },
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
  AUD: 1.52,
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
