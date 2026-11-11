import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";
import { useToast } from "@/hooks/use-toast";
import { adminInvoke } from "@/lib/adminInvoke";
import { publishCatalogUpdate } from "@/lib/catalogSync";
import { exchangeRates, currencyConfig, formatCurrencyAmount, type Currency } from "@/i18n";
import { CURRENCY_COUNT, GROUP_HINT, GROUP_TITLE, LOCAL_CURRENCY_CARDS, type CurrencyGroup } from "@/lib/adminCurrencyGroups";

/**
 * /admin/monedas — monedas locales por producto (SKU), en una página aparte para que el editor del producto no sea larguísimo.
 *  - Los 4 precios por región: LATAM, Europa (€), USA y Canadá, Asia y resto del mundo.
 *  - Por moneda (agrupadas en 5 regiones, plegables): precio fijo exacto y precio tachado. Vacío = automático.
 * Guarda solo precios (acción `set_prices` de manage-products): no toca enlaces de entrega ni nada más del producto.
 */
interface ProductRow {
  sku: string;
  name: string;
  price_usd: number;
  price_usd_latam: number | null;
  price_usd_tienda: number | null;
  local_prices: Record<string, number> | null;
  local_compare_at_prices: Record<string, number> | null;
  local_usd_prices: Record<string, number> | null;
}

const GROUP_ORDER: CurrencyGroup[] = ["LATAM", "EUROPA", "USA_CANADA", "ASIA", "RESTO"];
const numOrNull = (v: string): number | null => {
  const n = Number(v.replace(/,/g, "."));
  return v.trim() !== "" && Number.isFinite(n) && n > 0 ? n : null;
};
const decimalsOf = (code: string) => currencyConfig[code as Currency]?.decimals ?? 2;
/** Texto de un monto escrito: en monedas sin decimales, punto o coma es separador de miles (16.460 = 16460). */
const cleanTyped = (raw: string, code: string) => (decimalsOf(code) === 0 ? raw.replace(/[.,]/g, "") : raw.replace(/,/g, "."));
/** Mismo redondeo que el editor del producto para el valor automático. */
const roundAuto = (usd: number, code: string): number | null => {
  const rate = exchangeRates[code as Currency];
  if (!rate || usd <= 0) return null;
  const raw = usd * rate;
  if (code === "COP" || code === "TZS" || code === "UGX") return Math.round(raw / 100) * 100;
  if (["CLP", "PYG", "NGN", "KRW", "IDR"].includes(code)) return Math.round(raw / 10) * 10;
  if (["MXN", "ARS", "UYU", "JPY", "INR"].includes(code)) return Math.round(raw);
  return Math.round(raw * 100) / 100;
};

const AdminMonedas = () => {
  const { adminKey } = useAdminKey();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const sku = params.get("sku") ?? "";

  // Formulario (texto para los inputs).
  const [latam, setLatam] = useState("");
  const [usa, setUsa] = useState("");
  const [asia, setAsia] = useState("");
  const [fixed, setFixed] = useState<Record<string, string>>({});
  const [compare, setCompare] = useState<Record<string, string>>({});
  const [usdMap, setUsdMap] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await adminInvoke<{ products?: ProductRow[]; error?: string }>("manage-products", { body: { action: "list", adminKey } });
        if (error || data?.error) throw new Error(error?.message || data?.error);
        setProducts(data?.products ?? []);
      } catch (e) {
        toast({ title: "No se pudieron cargar los productos", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [adminKey, toast]);

  const product = useMemo(() => products.find((p) => p.sku === sku), [products, sku]);

  useEffect(() => {
    if (!sku && products.length) setParams({ sku: products[0].sku }, { replace: true });
  }, [sku, products, setParams]);

  useEffect(() => {
    if (!product) return;
    setLatam(product.price_usd_latam != null ? String(product.price_usd_latam) : "");
    setUsa(product.price_usd != null ? String(product.price_usd) : "");
    setAsia(product.price_usd_tienda != null ? String(product.price_usd_tienda) : "");
    setFixed(Object.fromEntries(Object.entries(product.local_prices ?? {}).map(([k, v]) => [k, String(v)])));
    setCompare(Object.fromEntries(Object.entries(product.local_compare_at_prices ?? {}).map(([k, v]) => [k, String(v)])));
    setUsdMap(product.local_usd_prices ?? {});
  }, [product]);

  const usaN = numOrNull(usa);
  const latamN = numOrNull(latam);
  const asiaN = numOrNull(asia);
  const usdFixedWarning = numOrNull(fixed.USD ?? "") !== null;

  /** USD base de una moneda (misma regla que la página y el servidor). */
  const baseUsd = (code: string, region: string): number => {
    if (region === "LATAM") return latamN ?? usaN ?? 0;
    if (region === "Asia" || region === "Africa") return asiaN ?? usaN ?? 0;
    return usaN ?? 0;
  };

  const save = async () => {
    if (!product) return;
    if (usaN === null) return toast({ title: "El precio de USA y Canadá es obligatorio", variant: "destructive" });
    setSaving(true);
    try {
      const toMap = (m: Record<string, string>) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, numOrNull(v)]).filter(([, v]) => v !== null));
      type SaveRes = { success?: boolean; error?: string; updated_at?: string | null };
      const prices = {
        price_usd: usaN,
        price_usd_latam: latamN,
        price_usd_tienda: asiaN,
        local_prices: toMap(fixed),
        local_compare_at_prices: toMap(compare),
        local_usd_prices: usdMap,
      };
      let { data, error } = await adminInvoke<SaveRes>("manage-products", { body: { action: "set_prices", adminKey, sku: product.sku, ...prices } });
      // La función de Supabase aún no tiene la acción nueva (se despliega al publicar): se guarda por la acción de siempre («upsert»)
      // reenviando el producto tal cual con los precios nuevos. Los enlaces de entrega no cambian (no pide confirmación) y los upsells no se tocan.
      const oldFunction = /invalid action/i.test(error?.message ?? "") || /invalid action/i.test(data?.error ?? "");
      if (oldFunction) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { bonus_titles: _b, id: _i, created_at: _c, updated_at: _u, ...clean } = product as any;
        ({ data, error } = await adminInvoke<SaveRes>("manage-products", {
          body: {
            action: "upsert",
            adminKey,
            confirmDriveChange: false,
            product: {
              ...clean,
              ...prices,
              gallery_images: Array.isArray(clean.gallery_images) ? clean.gallery_images : [],
              gallery_metadata: clean.gallery_metadata || {},
              is_physical: !!clean.is_physical,
              active: !!clean.active,
              store_enabled: !!clean.store_enabled,
            },
          },
        }));
      }
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      publishCatalogUpdate(product.sku, data?.updated_at ? new Date(data.updated_at).getTime() : Date.now());
      window.dispatchEvent(new Event("pricing_updated"));
      setProducts((list) => list.map((p) => (p.sku === product.sku ? {
        ...p,
        price_usd: usaN,
        price_usd_latam: latamN,
        price_usd_tienda: asiaN,
        local_prices: toMap(fixed) as Record<string, number>,
        local_compare_at_prices: toMap(compare) as Record<string, number>,
      } : p)));
      toast({ title: "✅ Guardado", description: "La página del producto y el checkout ya usan estos precios." });
    } catch (e) {
      toast({ title: "No se pudo guardar", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const countManual = (g: CurrencyGroup) => LOCAL_CURRENCY_CARDS.filter((c) => c.group === g && (numOrNull(fixed[c.code] ?? "") !== null || numOrNull(compare[c.code] ?? "") !== null)).length;

  if (loading) return (
    <><AdminNav /><div className="min-h-dvh flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div></>
  );

  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button variant="ghost" asChild><Link to="/admin/productos"><ArrowLeft className="w-4 h-4 mr-1" /> Productos</Link></Button>
            <Button onClick={save} disabled={saving || !product}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              Guardar precios y monedas
            </Button>
          </div>

          <div>
            <h1 className="text-2xl font-bold">💱 Monedas por producto</h1>
            <p className="text-sm text-muted-foreground">Elige un producto: la página pública, el checkout y todas las pasarelas (Stripe, PayPal, dLocal Go, Mercado Pago, pagos manuales) usan estos precios. Se cobra en US$, en euros (Europa) o en la moneda local de LATAM; cada proveedor convierte el resto.</p>
          </div>

          <Card className="p-4">
            <Label className="text-xs font-semibold">Producto</Label>
            <select
              className="mt-1 w-full md:w-96 h-10 border border-input rounded-md px-3 bg-background text-sm"
              value={sku}
              onChange={(e) => setParams({ sku: e.target.value })}
            >
              {products.map((p) => <option key={p.sku} value={p.sku}>{p.name} — {p.sku}</option>)}
            </select>
          </Card>

          {product && (
            <>
              <Card className="p-4 space-y-3">
                <h2 className="font-semibold">💰 Precios por región (4 precios distintos)</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">🌎 LATAM (US$)</Label>
                    <Input type="number" step="0.01" className="h-9 font-bold" value={latam} onChange={(e) => setLatam(e.target.value)} placeholder="45.00" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">🇪🇺 Europa (€)</Label>
                    <Input
                      type="text" inputMode="decimal" className="h-9 font-bold" value={fixed.EUR ?? ""}
                      onChange={(e) => setFixed((f) => ({ ...f, EUR: cleanTyped(e.target.value, "EUR") }))}
                      placeholder={usaN ? `auto ≈ ${((usaN) * (exchangeRates.EUR ?? 0.92)).toFixed(2)}` : "27.00"}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">🇺🇸🇨🇦 USA y Canadá (US$)</Label>
                    <Input type="number" step="0.01" className="h-9 font-bold" value={usa} onChange={(e) => setUsa(e.target.value)} placeholder="72.99" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">🌏 Asia y resto (US$)</Label>
                    <Input type="number" step="0.01" className="h-9 font-bold" value={asia} onChange={(e) => setAsia(e.target.value)} placeholder="68.00" />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">Vacío = se usa el precio de USA y Canadá. Australia y Nueva Zelanda, por ahora, también pagan el de USA y Canadá.</p>
                {usdFixedWarning && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-400 bg-amber-50 p-3 text-xs text-amber-900">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      Este producto tiene un precio fijo en <b>USD</b> que pisaría los precios de todas las regiones que ven dólares. Bórralo.
                      <Button size="sm" variant="outline" className="ml-2 h-6 text-[11px]" onClick={() => setFixed((f) => { const n = { ...f }; delete n.USD; return n; })}>Quitar USD</Button>
                    </div>
                  </div>
                )}
              </Card>

              <div className="space-y-2">
                <h2 className="font-semibold">Monedas locales de todo el mundo: {CURRENCY_COUNT} monedas (precio fijo y tachado, opcional)</h2>
                <p className="text-xs text-muted-foreground">Cada región se abre y se cierra. Si dejas una moneda vacía, su precio se calcula solo con la tasa del día.</p>
                {GROUP_ORDER.map((g) => {
                  const rows = LOCAL_CURRENCY_CARDS.filter((c) => c.group === g);
                  const manual = countManual(g);
                  return (
                    <details key={g} className="rounded-lg border bg-card" open={manual > 0}>
                      <summary className="cursor-pointer select-none px-4 py-3 flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{GROUP_TITLE[g]}</span>
                        <span className="text-xs text-muted-foreground">{rows.length ? `${rows.length} monedas` : "sin monedas propias"}{manual > 0 ? ` · ${manual} con precio fijo` : ""}</span>
                      </summary>
                      <div className="border-t px-4 py-3 space-y-2">
                        <p className="text-[11px] text-muted-foreground">{GROUP_HINT[g]}</p>
                        {rows.length === 0 && <p className="text-xs">Estados Unidos ve US$ con el precio de USA y Canadá (arriba). No hay precio fijo por moneda aquí.</p>}
                        {rows.length > 0 && (
                          <div className="hidden md:grid gap-2 md:grid-cols-[1.3fr_1fr_1fr_1fr] text-[10px] font-bold uppercase text-muted-foreground">
                            <span>Moneda</span><span>Automático</span><span>Precio fijo</span><span>Tachado fijo</span>
                          </div>
                        )}
                        {rows.map(({ code, flag, label, region }) => {
                          const usd = baseUsd(code, region);
                          const auto = roundAuto(usd, code);
                          return (
                            <div key={code} className="grid items-center gap-2 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
                              <div className="text-sm font-semibold">{flag} {code} <span className="text-xs font-normal text-muted-foreground">{label}</span></div>
                              <div className="text-xs text-muted-foreground">Auto: <b className="text-foreground">{auto !== null ? formatCurrencyAmount(auto, code as Currency) : "—"}</b></div>
                              <div>
                                <Input
                                  aria-label={`Precio fijo ${code}`}
                                  type="text" inputMode="decimal" className="h-8 text-xs" placeholder={`fijo ${code}`}
                                  value={fixed[code] ?? ""}
                                  onChange={(e) => setFixed((f) => ({ ...f, [code]: cleanTyped(e.target.value, code) }))}
                                />
                              </div>
                              <div>
                                <Input
                                  aria-label={`Tachado ${code}`}
                                  type="text" inputMode="decimal" className="h-8 text-xs" placeholder={`tachado ${code}`}
                                  value={compare[code] ?? ""}
                                  onChange={(e) => setCompare((f) => ({ ...f, [code]: cleanTyped(e.target.value, code) }))}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  );
                })}
              </div>

              <div className="sticky bottom-3 z-10 flex items-center gap-3 rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur">
                <Button onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                  Guardar precios y monedas
                </Button>
                <Link to={`/admin/productos/${encodeURIComponent(product.sku)}`} className="text-xs underline text-primary">Editar el resto del producto</Link>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default AdminMonedas;
