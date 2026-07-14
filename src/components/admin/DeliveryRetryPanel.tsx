import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { adminInvoke } from "@/lib/adminInvoke";
import { useAdminKey } from "@/components/admin/AdminGate";
import { toast } from "sonner";
import { RefreshCw, ShieldAlert, CheckCircle2, PlayCircle, Timer } from "lucide-react";

interface Config {
  retry_after_minutes: number;
  max_attempts: number;
  scan_window_hours: number;
  enabled: boolean;
  updated_at?: string;
}

interface Alert {
  id: string;
  source: string;
  source_ref: string | null;
  customer_email: string | null;
  reason: string;
  details: unknown;
  resolved: boolean;
  created_at: string;
}

const reasonLabel: Record<string, string> = {
  missing_skus: "SKUs no identificados",
  max_attempts_reached: "Reintentos agotados",
};

export default function DeliveryRetryPanel() {
  const [config, setConfig] = useState<Config | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [draft, setDraft] = useState<Config | null>(null);

  const load = useCallback(async (action: "get" | "run" = "get") => {
    setLoading(true);
    try {
      const { data, error } = await adminInvoke("manage-delivery-retry", { action });
      if (error) throw error;
      setConfig(data?.config ?? null);
      setDraft(data?.config ?? null);
      setAlerts(data?.alerts ?? []);
      if (action === "run" && data?.runReport) {
        const r = data.runReport as { retried?: number; alerts?: number; skipped?: number };
        toast.success(`Reintentos: ${r.retried ?? 0} · Alertas: ${r.alerts ?? 0} · Saltados: ${r.skipped ?? 0}`);
      }
    } catch (e) {
      toast.error((e as Error).message || "Error");
    } finally {
      setLoading(false);
      setRunning(false);
    }
  }, []);

  useEffect(() => { load("get"); }, [load]);

  const saveConfig = async () => {
    if (!draft) return;
    setLoading(true);
    try {
      const { error } = await adminInvoke("manage-delivery-retry", { action: "update", config: draft });
      if (error) throw error;
      toast.success("Configuración guardada");
      await load("get");
    } catch (e) {
      toast.error((e as Error).message || "Error");
    }
  };

  const resolveAlert = async (id: string) => {
    try {
      await adminInvoke("manage-delivery-retry", { action: "resolve_alert", id });
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, resolved: true } : a)));
    } catch (e) {
      toast.error((e as Error).message || "Error");
    }
  };

  const open = alerts.filter((a) => !a.resolved);

  return (
    <Card className="p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Reintento automático de entrega digital</h2>
        </div>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={() => load("get")} disabled={loading}>
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} /> Refrescar
          </Button>
          <Button size="sm" onClick={() => { setRunning(true); load("run"); }} disabled={running || loading}>
            <PlayCircle className={`w-3 h-3 mr-1 ${running ? "animate-spin" : ""}`} />
            Ejecutar ahora
          </Button>
        </div>
      </div>

      {draft && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <label className="text-xs space-y-1">
            <span className="text-muted-foreground">Espera antes de reintentar (min)</span>
            <Input type="number" min={1} max={1440}
              value={draft.retry_after_minutes}
              onChange={(e) => setDraft({ ...draft, retry_after_minutes: Number(e.target.value) })}
            />
          </label>
          <label className="text-xs space-y-1">
            <span className="text-muted-foreground">Intentos máximos</span>
            <Input type="number" min={1} max={20}
              value={draft.max_attempts}
              onChange={(e) => setDraft({ ...draft, max_attempts: Number(e.target.value) })}
            />
          </label>
          <label className="text-xs space-y-1">
            <span className="text-muted-foreground">Ventana de escaneo (h)</span>
            <Input type="number" min={1} max={168}
              value={draft.scan_window_hours}
              onChange={(e) => setDraft({ ...draft, scan_window_hours: Number(e.target.value) })}
            />
          </label>
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={draft.enabled} onCheckedChange={(v) => setDraft({ ...draft, enabled: v })} />
              <span>Activo</span>
            </label>
            <Button size="sm" onClick={saveConfig} disabled={loading}>Guardar</Button>
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        El cron corre cada 5 minutos. Un pedido cuya entrega digital no se marque como enviada dentro de{" "}
        <strong>{config?.retry_after_minutes ?? "—"} min</strong> reintenta automáticamente hasta{" "}
        <strong>{config?.max_attempts ?? "—"} veces</strong>. Después se registra como alerta.
      </div>

      <div className="border-t pt-3">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="w-4 h-4 text-destructive" />
          <h3 className="text-sm font-semibold">Alertas ({open.length} abiertas)</h3>
        </div>
        {open.length === 0 ? (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 text-green-600" /> Sin alertas pendientes.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-[10px] uppercase text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-1 pr-2">Origen</th>
                  <th className="text-left py-1 pr-2">Referencia</th>
                  <th className="text-left py-1 pr-2">Cliente</th>
                  <th className="text-left py-1 pr-2">Motivo</th>
                  <th className="text-left py-1 pr-2">Fecha</th>
                  <th className="text-right py-1"></th>
                </tr>
              </thead>
              <tbody>
                {open.map((a) => (
                  <tr key={a.id} className="border-b hover:bg-muted/40">
                    <td className="py-1.5 pr-2">{a.source}</td>
                    <td className="py-1.5 pr-2 font-mono text-[10px]">{a.source_ref || "—"}</td>
                    <td className="py-1.5 pr-2">{a.customer_email || "—"}</td>
                    <td className="py-1.5 pr-2">{reasonLabel[a.reason] || a.reason}</td>
                    <td className="py-1.5 pr-2">{new Date(a.created_at).toLocaleString("es-ES")}</td>
                    <td className="py-1.5 text-right">
                      <Button size="sm" variant="outline" onClick={() => resolveAlert(a.id)}>Resolver</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
