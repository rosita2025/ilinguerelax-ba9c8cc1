import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import AdminNav from "@/components/admin/AdminNav";
import { adminInvoke } from "@/lib/adminInvoke";
import { invalidateCheckoutMethodsCache } from "@/hooks/useCheckoutMethodsConfig";
import { toast } from "sonner";
import { DLOCAL_COVERAGE } from "@/lib/dlocalCoverage";
import { Building2, Banknote, Loader2, RefreshCw, Globe, CheckCircle2 } from "lucide-react";

type Region = {
  code: string; name: string; flag?: string | null; currency: string;
  gateway?: string | null; description?: string | null;
  country_codes: string[]; enabled: boolean; sort_order: number;
};
type Method = {
  id: string; region_code: string; method_key: string; label: string;
  note?: string | null; icon: string; enabled: boolean; sort_order: number;
};

type Kind = "transfer" | "cash";

const METHOD_KEY: Record<Kind, string> = {
  transfer: "dlocal_transfer",
  cash: "dlocal_cash",
};

/** Países con cobertura dLocal Go (fuente única: src/lib/dlocalCoverage.ts). */
const DLOCAL_COUNTRIES = DLOCAL_COVERAGE;

const LABELS: Record<Kind, { label: string; note: string; icon: string }> = {
  transfer: {
    label: "dLocal Go — transferencia",
    note: "Transferencia bancaria local vía dLocal Go (SPEI MX, PSE CO, Pix BR, CBU AR, transferencia PE…)",
    icon: "Building2",
  },
  cash: {
    label: "dLocal Go — efectivo",
    note: "Pago en efectivo/agentes vía dLocal Go (OXXO MX, Efecty CO, Boleto BR, Rapipago AR, PagoEfectivo PE…)",
    icon: "Banknote",
  },
};

export default function AdminDlocal() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [methods, setMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [bulk, setBulk] = useState(false);
  const [search, setSearch] = useState("");

  async function load() {
    invalidateCheckoutMethodsCache();
    setLoading(true);
    const { data, error } = await adminInvoke<any>("manage-checkout-methods", { body: { action: "list" } });
    if (error || data?.error) { toast.error(error?.message || data?.error); setLoading(false); return; }
    setRegions(data.regions || []);
    setMethods(data.methods || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  /** Encuentra la región que atiende a un país (por código o country_codes). */
  function regionFor(country: string): Region | undefined {
    return regions.find(r => r.code === country)
      || regions.find(r => (r.country_codes || []).includes(country));
  }

  function methodFor(country: string, kind: Kind): Method | undefined {
    const r = regionFor(country);
    if (!r) return undefined;
    return methods.find(m => m.region_code === r.code && m.method_key === METHOD_KEY[kind]);
  }

  function isOn(country: string, kind: Kind) {
    const m = methodFor(country, kind);
    return !!m?.enabled;
  }

  async function ensureRegion(country: string): Promise<Region | null> {
    const existing = regionFor(country);
    if (existing) return existing;
    const meta = DLOCAL_COUNTRIES.find(c => c.code === country)!;
    const region: Region = {
      code: country,
      name: meta.name,
      flag: meta.flag,
      currency: meta.currency,
      gateway: "dLocal Go",
      description: `Cobros locales vía dLocal Go en ${meta.name}`,
      country_codes: [country],
      enabled: true,
      sort_order: (regions.reduce((mx, x) => Math.max(mx, x.sort_order), 0) || 0) + 1,
    };
    const { data, error } = await adminInvoke<any>("manage-checkout-methods", {
      body: { action: "save_region", region },
    });
    if (error || data?.error) {
      toast.error(`No se pudo crear la región ${country}: ${error?.message || data?.error}`);
      return null;
    }
    setRegions(prev => [...prev, region]);
    return region;
  }

  async function toggle(country: string, kind: Kind, next: boolean) {
    const busyKey = `${country}:${kind}`;
    setBusy(busyKey);
    try {
      const region = await ensureRegion(country);
      if (!region) return;
      const existing = methods.find(m => m.region_code === region.code && m.method_key === METHOD_KEY[kind]);
      if (existing?.id) {
        setMethods(prev => prev.map(x => x.id === existing.id ? { ...x, enabled: next } : x));
        const { data, error } = await adminInvoke<any>("manage-checkout-methods", {
          body: { action: "toggle_method", id: existing.id, enabled: next },
        });
        if (error || data?.error) {
          setMethods(prev => prev.map(x => x.id === existing.id ? { ...x, enabled: existing.enabled } : x));
          throw new Error(error?.message || data?.error);
        }
      } else {
        const payload: Method = {
          id: "",
          region_code: region.code,
          method_key: METHOD_KEY[kind],
          label: LABELS[kind].label,
          note: LABELS[kind].note,
          icon: LABELS[kind].icon,
          enabled: next,
          sort_order: methods.filter(m => m.region_code === region.code).length + 1,
        };
        const { data, error } = await adminInvoke<any>("manage-checkout-methods", {
          body: { action: "save_method", method: payload },
        });
        if (error || data?.error) throw new Error(error?.message || data?.error);
        setMethods(prev => [...prev, payload]);
      }
      invalidateCheckoutMethodsCache();
      toast.success(`${next ? "✅ Activado" : "⏸️ Desactivado"} ${LABELS[kind].label} · ${country}`);
      await load();
    } catch (e) {
      toast.error(`❌ ${(e as Error).message || "Error al guardar"}`);
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function applyAll(kind: Kind | "both", next: boolean) {
    setBulk(true);
    try {
      for (const c of visible) {
        const kinds: Kind[] = kind === "both" ? ["transfer", "cash"] : [kind];
        for (const k of kinds) {
          if (isOn(c.code, k) === next) continue;
          await toggle(c.code, k, next);
        }
      }
      toast.success(next ? "Cobertura dLocal Go activada" : "Cobertura dLocal Go desactivada");
    } finally {
      setBulk(false);
      await load();
    }
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return DLOCAL_COUNTRIES;
    return DLOCAL_COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.currency.toLowerCase().includes(q)
    );
  }, [search]);

  const activeCount = DLOCAL_COUNTRIES.filter(c => isOn(c.code, "transfer") || isOn(c.code, "cash")).length;

  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background py-4 sm:py-10 px-3 sm:px-4">
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
          <header className="space-y-1.5">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <Globe className="h-3.5 w-3.5" /> dLocal Go
            </div>
            <h1 className="text-xl sm:text-3xl font-bold">Cobertura dLocal Go</h1>
            <p className="text-sm text-muted-foreground">
              Elige los países donde quieres cobrar y activa el método correcto: <strong>transferencia bancaria</strong> o <strong>pago en efectivo</strong>.
              Los cambios se reflejan al instante en el checkout según la IP del comprador.
            </p>
          </header>

          <Card className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder="Buscar país o moneda…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" /> {activeCount}/{DLOCAL_COUNTRIES.length} países activos
              </Badge>
              <Button size="sm" variant="outline" disabled={bulk || loading} onClick={() => applyAll("both", true)}>
                {bulk ? <Loader2 className="h-4 w-4 animate-spin" /> : "Activar todos"}
              </Button>
              <Button size="sm" variant="ghost" disabled={bulk || loading} onClick={() => applyAll("both", false)}>
                Desactivar todos
              </Button>
              <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </Card>

          {loading ? (
            <Card className="p-8 flex items-center justify-center text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando cobertura…
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {visible.map((c) => {
                const transferOn = isOn(c.code, "transfer");
                const cashOn = isOn(c.code, "cash");
                const region = regionFor(c.code);
                return (
                  <Card key={c.code} className="p-3 sm:p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl leading-none">{c.flag}</span>
                        <div>
                          <div className="font-semibold text-sm sm:text-base">{c.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {c.code} · {c.currency}
                            {region ? ` · región ${region.code}` : " · sin región (se crea al activar)"}
                          </div>
                        </div>
                      </div>
                      {(transferOn || cashOn) && (
                        <Badge className="shrink-0 text-[10px]">Activo</Badge>
                      )}
                    </div>

                    <div className="rounded-lg border p-2.5 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                          <Building2 className="h-4 w-4 text-primary" /> Transferencia bancaria
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">{c.transfer.join(" · ")}</div>
                      </div>
                      {busy === `${c.code}:transfer`
                        ? <Loader2 className="h-4 w-4 animate-spin mt-1" />
                        : <Switch checked={transferOn} onCheckedChange={(v) => toggle(c.code, "transfer", v)} />}
                    </div>

                    <div className="rounded-lg border p-2.5 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                          <Banknote className="h-4 w-4 text-primary" /> Pago en efectivo
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">{c.cash.join(" · ")}</div>
                      </div>
                      {busy === `${c.code}:cash`
                        ? <Loader2 className="h-4 w-4 animate-spin mt-1" />
                        : <Switch checked={cashOn} onCheckedChange={(v) => toggle(c.code, "cash", v)} />}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          <Card className="p-3 sm:p-4 text-xs text-muted-foreground space-y-1">
            <p><strong>Cómo funciona:</strong> al activar un país se crea (si falta) su región con la moneda local y se agrega el método dLocal Go correspondiente.</p>
            <p>El backend fuerza el rail elegido: “transferencia” solo muestra bancos/transferencias y “efectivo” solo agentes/vouchers.</p>
          </Card>
        </div>
      </main>
    </>
  );
}
