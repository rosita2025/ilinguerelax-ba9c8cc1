import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FunnelReport {
  days: number;
  totals: Record<string, number>;
  uniques: Record<string, number>;
  byProduct: Record<string, Record<string, number>>;
  byCountry: Record<string, Record<string, number>>;
  revenueByCountry: Record<string, number>;
  revenue: number;
  conversionRates: {
    view_to_cart: number;
    cart_to_checkout: number;
    checkout_to_purchase: number;
    view_to_purchase: number;
  };
}

const FUNNEL_STEPS = ["ViewContent", "Lead", "AddToCart", "InitiateCheckout", "Purchase"] as const;
const STEP_LABELS: Record<string, string> = {
  ViewContent: "1. Vista de producto",
  Lead: "2. Lead (suscripción email)",
  AddToCart: "3. Agregó al carrito",
  InitiateCheckout: "4. Inició checkout",
  Purchase: "5. Compró",
};

const AdminFunnel = () => {
  const [adminKey, setAdminKey] = useState("");
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<FunnelReport | null>(null);

  const loadReport = async () => {
    if (!adminKey) {
      toast.error("Ingresa la clave de administración");
      return;
    }
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
      setReport(data as FunnelReport);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!report) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 w-full max-w-md space-y-4">
          <div className="text-center">
            <BarChart3 className="w-10 h-10 mx-auto text-primary" />
            <h1 className="text-2xl font-bold mt-2">Reporte de embudo</h1>
            <p className="text-sm text-muted-foreground mt-1">
              ViewContent → AddToCart → InitiateCheckout → Purchase
            </p>
          </div>
          <Input
            type="password"
            placeholder="Clave admin"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadReport()}
          />
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              max={90}
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value) || 7)}
              placeholder="Días"
            />
            <Button onClick={loadReport} disabled={loading} className="shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ver reporte"}
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  const maxCount = Math.max(...FUNNEL_STEPS.map((s) => report.totals[s] || 0), 1);

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Embudo de conversión</h1>
            <p className="text-sm text-muted-foreground">Últimos {report.days} días</p>
          </div>
          <div className="flex gap-2">
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

        {/* Funnel bars */}
        <Card className="p-6 space-y-4">
          {FUNNEL_STEPS.map((step) => {
            const count = report.totals[step] || 0;
            const unique = report.uniques[step] || 0;
            const pct = (count / maxCount) * 100;
            return (
              <div key={step} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{STEP_LABELS[step]}</span>
                  <span className="text-muted-foreground">
                    {count.toLocaleString()} eventos · {unique.toLocaleString()} únicos
                  </span>
                </div>
                <div className="h-8 bg-muted rounded-md overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
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
            { label: "Vista → Compra", v: report.conversionRates.view_to_purchase },
          ].map((m) => (
            <Card key={m.label} className="p-4">
              <div className="text-xs text-muted-foreground">{m.label}</div>
              <div className="text-2xl font-bold mt-1">{m.v.toFixed(1)}%</div>
            </Card>
          ))}
        </div>

        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Ingresos rastreados (Purchase)</div>
          <div className="text-2xl font-bold">${report.revenue.toFixed(2)}</div>
        </Card>

        {/* Per product */}
        <Card className="p-4 overflow-x-auto">
          <h2 className="font-semibold mb-3">Por producto</h2>
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
                      <td key={s} className="py-2 px-2 text-right tabular-nums">
                        {(counts[s] || 0).toLocaleString()}
                      </td>
                    ))}
                  </tr>
                ))}
              {Object.keys(report.byProduct).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    Sin datos en este periodo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>

        {/* Per country */}
        <Card className="p-4 overflow-x-auto">
          <h2 className="font-semibold mb-3">Por país</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3">País</th>
                {FUNNEL_STEPS.map((s) => (
                  <th key={s} className="py-2 px-2 text-right">{s}</th>
                ))}
                <th className="py-2 px-2 text-right">Ingresos</th>
                <th className="py-2 px-2 text-right">Conv %</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(report.byCountry || {})
                .sort(([, a], [, b]) => (b.ViewContent || 0) - (a.ViewContent || 0))
                .map(([country, counts]) => {
                  const views = counts.ViewContent || 0;
                  const purchases = counts.Purchase || 0;
                  const conv = views ? (purchases / views) * 100 : 0;
                  const rev = report.revenueByCountry?.[country] || 0;
                  return (
                    <tr key={country} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">{country}</td>
                      {FUNNEL_STEPS.map((s) => (
                        <td key={s} className="py-2 px-2 text-right tabular-nums">
                          {(counts[s] || 0).toLocaleString()}
                        </td>
                      ))}
                      <td className="py-2 px-2 text-right tabular-nums">${rev.toFixed(0)}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{conv.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              {Object.keys(report.byCountry || {}).length === 0 && (
                <tr>
                  <td colSpan={FUNNEL_STEPS.length + 3} className="py-6 text-center text-muted-foreground">
                    Sin datos por país en este periodo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </main>
  );
};

export default AdminFunnel;