import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bug, Loader2, RefreshCw, ExternalLink, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";

interface EventItem {
  id: string;
  event_name: string;
  page_path: string | null;
  full_url: string | null;
  referrer: string | null;
  country: string | null;
  session_id: string | null;
  value: number | null;
  currency: string | null;
  is_bot: boolean;
  created_at: string;
}

interface SkuData {
  sku: string;
  total: number;
  humans: number;
  bots: number;
  sessions: number;
  lastSeen: string;
  events: Record<string, number>;
  urls: Record<string, number>;
  referrers: Record<string, number>;
  recent: EventItem[];
}

interface DebugData {
  windowMinutes: number;
  totalEvents: number;
  includeBots: boolean;
  skus: SkuData[];
  recent: EventItem[];
  generatedAt: string;
}

const timeAgo = (iso: string) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
};

const EVENT_COLORS: Record<string, string> = {
  PageView: "bg-slate-500/20 text-slate-300",
  ViewContent: "bg-blue-500/20 text-blue-300",
  AddToCart: "bg-amber-500/20 text-amber-300",
  InitiateCheckout: "bg-orange-500/20 text-orange-300",
  Purchase: "bg-green-500/20 text-green-300",
  Lead: "bg-purple-500/20 text-purple-300",
};

const copy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copiado");
  } catch {
    toast.error("No se pudo copiar");
  }
};

const AdminDebug = () => {
  const { adminKey } = useAdminKey();
  const [data, setData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(false);
  const [windowMin, setWindowMin] = useState(30);
  const [includeBots, setIncludeBots] = useState(false);
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("debug-events", {
        body: { adminKey, windowMinutes: windowMin, includeBots },
      });
      if (error) throw error;
      if ((res as { error?: string })?.error) {
        toast.error((res as { error: string }).error);
        return;
      }
      setData(res as DebugData);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey, windowMin, includeBots]);

  useEffect(() => {
    const id = setInterval(() => void load(), 8000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey, windowMin, includeBots]);

  const filteredSkus = useMemo(() => {
    if (!data) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return data.skus;
    return data.skus.filter(
      (s) =>
        s.sku.toLowerCase().includes(q) ||
        Object.keys(s.urls).some((u) => u.toLowerCase().includes(q)),
    );
  }, [data, filter]);

  if (!data) {
    return (
      <>
        <AdminNav />
        <main className="min-h-dvh bg-background flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </main>
      </>
    );
  }

  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Bug className="w-7 h-7 text-primary" /> Debug de eventos por SKU
              </h1>
              <p className="text-sm text-muted-foreground">
                Eventos crudos (ViewContent, AddToCart, InitiateCheckout, Purchase…) por SKU y URL exacta ·
                actualizado {timeAgo(data.generatedAt)} atrás · ventana {data.windowMinutes} min · {data.totalEvents} eventos
              </p>
            </div>
            <div className="flex items-center gap-2">
              {[15, 30, 60, 180, 720].map((m) => (
                <Button
                  key={m}
                  variant={windowMin === m ? "default" : "outline"}
                  size="sm"
                  onClick={() => setWindowMin(m)}
                >
                  {m < 60 ? `${m}m` : `${m / 60}h`}
                </Button>
              ))}
              <Button
                variant={includeBots ? "default" : "outline"}
                size="sm"
                onClick={() => setIncludeBots((v) => !v)}
                title="Incluir bots"
              >
                {includeBots ? "Con bots" : "Sin bots"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <Input
            placeholder="Filtrar por SKU o URL…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-md"
          />

          {filteredSkus.length === 0 && (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Sin eventos en esta ventana. Prueba ampliar el rango o incluir bots.
            </Card>
          )}

          <div className="space-y-3">
            {filteredSkus.map((sku) => {
              const isOpen = expanded === sku.sku;
              const topEvents = Object.entries(sku.events).sort(([, a], [, b]) => b - a);
              const topUrls = Object.entries(sku.urls).sort(([, a], [, b]) => b - a);
              const topRefs = Object.entries(sku.referrers).sort(([, a], [, b]) => b - a).slice(0, 6);
              return (
                <Card key={sku.sku} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded truncate max-w-full">
                          {sku.sku}
                        </code>
                        <button
                          onClick={() => copy(sku.sku)}
                          className="text-muted-foreground hover:text-foreground"
                          title="Copiar SKU"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <Badge variant="secondary">{sku.total} eventos</Badge>
                        <Badge variant="outline">{sku.sessions} sesiones</Badge>
                        {sku.bots > 0 && (
                          <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                            {sku.bots} bots
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          último: {timeAgo(sku.lastSeen)} atrás
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {topEvents.map(([name, n]) => (
                          <span
                            key={name}
                            className={`text-xs px-2 py-0.5 rounded ${
                              EVENT_COLORS[name] || "bg-muted text-muted-foreground"
                            }`}
                          >
                            {name} · {n}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpanded(isOpen ? null : sku.sku)}
                    >
                      {isOpen ? "Ocultar" : "Ver detalle"}
                    </Button>
                  </div>

                  {isOpen && (
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                          URLs exactas ({topUrls.length})
                        </div>
                        <div className="space-y-1">
                          {topUrls.map(([url, n]) => (
                            <div
                              key={url}
                              className="flex items-center gap-2 text-xs border rounded px-2 py-1.5"
                            >
                              <span className="tabular-nums text-muted-foreground w-8 shrink-0">{n}</span>
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="truncate flex-1 hover:underline"
                                title={url}
                              >
                                {url}
                              </a>
                              <button
                                onClick={() => copy(url)}
                                className="text-muted-foreground hover:text-foreground shrink-0"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                          Referrers ({topRefs.length})
                        </div>
                        <div className="space-y-1">
                          {topRefs.map(([ref, n]) => (
                            <div
                              key={ref}
                              className="flex items-center gap-2 text-xs border rounded px-2 py-1.5"
                            >
                              <span className="tabular-nums text-muted-foreground w-8 shrink-0">{n}</span>
                              <span className="truncate flex-1" title={ref}>{ref}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="lg:col-span-2">
                        <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                          Últimos {sku.recent.length} eventos
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="text-muted-foreground">
                              <tr className="border-b">
                                <th className="text-left py-1.5 pr-2">Hora</th>
                                <th className="text-left py-1.5 pr-2">Evento</th>
                                <th className="text-left py-1.5 pr-2">URL</th>
                                <th className="text-left py-1.5 pr-2">Referrer</th>
                                <th className="text-left py-1.5 pr-2">País</th>
                                <th className="text-left py-1.5 pr-2">Sesión</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sku.recent.map((e) => (
                                <tr key={e.id} className="border-b border-border/50">
                                  <td className="py-1 pr-2 text-muted-foreground tabular-nums">
                                    {timeAgo(e.created_at)}
                                  </td>
                                  <td className="py-1 pr-2">
                                    <span
                                      className={`px-1.5 py-0.5 rounded ${
                                        EVENT_COLORS[e.event_name] || "bg-muted"
                                      }`}
                                    >
                                      {e.event_name}
                                    </span>
                                    {e.is_bot && (
                                      <span className="ml-1 text-[10px] text-red-400">bot</span>
                                    )}
                                  </td>
                                  <td className="py-1 pr-2 max-w-[240px]">
                                    {e.full_url ? (
                                      <a
                                        href={e.full_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="truncate block hover:underline text-primary"
                                        title={e.full_url}
                                      >
                                        {e.page_path || e.full_url}
                                      </a>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </td>
                                  <td className="py-1 pr-2 max-w-[180px] truncate" title={e.referrer || ""}>
                                    {e.referrer || <span className="text-muted-foreground">(directo)</span>}
                                  </td>
                                  <td className="py-1 pr-2">{e.country || "—"}</td>
                                  <td className="py-1 pr-2 font-mono text-muted-foreground truncate max-w-[90px]" title={e.session_id || ""}>
                                    {e.session_id?.slice(0, 8) || "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
};

export default AdminDebug;
