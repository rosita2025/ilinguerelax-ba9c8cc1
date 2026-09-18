import { useEffect, useState } from "react";
import { startOfDay, endOfDay, subDays } from "date-fns";
import { Loader2, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";
import { cn } from "@/lib/utils";

type SimplePreset = "today" | "yesterday" | "7d" | "30d";

const simplePresets: Array<{ key: SimplePreset; label: string }> = [
  { key: "today", label: "Hoy" },
  { key: "yesterday", label: "Ayer" },
  { key: "7d", label: "Últimos 7 días" },
  { key: "30d", label: "Últimos 30 días" },
];

const rangeForPreset = (p: SimplePreset) => {
  const now = new Date();
  switch (p) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday": {
      const y = subDays(now, 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case "7d":
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case "30d":
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
  }
};

type Totals = { sessions: number; viewContent: number; checkout: number; purchases: number };

const AdminSimple = () => {
  const { adminKey } = useAdminKey();
  const [preset, setPreset] = useState<SimplePreset>("today");
  const [totals, setTotals] = useState<Totals>({ sessions: 0, viewContent: 0, checkout: 0, purchases: 0 });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const range = rangeForPreset(preset);
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("funnel-analytics", {
        body: {
          adminKey,
          from: range.from.toISOString(),
          to: range.to.toISOString(),
          granularity: "day",
          includeBots: false,
        },
      });
      if (error) throw error;
      const t = (res as { totals?: Partial<Totals> })?.totals ?? {};
      const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
      setTotals({
        sessions: num(t.sessions),
        viewContent: num(t.viewContent),
        checkout: num(t.checkout),
        purchases: num(t.purchases),
      });
    } catch {
      setTotals({ sessions: 0, viewContent: 0, checkout: 0, purchases: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminKey) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey, preset]);

  const conversionPct = totals.sessions > 0 ? (totals.purchases / totals.sessions) * 100 : 0;

  const cards = [
    { label: "Visitas", value: totals.sessions },
    { label: "Vieron producto", value: totals.viewContent },
    { label: "Checkouts iniciados", value: totals.checkout },
    { label: "Compras", value: totals.purchases },
    { label: "Conversión", value: `${conversionPct.toFixed(1)}%` },
  ];

  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-bold">Resumen simple</h1>
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading} className="gap-1">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Actualizar
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {cards.map((c) => (
              <Card key={c.label} className="p-4 md:p-6 flex flex-col items-center justify-center text-center">
                <span
                  className={cn(
                    "text-4xl md:text-5xl font-bold tabular-nums",
                    c.label === "Conversión" && conversionPct > 1 && "text-emerald-600",
                    c.label === "Conversión" && conversionPct === 0 && "text-muted-foreground",
                  )}
                >
                  {c.value}
                </span>
                <span className="mt-1.5 text-xs md:text-sm text-muted-foreground">{c.label}</span>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {simplePresets.map((p) => (
              <Button
                key={p.key}
                variant={preset === p.key ? "default" : "outline"}
                size="sm"
                onClick={() => setPreset(p.key)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>
      </main>
    </>
  );
};

export default AdminSimple;
