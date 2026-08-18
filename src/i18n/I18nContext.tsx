import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  Language,
  Currency,
  Translations,
  translations,
  detectLanguage,
  detectLanguageFromCountry,
  detectCurrency,
  formatPrice,
  languageNames,
  languageFlags,
} from "./index";
import { detectCountryByIp } from "@/lib/geoDetection";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  t: Translations;
  formatPrice: (priceInUSD: number, overrides?: any, localUsdPrices?: any) => string;
  countryCode: string;
  languageNames: typeof languageNames;
  languageFlags: typeof languageFlags;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "ilingue_language";
const CURRENCY_STORAGE_KEY = "ilingue_currency";

interface I18nProviderProps {
  children: ReactNode;
}

// Subdominios activos → país ISO (misma tabla que useRegionTier)
const SUBDOMAIN_TO_COUNTRY: Record<string, string> = {
  US: "US", PE: "PE", MX: "MX", UK: "GB", EU: "ES",
  CA: "CA", AU: "AU", BR: "BR", CO: "CO", AR: "AR", CL: "CL",
  ES: "ES", FR: "FR", DE: "DE", IT: "IT", PT: "PT",
  JP: "JP", KR: "KR", CN: "CN", IN: "IN",
};

function countryFromSubdomain(): string {
  if (typeof window === "undefined") return "";
  const parts = window.location.hostname.toLowerCase().split(".");
  if (parts.length < 3) return "";
  const sub = parts[0].toUpperCase();
  if (sub.length !== 2) return "";
  return SUBDOMAIN_TO_COUNTRY[sub] || "";
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  // Subdominio fuerza país + idioma (us. → EN, uk. → EN, eu. → ES, pe. → ES, mx. → ES).
  const subCountry = typeof window !== "undefined" ? countryFromSubdomain() : "";
  const savedLang = (() => {
    try { return typeof window !== "undefined" ? localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null : null; }
    catch { return null; }
  })();
  const savedCurrency = (() => {
    try { return typeof window !== "undefined" ? localStorage.getItem(CURRENCY_STORAGE_KEY) as Currency | null : null; }
    catch { return null; }
  })();

  // Idioma inicial: subdominio > guardado > idioma del navegador (respeta al usuario
  // aunque viaje: un hispanohablante en Portugal sigue viendo español).
  const initialLang: Language = subCountry
    ? detectLanguageFromCountry(subCountry)
    : (savedLang || detectLanguage());

  const savedCountry = (() => {
    try { return typeof window !== "undefined" ? localStorage.getItem("ilr_country") : null; }
    catch { return null; }
  })();
  const initialCurrency: Currency = subCountry
    ? detectCurrency(subCountry)
    : savedCountry
      ? detectCurrency(savedCountry)
      : (savedCurrency || "USD");
  const [language, setLanguageState] = useState<Language>(initialLang);
  const [currency, setCurrencyState] = useState<Currency>(initialCurrency);
  const [countryCode, setCountryCode] = useState<string>(subCountry || savedCountry || "US");

  // Detect country in background WITHOUT blocking render
  useEffect(() => {
    // Subdominio ya define el país → no llamar IP.
    if (subCountry) {
      try { localStorage.setItem("ilr_country", subCountry); } catch {}
      return;
    }
    const detectCountry = async () => {
      try {
        const detected = await detectCountryByIp({ fallbackCountry: "US" });
        const country = detected?.countryCode || "US";
        setCountryCode(country);
        try { localStorage.setItem("ilr_country", country); } catch {}

        // IMPORTANTE: NO sobrescribir el idioma con el país por IP si el
        // navegador ya declara un idioma soportado. Un hispanohablante que
        // viaja por Portugal/Brasil/Francia debe seguir viendo español para
        // que el checkout y los correos de carrito abandonado le lleguen en
        // su idioma real. Sólo usamos el país cuando el navegador no
        // declara un idioma útil (no hay savedLang y navigator.language
        // cae al default "es").
        if (!savedLang && typeof navigator !== "undefined") {
          const browserLang = navigator.language?.toLowerCase().split("-")[0];
          const supported = browserLang === "en" || browserLang === "es" || browserLang === "fr" || browserLang === "pt";
          if (!supported) {
            const detectedLang = detectLanguageFromCountry(country);
            setLanguageState(detectedLang);
          }
        }

        const detectedCurrency = detectCurrency(country);
        setCurrencyState(detectedCurrency);
        try { localStorage.setItem(CURRENCY_STORAGE_KEY, detectedCurrency); } catch { /* ignore */ }
      } catch (error) {
        setCountryCode("US");
      }
    };

    detectCountry();
  }, []);


  // Save preferences when they change
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, lang); } catch { /* ignore */ }
  };

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr);
    try { localStorage.setItem(CURRENCY_STORAGE_KEY, curr); } catch { /* ignore */ }
  };

  const t = translations[language];

  const formatPriceWithCurrency = (priceInUSD: number, overrides?: any, localUsdPrices?: any): string => {
    return formatPrice(priceInUSD, currency, overrides, localUsdPrices);
  };

  const value: I18nContextType = {
    language,
    setLanguage,
    currency,
    setCurrency,
    t,
    formatPrice: formatPriceWithCurrency,
    countryCode,
    languageNames,
    languageFlags,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
};
