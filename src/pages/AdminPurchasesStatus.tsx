import { useCallback, useEffect, useMemo, useState } from "react";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";
import { adminInvoke } from "@/lib/adminInvoke";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw, Search, CheckCircle2, Clock, XCircle, Ban, AlertOctagon,
  ChevronDown, ChevronRight, CreditCard, ShoppingBag, Wallet, Banknote, Pencil, Send,
  Box, UserMinus
} from "lucide-react";
import { toast } from "sonner";

type Provider = "mercadopago" | "paypal" | "stripe" | "manual" | "hotmart" | "shopify" | "dlocalgo" | "internal_cart";
type Mapped = "approved" | "pending" | "refused" | "refunded" | "chargeback" | "cancelled" | "blocked" | "abandoned" | "unknown";

interface Row {
  id: string;
  provider: Provider;
  received_at: string;
  email: string | null;
  name: string | null;
  country?: string | null;
  amount: number | null;
  currency: string | null;
  product: string | null;
  transaction: string | null;
  raw_status: string;
  mapped_status: Mapped;
  failure_reason: string | null;
  failed_step: string | null;
  payload: any;
  is_merged?: boolean;
}

const PROVIDER_META: Record<Provider, { label: string; icon: typeof CreditCard; color: string }> = {
  mercadopago: { label: "Mercado Pago",  icon: Wallet,      color: "bg-sky-100 text-sky-800" },
  stripe:      { label: "Stripe",        icon: CreditCard,  color: "bg-purple-100 text-purple-800" },
  paypal:      { label: "PayPal",        icon: CreditCard,  color: "bg-blue-100 text-blue-800" },
  manual:      { label: "Yape / Plin",   icon: Banknote,    color: "bg-emerald-100 text-emerald-800" },
  hotmart:     { label: "Hotmart",       icon: ShoppingBag, color: "bg-orange-100 text-orange-800" },
  shopify:     { label: "Shopify / Físico", icon: Box,      color: "bg-teal-100 text-teal-800" },
  dlocalgo:    { label: "dLocal Go",     icon: Wallet,   color: "bg-indigo-100 text-indigo-800" },
  internal_cart: { label: "Carrito Interno", icon: Clock,  color: "bg-amber-100 text-amber-800" },
};

const STATUS_META: Record<Mapped, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  approved:   { label: "Aprobado",     className: "bg-green-100 text-green-800",   icon: CheckCircle2 },
  pending:    { label: "Pendiente",    className: "bg-yellow-100 text-yellow-800", icon: Clock },
  refused:    { label: "Rechazado",    className: "bg-red-100 text-red-800",       icon: XCircle },
  blocked:    { label: "Bloqueado",    className: "bg-rose-100 text-rose-800",     icon: Ban },
  refunded:   { label: "Reembolsado",  className: "bg-purple-100 text-purple-800", icon: AlertOctagon },
  chargeback: { label: "Chargeback",   className: "bg-fuchsia-100 text-fuchsia-800", icon: AlertOctagon },
  cancelled:  { label: "Cancelado",    className: "bg-gray-100 text-gray-800",     icon: XCircle },
  abandoned:  { label: "Abandonado",   className: "bg-orange-100 text-orange-800", icon: UserMinus },
  unknown:    { label: "Desconocido",  className: "bg-muted text-foreground",       icon: Clock },
};

const fmtDate = (iso: string) => {
  try { return new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }); }
  catch { return iso; }
};

const AdminPurchasesStatus = () => {
  const { adminKey } = useAdminKey();
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [provider, setProvider] = useState<Provider | "all">("all");
  const [mapped, setMapped] = useState<Mapped | "all">("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState("");
  const [resendOnSave, setResendOnSave] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState<string | null>(null);

  const changeStatus = async (id: string, next: Mapped) => {
    setStatusSaving(id);
    try {
      const { data, error } = await adminInvoke("update-purchase-status", {
        body: { adminKey, rowId: id, status: next },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, mapped_status: next, raw_status: next } : r)));
      toast.success("Estado actualizado", { description: `Ahora: ${STATUS_META[next].label}` });
      load();
    } catch (e) {
      toast.error("No se pudo cambiar el estado", { description: (e as Error).message });
    } finally {
      setStatusSaving(null);
    }
  };


  const startEdit = (id: string, current: string | null) => {
    setEditing(id); setEmailDraft(current ?? ""); setResendOnSave(true);
  };
  const cancelEdit = () => { setEditing(null); setEmailDraft(""); };
  const saveEdit = async (id: string) => {
    const email = emailDraft.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Correo inválido"); return;
    }
    setSaving(true);
    try {
      const { data, error } = await adminInvoke("correct-purchase-email", {
        body: { adminKey, rowId: id, newEmail: email, resend: resendOnSave },
      });
      if (error) throw error;
      const d = data as any;
      toast.success("Correo actualizado", {
        description: d?.resend
          ? (d?.delivery?.ok ? "Material digital reenviado al nuevo correo." : "Correo cambiado, pero el reenvío falló.")
          : d?.canResend ? "Correo cambiado (sin reenvío)." : "Correo cambiado (esta compra no soporta reenvío automático).",
      });
      cancelEdit();
      load();
    } catch (e) {
      toast.error("Error", { description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const load = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    try {
      const { data, error } = await adminInvoke("list-purchases-status", {
        body: { adminKey, provider: provider === "all" ? undefined : provider, mapped, search, limit: 1000 },
      });
      if (error) throw error;
      const rows = ((data as any)?.rows ?? []) as any[];
      // Newest first (Shopify-style)
      rows.sort((a, b) => String(b.received_at ?? "").localeCompare(String(a.received_at ?? "")));
      setRows(rows);
      setSummary((data as any)?.summary ?? {});
      setLastSync(new Date());

    } catch (e) {
      toast.error("Error al cargar", { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, [adminKey, provider, mapped, search]);

  useEffect(() => { load(); }, [load]);

  const toggle = (id: string) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  const kpis = useMemo(() => ([
    { label: "Aprobados",   value: summary.approved   ?? 0, className: STATUS_META.approved.className },
    { label: "Pendientes",  value: summary.pending    ?? 0, className: STATUS_META.pending.className },
    { label: "Abandonos",   value: summary.abandoned  ?? 0, className: STATUS_META.abandoned.className },
    { label: "Rechazados",  value: summary.refused    ?? 0, className: STATUS_META.refused.className },
    { label: "Bloqueados",  value: summary.blocked    ?? 0, className: STATUS_META.blocked.className },
    { label: "Reembolsos",  value: summary.refunded   ?? 0, className: STATUS_META.refunded.className },
    { label: "Cancelados / Exp", value: summary.cancelled ?? 0, className: STATUS_META.cancelled.className },
  ]), [summary]);

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h1 className="text-lg sm:text-xl font-bold">Estado de compras · Todas las pasarelas</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              Hotmart · Stripe · Mercado Pago · PayPal. Muestra por qué quedó bloqueado y qué paso falló. 
              {lastSync && (
                <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-sm border border-emerald-100 animate-in fade-in slide-in-from-top-1">
                  Sincronizado: {lastSync.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> {loading ? "Sincronizando..." : "Recargar"}
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {kpis.map((k) => (
            <div key={k.label} className={`rounded-md px-3 py-2 ${k.className}`}>
              <div className="text-[10px] uppercase font-medium opacity-80">{k.label}</div>
              <div className="text-lg font-bold">{k.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <Card className="p-3">
          <div className="grid gap-2 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground">Buscar</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Email, transacción o producto…" className="pl-8 h-9" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Pasarela</label>
              <select value={provider} onChange={(e) => setProvider(e.target.value as Provider | "all")}
                className="w-full h-9 rounded-md border bg-background px-2 text-sm">
                <option value="all">Todas</option>
                
                <option value="mercadopago">Mercado Pago</option>
                <option value="paypal">PayPal</option>
                <option value="stripe">Stripe</option>
                <option value="hotmart">Hotmart</option>
                <option value="dlocalgo">dLocal Go</option>
                <option value="internal_cart">Carrito Interno</option>
                <option value="shopify">Shopify / Físico</option>
                <option value="manual">Yape / Plin</option>
                
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Estado</label>
              <select value={mapped} onChange={(e) => setMapped(e.target.value as Mapped | "all")}
                className="w-full h-9 rounded-md border bg-background px-2 text-sm">
                <option value="all">Todos</option>
                <option value="approved">Aprobado</option>
                <option value="pending">Pendiente</option>
                <option value="abandoned">Abandono</option>
                <option value="refused">Rechazado</option>
                <option value="blocked">Bloqueado</option>
                <option value="refunded">Reembolsado</option>
                <option value="chargeback">Chargeback</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Rows */}
        <Card className="overflow-hidden">
          <div className="divide-y">
            {rows.length === 0 && !loading && (
              <div className="p-6 text-center text-sm text-muted-foreground">Sin resultados con estos filtros.</div>
            )}
            {rows.map((r) => {
              const pMeta = PROVIDER_META[r.provider];
              const sMeta = STATUS_META[r.mapped_status];
              const PIcon = pMeta.icon; const SIcon = sMeta.icon;
              const isOpen = expanded.has(r.id);
              const highlight = r.mapped_status === "blocked" || r.mapped_status === "refused" || r.mapped_status === "chargeback";
              return (
                <div key={r.id} className={highlight ? "bg-red-50/40" : ""}>
                  <button onClick={() => toggle(r.id)}
                    className="w-full text-left px-3 py-2 hover:bg-muted/30 flex items-start gap-2">
                    {isOpen ? <ChevronDown className="w-4 h-4 mt-1 shrink-0" /> : <ChevronRight className="w-4 h-4 mt-1 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <Badge className={`${pMeta.color} font-normal`}>
                          <PIcon className="w-3 h-3 mr-1" />{pMeta.label}
                        </Badge>
                        <Badge className={`${sMeta.className} font-normal`}>
                          <SIcon className="w-3 h-3 mr-1" />{sMeta.label}
                        </Badge>
                        {(r.country || r.payload?.customer_country || r.payload?.country) && (
                          <Badge variant="outline" className="bg-slate-50 text-slate-600 font-normal">
                            {r.country || r.payload?.customer_country || r.payload?.country}
                          </Badge>
                        )}
                        {r.is_merged && (
                          <Badge variant="outline" className="text-[10px] h-5 border-amber-200 text-amber-600 bg-amber-50 font-normal">
                            Unificado
                          </Badge>
                        )}
                        <span className="text-[11px] text-muted-foreground">{fmtDate(r.received_at)}</span>
                        {r.amount != null && (
                          <span className="text-[11px] font-medium bg-muted/50 px-1 rounded">
                            {r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {r.currency ?? ""}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-semibold flex items-center gap-2">
                        <span className="truncate max-w-[150px]">{r.name ?? "Sin Nombre"}</span>
                        <span className="text-muted-foreground font-normal truncate opacity-70">&lt;{r.email ?? "—"}&gt;</span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {r.product ?? "—"} {r.transaction && <span className="opacity-60">· {r.transaction}</span>}
                      </div>
                      {(r.failure_reason || r.failed_step) && (
                        <div className="mt-1 text-[11px] leading-tight space-y-0.5">
                          {r.failure_reason && (
                            <div className="text-red-700 font-medium">
                              {r.failure_reason}
                            </div>
                          )}
                          {r.failed_step && (
                            <div className="text-amber-700">
                              <span className="font-medium">Paso:</span> {r.failed_step}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-3 pl-9 space-y-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Estado raw:</span>{" "}
                        <code className="bg-muted px-1 rounded">{r.raw_status}</code>
                      </div>




                      {editing === r.id ? (
                        <div className="rounded-md border p-2 space-y-2 bg-muted/30">
                          <label className="block text-[11px] font-medium">Corregir correo del cliente</label>
                          <Input value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)}
                            placeholder="nuevo@correo.com" className="h-8 text-xs" />
                          <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <input type="checkbox" checked={resendOnSave}
                              onChange={(e) => setResendOnSave(e.target.checked)} />
                            Reenviar material digital al nuevo correo (si la compra está aprobada)
                          </label>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveEdit(r.id)} disabled={saving} className="h-7 text-xs">
                              <Send className="w-3 h-3 mr-1" />{saving ? "Guardando…" : "Guardar"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit} disabled={saving} className="h-7 text-xs">
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => startEdit(r.id, r.email)} className="h-7 text-xs">
                          <Pencil className="w-3 h-3 mr-1" /> Editar correo / Reenviar
                        </Button>
                      )}

                      <details>
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Ver payload completo
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-x-auto max-h-72">
{JSON.stringify(r.payload, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminPurchasesStatus;
