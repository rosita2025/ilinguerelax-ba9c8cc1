import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import AdminNav from "@/components/admin/AdminNav";
import { adminInvoke } from "@/lib/adminInvoke";
import { invalidateBinanceConfigCache } from "@/hooks/useBinancePayConfig";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2, Wallet } from "lucide-react";

type BinanceConfig = {
  id?: string;
  region_code: string;
  address: string;
  holder_name: string;
  qr_url: string;
  network: string;
  pay_id?: string | null;
  notes?: string | null;
  active: boolean;
};

const EMPTY: BinanceConfig = {
  region_code: "",
  address: "",
  holder_name: "",
  qr_url: "",
  network: "Binance Pay (Pay ID)",
  pay_id: "",
  notes: "",
  active: true,
};

export default function AdminBinanceConfig() {
  const [items, setItems] = useState<BinanceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const [newRow, setNewRow] = useState<BinanceConfig>(EMPTY);

  const load = async () => {
    setLoading(true);
    const { data, error } = await adminInvoke<{ configs: BinanceConfig[]; error?: string }>(
      "manage-binance-config",
      { body: { action: "list" } },
    );
    setLoading(false);
    if (error || data?.error) return toast.error(data?.error || error?.message || "Error");
    setItems(data?.configs || []);
  };

  useEffect(() => { load(); }, []);

  const save = async (cfg: BinanceConfig) => {
    if (!cfg.region_code.trim()) return toast.error("Region code required");
    if (!cfg.address.trim() || !cfg.holder_name.trim() || !cfg.qr_url.trim()) {
      return toast.error("Address, holder and QR URL required");
    }
    setSavingCode(cfg.region_code);
    const { data, error } = await adminInvoke<{ ok?: boolean; error?: string }>(
      "manage-binance-config",
      { body: { action: "save", config: { ...cfg, region_code: cfg.region_code.toUpperCase() } } },
    );
    setSavingCode(null);
    if (error || data?.error) return toast.error(data?.error || error?.message || "Error");
    invalidateBinanceConfigCache();
    toast.success("Guardado");
    setNewRow(EMPTY);
    load();
  };

  const remove = async (region_code: string) => {
    if (region_code === "DEFAULT") return toast.error("No se puede borrar DEFAULT");
    if (!confirm(`¿Borrar configuración de ${region_code}?`)) return;
    const { data, error } = await adminInvoke<{ ok?: boolean; error?: string }>(
      "manage-binance-config",
      { body: { action: "delete", region_code } },
    );
    if (error || data?.error) return toast.error(data?.error || error?.message || "Error");
    invalidateBinanceConfigCache();
    toast.success("Eliminado");
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <header className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#F0B90B]/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-[#F0B90B]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Binance Pay · Configuración</h1>
            <p className="text-sm text-muted-foreground">
              Edita el QR, dirección/Pay ID y titular por región. Usa <code>DEFAULT</code> como fallback global.
            </p>
          </div>
        </header>

        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
          </div>
        )}

        <div className="space-y-4">
          {items.map((cfg) => (
            <ConfigCard
              key={cfg.region_code}
              value={cfg}
              onSave={save}
              onRemove={() => remove(cfg.region_code)}
              saving={savingCode === cfg.region_code}
              isDefault={cfg.region_code === "DEFAULT"}
            />
          ))}
        </div>

        <Card className="p-4 sm:p-6 border-dashed">
          <div className="flex items-center gap-2 mb-3">
            <Plus className="w-4 h-4" />
            <h2 className="font-semibold">Añadir configuración por región</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Usa el código de la región definido en <code>/admin/checkout-methods</code> (ej. <code>PE</code>, <code>US</code>, <code>GLOBAL</code>).
          </p>
          <ConfigCard
            value={newRow}
            onSave={save}
            saving={savingCode === newRow.region_code}
            isNew
            onChange={setNewRow}
          />
        </Card>
      </div>
    </div>
  );
}

function ConfigCard({
  value, onSave, onRemove, saving, isDefault, isNew, onChange,
}: {
  value: BinanceConfig;
  onSave: (cfg: BinanceConfig) => void;
  onRemove?: () => void;
  saving?: boolean;
  isDefault?: boolean;
  isNew?: boolean;
  onChange?: (v: BinanceConfig) => void;
}) {
  const [local, setLocal] = useState<BinanceConfig>(value);
  useEffect(() => { setLocal(value); }, [value]);
  const set = (patch: Partial<BinanceConfig>) => {
    const next = { ...local, ...patch };
    setLocal(next);
    onChange?.(next);
  };

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {isDefault && <Badge>DEFAULT</Badge>}
          {!isNew && !isDefault && <Badge variant="secondary">{value.region_code}</Badge>}
          {!local.active && <Badge variant="destructive">Inactivo</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={local.active} onCheckedChange={(v) => set({ active: v })} />
          <Label className="text-xs">Activo</Label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Region code</Label>
          <Input
            value={local.region_code}
            onChange={(e) => set({ region_code: e.target.value.toUpperCase() })}
            placeholder="DEFAULT · PE · US · GLOBAL"
            disabled={!isNew && !isDefault ? false : isDefault}
          />
        </div>
        <div>
          <Label className="text-xs">Red / Moneda</Label>
          <Input
            value={local.network}
            onChange={(e) => set({ network: e.target.value })}
            placeholder="Binance Pay (Pay ID)"
          />
        </div>
        <div>
          <Label className="text-xs">Titular</Label>
          <Input
            value={local.holder_name}
            onChange={(e) => set({ holder_name: e.target.value })}
            placeholder="iLingue Relax"
          />
        </div>
        <div>
          <Label className="text-xs">Dirección / Pay ID</Label>
          <Input
            value={local.address}
            onChange={(e) => set({ address: e.target.value })}
            placeholder="TPAw…"
          />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs">URL del QR</Label>
          <Input
            value={local.qr_url}
            onChange={(e) => set({ qr_url: e.target.value })}
            placeholder="https://…/qr.jpg"
          />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs">Notas internas</Label>
          <Textarea
            value={local.notes ?? ""}
            onChange={(e) => set({ notes: e.target.value })}
            rows={2}
            placeholder="Opcional"
          />
        </div>
      </div>

      {local.qr_url && (
        <div className="flex items-center gap-3">
          <img
            src={local.qr_url}
            alt="QR preview"
            className="w-24 h-24 rounded-lg border object-contain bg-white p-1"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.3"; }}
          />
          <p className="text-xs text-muted-foreground">Vista previa del QR (así lo verá el comprador).</p>
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t">
        <Button onClick={() => onSave(local)} disabled={saving} size="sm">
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          {isNew ? "Crear" : "Guardar"}
        </Button>
        {onRemove && !isDefault && (
          <Button onClick={onRemove} variant="ghost" size="sm" className="text-destructive">
            <Trash2 className="w-4 h-4 mr-1" /> Borrar
          </Button>
        )}
      </div>
    </Card>
  );
}
