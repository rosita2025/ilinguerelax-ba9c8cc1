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
  const [language, setLanguageState] = useState<Language>("es");
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [countryCode, setCountryCode] = useState<string>("US");
  const [isInitialized, setIsInitialized] = useState(false);

  // Detect language and country on mount
  useEffect(() => {
    const initializeI18n = async () => {
      // Check for saved preferences
      const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
      const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY) as Currency | null;
      
      // If user has manually saved both preferences, use them
      if (savedLang && savedCurrency) {
        setLanguageState(savedLang);
        setCurrencyState(savedCurrency);
        setIsInitialized(true);
        return;
      }

      // Try to detect country from IP using a free geolocation API
      try {
        const response = await fetch("https://ipapi.co/json/", { 
          signal: AbortSignal.timeout(3000) 
        });
        if (response.ok) {
          const data = await response.json();
          const country = data.country_code || "US";
          setCountryCode(country);
          
          // Detect language based on country (not browser)
          if (!savedLang) {
            const detectedLang = detectLanguageFromCountry(country);
            setLanguageState(detectedLang);
            console.log(`Country detected: ${country} → Language: ${detectedLang}`);
          } else {
            setLanguageState(savedLang);
          }
          
          // Detect currency based on country
          if (!savedCurrency) {
            const detectedCurrency = detectCurrency(country);
            setCurrencyState(detectedCurrency);
          } else {
            setCurrencyState(savedCurrency);
          }
        } else {
          // Fallback to browser language if IP detection fails
          const detectedLang = savedLang || detectLanguage();
          setLanguageState(detectedLang);
        }
      } catch (error) {
        console.log("Could not detect country, using browser language as fallback");
        // Fallback to browser language detection
        const detectedLang = savedLang || detectLanguage();
        setLanguageState(detectedLang);
        
        // Try timezone-based detection for currency
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezone.startsWith("Europe/")) {
          setCurrencyState(savedCurrency || "EUR");
        } else if (timezone.startsWith("America/Sao_Paulo") || timezone.includes("Brazil")) {
          setCurrencyState(savedCurrency || "BRL");
        }
      }

      setIsInitialized(true);
    };

    initializeI18n();
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

  // Don't render until initialized to prevent flash
  if (!isInitialized) {
    return null;
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
};
