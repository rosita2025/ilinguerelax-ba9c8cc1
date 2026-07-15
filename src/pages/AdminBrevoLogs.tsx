import { useCallback, useEffect, useMemo, useState } from "react";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";
import { adminInvoke } from "@/lib/adminInvoke";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, XCircle, Search, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface LogRow {
  id: string;
  created_at: string;
  event_type: string;
  source: string | null;
  origin: string | null;
  email: string | null;
  product_name: string | null;
  product_sku: string | null;
  order_ref: string | null;
  status: "success" | "failed" | "skipped";
  http_status: number | null;
  attributes: Record<string, unknown> | null;
  response: string | null;
  error: string | null;
}

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  hotmart_purchase:  { label: "Hotmart · Compra",           color: "bg-emerald-100 text-emerald-800" },
  hotmart_abandoned: { label: "Hotmart · Carrito abandonado", color: "bg-amber-100 text-amber-800" },
  tienda_purchase:   { label: "Tienda · Compra",            color: "bg-indigo-100 text-indigo-800" },
  tienda_abandoned:  { label: "Tienda · Carrito abandonado",  color: "bg-fuchsia-100 text-fuchsia-800" },
};

const fmt = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch { return iso; }
};

const AdminBrevoLogs = () => {
  const { adminKey } = useAdminKey();
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [total7d, setTotal7d] = useState(0);
  const [failed7d, setFailed7d] = useState(0);
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await adminInvoke<{ logs: LogRow[]; total7d: number; failed7d: number }>(
        "list-brevo-logs",
        { body: { adminKey, event, status, search, limit: 300 } },
      );
      if (error) throw error;
      setLogs(data?.logs ?? []);
      setTotal7d(data?.total7d ?? 0);
      setFailed7d(data?.failed7d ?? 0);
    } catch (e) {
      toast.error("No se pudieron cargar los registros de Brevo", { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, [adminKey, event, status, search]);

  useEffect(() => { void load(); }, [load]);

  const eventOptions = useMemo(() => (
    [
      { value: "all", label: "Todos los eventos" },
      { value: "hotmart_purchase", label: "Hotmart · Compra" },
      { value: "hotmart_abandoned", label: "Hotmart · Carrito abandonado" },
      { value: "tienda_purchase", label: "Tienda · Compra" },
      { value: "tienda_abandoned", label: "Tienda · Carrito abandonado" },
    ]
  ), []);

  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background py-6 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Logs de Brevo</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Cada evento que se envía a Brevo (compra Hotmart, carrito abandonado, compra tienda propia) con los campos exactos y estado de éxito o fallo.
              </p>
            </div>
            <Button onClick={() => void load()} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </header>

          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Envíos últimos 7 días</div>
              <div className="text-2xl font-semibold mt-1">{total7d}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Fallidos últimos 7 días</div>
              <div className={`text-2xl font-semibold mt-1 ${failed7d > 0 ? "text-red-600" : ""}`}>{failed7d}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Tasa de éxito 7d</div>
              <div className="text-2xl font-semibold mt-1">
                {total7d ? `${Math.round(((total7d - failed7d) / total7d) * 100)}%` : "—"}
              </div>
            </Card>
          </div>

          <Card className="p-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground">Buscar</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Email, producto, SKU u orden…" className="pl-8" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Evento</label>
                <select value={event} onChange={(e) => setEvent(e.target.value)}
                  className="w-full h-10 rounded-md border bg-background px-3 text-sm">
                  {eventOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Estado</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-10 rounded-md border bg-background px-3 text-sm">
                  <option value="all">Todos</option>
                  <option value="success">Éxito</option>
                  <option value="failed">Fallo</option>
                  <option value="skipped">Omitido</option>
                </select>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left w-8"></th>
                    <th className="px-3 py-2 text-left">Fecha</th>
                    <th className="px-3 py-2 text-left">Evento</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Producto</th>
                    <th className="px-3 py-2 text-left">País</th>
                    <th className="px-3 py-2 text-left">Método</th>
                    <th className="px-3 py-2 text-left">Orden / SKU</th>
                    <th className="px-3 py-2 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-10 text-muted-foreground">
                        {loading ? "Cargando…" : "Aún no hay registros con estos filtros."}
                      </td>
                    </tr>
                  )}
                  {logs.map((row) => {
                    const meta = EVENT_LABELS[row.event_type] ?? { label: row.event_type, color: "bg-muted text-foreground" };
                    const isOpen = openId === row.id;
                    const attrs = (row.attributes ?? {}) as Record<string, unknown>;
                    const countryName = (attrs.COUNTRY_NAME || attrs.PAIS || attrs.COUNTRY || "—") as string;
                    const countryCode = (attrs.COUNTRY_CODE || attrs.COUNTRY || "") as string;
                    const provider = (attrs.LAST_PROVIDER || attrs.PAYMENT_METHOD || row.origin || "—") as string;
                    const paymentMethod = (attrs.PAYMENT_METHOD || attrs.STRIPE_PAYMENT_METHOD || "") as string;
                    return (
                      <>
                        <tr key={row.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => setOpenId(isOpen ? null : row.id)}>
                          <td className="px-3 py-2">
                            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">{fmt(row.created_at)}</td>
                          <td className="px-3 py-2">
                            <Badge className={`${meta.color} font-normal`}>{meta.label}</Badge>
                          </td>
                          <td className="px-3 py-2 truncate max-w-[180px]">{row.email ?? "—"}</td>
                          <td className="px-3 py-2 truncate max-w-[200px]">{row.product_name ?? "—"}</td>
                          <td className="px-3 py-2 text-xs whitespace-nowrap">
                            <div>{countryName}</div>
                            {countryCode && countryCode !== countryName && (
                              <div className="text-muted-foreground font-mono">{countryCode}</div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs whitespace-nowrap">
                            <div className="capitalize">{provider}</div>
                            {paymentMethod && (
                              <div className="text-muted-foreground uppercase text-[10px]">{paymentMethod}</div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            <div>{row.order_ref ?? "—"}</div>
                            {row.product_sku && <div className="text-muted-foreground">{row.product_sku}</div>}
                          </td>
                          <td className="px-3 py-2">
                            {row.status === "success" ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Éxito {row.http_status ? `· ${row.http_status}` : ""}
                              </span>
                            ) : row.status === "failed" ? (
                              <span className="inline-flex items-center gap-1 text-red-700 text-xs font-medium">
                                <XCircle className="w-3.5 h-3.5" /> Fallo {row.http_status ? `· ${row.http_status}` : ""}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-medium">
                                <AlertTriangle className="w-3.5 h-3.5" /> Pendiente
                              </span>
                            )}
                          </td>
                        </tr>
                        {isOpen && (
                          <tr key={row.id + "-detail"} className="border-t bg-muted/20">
                            <td colSpan={7} className="px-6 py-4">
                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <div className="text-xs font-medium uppercase text-muted-foreground mb-1">Campos enviados a Brevo</div>
                                  <pre className="text-xs bg-background border rounded p-3 overflow-auto max-h-72">
{JSON.stringify(row.attributes ?? {}, null, 2)}
                                  </pre>
                                </div>
                                <div>
                                  <div className="text-xs font-medium uppercase text-muted-foreground mb-1">
                                    {row.status === "failed" ? "Error / respuesta" : "Respuesta"}
                                  </div>
                                  <pre className="text-xs bg-background border rounded p-3 overflow-auto max-h-72 whitespace-pre-wrap">
{row.error || row.response || "—"}
                                  </pre>
                                  <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                                    <div>Origen: <span className="font-mono">{row.origin ?? "—"}</span></div>
                                    <div>Fuente: <span className="font-mono">{row.source ?? "—"}</span></div>
                                    <div>ID: <span className="font-mono">{row.id}</span></div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
};

export default AdminBrevoLogs;
