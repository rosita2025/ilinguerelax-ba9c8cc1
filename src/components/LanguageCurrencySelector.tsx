import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/I18nContext";
import { Language, Currency } from "@/i18n";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";
import { CampaignCurrency } from "@/hooks/useCampaignPrice";

type CountryOption = {
  code: string;
  flag: string;
  label: string;
  currency: CampaignCurrency;
  region: "Americas" | "Europe" | "Asia-Pacific" | "Middle East & Africa";
};

// Full worldwide list — grouped by region for the dropdown.
const COUNTRIES: CountryOption[] = [
  // Americas
  { code: "US", flag: "🇺🇸", label: "United States", currency: "USD", region: "Americas" },
  { code: "CA", flag: "🇨🇦", label: "Canada", currency: "CAD", region: "Americas" },
  { code: "MX", flag: "🇲🇽", label: "México", currency: "MXN", region: "Americas" },
  { code: "BR", flag: "🇧🇷", label: "Brasil", currency: "BRL", region: "Americas" },
  { code: "AR", flag: "🇦🇷", label: "Argentina", currency: "ARS", region: "Americas" },
  { code: "CL", flag: "🇨🇱", label: "Chile", currency: "CLP", region: "Americas" },
  { code: "CO", flag: "🇨🇴", label: "Colombia", currency: "COP", region: "Americas" },
  { code: "PE", flag: "🇵🇪", label: "Perú", currency: "PEN", region: "Americas" },
  { code: "UY", flag: "🇺🇾", label: "Uruguay", currency: "UYU", region: "Americas" },
  { code: "BO", flag: "🇧🇴", label: "Bolivia", currency: "BOB", region: "Americas" },
  { code: "PY", flag: "🇵🇾", label: "Paraguay", currency: "PYG", region: "Americas" },
  { code: "GT", flag: "🇬🇹", label: "Guatemala", currency: "GTQ", region: "Americas" },
  { code: "DO", flag: "🇩🇴", label: "Rep. Dominicana", currency: "DOP", region: "Americas" },
  { code: "CR", flag: "🇨🇷", label: "Costa Rica", currency: "CRC", region: "Americas" },
  { code: "HN", flag: "🇭🇳", label: "Honduras", currency: "HNL", region: "Americas" },
  { code: "NI", flag: "🇳🇮", label: "Nicaragua", currency: "NIO", region: "Americas" },
  { code: "VE", flag: "🇻🇪", label: "Venezuela", currency: "VES", region: "Americas" },
  { code: "PA", flag: "🇵🇦", label: "Panamá", currency: "USD", region: "Americas" },
  { code: "EC", flag: "🇪🇨", label: "Ecuador", currency: "USD", region: "Americas" },
  { code: "SV", flag: "🇸🇻", label: "El Salvador", currency: "USD", region: "Americas" },
  // Europe
  { code: "GB", flag: "🇬🇧", label: "United Kingdom", currency: "GBP", region: "Europe" },
  { code: "IE", flag: "🇮🇪", label: "Ireland", currency: "EUR", region: "Europe" },
  { code: "ES", flag: "🇪🇸", label: "España", currency: "EUR", region: "Europe" },
  { code: "FR", flag: "🇫🇷", label: "France", currency: "EUR", region: "Europe" },
  { code: "DE", flag: "🇩🇪", label: "Deutschland", currency: "EUR", region: "Europe" },
  { code: "IT", flag: "🇮🇹", label: "Italia", currency: "EUR", region: "Europe" },
  { code: "PT", flag: "🇵🇹", label: "Portugal", currency: "EUR", region: "Europe" },
  { code: "NL", flag: "🇳🇱", label: "Nederland", currency: "EUR", region: "Europe" },
  { code: "BE", flag: "🇧🇪", label: "België", currency: "EUR", region: "Europe" },
  { code: "AT", flag: "🇦🇹", label: "Österreich", currency: "EUR", region: "Europe" },
  { code: "FI", flag: "🇫🇮", label: "Suomi", currency: "EUR", region: "Europe" },
  { code: "GR", flag: "🇬🇷", label: "Ελλάδα", currency: "EUR", region: "Europe" },
  { code: "CH", flag: "🇨🇭", label: "Schweiz", currency: "CHF", region: "Europe" },
  { code: "SE", flag: "🇸🇪", label: "Sverige", currency: "SEK", region: "Europe" },
  { code: "NO", flag: "🇳🇴", label: "Norge", currency: "NOK", region: "Europe" },
  { code: "DK", flag: "🇩🇰", label: "Danmark", currency: "DKK", region: "Europe" },
  // Asia-Pacific
  { code: "AU", flag: "🇦🇺", label: "Australia", currency: "AUD", region: "Asia-Pacific" },
  { code: "NZ", flag: "🇳🇿", label: "New Zealand", currency: "NZD", region: "Asia-Pacific" },
  { code: "JP", flag: "🇯🇵", label: "日本", currency: "JPY", region: "Asia-Pacific" },
  { code: "KR", flag: "🇰🇷", label: "대한민국", currency: "KRW", region: "Asia-Pacific" },
  { code: "SG", flag: "🇸🇬", label: "Singapore", currency: "SGD", region: "Asia-Pacific" },
  { code: "HK", flag: "🇭🇰", label: "Hong Kong", currency: "HKD", region: "Asia-Pacific" },
  { code: "TW", flag: "🇹🇼", label: "台灣", currency: "TWD", region: "Asia-Pacific" },
];

const CAMPAIGN_STORAGE = "campaign_currency_v5";
const COUNTRY_STORAGE = "manual_country_v1";

function readInitialCountry(): string {
  if (typeof window === "undefined") return "US";
  try {
    const saved = localStorage.getItem(COUNTRY_STORAGE);
    if (saved && COUNTRIES.some((c) => c.code === saved)) return saved;
    const cached = localStorage.getItem(CAMPAIGN_STORAGE);
    if (cached) {
      const parsed = JSON.parse(cached);
      const match = COUNTRIES.find((c) => c.code === parsed.countryCode);
      if (match) return match.code;
    }
  } catch { /* ignore */ }
  return "US";
}

const I18N_SUPPORTED: Currency[] = ["USD", "EUR", "BRL", "MXN", "COP", "ARS", "GBP", "CAD", "AUD", "PEN"];

export const LanguageCurrencySelector = () => {
  const { language, setLanguage, setCurrency, languageNames, languageFlags } = useI18n();
  const [countryCode, setCountryCode] = useState<string>(readInitialCountry);

  // Keep in sync if another tab / IP detection changes country
  useEffect(() => {
    const sync = () => {
      try {
        const cached = localStorage.getItem(CAMPAIGN_STORAGE);
        if (!cached) return;
        const parsed = JSON.parse(cached);
        const match = COUNTRIES.find((c) => c.code === parsed.countryCode);
        if (match && match.code !== countryCode) setCountryCode(match.code);
      } catch { /* ignore */ }
    };
    window.addEventListener("campaign-currency-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("campaign-currency-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, [countryCode]);

  const current = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0];

  const handleCountryChange = (code: string) => {
    const next = COUNTRIES.find((c) => c.code === code);
    if (!next) return;
    setCountryCode(code);
    try {
      localStorage.setItem(COUNTRY_STORAGE, code);
      const payload = { currency: next.currency, countryCode: code, timestamp: Date.now() };
      localStorage.setItem(CAMPAIGN_STORAGE, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent("campaign-currency-change", { detail: next.currency }));
    } catch { /* ignore */ }
    if ((I18N_SUPPORTED as string[]).includes(next.currency)) {
      setCurrency(next.currency as Currency);
    }
  };

  const grouped = COUNTRIES.reduce<Record<string, CountryOption[]>>((acc, c) => {
    (acc[c.region] ||= []).push(c);
    return acc;
  }, {});

  return (
    <div className="flex items-center gap-2">
      {/* Language */}
      <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
        <SelectTrigger className="w-auto gap-1 border-none bg-transparent hover:bg-muted/50 focus:ring-0 px-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <SelectValue>
            <span className="hidden sm:inline">{languageFlags[language]} {languageNames[language]}</span>
            <span className="sm:hidden">{languageFlags[language]}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(languageNames) as Language[]).map((lang) => (
            <SelectItem key={lang} value={lang}>
              {languageFlags[lang]} {languageNames[lang]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Country + Currency */}
      <Select value={current.code} onValueChange={handleCountryChange}>
        <SelectTrigger
          aria-label="Cambiar país y moneda"
          className="w-auto gap-1.5 border-none bg-transparent hover:bg-muted/50 focus:ring-0 px-2"
        >
          <SelectValue>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-base leading-none">{current.flag}</span>
              <span className="hidden sm:inline text-xs font-medium">{current.label}</span>
              <span className="text-[10px] font-semibold text-primary/80">{current.currency}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-96">
          {(Object.keys(grouped) as Array<keyof typeof grouped>).map((region) => (
            <SelectGroup key={region}>
              <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {region}
              </SelectLabel>
              {grouped[region].map((c) => (
                <SelectItem key={c.code} value={c.code} className="text-xs">
                  <span className="inline-flex items-center gap-2">
                    <span className="text-base leading-none">{c.flag}</span>
                    <span>{c.label}</span>
                    <span className="ml-1 text-[10px] font-semibold text-muted-foreground">
                      {c.currency}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
