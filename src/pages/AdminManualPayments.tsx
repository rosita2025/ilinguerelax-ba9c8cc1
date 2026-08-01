import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, X, RotateCcw, Copy, Wallet, Mail, Phone, Globe, Pencil, Save, Receipt, Hash, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminInvoke } from "@/lib/adminInvoke";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminNav from "@/components/admin/AdminNav";
import { extractPaymentReference, methodLabel } from "@/lib/paymentReference";

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
  payment_reference?: string | null;
  payment_reference_source?: string | null;
  payment_reference_at?: string | null;
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
  // Comprobante / ID de operación del banco por pedido
  const [refDraft, setRefDraft] = useState<Record<string, string>>({});
  const [refSource, setRefSource] = useState<Record<string, string>>({});
  const [savingRef, setSavingRef] = useState<string | null>(null);

  // Detecta automáticamente el N° de operación desde el texto pegado del banco
  const onRefChange = (id: string, value: string) => {
    setRefDraft((d) => ({ ...d, [id]: value }));
    const hit = extractPaymentReference(value);
    setRefSource((s) => ({ ...s, [id]: hit?.source ?? "" }));
  };

  const autoDetect = (id: string) => {
    const hit = extractPaymentReference(refDraft[id] ?? "");
    if (!hit) {
      toast({ title: "No se detectó un ID de pago", description: "Pega el mensaje o voucher del banco.", variant: "destructive" });
      return;
    }
    setRefDraft((d) => ({ ...d, [id]: hit.reference }));
    setRefSource((s) => ({ ...s, [id]: hit.source }));
    toast({ title: `🔎 ID detectado (${hit.source})`, description: hit.reference });
  };

  const saveReference = async (o: ManualPayment) => {
    const raw = (refDraft[o.id] ?? "").trim();
    const hit = raw ? extractPaymentReference(raw) : null;
    const reference = hit?.reference ?? raw;
    setSavingRef(o.id);
    try {
      const { error } = await adminInvoke("manage-manual-payments", {
        body: {
          action: "set_reference",
          orderId: o.id,
          adminKey,
          paymentReference: reference,
          paymentReferenceSource: refSource[o.id] || hit?.source || "Manual",
        },
      });
      if (error) throw error;
      toast({ title: reference ? "🧾 Comprobante guardado" : "Comprobante borrado" });
      setRefDraft((d) => ({ ...d, [o.id]: "" }));
      fetchOrders();
    } catch (e) {
      toast({ title: "Error al guardar comprobante", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSavingRef(null);
    }
  };



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
      const list = ((data as { orders?: ManualPayment[] } | null)?.orders) ?? [];
      // Ensure newest orders always appear on top (Shopify-style)
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOrders(list);
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
    // Realtime: new manual payments appear instantly at the top (Shopify-style)
    const channel = supabase
      .channel("admin-manual-payments")
      .on("postgres_changes", { event: "*", schema: "public", table: "manual_payments" }, () => {
        void fetchOrders();
      })
      .subscribe();
    return () => {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
      supabase.removeChannel(channel);
    };
    /* eslint-disable-next-line */
  }, [adminKey]);


  const runAction = async (action: "verify" | "reject" | "reset", orderId: string) => {
    try {
      // Al verificar, adjunta el comprobante escrito (si el admin lo dejó sin guardar)
      const draft = (refDraft[orderId] ?? "").trim();
      const hit = action === "verify" && draft ? extractPaymentReference(draft) : null;
      const { error } = await adminInvoke("manage-manual-payments", {
        body: {
          action,
          orderId,
          adminKey,
          ...(hit ? { paymentReference: hit.reference, paymentReferenceSource: hit.source } : {}),
        },
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
                    {editingId === o.id ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 max-w-lg">
                        <Input value={editData.name} onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))} placeholder="Nombre" />
                        <Input type="email" value={editData.email} onChange={(e) => setEditData((d) => ({ ...d, email: e.target.value }))} placeholder="Correo" />
                        <Input value={editData.phone} onChange={(e) => setEditData((d) => ({ ...d, phone: e.target.value }))} placeholder="Teléfono" />
                        <Input value={editData.country} onChange={(e) => setEditData((d) => ({ ...d, country: e.target.value }))} placeholder="País" />
                        <div className="flex gap-2 sm:col-span-2">
                          <Button size="sm" onClick={saveEdit} disabled={savingEdit}>
                            <Save className="w-4 h-4 mr-1" /> {savingEdit ? "Guardando…" : "Guardar"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button>
                        </div>
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {o.amount_local != null && o.currency_local
                        ? `${o.currency_local} ${Number(o.amount_local).toFixed(2)}`
                        : `USD ${Number(o.amount_usd).toFixed(2)}`}
                    </div>
                    {o.amount_local != null && o.currency_local && (
                      <div className="text-xs text-muted-foreground">≈ USD {Number(o.amount_usd).toFixed(2)}</div>
                    )}
                    <div className="text-xs font-medium text-foreground mt-0.5">{methodLabel(o.method)}</div>
                  </div>
                </div>

                {o.items?.length > 0 && (
                  <ul className="text-sm text-muted-foreground border-t border-border pt-2 space-y-0.5">
                    {o.items.map((it, i) => (
                      <li key={i}>• {it.name} × {it.quantity}</li>
                    ))}
                  </ul>
                )}

                {/* Comprobante / ID de operación del banco */}
                <div className="border-t border-border pt-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Hash className="w-3.5 h-3.5" /> Pedido:
                    </span>
                    <button onClick={() => copy(o.order_number)} className="font-mono font-semibold hover:text-primary">
                      {o.order_number}
                    </button>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Wallet className="w-3.5 h-3.5" /> {methodLabel(o.method)}
                    </span>
                    {o.payment_reference ? (
                      <button
                        onClick={() => copy(o.payment_reference!)}
                        className="inline-flex items-center gap-1 font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                        title={o.payment_reference_at ? new Date(o.payment_reference_at).toLocaleString("es-PE") : undefined}
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        {o.payment_reference}
                        {o.payment_reference_source ? ` · ${o.payment_reference_source}` : ""}
                        <Copy className="w-3 h-3 opacity-60" />
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        <Receipt className="w-3.5 h-3.5" /> Sin comprobante
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      value={refDraft[o.id] ?? ""}
                      onChange={(e) => onRefChange(o.id, e.target.value)}
                      placeholder="Pega el voucher o N° de operación (Interbank, BCP, SPEI, Yape, Binance…)"
                      className="flex-1"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => autoDetect(o.id)} disabled={!((refDraft[o.id] ?? "").trim())}>
                        <Sparkles className="w-4 h-4 mr-1" /> Detectar ID
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => saveReference(o)} disabled={savingRef === o.id}>
                        <Save className="w-4 h-4 mr-1" /> {savingRef === o.id ? "Guardando…" : "Guardar"}
                      </Button>
                    </div>
                  </div>
                  {refSource[o.id] && (
                    <p className="text-xs text-muted-foreground">Origen detectado: <strong>{refSource[o.id]}</strong></p>
                  )}
                </div>


                <div className="flex flex-wrap gap-2 justify-end pt-1">
                  {editingId !== o.id && (
                    <Button size="sm" variant="secondary" onClick={() => startEdit(o)}>
                      <Pencil className="w-4 h-4 mr-1" /> Editar datos
                    </Button>
                  )}
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
