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

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
        Detectado por tu ubicación:
      </span>
      <label className="relative inline-flex items-center">
        <span className="pointer-events-none absolute left-2 text-sm">
          {current.flag}
        </span>
        <select
          value={`${current.code}|${current.currency}`}
          onChange={(e) => {
            const [, cur] = e.target.value.split("|");
            campaign.setCurrency(cur as CampaignCurrency);
          }}
          aria-label="Cambiar país y moneda"
          className="appearance-none pl-8 pr-6 py-1 rounded-full border border-border bg-background text-foreground text-[11px] font-semibold hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={`${c.code}|${c.currency}`}>
              {c.flag} {c.label} ({c.currency})
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-1.5 w-3 h-3 text-muted-foreground"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </label>
    </div>
  );
};
