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

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  t: Translations;
  formatPrice: (priceInUSD: number) => string;
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

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  // IMPORTANT: Default to "es" (Spanish) always - this is our target market
  // Google's crawler and most users should see Spanish first
  const savedLang = typeof window !== "undefined" ? localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null : null;
  const savedCurrency = typeof window !== "undefined" ? localStorage.getItem(CURRENCY_STORAGE_KEY) as Currency | null : null;
  
  const [language, setLanguageState] = useState<Language>(savedLang || "es");
  const [currency, setCurrencyState] = useState<Currency>(savedCurrency || "USD");
  const savedCountry = typeof window !== "undefined" ? localStorage.getItem("ilr_country") : null;
  const [countryCode, setCountryCode] = useState<string>(savedCountry || "US");

  // Detect country in background WITHOUT blocking render
  useEffect(() => {
    // If user already saved preferences, skip detection
    if (savedLang && savedCurrency) return;

    const detectCountry = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/", { 
          signal: AbortSignal.timeout(3000) 
        });
        if (response.ok) {
          const data = await response.json();
          const country = data.country_code || "US";
          setCountryCode(country);
          try { localStorage.setItem("ilr_country", country); } catch {}
          
          if (!savedLang) {
            const detectedLang = detectLanguageFromCountry(country);
            setLanguageState(detectedLang);
            console.log(`Country detected: ${country} → Language: ${detectedLang}`);
          }
          
          if (!savedCurrency) {
            const detectedCurrency = detectCurrency(country);
            setCurrencyState(detectedCurrency);
          }
        }
      } catch (error) {
        console.log("Could not detect country, keeping Spanish as default");
      }
    };

    detectCountry();
  }, []);

  // Save preferences when they change
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr);
    localStorage.setItem(CURRENCY_STORAGE_KEY, curr);
  };

  const t = translations[language];

  const formatPriceWithCurrency = (priceInUSD: number): string => {
    return formatPrice(priceInUSD, currency);
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
