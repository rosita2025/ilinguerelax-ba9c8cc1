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

/** Manual country/flag picker for LatAm + USA, Canadá y España. */
export const CountryFlagSelector = ({ campaign, className = "" }: Props) => {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <span className="text-[11px] text-muted-foreground mr-1 w-full sm:w-auto">Elige tu país:</span>
      {COUNTRIES.map((c) => {
        const active = campaign.currency === c.currency && campaign.countryCode === c.code;
        return (
          <button
            key={c.code}
            type="button"
            onClick={() => campaign.setCurrency(c.currency)}
            className={`text-[11px] font-semibold px-2 py-1 rounded-full border transition-colors ${
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-border hover:bg-muted"
            }`}
            aria-pressed={active}
            title={c.label}
          >
            {c.flag} {c.label}
          </button>
        );
      })}
    </div>
  );
};
