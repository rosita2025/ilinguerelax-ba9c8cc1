import { useCallback, useEffect, useState } from "react";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";
import { adminInvoke } from "@/lib/adminInvoke";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Search, ChevronDown, ChevronRight, ShoppingCart, CheckCircle2, Clock, XCircle, RotateCcw, AlertOctagon, Ban } from "lucide-react";
import { toast } from "sonner";

type MappedStatus = "approved" | "pending" | "refused" | "refunded" | "chargeback" | "cancelled" | "abandoned" | "unknown";

interface BrevoInfo {
  status: string;
  http_status: number | null;
  event_type: string;
  last_sync_at: string;
  missing_fields: string[];
  error: string | null;
  attributes: Record<string, unknown> | null;
}

interface AuditRow {
  id: string;
  source: "purchase" | "abandoned";
  received_at: string;
  event_raw: string;
  mapped_status: MappedStatus;
  email: string | null;
  transaction: string | null;
  product: string | null;
  converted: boolean | null;
  payload: unknown;
  brevo: BrevoInfo | null;
}


interface Summary {
  approved: number; pending: number; refused: number; refunded: number; chargeback: number; cancelled: number; abandoned: number;
}

const STATUS_META: Record<MappedStatus, { label: string; color: string; icon: any }> = {
  approved:   { label: "Aprobado",   color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  pending:    { label: "Pendiente",  color: "bg-amber-100 text-amber-800",     icon: Clock },
  refused:    { label: "Rechazado",  color: "bg-red-100 text-red-800",         icon: XCircle },
  refunded:   { label: "Reembolso",  color: "bg-orange-100 text-orange-800",   icon: RotateCcw },
  chargeback: { label: "Chargeback", color: "bg-rose-200 text-rose-900",       icon: AlertOctagon },
  cancelled:  { label: "Cancelado",  color: "bg-slate-200 text-slate-800",     icon: Ban },
  abandoned:  { label: "Carrito abandonado", color: "bg-fuchsia-100 text-fuchsia-800", icon: ShoppingCart },
  unknown:    { label: "Desconocido", color: "bg-muted text-foreground", icon: Clock },
};

const fmtExact = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    });
  } catch { return iso; }
};

const AdminHotmartAudit = () => {
  const { adminKey } = useAdminKey();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [summary, setSummary] = useState<Summary>({ approved: 0, pending: 0, refused: 0, refunded: 0, chargeback: 0, cancelled: 0, abandoned: 0 });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await adminInvoke<{ rows: AuditRow[]; summary: Summary }>(
        "list-hotmart-audit",
        { body: { adminKey, status, search, limit: 300 } },
      );
      if (error) throw error;
      setRows(data?.rows ?? []);
      if (data?.summary) setSummary(data.summary);
    } catch (e) {
      toast.error("No se pudo cargar la auditoría de Hotmart", { description: (e as Error).message });
    } finally { setLoading(false); }
  }, [adminKey, status, search]);

  useEffect(() => { void load(); }, [load]);

  const statCards: Array<{ key: keyof Summary; label: string }> = [
    { key: "approved", label: "Aprobados" },
    { key: "pending", label: "Pendientes" },
    { key: "refused", label: "Rechazados" },
    { key: "refunded", label: "Reembolsos" },
    { key: "chargeback", label: "Chargebacks" },
    { key: "cancelled", label: "Cancelados" },
    { key: "abandoned", label: "Abandonados" },
  ];

  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background py-6 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Auditoría Hotmart</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Cada evento recibido de Hotmart (compra, pendiente, rechazo, reembolso, chargeback, cancelación, carrito abandonado) con el evento original, el estado mapeado y la hora exacta.
              </p>
            </div>
            <Button onClick={() => void load()} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </header>

          <div className="grid gap-2 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
            {statCards.map((c) => {
              const meta = STATUS_META[c.key as MappedStatus];
              return (
                <Card key={c.key} className="p-3">
                  <div className="text-[11px] text-muted-foreground">{c.label} · 7d</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${meta.color} font-normal text-[10px] px-1.5`}>·</Badge>
                    <div className="text-xl font-semibold">{summary[c.key]}</div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="p-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground">Buscar</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Email, transacción o producto…" className="pl-8" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Estado mapeado</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-10 rounded-md border bg-background px-3 text-sm">
                  <option value="all">Todos</option>
                  <option value="approved">Aprobado</option>
                  <option value="pending">Pendiente</option>
                  <option value="refused">Rechazado</option>
                  <option value="refunded">Reembolso</option>
                  <option value="chargeback">Chargeback</option>
                  <option value="cancelled">Cancelado</option>
                  <option value="abandoned">Carrito abandonado</option>
                </select>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            {/* Desktop: tabla */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left w-8"></th>
                    <th className="px-3 py-2 text-left">Hora exacta</th>
                    <th className="px-3 py-2 text-left">Evento Hotmart</th>
                    <th className="px-3 py-2 text-left">Estado mapeado</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Producto</th>
                    <th className="px-3 py-2 text-left">Transacción</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-muted-foreground">
                        {loading ? "Cargando…" : "Aún no hay eventos registrados con estos filtros."}
                      </td>
                    </tr>
                  )}
                  {rows.map((row) => {
                    const meta = STATUS_META[row.mapped_status];
                    const Icon = meta.icon;
                    const isOpen = openId === row.id;
                    return (
                      <>
                        <tr key={row.id} className="border-t hover:bg-muted/30 cursor-pointer"
                          onClick={() => setOpenId(isOpen ? null : row.id)}>
                          <td className="px-3 py-2">
                            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap font-mono text-xs">{fmtExact(row.received_at)}</td>
                          <td className="px-3 py-2 font-mono text-xs">{row.event_raw}</td>
                          <td className="px-3 py-2">
                            <Badge className={`${meta.color} font-normal inline-flex items-center gap-1`}>
                              <Icon className="w-3 h-3" /> {meta.label}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 truncate max-w-[180px]">{row.email ?? "—"}</td>
                          <td className="px-3 py-2 truncate max-w-[200px] text-xs">{row.product ?? "—"}</td>
                          <td className="px-3 py-2 font-mono text-xs">{row.transaction ?? (row.source === "abandoned" ? "(carrito)" : "—")}</td>
                        </tr>
                        {isOpen && (
                          <tr key={row.id + "-detail"} className="border-t bg-muted/20">
                            <td colSpan={7} className="px-6 py-4">
                              <div className="text-xs text-muted-foreground mb-2">
                                Fuente: <span className="font-mono">{row.source === "purchase" ? "hotmart_purchases" : "abandoned_carts"}</span>
                                {row.converted !== null && (
                                  <> · Convertido: <span className="font-mono">{row.converted ? "sí" : "no"}</span></>
                                )}
                              </div>
                              <pre className="text-xs bg-background border rounded p-3 overflow-auto max-h-96">
{JSON.stringify(row.payload ?? {}, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Móvil: tarjetas */}
            <div className="md:hidden divide-y">
              {rows.length === 0 && (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  {loading ? "Cargando…" : "Aún no hay eventos registrados con estos filtros."}
                </div>
              )}
              {rows.map((row) => {
                const meta = STATUS_META[row.mapped_status];
                const Icon = meta.icon;
                const isOpen = openId === row.id;
                return (
                  <div key={row.id} className="p-3">
                    <button
                      className="w-full text-left"
                      onClick={() => setOpenId(isOpen ? null : row.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge className={`${meta.color} font-normal inline-flex items-center gap-1 shrink-0`}>
                          <Icon className="w-3 h-3" /> {meta.label}
                        </Badge>
                        <span className="font-mono text-[11px] text-muted-foreground">{fmtExact(row.received_at)}</span>
                      </div>
                      <div className="mt-2 text-sm font-medium break-all">{row.email ?? "—"}</div>
                      <div className="mt-1 text-xs text-muted-foreground break-all">{row.product ?? "—"}</div>
                      <div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-mono text-muted-foreground truncate">{row.event_raw}</span>
                        <span className="font-mono">{row.transaction ?? (row.source === "abandoned" ? "(carrito)" : "—")}</span>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="mt-3 bg-muted/20 rounded p-2">
                        <div className="text-[11px] text-muted-foreground mb-2">
                          Fuente: <span className="font-mono">{row.source === "purchase" ? "hotmart_purchases" : "abandoned_carts"}</span>
                          {row.converted !== null && (
                            <> · Convertido: <span className="font-mono">{row.converted ? "sí" : "no"}</span></>
                          )}
                        </div>
                        <pre className="text-[11px] bg-background border rounded p-2 overflow-auto max-h-72">
{JSON.stringify(row.payload ?? {}, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

        </div>
      </main>
    </>
  );
};

export default AdminHotmartAudit;
