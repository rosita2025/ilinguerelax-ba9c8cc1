import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag, DollarSign, Users, Repeat, TrendingUp, Package, Globe2, CreditCard } from "lucide-react";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";
import { supabase } from "@/integrations/supabase/client";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

type Stats = {
  range: { days: number; since: string };
  currency: string;
  kpis: {
    netSales: number; totalOrders: number; totalQuantity: number; aov: number;
    totalCustomers: number; singleOrderCustomers: number; repeatCustomers: number;
    repeatRate: number; purchaseFrequency: number; ltv: number;
  };
  trend: Array<{ day: string; revenue: number; orders: number }>;
  hourly: Array<{ hour: number; revenue: number; orders: number }>;
  topProducts: Array<{ key: string; qty: number; revenue: number }>;
  topCountries: Array<{ key: string; orders: number; revenue: number }>;
  topCities: Array<{ key: string; orders: number; revenue: number; country: string }>;
  gateways: Array<{ key: string; revenue: number }>;
};

const RANGES = [7, 30, 90, 180, 365];
const PIE_COLORS = ["hsl(175, 65%, 40%)", "hsl(15, 85%, 55%)", "hsl(45, 90%, 55%)", "hsl(210, 70%, 55%)", "hsl(280, 60%, 55%)", "hsl(120, 45%, 45%)"];

const fmtMoney = (n: number, cur = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n || 0);
const fmtInt = (n: number) => new Intl.NumberFormat("en-US").format(n || 0);

const Kpi = ({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) => (
  <Card className="p-4">
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <div className="mt-2 text-2xl font-bold">{value}</div>
    {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
  </Card>
);

const AdminShopify = () => {
  const { adminKey } = useAdminKey();
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const projectUrl = (import.meta as any).env.VITE_SUPABASE_URL;
      const anon = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(
        `${projectUrl}/functions/v1/admin-shopify-stats?days=${days}&key=${encodeURIComponent(adminKey)}`,
        { headers: { apikey: anon, Authorization: `Bearer ${anon}` } },
      );
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "load_failed");
      setStats(json);
    } catch (e: any) {
      setError(e.message || "Error cargando datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [days]);

  const currency = stats?.currency || "USD";
  const gatewayData = useMemo(
    () => (stats?.gateways || []).map(g => ({ name: g.key, value: g.revenue })),
    [stats],
  );

  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background py-6 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-primary" /> Shopify · Ventas
              </h1>
              <p className="text-sm text-muted-foreground">
                Panel estilo Power BI con KPIs, tendencia, productos, países y métodos de pago.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {RANGES.map(d => (
                <Button key={d} size="sm" variant={days === d ? "default" : "outline"} onClick={() => setDays(d)}>
                  {d}d
                </Button>
              ))}
              <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "↻"}
              </Button>
            </div>
          </header>

          {error && (
            <Card className="p-4 border-destructive/40 text-sm text-destructive">
              {error}
            </Card>
          )}

          {!stats && loading && (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}

          {stats && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Kpi icon={DollarSign} label="Net Sales" value={fmtMoney(stats.kpis.netSales, currency)} sub={`${stats.range.days} días`} />
                <Kpi icon={ShoppingBag} label="Órdenes" value={fmtInt(stats.kpis.totalOrders)} sub={`${fmtInt(stats.kpis.totalQuantity)} unidades`} />
                <Kpi icon={TrendingUp} label="AOV" value={fmtMoney(stats.kpis.aov, currency)} sub="Order Value" />
                <Kpi icon={Users} label="Clientes" value={fmtInt(stats.kpis.totalCustomers)} sub={`${stats.kpis.singleOrderCustomers} 1x · ${stats.kpis.repeatCustomers} repet.`} />
                <Kpi icon={Repeat} label="Repeat Rate" value={`${stats.kpis.repeatRate}%`} sub={`Freq ${stats.kpis.purchaseFrequency}`} />
                <Kpi icon={DollarSign} label="LTV" value={fmtMoney(stats.kpis.ltv, currency)} sub="Lifetime Value" />
                <Kpi icon={Package} label="Productos" value={fmtInt(stats.topProducts.length)} sub="Distintos vendidos" />
                <Kpi icon={Globe2} label="Países" value={fmtInt(stats.topCountries.length)} sub="Alcance geográfico" />
              </div>

              {/* Trend */}
              <Card className="p-4">
                <h2 className="text-sm font-semibold mb-3">Ventas por día</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.trend}>
                      <defs>
                        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(175, 65%, 40%)" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="hsl(175, 65%, 40%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => fmtMoney(v, currency)} />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(175, 65%, 40%)" fill="url(#rev)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Hourly */}
                <Card className="p-4">
                  <h2 className="text-sm font-semibold mb-3">Ventas por hora (UTC)</h2>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.hourly}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => fmtMoney(v, currency)} />
                        <Bar dataKey="revenue" fill="hsl(15, 85%, 55%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Gateways */}
                <Card className="p-4">
                  <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Métodos de pago
                  </h2>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={gatewayData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                          {gatewayData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => fmtMoney(v, currency)} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Top products */}
                <Card className="p-4">
                  <h2 className="text-sm font-semibold mb-3">Top productos por ingresos</h2>
                  <div className="space-y-2">
                    {stats.topProducts.map((p, i) => {
                      const max = stats.topProducts[0]?.revenue || 1;
                      const pct = (p.revenue / max) * 100;
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="truncate max-w-[70%]" title={p.key}>{p.key}</span>
                            <span className="font-medium">{fmtMoney(p.revenue, currency)} · {p.qty}u</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    {stats.topProducts.length === 0 && <p className="text-xs text-muted-foreground">Sin datos.</p>}
                  </div>
                </Card>

                {/* Top countries */}
                <Card className="p-4">
                  <h2 className="text-sm font-semibold mb-3">Top países</h2>
                  <div className="space-y-2">
                    {stats.topCountries.map((c, i) => {
                      const max = stats.topCountries[0]?.revenue || 1;
                      const pct = (c.revenue / max) * 100;
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1">
                            <span>{c.key}</span>
                            <span className="font-medium">{fmtMoney(c.revenue, currency)} · {c.orders} ord.</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    {stats.topCountries.length === 0 && <p className="text-xs text-muted-foreground">Sin datos.</p>}
                  </div>
                </Card>
              </div>

              {/* Cities table */}
              <Card className="p-4">
                <h2 className="text-sm font-semibold mb-3">Top ciudades</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b">
                        <th className="py-2">Ciudad</th>
                        <th className="py-2 text-right">Órdenes</th>
                        <th className="py-2 text-right">Ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topCities.map((c, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2">{c.key}</td>
                          <td className="py-2 text-right">{c.orders}</td>
                          <td className="py-2 text-right font-medium">{fmtMoney(c.revenue, currency)}</td>
                        </tr>
                      ))}
                      {stats.topCities.length === 0 && (
                        <tr><td colSpan={3} className="py-4 text-center text-muted-foreground text-xs">Sin datos.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default AdminShopify;
