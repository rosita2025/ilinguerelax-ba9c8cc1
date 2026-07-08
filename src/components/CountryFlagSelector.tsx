import { MapPin, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CampaignCurrency, CampaignPrice } from "@/hooks/useCampaignPrice";

type Country = { code: string; flag: string; label: string; currency: CampaignCurrency };

// Latinoamérica + USA, Canadá y España
const COUNTRIES: Country[] = [
  { code: "US", flag: "🇺🇸", label: "USA", currency: "USD" },
  { code: "CA", flag: "🇨🇦", label: "Canadá", currency: "CAD" },
  { code: "ES", flag: "🇪🇸", label: "España", currency: "EUR" },
  { code: "MX", flag: "🇲🇽", label: "México", currency: "MXN" },
  { code: "CO", flag: "🇨🇴", label: "Colombia", currency: "COP" },
  { code: "AR", flag: "🇦🇷", label: "Argentina", currency: "ARS" },
  { code: "PE", flag: "🇵🇪", label: "Perú", currency: "PEN" },
  { code: "CL", flag: "🇨🇱", label: "Chile", currency: "CLP" },
  { code: "BR", flag: "🇧🇷", label: "Brasil", currency: "BRL" },
  { code: "UY", flag: "🇺🇾", label: "Uruguay", currency: "UYU" },
  { code: "BO", flag: "🇧🇴", label: "Bolivia", currency: "BOB" },
  { code: "PY", flag: "🇵🇾", label: "Paraguay", currency: "PYG" },
  { code: "GT", flag: "🇬🇹", label: "Guatemala", currency: "GTQ" },
  { code: "DO", flag: "🇩🇴", label: "Rep. Dominicana", currency: "DOP" },
  { code: "CR", flag: "🇨🇷", label: "Costa Rica", currency: "CRC" },
  { code: "HN", flag: "🇭🇳", label: "Honduras", currency: "HNL" },
  { code: "NI", flag: "🇳🇮", label: "Nicaragua", currency: "NIO" },
  { code: "VE", flag: "🇻🇪", label: "Venezuela", currency: "VES" },
  { code: "PA", flag: "🇵🇦", label: "Panamá", currency: "USD" },
  { code: "EC", flag: "🇪🇨", label: "Ecuador", currency: "USD" },
  { code: "SV", flag: "🇸🇻", label: "El Salvador", currency: "USD" },
];

interface Props {
  campaign: CampaignPrice;
  className?: string;
}

/** Compact country/currency picker. IP-detected by default; user can override. */
export const CountryFlagSelector = ({ campaign, className = "" }: Props) => {
  const current =
    COUNTRIES.find(
      (c) => c.currency === campaign.currency && c.code === campaign.countryCode,
    ) ||
    COUNTRIES.find((c) => c.currency === campaign.currency) ||
    COUNTRIES[0];

  const isFallback = campaign.detectionStatus === "fallback";
  const Icon = isFallback ? AlertCircle : MapPin;
  const label = isFallback ? "Selecciona tu país:" : "Tu país:";
  const wrapperTone = isFallback
    ? "border-accent/40 bg-gradient-to-r from-accent/10 via-background to-accent/5"
    : "border-primary/20 bg-gradient-to-r from-primary/5 via-background to-accent/5";
  const iconTone = isFallback ? "text-accent" : "text-primary";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border ${wrapperTone} pl-3 pr-1 py-1 shadow-sm ${className}`}
      title={
        isFallback
          ? "No pudimos detectar tu país automáticamente. Elige el tuyo para ver el precio en tu moneda."
          : undefined
      }
    >
      <Icon className={`w-3.5 h-3.5 ${iconTone} shrink-0`} aria-hidden />
      <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
        {label}
      </span>
      <Select
        value={`${current.code}|${current.currency}`}
        onValueChange={(v) => {
          const [, cur] = v.split("|");
          campaign.setCurrency(cur as CampaignCurrency);
        }}
      >
        <SelectTrigger
          aria-label="Cambiar país y moneda"
          className="h-7 w-auto min-w-[9rem] gap-1.5 rounded-full border-primary/30 bg-background/80 px-3 text-xs font-bold text-foreground shadow-sm hover:bg-primary/10 hover:border-primary/50 focus:ring-2 focus:ring-primary/40 transition-colors"
        >
          <SelectValue>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-base leading-none">{current.flag}</span>
              <span className="truncate">{current.label}</span>
              <span className="text-[10px] font-semibold text-primary/80">
                {current.currency}
              </span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-72 rounded-xl border-primary/20 shadow-xl">
          {COUNTRIES.map((c) => (
            <SelectItem
              key={c.code}
              value={`${c.code}|${c.currency}`}
              className="text-xs font-medium cursor-pointer"
            >
              <span className="inline-flex items-center gap-2">
                <span className="text-base leading-none">{c.flag}</span>
                <span>{c.label}</span>
                <span className="ml-1 text-[10px] font-semibold text-muted-foreground">
                  {c.currency}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
