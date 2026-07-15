import { useCallback, useEffect, useMemo, useState } from "react";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";
import { adminInvoke } from "@/lib/adminInvoke";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, Plus, Trash2, Save, X, Users } from "lucide-react";
import { toast } from "sonner";

interface Row {
  id: string;
  match_type: "hotmart_product_id" | "hotmart_product_code" | "tienda_sku" | "category" | "any_sku";
  match_value: string;
  event_kind: "any" | "compra" | "abandonado";
  list_id: number;
  tag: string | null;
  label: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

const MATCH_LABEL: Record<Row["match_type"], string> = {
  hotmart_product_id: "Hotmart · Product ID",
  hotmart_product_code: "Hotmart · Product Code",
  tienda_sku: "Tienda · SKU",
  category: "Categoría",
  any_sku: "Cualquier SKU",
};

const EVENT_LABEL: Record<Row["event_kind"], string> = {
  any: "Compra + Abandono",
  compra: "Solo compra",
  abandonado: "Solo abandono",
};

const empty: Partial<Row> = {
  match_type: "tienda_sku",
  match_value: "",
  event_kind: "any",
  list_id: 0,
  tag: "",
  label: "",
  notes: "",
  active: true,
};

const AdminBrevoAudiences = () => {
  const { adminKey } = useAdminKey();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Partial<Row> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await adminInvoke<{ rows: Row[] }>("manage-brevo-audiences", {
        body: { adminKey, action: "list" },
      });
      if (error) throw error;
      setRows(data?.rows ?? []);
    } catch (e) {
      toast.error("No se pudo cargar las audiencias", { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!editing) return;
    if (!editing.match_value?.trim()) return toast.error("Valor requerido");
    if (!editing.list_id || Number(editing.list_id) <= 0) return toast.error("List ID de Brevo requerido");
    try {
      const { error } = await adminInvoke("manage-brevo-audiences", {
        body: { adminKey, action: "upsert", row: editing },
      });
      if (error) throw error;
      toast.success("Audiencia guardada");
      setEditing(null);
      await load();
    } catch (e) {
      toast.error("Error al guardar", { description: (e as Error).message });
    }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar esta regla? Los futuros contactos ya no se añadirán a la lista.")) return;
    try {
      const { error } = await adminInvoke("manage-brevo-audiences", {
        body: { adminKey, action: "delete", id },
      });
      if (error) throw error;
      toast.success("Eliminada");
      await load();
    } catch (e) {
      toast.error("Error al eliminar", { description: (e as Error).message });
    }
  };

  const toggle = async (id: string, active: boolean) => {
    try {
      const { error } = await adminInvoke("manage-brevo-audiences", {
        body: { adminKey, action: "toggle", id, active },
      });
      if (error) throw error;
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, active } : r)));
    } catch (e) {
      toast.error("No se pudo actualizar", { description: (e as Error).message });
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const r of rows) {
      const key = MATCH_LABEL[r.match_type];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return [...map.entries()];
  }, [rows]);

  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background py-6 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" /> Audiencias de Brevo por producto
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
                Vincula cada producto (por Hotmart Product ID/Code, SKU de tienda, categoría, o cualquier SKU)
                a una <b>lista de Brevo</b>. Cuando llegue una compra o carrito abandonado que coincida,
                el contacto se añade automáticamente a esa lista y recibe un <b>tag</b> extra — listo para
                lanzar automatizaciones específicas por producto sin editar código.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Actualizar
              </Button>
              <Button size="sm" onClick={() => setEditing({ ...empty })}>
                <Plus className="w-4 h-4 mr-2" /> Nueva regla
              </Button>
            </div>
          </header>

          {editing && (
            <Card className="p-5 border-primary/40">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">{editing.id ? "Editar audiencia" : "Nueva audiencia"}</h2>
                <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tipo de coincidencia</label>
                  <select
                    className="w-full h-10 rounded-md border bg-background px-3 text-sm mt-1"
                    value={editing.match_type}
                    onChange={(e) => setEditing({ ...editing, match_type: e.target.value as Row["match_type"] })}
                  >
                    {Object.entries(MATCH_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Valor a coincidir <span className="text-muted-foreground">(ej. 5081234, sku-8000, 8000_palabras)</span>
                  </label>
                  <Input
                    value={editing.match_value ?? ""}
                    onChange={(e) => setEditing({ ...editing, match_value: e.target.value })}
                    placeholder="Ej: 5081234 o sku-8000-palabras"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Cuándo aplica</label>
                  <select
                    className="w-full h-10 rounded-md border bg-background px-3 text-sm mt-1"
                    value={editing.event_kind}
                    onChange={(e) => setEditing({ ...editing, event_kind: e.target.value as Row["event_kind"] })}
                  >
                    {Object.entries(EVENT_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Brevo List ID (numérico)</label>
                  <Input
                    type="number"
                    value={editing.list_id ?? ""}
                    onChange={(e) => setEditing({ ...editing, list_id: Number(e.target.value) })}
                    placeholder="Ej: 42"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Tag opcional <span className="text-muted-foreground">(se añade al atributo TAGS)</span>
                  </label>
                  <Input
                    value={editing.tag ?? ""}
                    onChange={(e) => setEditing({ ...editing, tag: e.target.value })}
                    placeholder="Ej: prod_8000_palabras"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Etiqueta legible (label)</label>
                  <Input
                    value={editing.label ?? ""}
                    onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                    placeholder="Ej: 8,000 palabras · Compradores"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Notas internas (opcional)</label>
                  <Input
                    value={editing.notes ?? ""}
                    onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                    placeholder="Ej: Trigger de automation 'Serie 8k palabras · Día 1/3/7'"
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center gap-2 md:col-span-2">
                  <Switch
                    checked={editing.active !== false}
                    onCheckedChange={(v) => setEditing({ ...editing, active: v })}
                  />
                  <span className="text-sm">Activa</span>
                </div>
              </div>
              <div className="flex gap-2 mt-5 justify-end">
                <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button size="sm" onClick={save}>
                  <Save className="w-4 h-4 mr-2" /> Guardar
                </Button>
              </div>
            </Card>
          )}

          {grouped.length === 0 && !loading && (
            <Card className="p-10 text-center text-muted-foreground">
              Aún no hay reglas. Crea la primera con "Nueva regla" para empezar a lanzar automatizaciones por producto.
            </Card>
          )}

          {grouped.map(([groupLabel, groupRows]) => (
            <Card key={groupLabel} className="overflow-hidden">
              <div className="px-4 py-2 bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                {groupLabel} · {groupRows.length}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/20 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Valor</th>
                      <th className="px-3 py-2 text-left">Cuándo</th>
                      <th className="px-3 py-2 text-left">List ID</th>
                      <th className="px-3 py-2 text-left">Tag</th>
                      <th className="px-3 py-2 text-left">Etiqueta</th>
                      <th className="px-3 py-2 text-left">Activa</th>
                      <th className="px-3 py-2 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupRows.map((r) => (
                      <tr key={r.id} className="border-t hover:bg-muted/20">
                        <td className="px-3 py-2 font-mono text-xs">{r.match_value}</td>
                        <td className="px-3 py-2">
                          <Badge variant="secondary" className="font-normal">{EVENT_LABEL[r.event_kind]}</Badge>
                        </td>
                        <td className="px-3 py-2 font-mono">{r.list_id}</td>
                        <td className="px-3 py-2 text-xs">{r.tag || "—"}</td>
                        <td className="px-3 py-2 text-xs">{r.label || "—"}</td>
                        <td className="px-3 py-2">
                          <Switch checked={r.active} onCheckedChange={(v) => void toggle(r.id, v)} />
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>Editar</Button>
                          <Button size="sm" variant="ghost" className="text-red-600" onClick={() => void remove(r.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
};

export default AdminBrevoAudiences;
