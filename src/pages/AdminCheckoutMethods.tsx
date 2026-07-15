import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import AdminNav from "@/components/admin/AdminNav";
import { adminInvoke } from "@/lib/adminInvoke";
import { toast } from "sonner";
import { Lock, Plus, Trash2, Pencil, CreditCard, Banknote, Wallet, Smartphone } from "lucide-react";

type Region = {
  code: string; name: string; flag?: string | null; currency: string;
  gateway?: string | null; description?: string | null;
  country_codes: string[]; enabled: boolean; sort_order: number;
};
type Method = {
  id: string; region_code: string; method_key: string; label: string;
  note?: string | null; icon: string; enabled: boolean; sort_order: number;
};

const ICONS: Record<string, any> = { CreditCard, Banknote, Wallet, Smartphone };

const PREVIEW_SKU = "1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion";

const emptyRegion = (): Region => ({
  code: "", name: "", flag: "🌐", currency: "USD",
  gateway: "Stripe", description: "", country_codes: [], enabled: true, sort_order: 99,
});
const emptyMethod = (region_code: string): Method => ({
  id: "", region_code, method_key: "", label: "",
  note: "", icon: "CreditCard", enabled: true, sort_order: 99,
});

export default function AdminCheckoutMethods() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [methods, setMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionEdit, setRegionEdit] = useState<Region | null>(null);
  const [methodEdit, setMethodEdit] = useState<Method | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await adminInvoke<any>("manage-checkout-methods", { body: { action: "list" } });
    if (error || data?.error) { toast.error(error?.message || data?.error); setLoading(false); return; }
    setRegions(data.regions || []);
    setMethods(data.methods || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function saveRegion(r: Region) {
    const { data, error } = await adminInvoke<any>("manage-checkout-methods", {
      body: { action: "save_region", region: r },
    });
    if (error || data?.error) return toast.error(error?.message || data?.error);
    toast.success("Región guardada"); setRegionEdit(null); load();
  }
  async function deleteRegion(code: string) {
    if (!confirm(`Eliminar región ${code} y sus métodos?`)) return;
    const { data, error } = await adminInvoke<any>("manage-checkout-methods", {
      body: { action: "delete_region", code },
    });
    if (error || data?.error) return toast.error(error?.message || data?.error);
    toast.success("Eliminada"); load();
  }
  async function saveMethod(m: Method) {
    const { data, error } = await adminInvoke<any>("manage-checkout-methods", {
      body: { action: "save_method", method: m },
    });
    if (error || data?.error) return toast.error(error?.message || data?.error);
    toast.success("Método guardado"); setMethodEdit(null); load();
  }
  async function deleteMethod(id: string) {
    if (!confirm("Eliminar método?")) return;
    const { data, error } = await adminInvoke<any>("manage-checkout-methods", {
      body: { action: "delete_method", id },
    });
    if (error || data?.error) return toast.error(error?.message || data?.error);
    toast.success("Eliminado"); load();
  }
  async function toggleMethod(m: Method) {
    setMethods(prev => prev.map(x => x.id === m.id ? { ...x, enabled: !m.enabled } : x));
    const { data, error } = await adminInvoke<any>("manage-checkout-methods", {
      body: { action: "toggle_method", id: m.id, enabled: !m.enabled },
    });
    if (error || data?.error) { toast.error(error?.message || data?.error); load(); }
  }

  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background py-10 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <header className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <Lock className="w-3.5 h-3.5" /> Vista privada · solo admin
            </div>
            <h1 className="text-3xl font-bold">Métodos de pago por región</h1>
            <p className="text-muted-foreground text-sm">
              Configura qué métodos aparecen en cada país/región según la IP del comprador.
              El cliente <strong>no</strong> ve esta página.
            </p>
          </header>

          <Card className="p-4 border-primary/30 bg-primary/5 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold mr-2">Vista previa checkout:</span>
            <Button asChild size="sm">
              <a href={`/checkout/${PREVIEW_SKU}?country=PE`} target="_blank" rel="noreferrer">🇵🇪 Perú</a>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <a href={`/checkout/${PREVIEW_SKU}?country=US`} target="_blank" rel="noreferrer">🇺🇸 USA (Stripe)</a>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <a href={`/checkout/${PREVIEW_SKU}?country=DE`} target="_blank" rel="noreferrer">🌎 Global (Stripe)</a>
            </Button>
            <div className="ml-auto">
              <Button size="sm" onClick={() => setRegionEdit(emptyRegion())}>
                <Plus className="w-4 h-4 mr-1" /> Nueva región
              </Button>
            </div>
          </Card>

          {loading && <Card className="p-8 text-center text-muted-foreground">Cargando…</Card>}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {regions.map((r) => {
              const rms = methods.filter(m => m.region_code === r.code);
              return (
                <Card key={r.code} className={`p-5 border-2 ${r.enabled ? "border-primary/40" : "border-muted opacity-60"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <span className="text-2xl">{r.flag || "🌐"}</span> {r.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.currency} · {r.gateway || "—"}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Países: {r.country_codes.length ? r.country_codes.join(", ") : "—"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge variant="outline" className="text-[10px]">{r.code}</Badge>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setRegionEdit(r)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteRegion(r.code)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {r.description && <p className="text-xs text-muted-foreground mb-3">{r.description}</p>}

                  <div className="space-y-1.5">
                    {rms.map(m => {
                      const Icon = ICONS[m.icon] || CreditCard;
                      return (
                        <div key={m.id} className={`flex items-center gap-2 text-sm p-2 rounded border ${m.enabled ? "bg-background" : "bg-muted/50 opacity-60"}`}>
                          <Icon className="w-4 h-4 text-foreground/70 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium leading-tight truncate">{m.label}</div>
                            {m.note && <div className="text-[11px] text-muted-foreground truncate">{m.note}</div>}
                          </div>
                          <Switch checked={m.enabled} onCheckedChange={() => toggleMethod(m)} />
                          <Button size="icon" variant="ghost" onClick={() => setMethodEdit(m)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteMethod(m.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                    <Button size="sm" variant="outline" className="w-full mt-2"
                      onClick={() => setMethodEdit(emptyMethod(r.code))}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Agregar método
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="p-4 bg-muted/40 text-xs text-muted-foreground space-y-1">
            <p><strong>Detección:</strong> IP del comprador vía ipapi.co → se busca el código de país en <code>country_codes</code> de cada región. La región con código <code>*</code> es el fallback global.</p>
            <p><strong>Nota técnica:</strong> desactivar un método aquí lo oculta de la UI del checkout. Para Stripe, los métodos habilitados se pasan como <code>payment_method_types</code> a la sesión.</p>
          </Card>
        </div>
      </main>

      {/* Region editor */}
      <Dialog open={!!regionEdit} onOpenChange={(o) => !o && setRegionEdit(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{regionEdit?.code ? "Editar región" : "Nueva región"}</DialogTitle></DialogHeader>
          {regionEdit && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Código (único, MAYÚS)</Label>
                  <Input value={regionEdit.code} onChange={(e) => setRegionEdit({ ...regionEdit, code: e.target.value.toUpperCase() })} placeholder="MX" />
                </div>
                <div>
                  <Label>Bandera (emoji)</Label>
                  <Input value={regionEdit.flag || ""} onChange={(e) => setRegionEdit({ ...regionEdit, flag: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Nombre</Label>
                <Input value={regionEdit.name} onChange={(e) => setRegionEdit({ ...regionEdit, name: e.target.value })} placeholder="México" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Moneda</Label>
                  <Input value={regionEdit.currency} onChange={(e) => setRegionEdit({ ...regionEdit, currency: e.target.value })} placeholder="MXN" />
                </div>
                <div>
                  <Label>Pasarela</Label>
                  <Input value={regionEdit.gateway || ""} onChange={(e) => setRegionEdit({ ...regionEdit, gateway: e.target.value })} placeholder="Stripe" />
                </div>
              </div>
              <div>
                <Label>Países ISO (separados por coma, usa * para fallback global)</Label>
                <Input value={regionEdit.country_codes.join(",")}
                  onChange={(e) => setRegionEdit({ ...regionEdit, country_codes: e.target.value.split(",").map(s => s.trim().toUpperCase()).filter(Boolean) })}
                  placeholder="MX,GT,HN" />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea rows={2} value={regionEdit.description || ""} onChange={(e) => setRegionEdit({ ...regionEdit, description: e.target.value })} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={regionEdit.enabled} onCheckedChange={(v) => setRegionEdit({ ...regionEdit, enabled: v })} />
                  <Label>Activa</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Orden</Label>
                  <Input type="number" className="w-20" value={regionEdit.sort_order}
                    onChange={(e) => setRegionEdit({ ...regionEdit, sort_order: Number(e.target.value) })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRegionEdit(null)}>Cancelar</Button>
            <Button onClick={() => regionEdit && saveRegion(regionEdit)}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Method editor */}
      <Dialog open={!!methodEdit} onOpenChange={(o) => !o && setMethodEdit(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{methodEdit?.id ? "Editar método" : "Nuevo método"}</DialogTitle></DialogHeader>
          {methodEdit && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Región</Label>
                  <Input value={methodEdit.region_code} disabled />
                </div>
                <div>
                  <Label>Clave (a-z, _)</Label>
                  <Input value={methodEdit.method_key}
                    onChange={(e) => setMethodEdit({ ...methodEdit, method_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                    placeholder="stripe_oxxo" />
                </div>
              </div>
              <div>
                <Label>Etiqueta</Label>
                <Input value={methodEdit.label} onChange={(e) => setMethodEdit({ ...methodEdit, label: e.target.value })} placeholder="OXXO" />
              </div>
              <div>
                <Label>Nota</Label>
                <Input value={methodEdit.note || ""} onChange={(e) => setMethodEdit({ ...methodEdit, note: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Icono</Label>
                  <select className="w-full border rounded h-10 px-2 bg-background" value={methodEdit.icon}
                    onChange={(e) => setMethodEdit({ ...methodEdit, icon: e.target.value })}>
                    {Object.keys(ICONS).map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Orden</Label>
                  <Input type="number" value={methodEdit.sort_order}
                    onChange={(e) => setMethodEdit({ ...methodEdit, sort_order: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={methodEdit.enabled} onCheckedChange={(v) => setMethodEdit({ ...methodEdit, enabled: v })} />
                <Label>Activo</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMethodEdit(null)}>Cancelar</Button>
            <Button onClick={() => methodEdit && saveMethod(methodEdit)}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
