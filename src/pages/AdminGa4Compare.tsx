import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Loader2, RefreshCw, AlertTriangle, ShieldAlert, CheckCircle2, Globe2, FileText, Radio } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Row = { ga4: number; internal: number; diff: number; severity: "ok" | "warn" | "high"; cause: string };
type CountryRow = Row & { code: string };
type PageRow = Row & { path: string };
type SourceRow = Row & { source: string };

interface Data {
  windowMinutes: number;
  ga4Available: boolean;
  totals: {
    ga4ActiveUsers: number;
    internalActiveSessions: number;
    ga4PageViews: number;
    internalPageViews: number;
    bots: number;
    estimatedGa4Loss: number;
  };
  byCountry: CountryRow[];
  byPage: PageRow[];
  bySource: SourceRow[];
  byEvent: { ga4: Record<string, number>; internal: Record<string, number> };
  generatedAt: string;
}

const SEVERITY_STYLES: Record<Row["severity"], string> = {
  ok: "bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30",
  warn: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  high: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
};

const SEVERITY_ICON = {
  ok: <CheckCircle2 className="w-3.5 h-3.5" />,
  warn: <AlertTriangle className="w-3.5 h-3.5" />,
  high: <ShieldAlert className="w-3.5 h-3.5" />,
};

const flag = (code: string) => {
  if (!code || code.length !== 2 || !/^[A-Z]{2}$/.test(code)) return "🌐";
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0)));
};

export default function AdminGa4Compare() {
  const { adminKey } = useAdminKey();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [windowMinutes, setWindowMinutes] = useState(30);

  const load = async () => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("ga4-vs-internal", {
        body: { adminKey, windowMinutes },
      });
      if (error) throw error;
      if ((res as { error?: string })?.error) { toast.error((res as { error: string }).error); return; }
      setData(res as Data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [adminKey, windowMinutes]);
  useEffect(() => {
    const id = setInterval(() => { void load(); }, 20000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey, windowMinutes]);

  const allEvents = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>([...Object.keys(data.byEvent.ga4), ...Object.keys(data.byEvent.internal)]);
    return [...set].map((ev) => ({
      event: ev,
      ga4: data.byEvent.ga4[ev] || 0,
      internal: data.byEvent.internal[ev] || 0,
    })).sort((a, b) => (b.ga4 + b.internal) - (a.ga4 + a.internal));
  }, [data]);

  return (
    <>
      <Helmet><title>GA4 vs Interno · Admin · iLingue Relax</title></Helmet>
      <AdminNav />
      <main className="min-h-dvh bg-background">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
          <header className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold leading-tight flex items-center gap-2">
                Comparativa GA4 vs Pixel Interno
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-normal text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  EN VIVO
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mt-1">
                Datos reales de GA4 (Realtime API) vs eventos propios (<code>funnel_events</code>). Auto-refresh cada 20 s.
                {data?.generatedAt && (
                  <span className="block text-[10px] mt-0.5 opacity-70">
                    Última actualización: {new Date(data.generatedAt).toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
              {[15, 30, 60, 120].map((m) => (
                <Button key={m} size="sm" className="h-8 px-2 text-xs flex-1 sm:flex-none" variant={windowMinutes === m ? "default" : "outline"} onClick={() => setWindowMinutes(m)}>
                  {m < 60 ? `${m}m` : `${m / 60}h`}
                </Button>
              ))}
              <Button size="sm" className="h-8 px-2 text-xs" variant="outline" onClick={load} disabled={loading}>
                <RefreshCw className={cn("w-3.5 h-3.5 sm:mr-1", loading && "animate-spin")} />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>
            </div>
          </header>

          {!data ? (
            <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <>
              {!data.ga4Available && (
                <Card className="border-amber-500/40 bg-amber-500/5">
                  <CardContent className="pt-4 flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600" />
                    <div>GA4 no disponible. Verifica <code>GA4_PROPERTY_ID</code> y <code>GA4_SERVICE_ACCOUNT_JSON</code>.</div>
                  </CardContent>
                </Card>
              )}

              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <SummaryCard label="GA4 Active" value={data.totals.ga4ActiveUsers} sub="usuarios activos" icon={<Radio className="w-4 h-4" />} />
                <SummaryCard label="Sesiones Pixel" value={data.totals.internalActiveSessions} sub="humanos únicos" icon={<Globe2 className="w-4 h-4" />} />
                <SummaryCard label="GA4 PageViews" value={data.totals.ga4PageViews} sub={`últimos ${data.windowMinutes} min`} icon={<FileText className="w-4 h-4" />} />
                <SummaryCard label="Pixel PageViews" value={data.totals.internalPageViews} sub="incluye ViewContent" icon={<FileText className="w-4 h-4" />} />
                <SummaryCard
                  label="Pérdida GA4 est."
                  value={`${data.totals.estimatedGa4Loss}%`}
                  sub={data.totals.estimatedGa4Loss > 20 ? "adblock alto" : data.totals.estimatedGa4Loss > 0 ? "normal" : "sin pérdida"}
                  icon={<ShieldAlert className="w-4 h-4" />}
                  tone={data.totals.estimatedGa4Loss > 30 ? "danger" : data.totals.estimatedGa4Loss > 15 ? "warn" : "ok"}
                />
              </div>

              <Tabs defaultValue="pages" className="w-full">
                <TabsList className="w-full grid grid-cols-4 h-auto">
                  <TabsTrigger value="pages" className="text-xs sm:text-sm px-1">Páginas</TabsTrigger>
                  <TabsTrigger value="countries" className="text-xs sm:text-sm px-1">Países</TabsTrigger>
                  <TabsTrigger value="sources" className="text-xs sm:text-sm px-1">Fuentes</TabsTrigger>
                  <TabsTrigger value="events" className="text-xs sm:text-sm px-1">Eventos</TabsTrigger>
                </TabsList>

                <TabsContent value="pages" className="mt-4">
                  <ComparisonTable
                    header="Página"
                    rows={data.byPage.map((r) => ({ key: r.path, label: r.path, ga4: r.ga4, internal: r.internal, diff: r.diff, severity: r.severity, cause: r.cause }))}
                  />
                </TabsContent>

                <TabsContent value="countries" className="mt-4">
                  <ComparisonTable
                    header="País"
                    rows={data.byCountry.map((r) => ({ key: r.code, label: `${flag(r.code)}  ${r.code}`, ga4: r.ga4, internal: r.internal, diff: r.diff, severity: r.severity, cause: r.cause }))}
                  />
                </TabsContent>

                <TabsContent value="sources" className="mt-4">
                  <ComparisonTable
                    header="Fuente"
                    rows={data.bySource.map((r) => ({ key: r.source, label: r.source, ga4: r.ga4, internal: r.internal, diff: r.diff, severity: r.severity, cause: r.cause }))}
                  />
                </TabsContent>

                <TabsContent value="events" className="mt-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Eventos disparados (GA4 vs Pixel)</CardTitle></CardHeader>
                    <CardContent className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-xs text-muted-foreground border-b">
                          <tr>
                            <th className="text-left py-2 pr-3">Evento</th>
                            <th className="text-right px-3">GA4</th>
                            <th className="text-right px-3">Pixel</th>
                            <th className="text-right pl-3">Δ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allEvents.map((e) => (
                            <tr key={e.event} className="border-b border-border/50">
                              <td className="py-2 pr-3 font-mono text-xs">{e.event}</td>
                              <td className="text-right px-3 tabular-nums">{e.ga4}</td>
                              <td className="text-right px-3 tabular-nums">{e.internal}</td>
                              <td className={cn("text-right pl-3 tabular-nums font-medium",
                                e.internal - e.ga4 > 0 ? "text-green-600" : e.internal - e.ga4 < 0 ? "text-red-600" : "text-muted-foreground")}>
                                {e.internal - e.ga4 > 0 ? "+" : ""}{e.internal - e.ga4}
                              </td>
                            </tr>
                          ))}
                          {allEvents.length === 0 && (
                            <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Sin eventos en la ventana</td></tr>
                          )}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <Card className="bg-muted/30">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Cómo interpretar</CardTitle></CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  <p><Badge className={SEVERITY_STYLES.ok} variant="outline">OK</Badge> Diferencia &lt;15% — sampling y latencia normal.</p>
                  <p><Badge className={SEVERITY_STYLES.warn} variant="outline">Warn</Badge> Diferencia 15–50% — probable adblock (Interno &gt; GA4) o Safari ITP.</p>
                  <p><Badge className={SEVERITY_STYLES.high} variant="outline">Alta</Badge> Solo un sistema reporta — bloqueo total de gtag.js, CSP, o pixel roto.</p>
                  <p className="pt-1">El pixel interno (<code>log-funnel-event</code>) va por dominio propio, por eso resiste adblockers que sí bloquean <code>google-analytics.com</code> y <code>connect.facebook.net</code>.</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </>
  );
}

function SummaryCard({ label, value, sub, icon, tone }: { label: string; value: number | string; sub?: string; icon: React.ReactNode; tone?: "ok" | "warn" | "danger" }) {
  const toneCls = tone === "danger" ? "border-red-500/40 bg-red-500/5" : tone === "warn" ? "border-amber-500/40 bg-amber-500/5" : "";
  return (
    <Card className={toneCls}>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide">{icon}{label}</div>
        <div className="text-2xl font-bold tabular-nums mt-1">{value}</div>
        {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function ComparisonTable({ header, rows }: { header: string; rows: Array<{ key: string; label: string; ga4: number; internal: number; diff: number; severity: Row["severity"]; cause: string }> }) {
  return (
    <Card>
      <CardContent className="pt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground border-b">
            <tr>
              <th className="text-left py-2 pr-3">{header}</th>
              <th className="text-right px-3">GA4</th>
              <th className="text-right px-3">Pixel</th>
              <th className="text-right px-3">Δ</th>
              <th className="text-left pl-3">Diagnóstico</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b border-border/50 hover:bg-muted/30">
                <td className="py-2 pr-2 font-medium truncate max-w-[120px] sm:max-w-[240px] text-xs sm:text-sm" title={r.label}>{r.label}</td>
                <td className="text-right px-1 sm:px-3 tabular-nums text-xs sm:text-sm">{r.ga4}</td>
                <td className="text-right px-1 sm:px-3 tabular-nums text-xs sm:text-sm">{r.internal}</td>
                <td className={cn("text-right px-1 sm:px-3 tabular-nums font-medium text-xs sm:text-sm",
                  r.diff > 0 ? "text-green-600" : r.diff < 0 ? "text-red-600" : "text-muted-foreground")}>
                  {r.diff > 0 ? "+" : ""}{r.diff}
                </td>
                <td className="pl-1 sm:pl-3 py-2">
                  <div className="flex flex-col sm:flex-row items-start gap-1 sm:gap-2">
                    <Badge variant="outline" className={cn("gap-1 text-[10px] sm:text-xs shrink-0", SEVERITY_STYLES[r.severity])}>
                      {SEVERITY_ICON[r.severity]}
                      {r.severity === "ok" ? "OK" : r.severity === "warn" ? "Warn" : "Alta"}
                    </Badge>
                    <span className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 sm:line-clamp-none">{r.cause}</span>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Sin datos en la ventana</td></tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
