import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, ExternalLink, RefreshCw, Monitor, Smartphone } from "lucide-react";

type Country = { code: string; name: string; flag: string; region?: string };

type RegionLite = {
  code: string;
  name: string;
  flag?: string | null;
  country_codes: string[];
  enabled: boolean;
};

// Catálogo maestro (solo para resolver nombre/bandera legibles a partir del ISO)
const COUNTRY_META: Record<string, { name: string; flag: string }> = {
  PE: { name: "Perú", flag: "🇵🇪" },
  MX: { name: "México", flag: "🇲🇽" },
  US: { name: "Estados Unidos", flag: "🇺🇸" },
  CA: { name: "Canadá", flag: "🇨🇦" },
  BR: { name: "Brasil", flag: "🇧🇷" },
  AR: { name: "Argentina", flag: "🇦🇷" },
  CL: { name: "Chile", flag: "🇨🇱" },
  CO: { name: "Colombia", flag: "🇨🇴" },
  VE: { name: "Venezuela", flag: "🇻🇪" },
  EC: { name: "Ecuador", flag: "🇪🇨" },
  UY: { name: "Uruguay", flag: "🇺🇾" },
  PY: { name: "Paraguay", flag: "🇵🇾" },
  BO: { name: "Bolivia", flag: "🇧🇴" },
  CR: { name: "Costa Rica", flag: "🇨🇷" },
  PA: { name: "Panamá", flag: "🇵🇦" },
  DO: { name: "R. Dominicana", flag: "🇩🇴" },
  PR: { name: "Puerto Rico", flag: "🇵🇷" },
  GT: { name: "Guatemala", flag: "🇬🇹" },
  HN: { name: "Honduras", flag: "🇭🇳" },
  SV: { name: "El Salvador", flag: "🇸🇻" },
  NI: { name: "Nicaragua", flag: "🇳🇮" },
  CU: { name: "Cuba", flag: "🇨🇺" },
  ES: { name: "España", flag: "🇪🇸" },
  DE: { name: "Alemania", flag: "🇩🇪" },
  FR: { name: "Francia", flag: "🇫🇷" },
  IT: { name: "Italia", flag: "🇮🇹" },
  PT: { name: "Portugal", flag: "🇵🇹" },
  NL: { name: "P. Bajos", flag: "🇳🇱" },
  BE: { name: "Bélgica", flag: "🇧🇪" },
  GB: { name: "Reino Unido", flag: "🇬🇧" },
  IE: { name: "Irlanda", flag: "🇮🇪" },
  CH: { name: "Suiza", flag: "🇨🇭" },
  AT: { name: "Austria", flag: "🇦🇹" },
  SE: { name: "Suecia", flag: "🇸🇪" },
  NO: { name: "Noruega", flag: "🇳🇴" },
  DK: { name: "Dinamarca", flag: "🇩🇰" },
  FI: { name: "Finlandia", flag: "🇫🇮" },
  PL: { name: "Polonia", flag: "🇵🇱" },
  AU: { name: "Australia", flag: "🇦🇺" },
  NZ: { name: "N. Zelanda", flag: "🇳🇿" },
  JP: { name: "Japón", flag: "🇯🇵" },
  KR: { name: "Corea del Sur", flag: "🇰🇷" },
  SG: { name: "Singapur", flag: "🇸🇬" },
  HK: { name: "Hong Kong", flag: "🇭🇰" },
  IN: { name: "India", flag: "🇮🇳" },
  AE: { name: "E.A.U.", flag: "🇦🇪" },
  ZA: { name: "Sudáfrica", flag: "🇿🇦" },
};

const DEFAULT_SKU =
  "1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion";

type MethodLite = {
  region_code: string;
  method_key: string;
  label: string;
  note?: string | null;
  enabled: boolean;
  sort_order?: number;
};

interface Props {
  regions?: RegionLite[];
  methods?: MethodLite[];
}


export default function AdminCheckoutPreview({ regions = [] }: Props) {
  // Construir lista de países disponibles SOLO a partir de las regiones configuradas.
  // La región con código "*" (global) se representa con un botón "🌐 Global".
  const countries = useMemo<Country[]>(() => {
    const list: Country[] = [];
    const seen = new Set<string>();
    let hasGlobal = false;

    for (const r of regions) {
      if (!r.enabled) continue;
      const codes = r.country_codes || [];
      // A region acts as "global" if its code is * / GLOBAL, or if it has no explicit countries.
      if (r.code === "*" || r.code === "GLOBAL" || codes.length === 0 || codes.includes("*")) {
        hasGlobal = true;
      }
      for (const cc of codes) {
        if (cc === "*") continue;
        if (seen.has(cc)) continue;
        seen.add(cc);
        const meta = COUNTRY_META[cc] ?? { name: cc, flag: "🏳️" };
        list.push({ code: cc, name: meta.name, flag: meta.flag, region: r.code });
      }
    }

    // Ordenar por región para agrupar visualmente
    list.sort((a, b) => (a.region || "").localeCompare(b.region || ""));

    if (hasGlobal) {
      list.unshift({ code: "XX", name: "Resto del mundo (Global)", flag: "🌐", region: "*" });
    }
    return list;
  }, [regions]);

  const [country, setCountry] = useState<Country | null>(countries[0] ?? null);
  const [sku, setSku] = useState(DEFAULT_SKU);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [nonce, setNonce] = useState(0);

  // Si cambian las regiones y el país actual ya no existe, saltar al primero.
  useEffect(() => {
    if (!countries.length) { setCountry(null); return; }
    if (!country || !countries.some(c => c.code === country.code)) {
      setCountry(countries[0]);
      setNonce((n) => n + 1);
    }
  }, [countries, country]);

  const url = useMemo(() => {
    if (!country) return "";
    const q = new URLSearchParams({
      country: country.code,
      admin_preview: "1",
      _t: String(nonce),
    });
    return `/checkouts/${sku}?${q.toString()}`;
  }, [sku, country, nonce]);

  const isMobileDevice = device === "mobile";
  const frameWidth = isMobileDevice ? 360 : "100%";
  const frameHeight = isMobileDevice ? 720 : 700;

  if (!countries.length) {
    return (
      <Card className="p-4 text-sm text-muted-foreground border-primary/30">
        Añade al menos una región para habilitar la vista previa por país.
      </Card>
    );
  }

  return (
    <Card className="p-3 sm:p-4 space-y-3 border-primary/30">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Eye className="w-4 h-4 text-primary shrink-0" />
          <span className="font-semibold text-sm">Vista previa</span>
          {country && (
            <Badge variant="outline" className="text-[10px] truncate">
              {country.flag} {country.code}
              {country.region ? ` · ${country.region}` : ""}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 flex-wrap justify-end">
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
            className="h-8 px-2"
            onClick={() => setNonce((n) => n + 1)}
            title="Recargar"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Recargar</span>
          </Button>
          {url && (
            <Button asChild size="sm" variant="secondary" className="h-8 px-2">
              <a href={url} target="_blank" rel="noreferrer">
                <ExternalLink className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Abrir</span>
              </a>
            </Button>
          )}
        </div>
      </div>


      <div className="flex flex-wrap gap-1.5">
        {countries.map((c) => {
          const active = country?.code === c.code;
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
              title={`${c.name}${c.region ? ` · región ${c.region}` : ""}`}
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

      {url && (
        <div className="rounded-lg border bg-muted/20 overflow-hidden flex justify-center">
          <iframe
            key={`${country?.code}-${nonce}`}
            src={url}
            title={`Checkout preview ${country?.code}`}
            style={{
              width: typeof frameWidth === "number" ? `${frameWidth}px` : frameWidth,
              height: `${frameHeight}px`,
              border: 0,
              background: "white",
            }}
          />
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        Solo aparecen los países de las regiones configuradas arriba.
        {country && <> Refleja lo que verá un comprador con IP de {country.flag} {country.name}.</>}
      </p>
    </Card>
  );
}
