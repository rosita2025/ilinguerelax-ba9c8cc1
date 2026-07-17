import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, X, RotateCcw, Copy, Wallet, Mail, Phone, Globe, Pencil, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminInvoke } from "@/lib/adminInvoke";
import { useToast } from "@/hooks/use-toast";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";

interface ManualPayment {
  id: string;
  order_number: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  buyer_country: string | null;
  amount_usd: number;
  amount_local: number | null;
  currency_local: string | null;
  method: string;
  items: Array<{ name: string; quantity: number; price?: number }>;
  status: "pending" | "verified" | "rejected";
  notes: string | null;
  verified_at: string | null;
  created_at: string;
}

type Filter = "pending" | "verified" | "rejected" | "all";

const AdminManualPayments = () => {
  const { adminKey } = useAdminKey();
  const { toast } = useToast();
  const [orders, setOrders] = useState<ManualPayment[]>([]);
  const [filter, setFilter] = useState<Filter>("pending");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ email: string; name: string; phone: string; country: string }>({ email: "", name: "", phone: "", country: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  const startEdit = (o: ManualPayment) => {
    setEditingId(o.id);
    setEditData({ email: o.buyer_email || "", name: o.buyer_name || "", phone: o.buyer_phone || "", country: o.buyer_country || "" });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSavingEdit(true);
    try {
      const { error } = await adminInvoke("manage-manual-payments", {
        body: {
          action: "update_buyer",
          orderId: editingId,
          adminKey,
          buyerEmail: editData.email,
          buyerName: editData.name,
          buyerPhone: editData.phone,
          buyerCountry: editData.country,
        },
      });
      if (error) throw error;
      toast({ title: "✏️ Datos actualizados" });
      setEditingId(null);
      fetchOrders();
    } catch (e) {
      toast({ title: "Error al guardar", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await adminInvoke("manage-manual-payments", {
        body: { action: "list", adminKey },
      });
      if (error) throw error;
      setOrders(((data as { orders?: ManualPayment[] } | null)?.orders) ?? []);
    } catch {
      toast({ title: "Error al cargar órdenes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrders();
    const iv = setInterval(() => { void fetchOrders(); }, 20000);
    const onVis = () => { if (document.visibilityState === "visible") void fetchOrders(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(iv); document.removeEventListener("visibilitychange", onVis); };
    /* eslint-disable-next-line */
  }, [adminKey]);

  const runAction = async (action: "verify" | "reject" | "reset", orderId: string) => {
    try {
      const { error } = await adminInvoke("manage-manual-payments", {
        body: { action, orderId, adminKey },
      });
      if (error) throw error;
      toast({
        title: action === "verify" ? "✅ Verificada" : action === "reject" ? "❌ Rechazada" : "↺ Reabierta",
      });
      fetchOrders();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copiado" });
    } catch { /* noop */ }
  };

  const counts = useMemo(() => ({
    pending: orders.filter((o) => o.status === "pending").length,
    verified: orders.filter((o) => o.status === "verified").length,
    rejected: orders.filter((o) => o.status === "rejected").length,
    all: orders.length,
  }), [orders]);

  const filtered = orders.filter((o) => (filter === "all" ? true : o.status === filter));

  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <header className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Wallet className="w-7 h-7 text-primary" /> Pagos manuales (Yape / Plin / Binance)
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Órdenes creadas cuando el cliente pulsa "Ya pagué" en el checkout. Verifica el pago en Yape/Plin o Binance Pay y marca como <strong>Verificada</strong>.

            </p>
          </header>

          <div className="flex gap-2 mb-6 flex-wrap">
            {(["pending", "verified", "rejected", "all"] as const).map((f) => (
              <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
                {f === "pending" ? `⏳ Pendientes (${counts.pending})` :
                 f === "verified" ? `✅ Verificadas (${counts.verified})` :
                 f === "rejected" ? `❌ Rechazadas (${counts.rejected})` :
                 `📋 Todas (${counts.all})`}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={fetchOrders} disabled={loading}>
              {loading ? "Cargando…" : "↻ Refrescar"}
            </Button>
          </div>

          <div className="space-y-3">
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-10">No hay órdenes en esta categoría.</p>
            )}
            {filtered.map((o) => (
              <div key={o.id} className="bg-card border border-border rounded-xl p-4 md:p-5 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => copy(o.order_number)} className="font-mono font-semibold text-foreground hover:text-primary inline-flex items-center gap-1">
                        {o.order_number} <Copy className="w-3.5 h-3.5 opacity-60" />
                      </button>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        o.status === "pending" ? "bg-amber-100 text-amber-800" :
                        o.status === "verified" ? "bg-green-100 text-green-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {o.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleString("es-PE")}
                      </span>
                    </div>
                    <div className="font-semibold">{o.buyer_name}</div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{o.buyer_email}</span>
                      {o.buyer_phone && (
                        <a href={`https://wa.me/${o.buyer_phone.replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-primary">
                          <Phone className="w-3.5 h-3.5" />{o.buyer_phone}
                        </a>
                      )}
                      {o.buyer_country && (
                        <span className="inline-flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{o.buyer_country}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {o.amount_local != null && o.currency_local
                        ? `${o.currency_local} ${Number(o.amount_local).toFixed(2)}`
                        : `USD ${Number(o.amount_usd).toFixed(2)}`}
                    </div>
                    <div className="text-xs text-muted-foreground">USD ${Number(o.amount_usd).toFixed(2)} · {o.method}</div>
                  </div>
                </div>

                {o.items?.length > 0 && (
                  <ul className="text-sm text-muted-foreground border-t border-border pt-2 space-y-0.5">
                    {o.items.map((it, i) => (
                      <li key={i}>• {it.name} × {it.quantity}</li>
                    ))}
                  </ul>
                )}

                <div className="flex flex-wrap gap-2 justify-end pt-1">
                  {o.status !== "verified" && (
                    <Button size="sm" onClick={() => runAction("verify", o.id)}>
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Verificar
                    </Button>
                  )}
                  {o.status !== "rejected" && (
                    <Button size="sm" variant="outline" onClick={() => runAction("reject", o.id)}>
                      <X className="w-4 h-4 mr-1" /> Rechazar
                    </Button>
                  )}
                  {o.status !== "pending" && (
                    <Button size="sm" variant="ghost" onClick={() => runAction("reset", o.id)}>
                      <RotateCcw className="w-4 h-4 mr-1" /> Reabrir
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
};

export default AdminManualPayments;
