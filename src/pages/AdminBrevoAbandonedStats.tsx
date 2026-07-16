import { useCallback, useEffect, useMemo, useState } from "react";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";
import { adminInvoke } from "@/lib/adminInvoke";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, ShoppingCart, Store, AlertTriangle, Globe, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";

interface StatsResponse {
  windowDays: number;
  country: string | null;
  totals: { total: number; hotmart: number; tienda: number; errors: number };
  series: Array<{ day: string; hotmart: number; tienda: number }>;
  byCountry: Array<{ code: string; hotmart: number; tienda: number; total: number }>;
  availableCountries: string[];
}

interface SegmentReport {
  windowDays: number;
  from: string;
  to: string;
  totals: { total: number; ok: number; error: number };
  byOrigin: Array<{ origen: string; total: number }>;
  bySegment: Array<{ segmento: string; total: number }>;
  matrix: Array<{ origen: string; segmento: string; total: number; ok: number; error: number }>;
}

interface BrevoRealResponse {
  range: { from: string; to: string };
  account: { emailsLeft: number | null; planType: string | null; planEndDate: string | null; error: string | null };
  stats: {
    requests: number; delivered: number; opens: number; uniqueOpens: number;
    clicks: number; uniqueClicks: number; hardBounces: number; softBounces: number;
    spamReports: number; blocked: number; unsubscribed: number; error: string | null;
  };
}

const SEGMENT_LABELS: Record<string, string> = {
  abandoned_cart: "Carrito abandonado",
  purchase: "Compra",
  pending: "Pendiente de pago",
  newsletter: "Newsletter",
  other: "Otros",
};
const ORIGIN_COLORS: Record<string, string> = { hotmart: "#f97316", tienda: "#0d9488", otro: "#64748b" };

const KPI = ({ label, value, icon, tone }: { label: string; value: number | string; icon: React.ReactNode; tone: string }) => (
  <Card className="p-3 md:p-4 flex items-center gap-3 md:gap-4">
    <div className={`h-9 w-9 md:h-11 md:w-11 rounded-lg flex items-center justify-center shrink-0 ${tone}`}>{icon}</div>
    <div className="min-w-0">
      <div className="text-[10px] md:text-xs uppercase tracking-wide text-muted-foreground truncate">{label}</div>
      <div className="text-lg md:text-2xl font-semibold">{value}</div>
    </div>
  </Card>
);

const AdminBrevoAbandonedStats = () => {
  const { adminKey } = useAdminKey();
  const today = new Date().toISOString().slice(0, 10);
  const [preset, setPreset] = useState<string>("30");
  const [days, setDays] = useState<number>(30);
  const [customFrom, setCustomFrom] = useState<string>(today);
  const [customTo, setCustomTo] = useState<string>(today);
  const [country, setCountry] = useState<string>("all");
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<SegmentReport | null>(null);
  const [brevoReal, setBrevoReal] = useState<BrevoRealResponse | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<string>(() => {
    return (typeof window !== "undefined" && window.localStorage.getItem("brevo_auto_refresh")) || "60";
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countryPage, setCountryPage] = useState(1);
  const [countryPageSize, setCountryPageSize] = useState(10);
  const [countryFilter, setCountryFilter] = useState("");
  const [matrixPage, setMatrixPage] = useState(1);
  const [matrixPageSize, setMatrixPageSize] = useState(10);
  const [matrixFilter, setMatrixFilter] = useState("");
  const [planCap, setPlanCap] = useState<number>(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("brevo_plan_cap") : null;
    return saved ? Number(saved) : 10000;
  });
  const [seqSteps, setSeqSteps] = useState<number>(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("brevo_seq_steps") : null;
    return saved ? Number(saved) : 6;
  });
  const [extraMonthly, setExtraMonthly] = useState<number>(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("brevo_extra_monthly") : null;
    return saved ? Number(saved) : 945;
  });

  useEffect(() => { window.localStorage.setItem("brevo_plan_cap", String(planCap)); }, [planCap]);
  useEffect(() => { window.localStorage.setItem("brevo_seq_steps", String(seqSteps)); }, [seqSteps]);
  useEffect(() => { window.localStorage.setItem("brevo_extra_monthly", String(extraMonthly)); }, [extraMonthly]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        adminKey,
        country: country === "all" ? null : country,
      };
      if (preset === "today") {
        body.from = today; body.to = today;
      } else if (preset === "yesterday") {
        const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        body.from = y; body.to = y;
      } else if (preset === "custom") {
        body.from = customFrom; body.to = customTo;
      } else {
        body.days = days;
      }
      const [statsRes, reportRes, brevoRes] = await Promise.all([
        adminInvoke<StatsResponse>("stats-brevo-abandoned", { body }),
        adminInvoke<SegmentReport>("report-brevo-segments", { body: { ...body, country: undefined } }),
        adminInvoke<BrevoRealResponse>("brevo-account-stats", { body: { ...body, country: undefined } }),
      ]);
      if (statsRes.error) throw statsRes.error;
      setData(statsRes.data ?? null);
      if (!reportRes.error) setReport(reportRes.data ?? null);
      if (!brevoRes.error) setBrevoReal(brevoRes.data ?? null);
      setLastUpdated(new Date());
    } catch (e) {
      toast.error("No se pudieron cargar las estadísticas", { description: (e as Error).message });
    } finally { setLoading(false); }
  }, [adminKey, days, country, preset, customFrom, customTo, today]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    window.localStorage.setItem("brevo_auto_refresh", autoRefresh);
    if (autoRefresh === "off") return;
    const ms = Number(autoRefresh) * 1000;
    if (!ms) return;
    const id = window.setInterval(() => { void load(); }, ms);
    return () => window.clearInterval(id);
  }, [autoRefresh, load]);


  const countryOptions = useMemo(() => data?.availableCountries ?? [], [data]);
  const totals = data?.totals ?? { total: 0, hotmart: 0, tienda: 0, errors: 0 };
  const pctHot = totals.total ? Math.round((totals.hotmart / totals.total) * 100) : 0;
  const pctTie = totals.total ? Math.round((totals.tienda / totals.total) * 100) : 0;

  // Proyección de consumo mensual de emails de Brevo
  const abandonsPerDay = data && data.windowDays > 0 ? totals.total / data.windowDays : 0;
  const projectedRecovery = Math.round(abandonsPerDay * 30 * seqSteps);
  const projectedTotal = projectedRecovery + extraMonthly;
  const usagePct = planCap > 0 ? Math.min(100, Math.round((projectedTotal / planCap) * 100)) : 0;
  const usageTone = usagePct >= 90 ? "bg-red-500" : usagePct >= 70 ? "bg-amber-500" : "bg-emerald-500";
  const remaining = Math.max(0, planCap - projectedTotal);

  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background py-4 md:py-8 px-3 md:px-4">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
          <header className="space-y-3">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold leading-tight">Brevo · Carritos abandonados</h1>
              <p className="text-xs md:text-sm text-muted-foreground">Tendencia diaria por origen y desglose por país.</p>
            </div>
            <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:items-center">
              <Select value={preset} onValueChange={(v) => {
                setPreset(v);
                if (v !== "today" && v !== "yesterday" && v !== "custom") setDays(Number(v));
              }}>
                <SelectTrigger className="w-full md:w-[170px]"><SelectValue placeholder="Rango" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="yesterday">Ayer</SelectItem>
                  <SelectItem value="7">Últimos 7 días</SelectItem>
                  <SelectItem value="15">Últimos 15 días</SelectItem>
                  <SelectItem value="30">Últimos 30 días</SelectItem>
                  <SelectItem value="60">Últimos 60 días</SelectItem>
                  <SelectItem value="90">Últimos 90 días</SelectItem>
                  <SelectItem value="custom">Personalizado…</SelectItem>
                </SelectContent>
              </Select>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="País" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los países</SelectItem>
                  {countryOptions.map((c) => (
                    <SelectItem key={c} value={c}>{c === "??" ? "Sin país" : c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={autoRefresh} onValueChange={setAutoRefresh}>
                <SelectTrigger className="w-full md:w-[160px]"><SelectValue placeholder="Auto" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">Sin auto-refresh</SelectItem>
                  <SelectItem value="15">Auto · 15 s</SelectItem>
                  <SelectItem value="30">Auto · 30 s</SelectItem>
                  <SelectItem value="60">Auto · 1 min</SelectItem>
                  <SelectItem value="300">Auto · 5 min</SelectItem>
                  <SelectItem value="900">Auto · 15 min</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={load} disabled={loading} className="w-full md:w-auto">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
              <Button
                variant="default"
                className="w-full md:w-auto"
                onClick={async () => {
                  const t = toast.loading("Enviando recordatorios...");
                  try {
                    const res = await adminInvoke<{ ok: boolean; results: Record<string, { candidates: number; sent: number; skipped: number; errors: number }> }>(
                      "send-cart-reminders",
                      { body: { adminKey } },
                    );
                    if (res.error) throw res.error;
                    const r = res.data?.results || {};
                    const total = Object.values(r).reduce((s, v) => s + v.sent, 0);
                    toast.success(`Recordatorios enviados: ${total}`, {
                      id: t,
                      description: Object.entries(r).map(([k, v]) => `${k}: ${v.sent}/${v.candidates} (skip ${v.skipped}, err ${v.errors})`).join(" · "),
                    });
                  } catch (e) {
                    toast.error("Fallo al enviar recordatorios", { id: t, description: (e as Error).message });
                  }
                }}
              >
                <Mail className="w-4 h-4 mr-2" /> Enviar recordatorios 1/7/15/30
              </Button>
              {preset === "custom" && (
                <div className="col-span-2 md:col-span-1 flex items-center gap-2 w-full md:w-auto">
                  <Input type="date" value={customFrom} max={customTo} onChange={(e) => setCustomFrom(e.target.value)} className="flex-1 md:w-[150px]" />
                  <span className="text-muted-foreground text-sm">→</span>
                  <Input type="date" value={customTo} min={customFrom} max={today} onChange={(e) => setCustomTo(e.target.value)} className="flex-1 md:w-[150px]" />
                </div>
              )}
              {lastUpdated && (
                <span className="col-span-2 md:col-span-1 text-xs text-muted-foreground md:ml-auto">
                  Actualizado {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </header>



          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPI label="Total abandonos" value={totals.total} icon={<Globe className="w-5 h-5 text-white" />} tone="bg-slate-700" />
            <KPI label={`Hotmart (${pctHot}%)`} value={totals.hotmart} icon={<ShoppingCart className="w-5 h-5 text-white" />} tone="bg-orange-500" />
            <KPI label={`Tienda (${pctTie}%)`} value={totals.tienda} icon={<Store className="w-5 h-5 text-white" />} tone="bg-teal-600" />
            <KPI label="Errores de envío" value={totals.errors} icon={<AlertTriangle className="w-5 h-5 text-white" />} tone="bg-red-500" />
          </section>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <h2 className="font-semibold">Brevo (datos reales)</h2>
                <Badge variant="outline" className="text-[10px]">API oficial</Badge>
              </div>
              {brevoReal && (
                <span className="text-xs text-muted-foreground">
                  {brevoReal.range.from} → {brevoReal.range.to}
                </span>
              )}
            </div>
            {brevoReal?.stats.error || brevoReal?.account.error ? (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-2 rounded">
                Error Brevo: {brevoReal.stats.error || brevoReal.account.error}
              </div>
            ) : brevoReal ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-[10px] uppercase text-muted-foreground">Enviados (rango)</div>
                    <div className="text-2xl font-semibold">{brevoReal.stats.requests.toLocaleString()}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-[10px] uppercase text-muted-foreground">Entregados</div>
                    <div className="text-2xl font-semibold text-emerald-600">{brevoReal.stats.delivered.toLocaleString()}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-[10px] uppercase text-muted-foreground">Aperturas únicas</div>
                    <div className="text-2xl font-semibold">{brevoReal.stats.uniqueOpens.toLocaleString()}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-[10px] uppercase text-muted-foreground">Clics únicos</div>
                    <div className="text-2xl font-semibold">{brevoReal.stats.uniqueClicks.toLocaleString()}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-[10px] uppercase text-muted-foreground">Rebotes duros</div>
                    <div className="text-2xl font-semibold text-red-600">{brevoReal.stats.hardBounces.toLocaleString()}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-[10px] uppercase text-muted-foreground">Rebotes suaves</div>
                    <div className="text-2xl font-semibold text-amber-600">{brevoReal.stats.softBounces.toLocaleString()}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-[10px] uppercase text-muted-foreground">Spam / Bloqueos</div>
                    <div className="text-2xl font-semibold">{(brevoReal.stats.spamReports + brevoReal.stats.blocked).toLocaleString()}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-[10px] uppercase text-muted-foreground">Bajas</div>
                    <div className="text-2xl font-semibold">{brevoReal.stats.unsubscribed.toLocaleString()}</div>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-3 text-sm border-t pt-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Créditos restantes</div>
                    <div className="font-semibold text-lg">
                      {brevoReal.account.emailsLeft != null ? brevoReal.account.emailsLeft.toLocaleString() : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Plan</div>
                    <div className="font-semibold">{brevoReal.account.planType ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Vence</div>
                    <div className="font-semibold">{brevoReal.account.planEndDate ?? "—"}</div>
                  </div>
                </div>
                <div className="mt-3 p-2 rounded bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-200">
                  Comparativa: nuestro dashboard registra <strong>{totals.total.toLocaleString()}</strong> abandonos sincronizados.
                  Brevo reporta <strong>{brevoReal.stats.requests.toLocaleString()}</strong> emails enviados totales
                  (incluye newsletter, secuencias, transaccionales — no solo abandonos).
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Cargando datos reales de Brevo…</div>
            )}
          </Card>



          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">Proyección de consumo mensual · Brevo</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label className="text-xs">Límite del plan (emails/mes)</Label>
                <Input type="number" min={100} step={100} value={planCap} onChange={(e) => setPlanCap(Number(e.target.value) || 0)} />
              </div>
              <div>
                <Label className="text-xs">Correos por secuencia de recuperación</Label>
                <Input type="number" min={1} max={12} value={seqSteps} onChange={(e) => setSeqSteps(Number(e.target.value) || 0)} />
              </div>
              <div>
                <Label className="text-xs">Otros envíos/mes (newsletter, campañas)</Label>
                <Input type="number" min={0} step={50} value={extraMonthly} onChange={(e) => setExtraMonthly(Number(e.target.value) || 0)} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  ~{abandonsPerDay.toFixed(1)} abandonos/día × 30 × {seqSteps} correos = <strong className="text-foreground">{projectedRecovery.toLocaleString()}</strong> recuperación
                  {" + "}<strong className="text-foreground">{extraMonthly.toLocaleString()}</strong> otros
                </span>
                <span className="font-semibold">{projectedTotal.toLocaleString()} / {planCap.toLocaleString()}</span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div className={`h-full ${usageTone} transition-all`} style={{ width: `${usagePct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{usagePct}% usado</span>
                <span>{remaining.toLocaleString()} emails disponibles</span>
              </div>
              {usagePct >= 90 && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-2 rounded">
                  <AlertTriangle className="w-4 h-4" /> Estás cerca del límite. Considera subir de plan o reducir la frecuencia de la secuencia.
                </div>
              )}
              {usagePct >= 70 && usagePct < 90 && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
                  <AlertTriangle className="w-4 h-4" /> Consumo alto. Revisa segmentación para no gastar emails en clientes ya convertidos.
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold mb-3">Tendencia diaria</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.series ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="hotmart" name="Hotmart" stroke="#f97316" strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="tienda" name="Tienda" stroke="#0d9488" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold mb-3">Desglose por país (COUNTRY_CODE)</h2>
            {(data?.byCountry ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos en el rango seleccionado.</p>
            ) : (
              <>
                <div className="h-64 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.byCountry ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="hotmart" name="Hotmart" stackId="a" fill="#f97316" />
                      <Bar dataKey="tienda" name="Tienda" stackId="a" fill="#0d9488" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="overflow-x-auto">
                  {(() => {
                    const all = data?.byCountry ?? [];
                    const filtered = countryFilter
                      ? all.filter((c) => c.code.toLowerCase().includes(countryFilter.toLowerCase()))
                      : all;
                    const totalPages = Math.max(1, Math.ceil(filtered.length / countryPageSize));
                    const page = Math.min(countryPage, totalPages);
                    const start = (page - 1) * countryPageSize;
                    const rows = filtered.slice(start, start + countryPageSize);
                    return (
                      <>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Input placeholder="Filtrar país…" value={countryFilter}
                            onChange={(e) => { setCountryFilter(e.target.value); setCountryPage(1); }}
                            className="w-[180px] h-8" />
                          <Select value={String(countryPageSize)} onValueChange={(v) => { setCountryPageSize(Number(v)); setCountryPage(1); }}>
                            <SelectTrigger className="w-[110px] h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10 / pág</SelectItem>
                              <SelectItem value="15">15 / pág</SelectItem>
                              <SelectItem value="25">25 / pág</SelectItem>
                              <SelectItem value="50">50 / pág</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {filtered.length} países · pág {page}/{totalPages}
                          </span>
                        </div>
                        <table className="w-full text-sm">
                          <thead className="text-left text-muted-foreground border-b">
                            <tr><th className="py-2">País</th><th>Hotmart</th><th>Tienda</th><th>Total</th></tr>
                          </thead>
                          <tbody>
                            {rows.map((c) => (
                              <tr key={c.code} className="border-b last:border-0">
                                <td className="py-2">
                                  {c.code === "??" ? <Badge variant="outline">Sin país</Badge> : <span className="font-mono">{c.code}</span>}
                                </td>
                                <td>{c.hotmart}</td>
                                <td>{c.tienda}</td>
                                <td className="font-semibold">{c.total}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="flex justify-end gap-2 mt-2">
                          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setCountryPage(page - 1)}>Anterior</Button>
                          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setCountryPage(page + 1)}>Siguiente</Button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </>
            )}
          </Card>


          {report && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h2 className="font-semibold">Reporte por ORIGEN × SEGMENTO</h2>
                <span className="text-xs text-muted-foreground">{report.from} → {report.to} · {report.totals.total.toLocaleString()} envíos ({report.totals.ok} OK / {report.totals.error} err)</span>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-medium mb-2 text-muted-foreground">Por ORIGEN</h3>
                  <div className="space-y-1">
                    {report.byOrigin.map((o) => {
                      const pct = report.totals.total ? Math.round((o.total / report.totals.total) * 100) : 0;
                      return (
                        <div key={o.origen}>
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{o.origen}</span>
                            <span className="font-semibold">{o.total.toLocaleString()} ({pct}%)</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: ORIGIN_COLORS[o.origen] ?? "#64748b" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2 text-muted-foreground">Por SEGMENTO</h3>
                  <div className="space-y-1">
                    {report.bySegment.map((s) => {
                      const pct = report.totals.total ? Math.round((s.total / report.totals.total) * 100) : 0;
                      return (
                        <div key={s.segmento}>
                          <div className="flex justify-between text-sm">
                            <span>{SEGMENT_LABELS[s.segmento] ?? s.segmento}</span>
                            <span className="font-semibold">{s.total.toLocaleString()} ({pct}%)</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                {(() => {
                  const all = report.matrix;
                  const q = matrixFilter.toLowerCase();
                  const filtered = q
                    ? all.filter((r) => r.origen.toLowerCase().includes(q) || r.segmento.toLowerCase().includes(q) || (SEGMENT_LABELS[r.segmento] ?? "").toLowerCase().includes(q))
                    : all;
                  const totalPages = Math.max(1, Math.ceil(filtered.length / matrixPageSize));
                  const page = Math.min(matrixPage, totalPages);
                  const start = (page - 1) * matrixPageSize;
                  const rows = filtered.slice(start, start + matrixPageSize);
                  return (
                    <>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Input placeholder="Filtrar origen/segmento…" value={matrixFilter}
                          onChange={(e) => { setMatrixFilter(e.target.value); setMatrixPage(1); }}
                          className="w-[220px] h-8" />
                        <Select value={String(matrixPageSize)} onValueChange={(v) => { setMatrixPageSize(Number(v)); setMatrixPage(1); }}>
                          <SelectTrigger className="w-[110px] h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10 / pág</SelectItem>
                            <SelectItem value="15">15 / pág</SelectItem>
                            <SelectItem value="25">25 / pág</SelectItem>
                            <SelectItem value="50">50 / pág</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {filtered.length} filas · pág {page}/{totalPages}
                        </span>
                      </div>
                      <table className="w-full text-sm">
                        <thead className="text-left text-muted-foreground border-b">
                          <tr>
                            <th className="py-2">Origen</th>
                            <th>Segmento</th>
                            <th className="text-right">Total</th>
                            <th className="text-right">OK</th>
                            <th className="text-right">Errores</th>
                            <th className="text-right">% éxito</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row) => {
                            const rate = row.total ? Math.round((row.ok / row.total) * 100) : 0;
                            return (
                              <tr key={`${row.origen}-${row.segmento}`} className="border-b last:border-0">
                                <td className="py-2">
                                  <Badge variant="outline" style={{ borderColor: ORIGIN_COLORS[row.origen] ?? "#64748b", color: ORIGIN_COLORS[row.origen] ?? "#64748b" }} className="capitalize">
                                    {row.origen}
                                  </Badge>
                                </td>
                                <td>{SEGMENT_LABELS[row.segmento] ?? row.segmento}</td>
                                <td className="text-right font-semibold">{row.total.toLocaleString()}</td>
                                <td className="text-right text-emerald-600">{row.ok}</td>
                                <td className="text-right text-red-600">{row.error}</td>
                                <td className="text-right">{rate}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div className="flex justify-end gap-2 mt-2">
                        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setMatrixPage(page - 1)}>Anterior</Button>
                        <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setMatrixPage(page + 1)}>Siguiente</Button>
                      </div>
                    </>
                  );
                })()}
              </div>

            </Card>
          )}
        </div>
      </main>
    </>
  );
};

export default AdminBrevoAbandonedStats;
