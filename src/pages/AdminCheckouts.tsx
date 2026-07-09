import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingCart, CheckCircle2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";

interface CheckoutRow {
  id: string;
  event_name: string;
  product_id: string | null;
  value: number | null;
  currency: string | null;
  session_id: string | null;
  page_path: string | null;
  country: string | null;
  referrer: string | null;
  created_at: string;
}

const RANGES = [
  { label: "Hoy", hours: 24 },
  { label: "7 días", hours: 24 * 7 },
  { label: "15 días", hours: 24 * 15 },
  { label: "28 días", hours: 24 * 28 },
  { label: "3 meses", hours: 24 * 90 },
];

const AdminCheckouts = () => {
  const { adminKey } = useAdminKey();
  const [hours, setHours] = useState(24 * 7);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<CheckoutRow[]>([]);

  const load = async (h = hours) => {
    if (!adminKey) return;
    setLoading(true);
    try {
      const since = new Date(Date.now() - h * 3600_000).toISOString();
      const { data, error } = await supabase
        .from("funnel_events")
        .select("id,event_name,product_id,value,currency,session_id,page_path,country,referrer,created_at")
        .in("event_name", ["InitiateCheckout", "Purchase"])
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      setRows((data ?? []) as CheckoutRow[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar checkouts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(hours); /* eslint-disable-next-line */ }, [adminKey]);

  const initiated = rows.filter((r) => r.event_name === "InitiateCheckout");
  const purchases = rows.filter((r) => r.event_name === "Purchase");
  const revenue = purchases.reduce((s, r) => s + (Number(r.value) || 0), 0);
  const convRate = initiated.length > 0 ? (purchases.length / initiated.length) * 100 : 0;

  const fmtDate = (d: string) => new Date(d).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });

  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background py-10 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Checkouts</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Sesiones que iniciaron pago y compras completadas.
            </p>
          </div>

          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              {RANGES.map((r) => (
                <Button
                  key={r.hours}
                  size="sm"
                  variant={hours === r.hours ? "default" : "outline"}
                  onClick={() => { setHours(r.hours); void load(r.hours); }}
                  disabled={loading}
                >
                  {r.label}
                </Button>
              ))}
              <Button size="sm" variant="ghost" className="ml-auto" onClick={() => load(hours)} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Recargar"}
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <ShoppingCart className="w-4 h-4" /> Checkouts iniciados
              </div>
              <p className="text-3xl font-bold mt-1">{initiated.length}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <CheckCircle2 className="w-4 h-4" /> Compras
              </div>
              <p className="text-3xl font-bold mt-1">{purchases.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Conversión</p>
              <p className="text-3xl font-bold mt-1">{convRate.toFixed(1)}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Ingresos</p>
              <p className="text-3xl font-bold mt-1">${revenue.toFixed(2)}</p>
            </Card>
          </div>

          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Actividad reciente</h2>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin checkouts en este intervalo.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-muted-foreground border-b">
                    <tr>
                      <th className="py-2 pr-2">Fecha</th>
                      <th className="py-2 px-2">Evento</th>
                      <th className="py-2 px-2">Producto</th>
                      <th className="py-2 px-2 text-right">Valor</th>
                      <th className="py-2 px-2">País</th>
                      <th className="py-2 px-2">Página</th>
                      <th className="py-2 pl-2">Referrer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 pr-2 whitespace-nowrap text-xs">{fmtDate(r.created_at)}</td>
                        <td className="py-2 px-2">
                          <Badge variant={r.event_name === "Purchase" ? "default" : "secondary"}>
                            {r.event_name === "Purchase" ? "Compra" : "Iniciado"}
                          </Badge>
                        </td>
                        <td className="py-2 px-2 max-w-[180px] truncate" title={r.product_id ?? ""}>
                          {r.product_id ?? "—"}
                        </td>
                        <td className="py-2 px-2 text-right font-medium">
                          {r.value ? `${r.currency ?? "$"} ${Number(r.value).toFixed(2)}` : "—"}
                        </td>
                        <td className="py-2 px-2">{r.country ?? "—"}</td>
                        <td className="py-2 px-2 max-w-[200px] truncate" title={r.page_path ?? ""}>
                          {r.page_path ? (
                            <a href={r.page_path} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 hover:text-primary">
                              <span className="truncate">{r.page_path}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : "—"}
                        </td>
                        <td className="py-2 pl-2 max-w-[160px] truncate text-xs text-muted-foreground" title={r.referrer ?? ""}>
                          {r.referrer ?? "directo"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </main>
    </>
  );
};

export default AdminCheckouts;
