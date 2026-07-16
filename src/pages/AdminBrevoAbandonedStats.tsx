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

const KPI = ({ label, value, icon, tone }: { label: string; value: number | string; icon: React.ReactNode; tone: string }) => (
  <Card className="p-4 flex items-center gap-4">
    <div className={`h-11 w-11 rounded-lg flex items-center justify-center ${tone}`}>{icon}</div>
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  </Card>
);

const AdminBrevoAbandonedStats = () => {
  const { adminKey } = useAdminKey();
  const [days, setDays] = useState<number>(30);
  const [country, setCountry] = useState<string>("all");
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
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
      const { data: res, error } = await adminInvoke<StatsResponse>("stats-brevo-abandoned", {
        body: { adminKey, days, country: country === "all" ? null : country },
      });
      if (error) throw error;
      setData(res ?? null);
    } catch (e) {
      toast.error("No se pudieron cargar las estadísticas", { description: (e as Error).message });
    } finally { setLoading(false); }
  }, [adminKey, days, country]);

  useEffect(() => { void load(); }, [load]);

  const countryOptions = useMemo(() => data?.availableCountries ?? [], [data]);
  const totals = data?.totals ?? { total: 0, hotmart: 0, tienda: 0, errors: 0 };
  const pctHot = totals.total ? Math.round((totals.hotmart / totals.total) * 100) : 0;
  const pctTie = totals.total ? Math.round((totals.tienda / totals.total) * 100) : 0;

  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Brevo · Carritos abandonados (Dashboard)</h1>
              <p className="text-sm text-muted-foreground">Tendencia diaria por origen (Hotmart vs Tienda) y desglose por país.</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Rango" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 días</SelectItem>
                  <SelectItem value="14">Últimos 14 días</SelectItem>
                  <SelectItem value="30">Últimos 30 días</SelectItem>
                  <SelectItem value="60">Últimos 60 días</SelectItem>
                  <SelectItem value="90">Últimos 90 días</SelectItem>
                </SelectContent>
              </Select>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="País" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los países</SelectItem>
                  {countryOptions.map((c) => (
                    <SelectItem key={c} value={c}>{c === "??" ? "Sin país" : c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={load} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
            </div>
          </header>

          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPI label="Total abandonos" value={totals.total} icon={<Globe className="w-5 h-5 text-white" />} tone="bg-slate-700" />
            <KPI label={`Hotmart (${pctHot}%)`} value={totals.hotmart} icon={<ShoppingCart className="w-5 h-5 text-white" />} tone="bg-orange-500" />
            <KPI label={`Tienda (${pctTie}%)`} value={totals.tienda} icon={<Store className="w-5 h-5 text-white" />} tone="bg-teal-600" />
            <KPI label="Errores de envío" value={totals.errors} icon={<AlertTriangle className="w-5 h-5 text-white" />} tone="bg-red-500" />
          </section>

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
                  <table className="w-full text-sm">
                    <thead className="text-left text-muted-foreground border-b">
                      <tr><th className="py-2">País</th><th>Hotmart</th><th>Tienda</th><th>Total</th></tr>
                    </thead>
                    <tbody>
                      {(data?.byCountry ?? []).map((c) => (
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
                </div>
              </>
            )}
          </Card>
        </div>
      </main>
    </>
  );
};

export default AdminBrevoAbandonedStats;
