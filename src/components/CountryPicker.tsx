import { useState } from "react";
import { Globe, Check } from "lucide-react";
import { useRegionTier, setManualCountryOverride, clearManualCountryOverride } from "@/hooks/useRegionTier";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Small pill: "¿No estás en {country}? · Cambiar"
 * Opens a dialog with the countries we support so the user can override
 * IP detection when it's wrong (VPN, roaming, mislabelled IP).
 */

interface CountryOption {
  code: string;
  name: string;
  flag: string;
  tier: "PE" | "TiendaUSD" | "LATAM" | "Global";
}

const COUNTRIES: CountryOption[] = [
  // Perú (PEN nativo)
  { code: "PE", name: "Perú", flag: "🇵🇪", tier: "PE" },
  // Tienda USD ($7)
  { code: "VE", name: "Venezuela", flag: "🇻🇪", tier: "TiendaUSD" },
  { code: "CU", name: "Cuba", flag: "🇨🇺", tier: "TiendaUSD" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮", tier: "TiendaUSD" },
  // LATAM Hotmart (moneda local)
  { code: "MX", name: "México", flag: "🇲🇽", tier: "LATAM" },
  { code: "CO", name: "Colombia", flag: "🇨🇴", tier: "LATAM" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", tier: "LATAM" },
  { code: "CL", name: "Chile", flag: "🇨🇱", tier: "LATAM" },
  { code: "BR", name: "Brasil", flag: "🇧🇷", tier: "LATAM" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨", tier: "LATAM" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴", tier: "LATAM" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾", tier: "LATAM" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾", tier: "LATAM" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷", tier: "LATAM" },
  { code: "PA", name: "Panamá", flag: "🇵🇦", tier: "LATAM" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹", tier: "LATAM" },
  { code: "HN", name: "Honduras", flag: "🇭🇳", tier: "LATAM" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻", tier: "LATAM" },
  { code: "DO", name: "R. Dominicana", flag: "🇩🇴", tier: "LATAM" },
  { code: "PR", name: "Puerto Rico", flag: "🇵🇷", tier: "LATAM" },
  // Global (USD)
  { code: "US", name: "Estados Unidos", flag: "🇺🇸", tier: "Global" },
  { code: "CA", name: "Canadá", flag: "🇨🇦", tier: "Global" },
  { code: "ES", name: "España", flag: "🇪🇸", tier: "Global" },
  { code: "FR", name: "Francia", flag: "🇫🇷", tier: "Global" },
  { code: "DE", name: "Alemania", flag: "🇩🇪", tier: "Global" },
  { code: "IT", name: "Italia", flag: "🇮🇹", tier: "Global" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", tier: "Global" },
  { code: "GB", name: "Reino Unido", flag: "🇬🇧", tier: "Global" },
  { code: "AU", name: "Australia", flag: "🇦🇺", tier: "Global" },
  { code: "JP", name: "Japón", flag: "🇯🇵", tier: "Global" },
  { code: "KR", name: "Corea", flag: "🇰🇷", tier: "Global" },
];

const TIER_LABEL: Record<CountryOption["tier"], string> = {
  PE: "Soles PEN",
  TiendaUSD: "USD Tienda",
  LATAM: "Moneda local (LATAM)",
  Global: "USD internacional",
};

interface Props {
  lang?: "es" | "en";
  className?: string;
}

export const CountryPicker = ({ lang = "es", className = "" }: Props) => {
  const region = useRegionTier();
  const [open, setOpen] = useState(false);
  const cc = (region.country || "").toUpperCase();
  const current = COUNTRIES.find((c) => c.code === cc);
  const currentName = current?.name || cc || (lang === "en" ? "your country" : "tu país");
  const currentFlag = current?.flag || "🌍";

  const t = {
    notIn: lang === "en" ? "Not in" : "¿No estás en",
    change: lang === "en" ? "Change" : "Cambiar",
    title: lang === "en" ? "Choose your country" : "Elige tu país",
    desc:
      lang === "en"
        ? "Prices adjust automatically to your region. If detection is wrong, pick the correct country."
        : "Los precios se ajustan a tu región. Si la detección es incorrecta, elige el país correcto.",
    autoDetect: lang === "en" ? "Auto-detect by IP" : "Detectar automáticamente por IP",
  };

  const pick = (code: string) => {
    setManualCountryOverride(code);
    setOpen(false);
    
    // Dispatch a custom event to notify useRegionTier and other listeners
    // without a full page reload for a smoother experience.
    window.dispatchEvent(new Event("country_changed"));
    
    // If we have access to context, we update it there too
    // In many cases, window.location.reload() is still the safest fallback
    // to ensure ALL hooks (like useAdminPricing) re-trigger if they rely on country.
    // For now, let's keep the reload as a safety net but trigger the event first.
    window.location.reload();
  };

  const auto = () => {
    clearManualCountryOverride();
    setOpen(false);
    window.dispatchEvent(new Event("country_changed"));
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`${t.notIn} ${currentName}? ${t.change}`}
          className={`inline-flex items-center gap-1.5 text-xs sm:text-[11px] font-medium text-muted-foreground hover:text-foreground underline underline-offset-2 decoration-dotted transition-colors min-h-[32px] px-2 py-1 rounded-md max-w-full ${className}`}
        >
          <Globe className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">
            {t.notIn} <span className="font-semibold">{currentFlag} {currentName}</span>? · {t.change}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md w-[calc(100vw-1.5rem)] p-0 gap-0 max-h-[90vh] sm:max-h-[85vh] flex flex-col">
        <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-3 flex-shrink-0 text-left">
          <DialogTitle className="text-base sm:text-lg">{t.title}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">{t.desc}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-2 overscroll-contain">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {COUNTRIES.map((c) => {
              const active = c.code === cc;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => pick(c.code)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 min-h-[48px] rounded-lg border text-left text-sm transition-all active:scale-[0.98] ${
                    active
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:border-primary/50 hover:bg-muted"
                  }`}
                >
                  <span className="text-xl leading-none flex-shrink-0">{c.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{c.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{TIER_LABEL[c.tier]}</div>
                  </div>
                  {active && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-4 sm:p-6 pt-3 border-t border-border flex-shrink-0 bg-background">
          <Button variant="outline" size="default" onClick={auto} className="w-full min-h-[44px]">
            <Globe className="w-4 h-4 mr-2" />
            {t.autoDetect}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
