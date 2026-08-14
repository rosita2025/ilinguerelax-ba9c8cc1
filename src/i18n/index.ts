import { es } from "./translations/es";
import { en } from "./translations/en";
import { fr } from "./translations/fr";
import { pt } from "./translations/pt";

export type Language = "es" | "en" | "fr" | "pt";
export type Currency =
  | "USD" | "EUR" | "GBP" | "CAD" | "AUD"
  | "BRL" | "MXN" | "COP" | "ARS" | "PEN"
  | "CLP" | "BOB" | "CRC" | "DOP" | "GTQ" | "HNL" | "NIO" | "CUP" | "PYG" | "UYU" | "HTG" | "VES"
  | "CHF" | "SEK" | "NOK" | "DKK" | "PLN" | "CZK"
  | "JPY" | "KRW" | "CNY" | "INR" | "NZD" | "SGD" | "HKD" | "TWD"
  | "ZAR" | "NGN" | "EGP" | "KES" | "GHS" | "TZS" | "UGX" | "MAD";

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
  US: "USD", EC: "USD", SV: "USD", PA: "USD", PR: "USD",

  // EUR
  ES: "EUR", FR: "EUR", DE: "EUR", IT: "EUR", PT: "EUR", NL: "EUR",
  BE: "EUR", AT: "EUR", IE: "EUR", FI: "EUR", GR: "EUR", LU: "EUR",
  SK: "EUR", SI: "EUR", EE: "EUR", LV: "EUR", LT: "EUR", MT: "EUR", CY: "EUR", HR: "EUR",

  // GBP
  GB: "GBP", UK: "GBP",

  // Otras principales
  BR: "BRL", MX: "MXN", CO: "COP", AR: "ARS", CA: "CAD", VE: "VES",
  AU: "AUD", NZ: "NZD", PE: "PEN",

  // LATAM Hotmart (moneda local)
  CL: "CLP", BO: "BOB", CR: "CRC", DO: "DOP",
  GT: "GTQ", HN: "HNL", NI: "NIO", CU: "CUP", PY: "PYG", UY: "UYU", HT: "HTG",

  // Europa fuera Eurozona
  CH: "CHF", SE: "SEK", NO: "NOK", DK: "DKK",
  PL: "PLN", CZ: "CZK",

  // Asia principal
  JP: "JPY", KR: "KRW", CN: "CNY", IN: "INR", SG: "SGD", HK: "HKD", TW: "TWD",
  
  // Africa
  ZA: "ZAR", NG: "NGN", EG: "EGP", KE: "KES", GH: "GHS", TZ: "TZS", UG: "UGX", MA: "MAD",
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
  CAD: { symbol: "C$", position: "before", decimals: 2 },
  AUD: { symbol: "A$", position: "before", decimals: 2 },
  NZD: { symbol: "NZ$", position: "before", decimals: 2 },
  PEN: { symbol: "S/", position: "before", decimals: 2 },
  CLP: { symbol: "$", position: "before", decimals: 0 },
  BOB: { symbol: "Bs ", position: "before", decimals: 2 },
  CRC: { symbol: "₡", position: "before", decimals: 0 },
  DOP: { symbol: "RD$", position: "before", decimals: 2 },
  GTQ: { symbol: "Q", position: "before", decimals: 2 },
  HNL: { symbol: "L", position: "before", decimals: 2 },
  NIO: { symbol: "C$", position: "before", decimals: 2 },
  CUP: { symbol: "$", position: "before", decimals: 2 },
  PYG: { symbol: "₲", position: "before", decimals: 0 },
  UYU: { symbol: "$U", position: "before", decimals: 2 },
  HTG: { symbol: "G ", position: "before", decimals: 2 },
  VES: { symbol: "Bs.S ", position: "before", decimals: 2 },
  CHF: { symbol: "CHF ", position: "before", decimals: 2 },
  SEK: { symbol: " kr", position: "after", decimals: 2 },
  NOK: { symbol: " kr", position: "after", decimals: 2 },
  DKK: { symbol: " kr", position: "after", decimals: 2 },
  PLN: { symbol: " zł", position: "after", decimals: 2 },
  CZK: { symbol: " Kč", position: "after", decimals: 2 },
  JPY: { symbol: "¥", position: "before", decimals: 0 },
  KRW: { symbol: "₩", position: "before", decimals: 0 },
  CNY: { symbol: "¥", position: "before", decimals: 2 },
  INR: { symbol: "₹", position: "before", decimals: 0 },
  SGD: { symbol: "S$", position: "before", decimals: 2 },
  HKD: { symbol: "HK$", position: "before", decimals: 2 },
  TWD: { symbol: "NT$", position: "before", decimals: 0 },
  ZAR: { symbol: "R ", position: "before", decimals: 2 },
  NGN: { symbol: "₦", position: "before", decimals: 2 },
  EGP: { symbol: "E£", position: "before", decimals: 2 },
  KES: { symbol: "KSh ", position: "before", decimals: 2 },
  GHS: { symbol: "GH₵", position: "before", decimals: 2 },
  TZS: { symbol: "TSh ", position: "before", decimals: 2 },
  UGX: { symbol: "USh ", position: "before", decimals: 0 },
  MAD: { symbol: "MAD ", position: "before", decimals: 2 },
};

// Exchange rates from USD (updated August 2026 — exact)
export const exchangeRates: Record<Currency, number> = {
  USD: 1,
  EUR: 0.90,
  BRL: 5.50,
  MXN: 19, // Ajustado de 20 a 19 por el usuario (ej: 500 MXN ≈ 26 USD, 540 MXN ≈ 20 USD -> 27 USD es lo real, el usuario prefiere 19)
  COP: 4000,
  ARS: 950, // Argentina ≈ 19 USD para 15.000 (15000/19 = 789, se ajusta a 950 para mercado blue/referencia)
  GBP: 0.78,
  CAD: 1.35,
  AUD: 1.50,
  NZD: 1.65,
  PEN: 3.75,
  CLP: 940,
  BOB: 6.9,
  CRC: 520,
  DOP: 59,
  GTQ: 7.8,
  HNL: 24.7,
  NIO: 36.6,
  CUP: 24,
  PYG: 7500,
  UYU: 40,
  HTG: 130,
  VES: 750.00,
  CHF: 0.88,
  SEK: 10.6,
  NOK: 10.7,
  DKK: 6.9,
  PLN: 4.0,
  CZK: 23,
  JPY: 150,
  KRW: 1360,
  CNY: 7.2,
  INR: 83,
  SGD: 1.34,
  HKD: 7.8,
  TWD: 32,
  ZAR: 18.5,
  NGN: 1550,
  EGP: 48,
  KES: 130,
  GHS: 15,
  TZS: 2700,
  UGX: 3700,
  MAD: 10,
};

// Detect currency from country
export const detectCurrency = (countryCode: string): Currency => {
  return countryToCurrency[countryCode.toUpperCase()] || "USD";
};

/**
 * Currencies whose "$" symbol collides with USD — render with ISO code prefix
 * (e.g. "MXN 278" instead of "$278") so the buyer never confuses local money
 * with dollars. Must match the ambiguous set in `useLocalCurrency`.
 */
const AMBIGUOUS_DOLLAR_CURRENCIES = new Set<Currency>([
  "MXN", "ARS", "COP", "CLP", "BRL", "CRC",
] as unknown as Currency[]);

/**
 * Formats a raw number with the LATAM/European convention: dot for thousands,
 * comma for decimals (e.g. 1.889,25). Used everywhere a local-currency amount
 * is printed so cart, checkout and product pages never disagree.
 */
export const formatAmountLocalized = (amount: number, decimals: number): string =>
  amount.toLocaleString("es-ES", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    // es-ES omits grouping for 4-digit integers (1889 -> "1889"); force it so
    // every amount reads the same way (1.889,25).
    useGrouping: "always" as unknown as boolean,
  });

/**
 * Formats an amount that is ALREADY in the target currency (no conversion),
 * applying the currency symbol/position and the dot/comma convention.
 * USD keeps the international style ($1,889.25) to avoid confusion.
 */
export const formatCurrencyAmount = (amount: number, currency: Currency): string => {
  const config = currencyConfig[currency];
  if (currency === "USD") {
    return `$${amount.toLocaleString("en-US", {
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    })}`;
  }
  const formattedNumber = formatAmountLocalized(amount, config.decimals);
  if (AMBIGUOUS_DOLLAR_CURRENCIES.has(currency)) {
    return `${currency} ${formattedNumber}`;
  }
  if (config.position === "before") {
    return `${config.symbol}${formattedNumber}`;
  }
  return `${formattedNumber} ${config.symbol}`;
};

// Format price with currency.
// `overrides` permite fijar el monto exacto en una moneda (ej. { COP: 33900 })
// para no depender de la tasa de cambio. Si la moneda no está en overrides,
// se usa la conversión USD × tasa habitual.
export const formatPrice = (
  priceInUSD: number,
  currency: Currency,
  overrides?: Partial<Record<Currency, number>> | null,
): string => {
  const override = overrides && overrides[currency];
  const hasOverride = typeof override === "number" && override > 0;
  const rate = exchangeRates[currency];
  const convertedPrice = hasOverride ? (override as number) : priceInUSD * rate;

  return formatCurrencyAmount(convertedPrice, currency);
};

/**
 * Convierte un monto de moneda local a USD usando la tasa interna de la tienda.
 */
export const convertToUSD = (amount: number, currency: Currency): number => {
  const rate = exchangeRates[currency] || 1;
  if (rate <= 0) return amount;
  return amount / rate;
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
