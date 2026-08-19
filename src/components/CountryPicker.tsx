import { useState, useEffect } from "react";
import { Globe, Check } from "lucide-react";
import { useRegionTier, clearManualCountryOverride } from "@/hooks/useRegionTier";
import { useI18n } from "@/i18n/I18nContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { countries } from "@/hooks/useRegionTier";

interface Props {
  lang?: "es" | "en" | "fr" | "pt";
  className?: string;
}

export const CountryPicker = ({ lang = "es", className = "" }: Props) => {
  const { setCountryCode } = useI18n();
  const region = useRegionTier();
  const [open, setOpen] = useState(false);
  const [activeCountry, setActiveCountry] = useState<string | null>(null);

  useEffect(() => {
    if (region.country) {
      setActiveCountry(region.country);
    }
  }, [region.country]);

  const currentCountry = countries.find((c) => c.code === activeCountry) || {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
  };

  const pick = (code: string) => {
    setCountryCode(code);
    setOpen(false);
  };

  const auto = () => {
    clearManualCountryOverride();
    setOpen(false);
    window.location.reload();
  };

  const labels = {
    es: {
      title: "Selecciona tu país",
      desc: "Los precios y métodos de pago se ajustarán automáticamente.",
      auto: "Detectar automáticamente",
      current: "País actual",
    },
    en: {
      title: "Select your country",
      desc: "Prices and payment methods will adjust automatically.",
      auto: "Detect automatically",
      current: "Current country",
    },
    fr: {
      title: "Choisissez votre pays",
      desc: "Les prix et méthodes de paiement s'adapteront automatiquement.",
      auto: "Détecter automatiquement",
      current: "Pays actuel",
    },
    pt: {
      title: "Selecione seu país",
      desc: "Os preços e métodos de pagamento serão ajustados automaticamente.",
      auto: "Detectar automaticamente",
      current: "País atual",
    },
  };

  const l = labels[lang as keyof typeof labels] || labels.es;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 px-3 gap-2 text-muted-foreground hover:text-foreground transition-colors",
            className
          )}
        >
          <Globe className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wider">
            {currentCountry.flag} {currentCountry.code}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle>{l.title}</DialogTitle>
          <DialogDescription>{l.desc}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            className="justify-start gap-3 h-12"
            onClick={auto}
          >
            <Globe className="w-5 h-5 text-primary" />
            <div className="text-left">
              <div className="text-sm font-semibold">{l.auto}</div>
              <div className="text-xs text-muted-foreground uppercase">IP Geolocation</div>
            </div>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                O elige manualmente
              </span>
            </div>
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="grid grid-cols-1 gap-1">
              {countries.map((c) => (
                <button
                  key={c.code}
                  onClick={() => pick(c.code)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-left",
                    activeCountry === c.code
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-muted text-foreground/80"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl leading-none">{c.flag}</span>
                    <span className="text-sm">{c.name}</span>
                  </div>
                  {activeCountry === c.code && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="pt-2 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground opacity-50">
          <Globe className="w-3 h-3" />
          iLingue Relax Global Store v4.2
        </div>
      </DialogContent>
    </Dialog>
  );
};