import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, CreditCard, Package, Clock, Megaphone, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import { adminInvoke } from "@/lib/adminInvoke";
import { useAdminKey } from "@/components/admin/AdminGate";
import { toast } from "sonner";

interface OrderDetail {
  id: string;
  provider_label: string;
  payment_method: string | null;
  order_number: string | null;
  email: string | null;
  name: string | null;
  amount: number | null;
  currency: string | null;
  country: string | null;
  product: string | null;
  items: Array<{ name?: string; sku?: string }>;
  created_at: string | null;
  from_meta_ads: boolean;
  meta_attribution: { country?: string; updated_at?: string } | null;
  delivery: { status: string | null; last_event: string | null; created_at: string | null; updated_at: string | null } | null;
  raw_detail: Record<string, unknown>;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-PE", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function DeliveryBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground border border-border">
        <HelpCircle className="w-3.5 h-3.5" /> Sin registro de envío
      </span>
    );
  }
  if (status === "sent") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
        <CheckCircle2 className="w-3.5 h-3.5" /> Material enviado
      </span>
    );
  }
  if (status === "processing") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/30">
        <Clock className="w-3.5 h-3.5" /> Procesando envío
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-red-500/15 text-red-600 border border-red-500/30">
      <AlertCircle className="w-3.5 h-3.5" /> {status}
    </span>
  );
}

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { adminKey } = useAdminKey();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!adminKey || !id) return;
    setLoading(true);
    setError(null);
    adminInvoke("get-order-detail", { body: { adminKey, id } })
      .then(({ data, error: err }) => {
        if (err) throw err;
        if ((data as any)?.error) throw new Error((data as any).error);
        setOrder(data as OrderDetail);
      })
      .catch((e) => {
        setError((e as Error).message);
        toast.error("No se pudo cargar el pedido", { description: (e as Error).message });
      })
      .finally(() => setLoading(false));
  }, [adminKey, id]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <Link to="/admin/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Volver a todos los pedidos
      </Link>

      {loading && <p className="text-sm text-muted-foreground py-8 text-center">Cargando pedido…</p>}

      {!loading && error && (
        <Card className="p-4 border-red-500/30 bg-red-500/5">
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      )}

      {!loading && order && (
        <>
          <Card className="p-5">
            <div className="flex items-start justify-between flex-wrap gap-2 mb-1">
              <div>
                <h1 className="text-lg font-bold">{order.name || "Sin nombre"}</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {order.email || "—"}
                </p>
              </div>
              {order.amount != null && (
                <div className="text-right">
                  <p className="text-xl font-bold tabular-nums">
                    {order.currency || "USD"} {order.amount.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Pedido {order.order_number || order.id}
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" /> Productos
            </h2>
            {order.items && order.items.length > 0 ? (
              <div className="space-y-2">
                {order.items.map((it, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                    <span>{it.name || it.sku || "Producto"}</span>
                    {i === 0 ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Principal</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">Upsell</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {order.product || "Sin detalle de producto disponible para este tipo de pago."}
              </p>
            )}
          </Card>

          {/* Resumen de conversión — estilo "Conversion summary" */}
          <Card className="p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Megaphone className="w-4 h-4" /> Resumen de conversión
            </h2>
            {order.from_meta_ads ? (
              <div className="space-y-1.5 text-sm">
                <p className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                  Llegó desde un anuncio de <b>Meta (Facebook / Instagram)</b>
                </p>
                {order.meta_attribution?.country && (
                  <p className="text-muted-foreground text-xs">País detectado en el clic: {order.meta_attribution.country}</p>
                )}
                {order.meta_attribution?.updated_at && (
                  <p className="text-muted-foreground text-xs">Última atribución registrada: {formatDateTime(order.meta_attribution.updated_at)}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground" />
                Visita <b>directa u orgánica</b> — no se detectó clic en un anuncio de Meta para este correo.
              </div>
            )}
          </Card>

          {/* Pago y entrega */}
          <Card className="p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Pago y entrega
            </h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Método de pago</span>
                <span className="font-medium">{order.payment_method || order.provider_label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">País</span>
                <span className="font-medium">{order.country || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Fecha y hora del pedido</span>
                <span className="font-medium">{formatDateTime(order.created_at)}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> Entrega digital
                </span>
                <DeliveryBadge status={order.delivery?.status ?? null} />
              </div>
              {order.delivery?.updated_at && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Última actualización de envío</span>
                  <span>{formatDateTime(order.delivery.updated_at)}</span>
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
