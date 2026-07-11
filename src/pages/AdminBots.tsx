import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";

interface Filter {
  id: string;
  pattern: string;
  kind: "user_agent" | "referrer" | "ip";
  enabled: boolean;
  note: string | null;
  updated_at: string;
}

const KIND_LABEL: Record<string, string> = {
  user_agent: "User-Agent",
  referrer: "Referrer",
  ip: "IP",
};

const AdminBots = () => {
  const { adminKey } = useAdminKey();
  const [filters, setFilters] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPattern, setNewPattern] = useState("");
  const [newKind, setNewKind] = useState<Filter["kind"]>("user_agent");
  const [newNote, setNewNote] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("bot-filters", {
        body: { action: "list", adminKey },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setFilters((data as { filters: Filter[] }).filters);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [adminKey]);

  const add = async () => {
    if (!newPattern.trim()) return;
    try {
      const { data, error } = await supabase.functions.invoke("bot-filters", {
        body: { action: "add", adminKey, pattern: newPattern, kind: newKind, note: newNote },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      toast.success("Filtro agregado");
      setNewPattern(""); setNewNote("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  const toggle = async (id: string, enabled: boolean) => {
    setFilters((f) => f.map((x) => (x.id === id ? { ...x, enabled } : x)));
    await supabase.functions.invoke("bot-filters", { body: { action: "toggle", adminKey, id, enabled } });
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este filtro?")) return;
    await supabase.functions.invoke("bot-filters", { body: { action: "delete", adminKey, id } });
    await load();
  };

  const grouped = {
    user_agent: filters.filter((f) => f.kind === "user_agent"),
    referrer: filters.filter((f) => f.kind === "referrer"),
    ip: filters.filter((f) => f.kind === "ip"),
  };

  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Filtros de bots</h1>
            <p className="text-sm text-muted-foreground">
              Patrones que se aplican al User-Agent, Referrer o IP de cada visita.
              Si coinciden, la visita NO se registra en <code>funnel_events</code>.
              Los cambios se aplican en ~60 segundos (caché del edge).
            </p>
          </div>

          {/* Add new */}
          <Card className="p-4 space-y-3">
            <h2 className="font-semibold">Agregar nuevo patrón</h2>
            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr_1fr_auto] gap-2">
              <select
                value={newKind}
                onChange={(e) => setNewKind(e.target.value as Filter["kind"])}
                className="h-10 px-3 rounded-md border bg-background text-sm"
              >
                <option value="user_agent">User-Agent</option>
                <option value="referrer">Referrer</option>
                <option value="ip">IP exacta</option>
              </select>
              <Input
                placeholder={newKind === "ip" ? "203.0.113.10" : "patrón (ej. semrush, radarads)"}
                value={newPattern}
                onChange={(e) => setNewPattern(e.target.value)}
              />
              <Input
                placeholder="Nota (opcional)"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <Button onClick={add}><Plus className="w-4 h-4 mr-1" />Agregar</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Coincidencia por subcadena, sin distinción de mayúsculas. Para IP, coincide exacta.
            </p>
          </Card>

          {loading && <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />}

          {(["user_agent", "referrer", "ip"] as const).map((k) => (
            <Card key={k} className="p-4">
              <h2 className="font-semibold mb-3">
                {KIND_LABEL[k]} <span className="text-xs text-muted-foreground">({grouped[k].length})</span>
              </h2>
              <div className="space-y-1">
                {grouped[k].map((f) => (
                  <div key={f.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <Switch checked={f.enabled} onCheckedChange={(v) => toggle(f.id, v)} />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm truncate">{f.pattern}</div>
                      {f.note && <div className="text-xs text-muted-foreground truncate">{f.note}</div>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => remove(f.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {grouped[k].length === 0 && (
                  <p className="text-sm text-muted-foreground py-2">Sin patrones.</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
};

export default AdminBots;
