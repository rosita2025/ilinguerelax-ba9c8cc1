import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, RefreshCw, ShieldCheck, XCircle, Search, ListChecks } from "lucide-react";
import { adminInvoke } from "@/lib/adminInvoke";

/**
 * Conciliación de pedidos: re-consulta el estado real en el proveedor
 * (dLocal Go) y lo aplica, o permite que el admin acepte manualmente un pago
 * que confirmó por su cuenta. Todo queda auditado en el historial del pedido.
 */
type Summary = {
  orderNumber: string;
  provider: string;
  env: string;
  email: string;
  method: string | null;
  amount: number | null;
  currency: string;
  skus: string[];
  alreadyPaid: boolean;
  alreadyDelivered: boolean;
  remoteStatus: string | null;
  timeline: Array<{ event: string; status: string | null; at: string }>;
};

type PendingOrder = {
  orderNumber: string;
  email: string;
  method: string | null;
  amount: number | null;
  currency: string;
  lastAt: string;
};

export default function OrderReconcilePanel() {
  const [orderNumber, setOrderNumber] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pending, setPending] = useState<PendingOrder[] | null>(null);

  async function loadPending() {
    if (!adminKey.trim()) { toast.error("Falta la clave de admin"); return; }
    setBusy("list");
    try {
      const { data, error } = await adminInvoke<any>("dlocal-reconcile-order", {
        body: { action: "list_pending", adminKey: adminKey.trim() },
      });
      if (error || data?.error) {
        toast.error(data?.error || error?.message || "No se pudo cargar la lista");
        return;
      }
      setPending(data.pending ?? []);
      toast.success(`${(data.pending ?? []).length} pedido(s) pendiente(s)`);
    } catch (e) {
      toast.error((e as Error).message || "Error inesperado");
    } finally {
      setBusy(null);
    }
  }

  async function run(action: "inspect" | "sync" | "approve" | "reject" | "retry_delivery") {
    const order = orderNumber.trim().toUpperCase();
    if (!order) { toast.error("Escribe el número de pedido"); return; }
    if (!adminKey.trim()) { toast.error("Falta la clave de admin"); return; }
    if (action === "approve" && reason.trim().length < 4) {
      toast.error("Indica el motivo o comprobante de la aceptación manual");
      return;
    }
    setBusy(action);
    try {
      const { data, error } = await adminInvoke<any>("dlocal-reconcile-order", {
        body: { action, orderNumber: order, adminKey: adminKey.trim(), reason: reason.trim() || undefined },
      });
      if (error || data?.error) {
        toast.error(data?.error || error?.message || "No se pudo procesar");
        if (data?.summary) setSummary(data.summary);
        return;
      }
      setSummary(data.summary ?? null);
      if (action === "inspect") toast.success("Estado consultado");
      else if (action === "retry_delivery") toast.success("Material reenviado al cliente");
      else if (data.applied === "paid" || data.applied === "manual_approved") {
        toast.success(data.delivery?.delivered ? "Pago aplicado y entrega enviada" : "Pago aplicado");
        if (data.delivery && data.delivery.delivered === false) {
          toast.error(`No se envió el material: ${data.delivery.detail}`);
        }
        setPending((p) => (p ? p.filter((o) => o.orderNumber !== order) : p));
      } else toast.success(`Resultado: ${data.applied}`);
      if (action === "reject") setPending((p) => (p ? p.filter((o) => o.orderNumber !== order) : p));
    } catch (e) {
      toast.error((e as Error).message || "Error inesperado");
    } finally {
      setBusy(null);
    }
  }


  return (
    <Card className="p-3 sm:p-4 space-y-3">
      <div className="space-y-1">
        <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" /> Conciliar pedido (pagado / pendiente / rechazado)
        </h2>
        <p className="text-xs text-muted-foreground">
          Vuelve a consultar el estado real en dLocal Go y lo aplica automáticamente. Si el webhook se perdió,
          también puedes aceptar el pago manualmente: se registra con motivo y dispara la entrega digital.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          placeholder="Número de pedido (ej. ILR-DL-XXXX)"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Clave de admin"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
        />
      </div>
      <Input
        placeholder="Motivo / comprobante (obligatorio para aceptar manualmente)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={!!busy} onClick={() => run("inspect")}>
          {busy === "inspect" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
          Consultar
        </Button>
        <Button size="sm" disabled={!!busy} onClick={() => run("sync")}>
          {busy === "sync" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
          Sincronizar con dLocal
        </Button>
        <Button size="sm" variant="secondary" disabled={!!busy} onClick={() => run("approve")}>
          {busy === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-1" />}
          Aceptar manualmente
        </Button>
        <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => run("reject")}>
          {busy === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
          Marcar rechazado
        </Button>
        <Button size="sm" variant="secondary" disabled={!!busy} onClick={() => run("retry_delivery")}>
          {busy === "retry_delivery" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
          Reintentar entrega
        </Button>
        <Button size="sm" variant="outline" disabled={!!busy} onClick={loadPending}>
          {busy === "list" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListChecks className="h-4 w-4 mr-1" />}
          Ver pendientes
        </Button>

      </div>

      {pending && (
        <div className="rounded-lg border border-border p-3 space-y-2">
          <p className="text-xs font-medium">
            Pendientes de dLocal Go ({pending.length}) — elige uno y acéptalo o recházalo
          </p>
          {pending.length === 0 && (
            <p className="text-xs text-muted-foreground">No hay pedidos pendientes en los últimos 30 días.</p>
          )}
          <ul className="space-y-1.5 max-h-72 overflow-y-auto">
            {pending.map((o) => (
              <li
                key={o.orderNumber}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 px-2 py-1.5 text-xs break-words"
              >
                <span className="min-w-0">
                  <strong>{o.orderNumber}</strong> · {o.email || "sin correo"} ·{" "}
                  {o.amount ?? "—"} {o.currency} · {o.method || "sin método"} ·{" "}
                  {new Date(o.lastAt).toLocaleString()}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 px-2"
                  disabled={!!busy}
                  onClick={() => { setOrderNumber(o.orderNumber); setSummary(null); }}
                >
                  Seleccionar
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}


      {summary && (
        <div className="rounded-lg border border-border p-3 text-xs space-y-2 break-words">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">{summary.provider}</Badge>
            <Badge variant="outline">entorno: {summary.env}</Badge>
            {summary.remoteStatus && <Badge>{summary.remoteStatus}</Badge>}
            {summary.alreadyPaid && <Badge variant="secondary">pagado</Badge>}
            {summary.alreadyDelivered && <Badge variant="secondary">entregado</Badge>}
          </div>
          <p><strong>{summary.orderNumber}</strong> · {summary.email || "sin correo"} · {summary.method || "sin método"}</p>
          <p>{summary.amount ?? "—"} {summary.currency} · SKUs: {summary.skus.length ? summary.skus.join(", ") : "ninguno"}</p>
          <ul className="space-y-0.5 text-muted-foreground">
            {summary.timeline.map((t, i) => (
              <li key={i}>{new Date(t.at).toLocaleString()} — {t.event}{t.status ? ` (${t.status})` : ""}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
