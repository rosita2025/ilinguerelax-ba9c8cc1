import { useCallback, useEffect, useState } from "react";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";
import { adminInvoke } from "@/lib/adminInvoke";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Search, ChevronDown, ChevronRight, ShoppingCart, CheckCircle2, Clock, XCircle, RotateCcw, AlertOctagon, Ban, Send } from "lucide-react";
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
  usd_amount: number | null;
  usd_source: "producer" | "offer" | "price" | "none";
  brevo: BrevoInfo | null;
}


interface Summary {
  approved: number; pending: number; refused: number; refunded: number; chargeback: number; cancelled: number; abandoned: number;
}

interface UsdSummary {
  approved_usd: number;
  pending_usd: number;
}

const USD_SOURCE_LABEL: Record<AuditRow["usd_source"], string> = {
  producer: "Producer",
  offer: "Offer",
  price: "Price",
  none: "—",
};

const fmtUsd = (n: number | null) =>
  n == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);



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
  const [usdSummary, setUsdSummary] = useState<UsdSummary>({ approved_usd: 0, pending_usd: 0 });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  type BrevoLookup = { loading: boolean; data?: any; error?: string };
  const [brevoLookups, setBrevoLookups] = useState<Record<string, BrevoLookup>>({});

  const lookupBrevo = useCallback(async (email: string) => {
    setBrevoLookups((s) => ({ ...s, [email]: { loading: true } }));
    try {
      const { data, error } = await adminInvoke<any>(
        "brevo-lookup-contact",
        { body: { adminKey, email } },
      );
      if (error) throw error;
      setBrevoLookups((s) => ({ ...s, [email]: { loading: false, data } }));
    } catch (e) {
      setBrevoLookups((s) => ({ ...s, [email]: { loading: false, error: (e as Error).message } }));
    }
  }, [adminKey]);


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

  const forceBrevoSync = useCallback(async () => {
    setSyncing(true);
    try {
      const { data, error } = await adminInvoke<{ rows: AuditRow[]; summary: Summary; synced: number; syncTargets: number }>(
        "list-hotmart-audit",
        { body: { adminKey, status, search, limit: 300, forceSync: true } },
      );
      if (error) throw error;
      setRows(data?.rows ?? []);
      if (data?.summary) setSummary(data.summary);
      const synced = data?.synced ?? 0;
      const targets = data?.syncTargets ?? 0;
      if (targets === 0) {
        toast.success("Brevo ya está al día", { description: "No hay contactos pendientes de sincronizar." });
      } else {
        toast.success(`Sincronizados ${synced}/${targets} contactos con Brevo`);
      }
    } catch (e) {
      toast.error("No se pudo forzar la sincronización con Brevo", { description: (e as Error).message });
    } finally { setSyncing(false); }
  }, [adminKey, status, search]);

  useEffect(() => { void load(); }, [load]);

  // Auto-refresh cada 30s para reflejar nuevos eventos y sincronizar contactos a Brevo
  useEffect(() => {
    const id = window.setInterval(() => { void load(); }, 30000);
    const onFocus = () => { void load(); };
    window.addEventListener("focus", onFocus);
    return () => { window.clearInterval(id); window.removeEventListener("focus", onFocus); };
  }, [load]);

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
            <div className="flex gap-2">
              <Button onClick={() => void forceBrevoSync()} disabled={syncing || loading} size="sm">
                <Send className={`w-4 h-4 mr-2 ${syncing ? "animate-pulse" : ""}`} />
                {syncing ? "Sincronizando…" : "Sincronizar Brevo"}
              </Button>
              <Button onClick={() => void load()} disabled={loading} variant="outline" size="sm">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
            </div>
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
                    <th className="px-3 py-2 text-left">Brevo</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-10 text-muted-foreground">
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
                          <td className="px-3 py-2"><BrevoBadge info={row.brevo} /></td>
                        </tr>
                        {isOpen && (
                          <tr key={row.id + "-detail"} className="border-t bg-muted/20">
                            <td colSpan={9} className="px-6 py-4 space-y-3">
                              <div className="text-xs text-muted-foreground">
                                Fuente: <span className="font-mono">{row.source === "purchase" ? "hotmart_purchases" : "abandoned_carts"}</span>
                                {row.converted !== null && (
                                  <> · Convertido: <span className="font-mono">{row.converted ? "sí" : "no"}</span></>
                                )}
                              </div>
                              <BrevoDetail
                                row={row}
                                lookup={row.email ? brevoLookups[row.email.toLowerCase()] : undefined}
                                onLookup={row.email ? () => void lookupBrevo(row.email!.toLowerCase()) : undefined}
                              />
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
                      <div className="mt-2"><BrevoBadge info={row.brevo} /></div>
                    </button>
                    {isOpen && (
                      <div className="mt-3 bg-muted/20 rounded p-2 space-y-3">
                        <div className="text-[11px] text-muted-foreground">
                          Fuente: <span className="font-mono">{row.source === "purchase" ? "hotmart_purchases" : "abandoned_carts"}</span>
                          {row.converted !== null && (
                            <> · Convertido: <span className="font-mono">{row.converted ? "sí" : "no"}</span></>
                          )}
                        </div>
                        <BrevoDetail
                          row={row}
                          lookup={row.email ? brevoLookups[row.email.toLowerCase()] : undefined}
                          onLookup={row.email ? () => void lookupBrevo(row.email!.toLowerCase()) : undefined}
                        />
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

function BrevoBadge({ info }: { info: BrevoInfo | null }) {
  if (!info) {
    return <Badge className="bg-slate-200 text-slate-800 font-normal">Sin sincronizar</Badge>;
  }
  const ok = info.status === "success" || (info.http_status !== null && info.http_status >= 200 && info.http_status < 300);
  const color = ok
    ? (info.missing_fields.length > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800")
    : "bg-red-100 text-red-800";
  const label = ok
    ? (info.missing_fields.length > 0 ? `Sincronizado · faltan ${info.missing_fields.length}` : "Sincronizado")
    : "Error";
  return <Badge className={`${color} font-normal`}>{label}</Badge>;
}

function BrevoDetail({
  row,
  lookup,
  onLookup,
}: {
  row: AuditRow;
  lookup?: { loading: boolean; data?: any; error?: string };
  onLookup?: () => void;
}) {
  const info = row.brevo;
  return (
    <div className="rounded border bg-background p-3 text-xs space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium text-sm">Sincronización con Brevo</div>
        {row.email && onLookup && (
          <Button size="sm" variant="outline" onClick={onLookup} disabled={lookup?.loading}>
            {lookup?.loading ? "Buscando…" : (lookup?.data ? "Actualizar" : "Buscar en Brevo")}
          </Button>
        )}
      </div>

      {info ? (
        <div className="grid gap-1 sm:grid-cols-2">
          <div><span className="text-muted-foreground">Último evento:</span> <span className="font-mono">{info.event_type || "—"}</span></div>
          <div><span className="text-muted-foreground">Última sincronización:</span> <span className="font-mono">{fmtExact(info.last_sync_at)}</span></div>
          <div><span className="text-muted-foreground">Estado:</span> <span className="font-mono">{info.status}{info.http_status ? ` (${info.http_status})` : ""}</span></div>
          <div>
            <span className="text-muted-foreground">Campos faltantes:</span>{" "}
            {info.missing_fields.length === 0
              ? <span className="text-emerald-700">ninguno</span>
              : <span className="text-amber-700">{info.missing_fields.join(", ")}</span>}
          </div>
          {info.error && (
            <div className="sm:col-span-2 text-red-700 break-all"><span className="text-muted-foreground">Error:</span> {info.error}</div>
          )}
        </div>
      ) : (
        <div className="text-muted-foreground">No se encontró un log de sincronización local para este email.</div>
      )}

      {lookup?.error && (
        <div className="text-red-700 break-all">Error consultando Brevo: {lookup.error}</div>
      )}

      {lookup?.data && (
        <div className="grid gap-1 sm:grid-cols-2 border-t pt-2">
          <div><span className="text-muted-foreground">Brevo ID:</span> <span className="font-mono">{lookup.data.id ?? "—"}</span></div>
          <div><span className="text-muted-foreground">Modificado:</span> <span className="font-mono">{lookup.data.modified_at ? fmtExact(lookup.data.modified_at) : "—"}</span></div>
          <div><span className="text-muted-foreground">Creado:</span> <span className="font-mono">{lookup.data.created_at ? fmtExact(lookup.data.created_at) : "—"}</span></div>
          <div><span className="text-muted-foreground">Listas:</span> <span className="font-mono">{(lookup.data.list_ids ?? []).join(", ") || "—"}</span></div>
          <div className="sm:col-span-2">
            <span className="text-muted-foreground">Campos faltantes en Brevo:</span>{" "}
            {lookup.data.missing_fields?.length === 0
              ? <span className="text-emerald-700">ninguno</span>
              : <span className="text-amber-700">{(lookup.data.missing_fields ?? []).join(", ")}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminHotmartAudit;

