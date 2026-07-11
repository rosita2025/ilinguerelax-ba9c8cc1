import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";

interface Ga4Report {
  source: "ga4";
  days: number;
  propertyId: string;
  totals: {
    pageViews: number;
    sessions: number;
    totalUsers: number;
    activeUsers: number;
    engagedSessions: number;
    engagementSeconds: number;
  };
  engagementRate: number;
  avgSessionSeconds: number;
  liveVisitors: number;
  byCountry: { country: string; pageViews: number; sessions: number; users: number }[];
  bySource: { channel: string; source: string; sessions: number; users: number }[];
  byPage: { path: string; pageViews: number; users: number }[];
  eventCounts: Record<string, number>;
  byProduct: Record<string, Record<string, number>>;
  revenue: number;
  conversionRates: {
    view_to_cart: number;
    cart_to_checkout: number;
    checkout_to_purchase: number;
    session_to_purchase: number;
  };
}

const FUNNEL_STEPS = ["ViewContent", "Lead", "AddToCart", "InitiateCheckout", "Purchase"] as const;
const STEP_LABELS: Record<string, string> = {
  ViewContent: "Vista de producto",
  Lead: "Lead (email)",
  AddToCart: "Agregó al carrito",
  InitiateCheckout: "Inició checkout",
  Purchase: "Compró",
};

const fmt = (n: number) => n.toLocaleString();
const fmtSec = (s: number) => `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;

const AdminFunnel = () => {
  const { adminKey } = useAdminKey();
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Ga4Report | null>(null);

  const loadReport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("funnel-report", {
        body: { adminKey, days },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) {
        toast.error((data as { error: string }).error);
        return;
      }
      setReport(data as Ga4Report);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadReport(); }, [adminKey, days]);

  useEffect(() => {
    if (!report) return;
    const id = setInterval(() => { void loadReport(); }, 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, adminKey, days]);

  if (!report) {
    return (
      <>
        <AdminNav />
        <main className="min-h-dvh bg-background flex items-center justify-center p-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </main>
      </>
    );
  }

  const maxCount = Math.max(
    report.totals.sessions,
    ...FUNNEL_STEPS.map((s) => report.eventCounts[s] || 0),
    1,
  );

  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Tráfico real (GA4)</h1>
              <p className="text-sm text-muted-foreground">
                Property {report.propertyId} · Últimos {report.days} días
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10 border border-primary/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold tabular-nums">{report.liveVisitors}</span>
                <span className="text-xs text-muted-foreground">en vivo</span>
              </div>
              <Input
                type="number"
                min={1}
                max={90}
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 7)}
                className="w-24"
              />
              <Button onClick={loadReport} disabled={loading} variant="outline">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Recargar"}
              </Button>
            </div>
          </div>

          {/* Top KPIs from GA4 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Visitas a la página", v: fmt(report.totals.pageViews) },
              { label: "Sesiones", v: fmt(report.totals.sessions) },
              { label: "Usuarios totales", v: fmt(report.totals.totalUsers) },
              { label: "Tasa de interacción", v: `${report.engagementRate.toFixed(1)}%` },
              { label: "Sesiones interactivas", v: fmt(report.totals.engagedSessions) },
              { label: "Duración media", v: fmtSec(report.avgSessionSeconds) },
              { label: "Compras", v: fmt(report.eventCounts.Purchase || 0) },
              { label: "Ingresos", v: `$${report.revenue.toFixed(0)}` },
            ].map((m) => (
              <Card key={m.label} className="p-4">
                <div className="text-xs text-muted-foreground">{m.label}</div>
                <div className="text-2xl font-bold mt-1 tabular-nums">{m.v}</div>
              </Card>
            ))}
          </div>

          {/* Funnel: sessions -> conversion events (internal tracking) */}
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">Embudo de conversión</h2>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Sesiones (GA4)</span>
                <span className="text-muted-foreground">{fmt(report.totals.sessions)}</span>
              </div>
              <div className="h-8 bg-muted rounded-md overflow-hidden">
                <div className="h-full bg-primary/60" style={{ width: "100%" }} />
              </div>
            </div>
            {FUNNEL_STEPS.map((step) => {
              const count = report.eventCounts[step] || 0;
              const pct = (count / maxCount) * 100;
              return (
                <div key={step} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{STEP_LABELS[step]}</span>
                    <span className="text-muted-foreground">{fmt(count)} eventos</span>
                  </div>
                  <div className="h-8 bg-muted rounded-md overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${Math.max(pct, 2)}%` }} />
                  </div>
                </div>
              );
            })}
          </Card>

          {/* Conversion rates */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Vista → Carrito", v: report.conversionRates.view_to_cart },
              { label: "Carrito → Checkout", v: report.conversionRates.cart_to_checkout },
              { label: "Checkout → Compra", v: report.conversionRates.checkout_to_purchase },
              { label: "Sesión → Compra", v: report.conversionRates.session_to_purchase },
            ].map((m) => (
              <Card key={m.label} className="p-4">
                <div className="text-xs text-muted-foreground">{m.label}</div>
                <div className="text-2xl font-bold mt-1">{m.v.toFixed(2)}%</div>
              </Card>
            ))}
          </div>

          {/* Countries */}
          <Card className="p-4 overflow-x-auto">
            <h2 className="font-semibold mb-3">Por país (GA4)</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">País</th>
                  <th className="py-2 px-2 text-right">Visitas</th>
                  <th className="py-2 px-2 text-right">Sesiones</th>
                  <th className="py-2 px-2 text-right">Usuarios</th>
                </tr>
              </thead>
              <tbody>
                {report.byCountry.map((r) => (
                  <tr key={r.country} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium">{r.country}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{fmt(r.pageViews)}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{fmt(r.sessions)}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{fmt(r.users)}</td>
                  </tr>
                ))}
                {report.byCountry.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Sin datos.</td></tr>
                )}
              </tbody>
            </table>
          </Card>

          {/* Sources */}
          <Card className="p-4 overflow-x-auto">
            <h2 className="font-semibold mb-3">Fuentes de tráfico (GA4)</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">Canal</th>
                  <th className="py-2 pr-3">Origen</th>
                  <th className="py-2 px-2 text-right">Sesiones</th>
                  <th className="py-2 px-2 text-right">Usuarios</th>
                </tr>
              </thead>
              <tbody>
                {report.bySource.map((r, i) => (
                  <tr key={`${r.channel}-${r.source}-${i}`} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium">{r.channel}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{r.source}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{fmt(r.sessions)}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{fmt(r.users)}</td>
                  </tr>
                ))}
                {report.bySource.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Sin datos.</td></tr>
                )}
              </tbody>
            </table>
          </Card>

          {/* Top pages */}
          <Card className="p-4 overflow-x-auto">
            <h2 className="font-semibold mb-3">Páginas más visitadas (GA4)</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">Ruta</th>
                  <th className="py-2 px-2 text-right">Visitas</th>
                  <th className="py-2 px-2 text-right">Usuarios</th>
                </tr>
              </thead>
              <tbody>
                {report.byPage.slice(0, 30).map((r) => (
                  <tr key={r.path} className="border-b last:border-0">
                    <td className="py-2 pr-3 truncate max-w-[420px]" title={r.path}>{r.path}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{fmt(r.pageViews)}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{fmt(r.users)}</td>
                  </tr>
                ))}
                {report.byPage.length === 0 && (
                  <tr><td colSpan={3} className="py-6 text-center text-muted-foreground">Sin datos.</td></tr>
                )}
              </tbody>
            </table>
          </Card>

          {/* Per product (internal) */}
          <Card className="p-4 overflow-x-auto">
            <h2 className="font-semibold mb-3">Conversiones por producto</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">Producto</th>
                  {FUNNEL_STEPS.map((s) => (
                    <th key={s} className="py-2 px-2 text-right">{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(report.byProduct)
                  .sort(([, a], [, b]) => (b.ViewContent || 0) - (a.ViewContent || 0))
                  .map(([pid, counts]) => (
                    <tr key={pid} className="border-b last:border-0">
                      <td className="py-2 pr-3 truncate max-w-[240px]" title={pid}>{pid}</td>
                      {FUNNEL_STEPS.map((s) => (
                        <td key={s} className="py-2 px-2 text-right tabular-nums">{fmt(counts[s] || 0)}</td>
                      ))}
                    </tr>
                  ))}
                {Object.keys(report.byProduct).length === 0 && (
                  <tr><td colSpan={FUNNEL_STEPS.length + 1} className="py-6 text-center text-muted-foreground">Sin conversiones registradas.</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      </main>
    </>
  );
};

export default AdminFunnel;
