import { useI18n } from "@/i18n/I18nContext";
import { Language, Currency, currencyConfig } from "@/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, DollarSign } from "lucide-react";

export const LanguageCurrencySelector = () => {
  const { language, setLanguage, currency, setCurrency, languageNames, languageFlags } = useI18n();

  const currencies: Currency[] = ["USD", "EUR", "GBP", "CAD", "AUD", "MXN", "BRL", "ARS", "COP", "PEN"];

  const handleCurrencyChange = (value: string) => {
    setCurrency(value as Currency);
    // Sync with the campaign pricing system used by product pages
    try {
      const payload = { currency: value, countryCode: "", timestamp: Date.now() };
      localStorage.setItem("campaign_currency_v5", JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent("campaign-currency-change", { detail: value }));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Language Selector */}
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

      {/* Currency Selector */}
      <Select value={currency} onValueChange={handleCurrencyChange}>
        <SelectTrigger className="w-auto gap-1 border-none bg-transparent hover:bg-muted/50 focus:ring-0 px-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <SelectValue>
            <span>{currencyConfig[currency].symbol} {currency}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {currencies.map((curr) => (
            <SelectItem key={curr} value={curr}>
              {currencyConfig[curr].symbol} {curr}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
