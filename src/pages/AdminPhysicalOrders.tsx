import { useEffect, useMemo, useState } from "react";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminInvoke } from "@/lib/adminInvoke";
import { 
  Package, 
  Truck, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Save,
  ClipboardCopy,
  Mail,
  Upload,
  Image as ImageIcon,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderItem {
  sku: string;
  name: string;
}

interface PhysicalOrder {
  id: string;
  source: "manual" | "shopify" | "gateway";
  created_at: string;
  order_ref: string;
  customer: string;
  email: string;
  products: string;
  items: OrderItem[];
  amount: string;
  status: string;
  tracking_number: string | null;
  shipping_provider: string | null;
  shipping_proof_url: string | null;
  shipping_address?: string | null;
  payment_provider?: string | null;
}

const AdminPhysicalOrders = () => {
  const { adminKey } = useAdminKey();
  const [orders, setOrders] = useState<PhysicalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const loadOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data, error } = await adminInvoke("list-admin-orders", {
        body: { adminKey },
      });
      if (error) throw error;

      const products = (data as any)?.products || [];
      const physicalSkus = new Set(
        products
          .filter((p: any) => p.is_physical)
          .map((p: any) => String(p.sku).toLowerCase())
      );

      const merged: PhysicalOrder[] = [];

      // Manual Payments
      ((data as any)?.manual || []).forEach((r: any) => {
        const items = Array.isArray(r.items) ? r.items : [];
        const hasPhysical = items.some((i: any) => physicalSkus.has(String(i.sku || i.id).toLowerCase()));
        
        if (hasPhysical) {
          merged.push({
            id: r.order_number || `m-${r.id}`,
            source: "manual",
            created_at: r.created_at,
            order_ref: r.order_number,
            customer: r.buyer_name || "—",
            email: r.buyer_email || "—",
            products: items.map((i: any) => i.name).join(", "),
            items: items.map((i: any) => ({ sku: i.sku || i.id, name: i.name })),
            amount: `USD ${Number(r.amount_usd || 0).toFixed(2)}`,
            status: r.status || "pending",
            tracking_number: r.tracking_number,
            shipping_provider: r.shipping_provider,
            shipping_proof_url: r.shipping_proof_url,
          });
        }
      });

      // Shopify Sales
      ((data as any)?.shopify || []).forEach((r: any) => {
        // Shopify usually physical by default in this context
        merged.push({
          id: String(r.id),
          source: "shopify",
          created_at: r.created_at,
          order_ref: r.order_number || String(r.id),
          customer: r.customer_name || "—",
          email: r.customer_email || "—",
          products: r.product_name || "—",
          items: [{ sku: r.sku || "", name: r.product_name || "" }],
          amount: `${r.currency || "USD"} ${Number(r.amount || 0).toFixed(2)}`,
          status: r.status || "paid",
          tracking_number: r.tracking_number,
          shipping_provider: r.shipping_provider,
          shipping_proof_url: r.shipping_proof_url,
        });
      });

      // Pedidos pagados con pasarela (Stripe, dLocal…) que incluyen algún SKU físico
      const nameBySku = new Map<string, string>(
        products.map((p: any) => [String(p.sku).toLowerCase(), p.name || p.sku])
      );
      ((data as any)?.gateway || []).forEach((r: any) => {
        const skus: string[] = Array.isArray(r.skus) ? r.skus : [];
        const physical = skus.filter((s) => physicalSkus.has(String(s).toLowerCase()));
        if (physical.length === 0) return;

        const addr = r.shipping_address && typeof r.shipping_address === "object"
          ? [r.shipping_address.address, r.shipping_address.city, r.shipping_address.state, r.shipping_address.zip, r.shipping_address.country]
              .filter(Boolean).join(", ")
          : null;

        merged.push({
          id: String(r.order_number),
          source: "gateway",
          created_at: r.created_at,
          order_ref: String(r.order_number),
          customer: r.customer_name || "—",
          email: r.customer_email || "—",
          products: physical.map((s) => nameBySku.get(String(s).toLowerCase()) || s).join(", "),
          items: physical.map((s) => ({ sku: s, name: nameBySku.get(String(s).toLowerCase()) || s })),
          amount: `${r.currency || "USD"} ${Number(r.amount || 0).toFixed(2)}`,
          status: r.status || "paid",
          tracking_number: r.tracking_number,
          shipping_provider: r.shipping_provider,
          shipping_proof_url: r.shipping_proof_url,
          shipping_address: addr,
          payment_provider: r.provider || r.method || null,
        });
      });

      setOrders(merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (e) {
      toast.error("Error al cargar pedidos: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminKey) loadOrders();
  }, [adminKey]);

  const updateTracking = async (order: PhysicalOrder, tracking: string, provider: string, proofUrl?: string) => {
    if (!tracking && !provider && !proofUrl) {
      toast.error("Ingresa al menos un dato de seguimiento");
      return;
    }
    
    setSaving(order.id);
    try {
      const { error } = await adminInvoke("list-admin-orders", {
        body: {
          adminKey,
          action: "update_tracking",
          orderId: order.order_ref || order.id,
          trackingNumber: tracking,
          shipping_provider: provider,
          shippingProofUrl: proofUrl,
          source: order.source,
        },
      });
      if (error) throw error;
      toast.success("Seguimiento actualizado para " + (order.order_ref || order.id));
      loadOrders(true);
    } catch (e) {
      toast.error("Error al guardar: " + (e as Error).message);
    } finally {
      setSaving(null);
    }
  };

  const getTrackingUrl = (provider: string, tracking: string) => {
    const p = provider.toLowerCase();
    if (tracking.startsWith('http')) return tracking;
    
    if (p.includes('amazon')) return `https://www.amazon.com/progress-tracker/package/ref=pt_redirect_from_gp?shipmentId=${tracking}`;
    if (p.includes('dhl')) return `https://www.dhl.com/en/express/tracking.html?AWB=${tracking}`;
    if (p.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${tracking}`;
    if (p.includes('ups')) return `https://www.ups.com/track?tracknum=${tracking}`;
    if (p.includes('serpost')) return `https://www.serpost.com.pe/Cliente/ConsultaEnvio?pTracking=${tracking}`;
    if (p.includes('olva')) return `https://www.olvacourier.com/seguimiento-de-envios/`;
    
    return null;
  };

  const filteredOrders = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return orders;
    return orders.filter(o => 
      o.order_ref.toLowerCase().includes(q) ||
      o.customer.toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q) ||
      o.products.toLowerCase().includes(q) ||
      (o.tracking_number || "").toLowerCase().includes(q)
    );
  }, [orders, query]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <AdminNav />
      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              Gestión de Pedidos Físicos
            </h1>
            <p className="text-muted-foreground text-sm">
              Administra los envíos y números de seguimiento para productos físicos.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => loadOrders()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por pedido, cliente, email o tracking..." 
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="grid gap-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-4 space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
              </Card>
            ))
          ) : filteredOrders.length === 0 ? (
            <Card className="p-12 text-center space-y-2">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
              <p className="text-muted-foreground">No se encontraron pedidos físicos.</p>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id} className="p-4 md:p-6 space-y-4">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-lg">{order.order_ref}</span>
                      <Badge 
                        variant={order.status === "approved" || order.status === "paid" ? "default" : "secondary"}
                        className={order.tracking_number ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}
                      >
                        {order.tracking_number ? "ENVIADO" : order.status.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {order.source}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleString("es-PE")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{order.amount}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-[200px] md:max-w-none">
                      {order.customer} ({order.email})
                    </p>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-lg p-3 text-sm border">
                  <p className="font-semibold mb-1">Productos:</p>
                  <p className="text-muted-foreground">{order.products}</p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 items-end border-t pt-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                      <Truck className="w-3 h-3" /> Transportista
                    </label>
                    <Input 
                      placeholder="Ej: Amazon, DHL..." 
                      defaultValue={order.shipping_provider || ""}
                      id={`provider-${order.id}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> Tracking
                    </label>
                    <Input 
                      placeholder="ID o enlace..." 
                      defaultValue={order.tracking_number || ""}
                      id={`tracking-${order.id}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                      <Upload className="w-3 h-3" /> Comprobante (URL)
                    </label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="URL de imagen o PDF..." 
                        defaultValue={order.shipping_proof_url || ""}
                        id={`proof-${order.id}`}
                      />
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          disabled={saving === order.id}
                          onClick={() => {
                            const t = (document.getElementById(`tracking-${order.id}`) as HTMLInputElement).value;
                            const p = (document.getElementById(`provider-${order.id}`) as HTMLInputElement).value;
                            const pr = (document.getElementById(`proof-${order.id}`) as HTMLInputElement).value;
                            updateTracking(order, t, p, pr);
                          }}
                        >
                          {saving === order.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {order.tracking_number && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-dashed">
                    <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Tracking configurado.
                    </div>
                    {getTrackingUrl(order.shipping_provider || "", order.tracking_number) && (
                      <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs gap-1">
                        <a 
                          href={getTrackingUrl(order.shipping_provider || "", order.tracking_number)!} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          Ver rastreo externo <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                )}
                {!order.tracking_number && (order.status === "approved" || order.status === "paid") && (
                  <div className="space-y-2 pt-2 border-t border-dashed">
                    <div className="flex items-center gap-2 text-xs text-amber-600 font-medium">
                      <AlertCircle className="w-3 h-3" />
                      Pendiente de envío / tracking.
                    </div>
                    {order.source === "manual" && (
                      <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                        <p className="text-[10px] uppercase font-bold text-primary/70 mb-1">Conversión Manual a Pedido Físico</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Si este pago manual incluye un producto físico (ej: libro), completa el transportista y tracking para activar el rastreo del cliente.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPhysicalOrders;