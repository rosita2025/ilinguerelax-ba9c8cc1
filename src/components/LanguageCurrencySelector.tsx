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
    // Prefer IP-detected campaign cache over the manual override so a stale
    // manual pick from a previous session does not shadow the real location.
    const cached = localStorage.getItem(CAMPAIGN_STORAGE);
    if (cached) {
      const parsed = JSON.parse(cached);
      const match = COUNTRIES.find((c) => c.code === parsed.countryCode);
      if (match) return match.code;
    }
    const saved = localStorage.getItem(COUNTRY_STORAGE);
    if (saved && COUNTRIES.some((c) => c.code === saved)) return saved;
  } catch { /* ignore */ }
  return "US";
}

const I18N_SUPPORTED: Currency[] = ["USD", "EUR", "BRL", "MXN", "COP", "ARS", "GBP", "CAD", "AUD", "PEN"];

// Detect country via IP so the header selector reflects the visitor's real
// location even on pages that don't call useCampaignPrice (e.g. /admin, /blog).
let inflightIpDetection: Promise<string | null> | null = null;
async function detectCountryByIp(): Promise<string | null> {
  if (inflightIpDetection) return inflightIpDetection;
  inflightIpDetection = (async () => {
    for (const url of ["https://ipwho.is/", "https://ipwho.is/"]) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (!res.ok) continue;
        const data = await res.json();
        if (data?.error || data?.success === false) continue;
        const country = (data.country_code || data.country || "").toString().toUpperCase();
        if (country && COUNTRIES.some((c) => c.code === country)) return country;
      } catch { /* try next */ }
    }
    return null;
  })();
  return inflightIpDetection;
}

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

    // Force IP detection on mount so the selector reflects the real country.
    // The manual override (COUNTRY_STORAGE) is only respected if it matches
    // the IP-detected country — otherwise IP wins.
    let cancelled = false;
    detectCountryByIp().then((detected) => {
      if (cancelled || !detected) return;
      const match = COUNTRIES.find((c) => c.code === detected);
      if (!match) return;
      try {
        const payload = { currency: match.currency, countryCode: detected, timestamp: Date.now() };
        localStorage.setItem(CAMPAIGN_STORAGE, JSON.stringify(payload));
        // Clear stale manual pick so it can't shadow IP on the next visit.
        localStorage.removeItem(COUNTRY_STORAGE);
      } catch { /* ignore */ }
      if (detected !== countryCode) {
        setCountryCode(detected);
        if ((I18N_SUPPORTED as string[]).includes(match.currency)) {
          setCurrency(match.currency as Currency);
        }
        window.dispatchEvent(new CustomEvent("campaign-currency-change", { detail: match.currency }));
      }
    });

    return () => {
      cancelled = true;
      window.removeEventListener("campaign-currency-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, [countryCode, setCurrency]);


  const current = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0];

  // Nota: cambio manual de país deshabilitado a propósito para evitar arbitraje
  // (visitante de USA cambiando a MX/PE para comprar al precio local reducido).
  // La moneda y el tramo de precio se derivan solo del IP.
  void setCurrency;



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

      {/* País + moneda: sólo lectura, detectado por IP.
          Evita que un visitante de USA cambie a MX/PE y compre al precio local
          reducido (arbitraje). Para pruebas internas: ?country=XX en la URL. */}
      <div
        aria-label={`País detectado: ${current.label} (${current.currency})`}
        title="País y moneda detectados por tu ubicación"
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/40 select-none cursor-default"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline text-xs font-medium">{current.label}</span>
        <span className="text-[10px] font-semibold text-primary/80">{current.currency}</span>
      </div>
    </div>
  );
};
