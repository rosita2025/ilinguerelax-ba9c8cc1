import { es } from "./translations/es";
import { en } from "./translations/en";
import { fr } from "./translations/fr";
import { pt } from "./translations/pt";
import { it } from "./translations/it";

export type Language = "es" | "en" | "fr" | "pt" | "it";
export type Currency =
  | "USD" | "EUR" | "GBP" | "CAD" | "AUD"
  | "BRL" | "MXN" | "COP" | "ARS" | "PEN"
  | "CLP" | "BOB" | "CRC" | "DOP" | "GTQ" | "HNL" | "NIO" | "CUP" | "PYG" | "UYU" | "HTG" | "VES"
  | "CHF" | "SEK" | "NOK" | "DKK" | "PLN" | "CZK"
  | "JPY" | "KRW" | "CNY" | "INR" | "NZD" | "SGD" | "HKD" | "TWD" | "IDR" | "MYR"
  | "ZAR" | "NGN" | "EGP" | "KES" | "GHS" | "TZS" | "UGX" | "MAD"
  // Resto de las 79 monedas del catálogo (admin /admin/monedas)
  | "JMD" | "TTD" | "RON" | "HUF" | "ISK" | "RSD" | "ALL" | "BAM" | "MKD" | "MDL" | "UAH" | "TRY" | "THB" | "PHP" | "VND" | "PKR" | "BDT" | "LKR" | "NPR" | "KZT" | "UZS" | "AED" | "SAR" | "QAR" | "KWD" | "BHD" | "OMR" | "ILS" | "JOD" | "TND" | "DZD" | "XOF" | "XAF" | "ETB" | "FJD" | "PGK";

export const translations = {
  es,
  en,
  fr,
  pt,
  it,
};

export type Translations = typeof es;

// Language detection from browser (fallback)
export const detectLanguage = (): Language => {
  if (typeof navigator === "undefined") return "es";
  
  const browserLang = navigator.language.toLowerCase().split("-")[0];
  
  if (browserLang === "en") return "en";
  if (browserLang === "fr") return "fr";
  if (browserLang === "pt") return "pt";
  if (browserLang === "it") return "it";
  
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
  IT: "it", // Italy
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

  // Europa fuera de la Eurozona: también ven y pagan en EUROS (un solo precio de Europa en euros).
  GB: "EUR", UK: "EUR", CH: "EUR", SE: "EUR", NO: "EUR", DK: "EUR",
  PL: "EUR", CZ: "EUR", RO: "EUR", HU: "EUR", BG: "EUR",

  // Otras principales
  BR: "BRL", MX: "MXN", CO: "COP", AR: "ARS", CA: "CAD", VE: "VES",
  AU: "AUD", NZ: "NZD", PE: "PEN",

  // LATAM Hotmart (moneda local)
  CL: "CLP", BO: "BOB", CR: "CRC", DO: "DOP",
  GT: "GTQ", HN: "HNL", NI: "NIO", CU: "CUP", PY: "PYG", UY: "UYU", HT: "HTG",

  // Asia principal
  JP: "JPY", KR: "KRW", CN: "CNY", IN: "INR", SG: "SGD", HK: "HKD", TW: "TWD", ID: "IDR", MY: "MYR",
  
  // Africa
  ZA: "ZAR", NG: "NGN", EG: "EGP", KE: "KES", GH: "GHS", TZ: "TZS", UG: "UGX", MA: "MAD",

  // Resto del mundo con moneda local (catálogo de 79 monedas). KW, BH, OM, JO y TN (3 decimales) no las cobra Stripe: ven US$.
  JM: "JMD", TT: "TTD", TH: "THB", PH: "PHP", VN: "VND", PK: "PKR", BD: "BDT", LK: "LKR", NP: "NPR", KZ: "KZT", UZ: "UZS", AE: "AED", SA: "SAR", QA: "QAR", IL: "ILS", DZ: "DZD", ET: "ETB", FJ: "FJD", PG: "PGK", SN: "XOF", CI: "XOF", BF: "XOF", ML: "XOF", NE: "XOF", TG: "XOF", BJ: "XOF", GW: "XOF", CM: "XAF", GA: "XAF", CG: "XAF", TD: "XAF", CF: "XAF", GQ: "XAF",
  // Europa: otros países europeos también en euros.
  IS: "EUR", RS: "EUR", AL: "EUR", BA: "EUR", MK: "EUR", MD: "EUR", UA: "EUR", TR: "EUR", ME: "EUR", AD: "EUR", MC: "EUR", SM: "EUR", VA: "EUR", LI: "EUR",
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
  IDR: { symbol: "Rp ", position: "before", decimals: 0 },
  MYR: { symbol: "RM ", position: "before", decimals: 2 },
  ZAR: { symbol: "R ", position: "before", decimals: 2 },
  NGN: { symbol: "₦", position: "before", decimals: 2 },
  EGP: { symbol: "E£", position: "before", decimals: 2 },
  KES: { symbol: "KSh ", position: "before", decimals: 2 },
  GHS: { symbol: "GH₵", position: "before", decimals: 2 },
  TZS: { symbol: "TSh ", position: "before", decimals: 2 },
  UGX: { symbol: "USh ", position: "before", decimals: 0 },
  MAD: { symbol: "MAD ", position: "before", decimals: 2 },
  JMD: { symbol: "J$", position: "before", decimals: 2 },
  TTD: { symbol: "TT$", position: "before", decimals: 2 },
  RON: { symbol: " lei", position: "after", decimals: 2 },
  HUF: { symbol: " Ft", position: "after", decimals: 0 },
  ISK: { symbol: " kr", position: "after", decimals: 0 },
  RSD: { symbol: " din", position: "after", decimals: 0 },
  ALL: { symbol: " L", position: "after", decimals: 0 },
  BAM: { symbol: " KM", position: "after", decimals: 2 },
  MKD: { symbol: " ден", position: "after", decimals: 0 },
  MDL: { symbol: " L", position: "after", decimals: 2 },
  UAH: { symbol: "₴", position: "before", decimals: 2 },
  TRY: { symbol: "₺", position: "before", decimals: 2 },
  THB: { symbol: "฿", position: "before", decimals: 2 },
  PHP: { symbol: "₱", position: "before", decimals: 2 },
  VND: { symbol: " ₫", position: "after", decimals: 0 },
  PKR: { symbol: "Rs ", position: "before", decimals: 0 },
  BDT: { symbol: "৳", position: "before", decimals: 0 },
  LKR: { symbol: "Rs ", position: "before", decimals: 0 },
  NPR: { symbol: "Rs ", position: "before", decimals: 0 },
  KZT: { symbol: "₸", position: "before", decimals: 0 },
  UZS: { symbol: " so'm", position: "after", decimals: 0 },
  AED: { symbol: "AED ", position: "before", decimals: 2 },
  SAR: { symbol: "SAR ", position: "before", decimals: 2 },
  QAR: { symbol: "QAR ", position: "before", decimals: 2 },
  KWD: { symbol: "KWD ", position: "before", decimals: 3 },
  BHD: { symbol: "BHD ", position: "before", decimals: 3 },
  OMR: { symbol: "OMR ", position: "before", decimals: 3 },
  ILS: { symbol: "₪", position: "before", decimals: 2 },
  JOD: { symbol: "JOD ", position: "before", decimals: 3 },
  TND: { symbol: "TND ", position: "before", decimals: 3 },
  DZD: { symbol: "DA ", position: "before", decimals: 0 },
  XOF: { symbol: " CFA", position: "after", decimals: 0 },
  XAF: { symbol: " FCFA", position: "after", decimals: 0 },
  ETB: { symbol: "Br ", position: "before", decimals: 0 },
  FJD: { symbol: "FJ$", position: "before", decimals: 2 },
  PGK: { symbol: "K ", position: "before", decimals: 2 },
};

// Exchange rates from USD (updated August 2026 — exact)
// These are fallback values. Use useLivePrices() or fetch from DB when possible.
export let exchangeRates: Record<Currency, number> = {
  USD: 1,
  EUR: 0.90,
  BRL: 5.50,
  MXN: 20.5, 
  COP: 4500,
  ARS: 1000, 
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
  IDR: 16000,
  MYR: 4.5,
  ZAR: 18.5,
  NGN: 1550,
  EGP: 48,
  KES: 130,
  GHS: 15,
  TZS: 2700,
  UGX: 3700,
  MAD: 10,
  JMD: 157,
  TTD: 6.8,
  RON: 4.6,
  HUF: 360,
  ISK: 138,
  RSD: 108,
  ALL: 94,
  BAM: 1.8,
  MKD: 56,
  MDL: 17.5,
  UAH: 41,
  TRY: 41,
  THB: 35,
  PHP: 57,
  VND: 25400,
  PKR: 280,
  BDT: 120,
  LKR: 300,
  NPR: 135,
  KZT: 520,
  UZS: 12800,
  AED: 3.67,
  SAR: 3.75,
  QAR: 3.64,
  KWD: 0.31,
  BHD: 0.377,
  OMR: 0.385,
  ILS: 3.7,
  JOD: 0.71,
  TND: 3.1,
  DZD: 134,
  XOF: 600,
  XAF: 600,
  ETB: 120,
  FJD: 2.25,
  PGK: 4,
};

/**
 * Updates the global exchange rates map with live data from the database.
 * Used by LivePricesProvider to ensure frontend matches backend.
 */
export const updateExchangeRates = (newRates: Partial<Record<Currency, number>>) => {
  exchangeRates = { ...exchangeRates, ...newRates };
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
  "MXN", "ARS", "COP", "CLP", "BRL", "CRC", "CAD", "AUD", "NZD", "SGD", "HKD", "TWD",
] as unknown as Currency[]);

/**
 * Formats a raw number with the LATAM/European convention: dot for thousands,
 * comma for decimals (e.g. 1.889,25). Used everywhere a local-currency amount
 * is printed so cart, checkout and product pages never disagree.
 */
export const formatAmountLocalized = (amount: number, decimals: number): string => {
  const formatted = amount.toLocaleString("es-ES", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  });
  return formatted;
};

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
  localUsdPrices?: Partial<Record<Currency, number>> | null
): string => {
  const override = overrides && overrides[currency];
  const hasOverride = typeof override === "number" && override > 0;
  
  // New: use regional USD override if present
  const regionalUsd = localUsdPrices && localUsdPrices[currency];
  const activeUsd = typeof regionalUsd === "number" && regionalUsd > 0 ? regionalUsd : priceInUSD;

  const rate = exchangeRates[currency];
  const convertedPrice = hasOverride ? (override as number) : activeUsd * rate;

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
  it: "Italiano",
};

// Language flags
export const languageFlags: Record<Language, string> = {
  es: "🇪🇸",
  en: "🇬🇧",
  fr: "🇫🇷",
  pt: "🇧🇷",
  it: "🇮🇹",
};

export { useI18n } from "./I18nContext";
