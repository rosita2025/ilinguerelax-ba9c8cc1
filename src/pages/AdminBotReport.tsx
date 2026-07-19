import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, TrendingDown, TrendingUp, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";

interface Summary {
  events: number; humans: number; bots: number;
  sessions: number; humanSessions: number; botSessions: number;
  byCountry: Record<string, number>;
  byReason: Record<string, number>;
  humansByCountry: Record<string, number>;
}
interface Report {
  pagePath: string;
  filterDeployedAt: string;
  window: { beforeStart: string; beforeEnd: string; afterStart: string; afterEnd: string; hoursBefore: number; hoursAfter: number };
  before: Summary;
  after: Summary;
  delta: { eventsPct: number; humansPct: number; botsPct: number; sessionsPct: number; humanSessionsPct: number };
  generatedAt: string;
}

const topN = (rec: Record<string, number>, n = 8) =>
  Object.entries(rec).sort((a, b) => b[1] - a[1]).slice(0, n);

const DeltaBadge = ({ pct, invert = false }: { pct: number; invert?: boolean }) => {
  const good = invert ? pct < 0 : pct > 0;
  const Icon = pct >= 0 ? TrendingUp : TrendingDown;
  return (
    <Badge variant="outline" className={good ? "text-emerald-600 border-emerald-300" : "text-rose-600 border-rose-300"}>
      <Icon className="h-3 w-3 mr-1" />{pct > 0 ? "+" : ""}{pct}%
    </Badge>
  );
};

export default function AdminBotReport() {
  const { adminKey } = useAdminKey();
  const [pagePath, setPagePath] = useState("/");
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!adminKey) return;
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("bot-filter-report", {
        body: { adminKey, pagePath, hoursBefore: 24, hoursAfter: 24 },
      });
      if (error) throw error;
      setData(res as Report);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [adminKey]);
  useEffect(() => {
    // Auto-refresh cada 60s, pausado cuando la pestaña está oculta (ligero para el hosting).
    const tick = () => { if (!document.hidden) void load(); };
    const id = setInterval(tick, 60_000);
    const onVis = () => { if (!document.hidden) void load(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey, pagePath]);

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Reporte Anti-Bot · 24h antes / 24h después
            </h1>
            <p className="text-sm text-muted-foreground">
              Compara eventos en <code className="bg-muted px-1 rounded">{pagePath}</code> antes y después del filtro anti-bot.
            </p>
          </div>
          <div className="flex gap-2">
            <Input value={pagePath} onChange={(e) => setPagePath(e.target.value)} className="w-40" placeholder="/" />
            <Button onClick={load} disabled={loading} size="sm">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {!data ? (
          <Card className="p-12 text-center text-muted-foreground">
            {loading ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : "Sin datos"}
          </Card>
        ) : (
          <>
            <Card className="p-3 text-xs text-muted-foreground">
              Filtro desplegado: <b>{new Date(data.filterDeployedAt).toLocaleString()}</b> · 
              Ventana antes: {new Date(data.window.beforeStart).toLocaleString()} → {new Date(data.window.beforeEnd).toLocaleString()} · 
              Ventana después: {new Date(data.window.afterStart).toLocaleString()} → {new Date(data.window.afterEnd).toLocaleString()}
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-4">
                <div className="text-xs text-muted-foreground">Eventos totales</div>
                <div className="text-2xl font-bold">{data.after.events}</div>
                <div className="text-xs mt-1">antes: {data.before.events} <DeltaBadge pct={data.delta.eventsPct} /></div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-muted-foreground">Humanos</div>
                <div className="text-2xl font-bold text-emerald-600">{data.after.humans}</div>
                <div className="text-xs mt-1">antes: {data.before.humans} <DeltaBadge pct={data.delta.humansPct} /></div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-muted-foreground">Bots detectados</div>
                <div className="text-2xl font-bold text-rose-600">{data.after.bots}</div>
                <div className="text-xs mt-1">antes: {data.before.bots} <DeltaBadge pct={data.delta.botsPct} invert /></div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-muted-foreground">Sesiones humanas</div>
                <div className="text-2xl font-bold">{data.after.humanSessions}</div>
                <div className="text-xs mt-1">antes: {data.before.humanSessions} <DeltaBadge pct={data.delta.humanSessionsPct} /></div>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <Card className="p-4">
                <h3 className="font-semibold mb-2 text-sm">Motivos de bot (después)</h3>
                {Object.keys(data.after.byReason).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin bots detectados en las últimas 24h.</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {topN(data.after.byReason).map(([k, v]) => (
                      <li key={k} className="flex justify-between border-b py-1">
                        <code className="text-xs bg-muted px-1.5 rounded">{k}</code>
                        <span className="font-mono">{v}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              <Card className="p-4">
                <h3 className="font-semibold mb-2 text-sm">Humanos por país (después)</h3>
                {Object.keys(data.after.humansByCountry).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin humanos aún en la ventana.</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {topN(data.after.humansByCountry).map(([k, v]) => (
                      <li key={k} className="flex justify-between border-b py-1">
                        <span>{k}</span>
                        <span className="font-mono">{v}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            <Card className="p-4">
              <h3 className="font-semibold mb-2 text-sm">Comparativa países (antes → después)</h3>
              <div className="text-xs">
                <div className="grid grid-cols-4 font-semibold border-b py-1">
                  <div>País</div><div className="text-right">Antes total</div><div className="text-right">Después total</div><div className="text-right">Δ</div>
                </div>
                {Array.from(new Set([...Object.keys(data.before.byCountry), ...Object.keys(data.after.byCountry)]))
                  .map((c) => ({ c, b: data.before.byCountry[c] || 0, a: data.after.byCountry[c] || 0 }))
                  .sort((x, y) => y.a - x.a).slice(0, 12).map(({ c, b, a }) => (
                    <div key={c} className="grid grid-cols-4 border-b py-1">
                      <div>{c}</div>
                      <div className="text-right font-mono">{b}</div>
                      <div className="text-right font-mono">{a}</div>
                      <div className="text-right font-mono">{a - b >= 0 ? "+" : ""}{a - b}</div>
                    </div>
                  ))}
              </div>
            </Card>

            <p className="text-xs text-muted-foreground text-center">
              Auto-refresh cada 5 min · Última actualización: {new Date(data.generatedAt).toLocaleTimeString()}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
