import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, ExternalLink, RefreshCw, Monitor, Smartphone } from "lucide-react";

type Country = { code: string; name: string; flag: string; region?: string };

const COUNTRIES: Country[] = [
  { code: "PE", name: "Perú", flag: "🇵🇪", region: "PE" },
  { code: "MX", name: "México", flag: "🇲🇽", region: "MX" },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸", region: "US" },
  { code: "CA", name: "Canadá", flag: "🇨🇦" },
  { code: "BR", name: "Brasil", flag: "🇧🇷" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "ES", name: "España", flag: "🇪🇸", region: "GLOBAL" },
  { code: "DE", name: "Alemania", flag: "🇩🇪" },
  { code: "FR", name: "Francia", flag: "🇫🇷" },
  { code: "IT", name: "Italia", flag: "🇮🇹" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "NL", name: "P. Bajos", flag: "🇳🇱" },
  { code: "GB", name: "Reino Unido", flag: "🇬🇧" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "JP", name: "Japón", flag: "🇯🇵" },
  { code: "SG", name: "Singapur", flag: "🇸🇬" },
];

const DEFAULT_SKU =
  "1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion";

export default function AdminCheckoutPreview() {
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [sku, setSku] = useState(DEFAULT_SKU);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [nonce, setNonce] = useState(0);

  const url = useMemo(() => {
    const q = new URLSearchParams({
      country: country.code,
      admin_preview: "1",
      _t: String(nonce),
    });
    return `/checkouts/${sku}?${q.toString()}`;
  }, [sku, country.code, nonce]);

  const frameWidth = device === "mobile" ? 390 : "100%";
  const frameHeight = device === "mobile" ? 780 : 900;

  return (
    <Card className="p-4 space-y-3 border-primary/30">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 mr-2">
          <Eye className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Vista previa por país</span>
          <Badge variant="outline" className="text-[10px]">
            {country.flag} {country.code}
            {country.region ? ` · región ${country.region}` : ""}
          </Badge>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <Button
            size="icon"
            variant={device === "desktop" ? "default" : "outline"}
            className="h-8 w-8"
            onClick={() => setDevice("desktop")}
            title="Escritorio"
          >
            <Monitor className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant={device === "mobile" ? "default" : "outline"}
            className="h-8 w-8"
            onClick={() => setDevice("mobile")}
            title="Móvil"
          >
            <Smartphone className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => setNonce((n) => n + 1)}
            title="Recargar"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Recargar
          </Button>
          <Button asChild size="sm" variant="secondary" className="h-8">
            <a href={url} target="_blank" rel="noreferrer">
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              Abrir
            </a>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {COUNTRIES.map((c) => {
          const active = c.code === country.code;
          return (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                setCountry(c);
                setNonce((n) => n + 1);
              }}
              className={`text-[11px] px-2 py-1 rounded border transition ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted"
              }`}
              title={c.name}
            >
              {c.flag} {c.code}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground shrink-0">SKU:</span>
        <Input
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          onBlur={() => setNonce((n) => n + 1)}
          className="h-8 text-xs font-mono"
          spellCheck={false}
        />
      </div>

      <div className="rounded-lg border bg-muted/20 overflow-hidden flex justify-center">
        <iframe
          key={`${country.code}-${nonce}`}
          src={url}
          title={`Checkout preview ${country.code}`}
          style={{
            width: typeof frameWidth === "number" ? `${frameWidth}px` : frameWidth,
            height: `${frameHeight}px`,
            border: 0,
            background: "white",
          }}
        />
      </div>

      <p className="text-[11px] text-muted-foreground">
        La vista previa refleja lo mismo que verá un comprador con IP de {country.flag} {country.name}.
        Rellena nombre y correo dentro del iframe para desbloquear los métodos de pago.
      </p>
    </Card>
  );
}
