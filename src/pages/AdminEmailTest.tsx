import { useEffect, useState } from "react";
import AdminNav from "@/components/admin/AdminNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, RefreshCw, Mail, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

type Source = "manual" | "shopify" | "hotmart" | "digital";

interface OrderRow {
  id: string;
  source: Source;
  created_at: string;
  order_ref: string;
  customer: string;
  email: string;
  products: string;
  amount: string;
  status: string;
  delivery?: {
    status: string | null;
    last_event: string | null;
    last_event_at: string | null;
    message_id: string | null;
  } | null;
}

const fmt = (iso: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
};

const sourceLabel: Record<Source, string> = {
  manual: "Yape/Plin",
  shopify: "Shopify",
  hotmart: "Hotmart",
  digital: "Digital (email)",
};

const sourceColor: Record<Source, string> = {
  manual: "bg-amber-100 text-amber-800",
  shopify: "bg-emerald-100 text-emerald-800",
  hotmart: "bg-orange-100 text-orange-800",
  digital: "bg-blue-100 text-blue-800",
};

const AdminEmailTest = () => {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({ manual: 0, shopify: 0, hotmart: 0, digital: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const [manualRes, shopifyRes, hotmartRes, digitalRes] = await Promise.all([
        supabase.from("manual_payments").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("shopify_sales").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("hotmart_purchases").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("digital_email_sends").select("*").order("created_at", { ascending: false }).limit(100),
      ]);

      const digitalByEmail = new Map<string, any>();
      (digitalRes.data ?? []).forEach((d: any) => {
        const k = (d.customer_email || "").toLowerCase();
        if (!digitalByEmail.has(k)) digitalByEmail.set(k, d);
      });

      const merged: OrderRow[] = [];

      (manualRes.data ?? []).forEach((r: any) => {
        const d = digitalByEmail.get((r.buyer_email || "").toLowerCase()) || null;
        merged.push({
          id: `m-${r.id}`,
          source: "manual",
          created_at: r.created_at,
          order_ref: r.order_number,
          customer: r.buyer_name || "—",
          email: r.buyer_email,
          products: (Array.isArray(r.items) ? r.items.map((i: any) => i?.name).filter(Boolean).join(", ") : "") || "—",
          amount: `${r.currency_local || "USD"} ${Number(r.amount_local ?? r.amount_usd ?? 0).toFixed(2)}`,
          status: r.status || "pending",
          delivery: d ? { status: d.status, last_event: d.last_event, last_event_at: d.last_event_at, message_id: d.message_id } : null,
        });
      });

      (shopifyRes.data ?? []).forEach((r: any) => {
        merged.push({
          id: `s-${r.id}`,
          source: "shopify",
          created_at: r.created_at,
          order_ref: r.shopify_order_id || "—",
          customer: r.customer_name || "—",
          email: "—",
          products: r.product_name || "—",
          amount: "—",
          status: "paid",
        });
      });

      (hotmartRes.data ?? []).forEach((r: any) => {
        const d = digitalByEmail.get((r.email || "").toLowerCase()) || null;
        merged.push({
          id: `h-${r.id}`,
          source: "hotmart",
          created_at: r.created_at,
          order_ref: r.transaction_code || "—",
          customer: "—",
          email: r.email,
          products: r.product_id || r.product_code || "—",
          amount: "—",
          status: r.status || "—",
          delivery: d ? { status: d.status, last_event: d.last_event, last_event_at: d.last_event_at, message_id: d.message_id } : null,
        });
      });

      // Digital sends not matched to any order (Stripe/PayPal direct sends)
      const matchedEmails = new Set(merged.map((m) => m.email.toLowerCase()));
      (digitalRes.data ?? []).forEach((r: any) => {
        const e = (r.customer_email || "").toLowerCase();
        if (matchedEmails.has(e)) return;
        merged.push({
          id: `d-${r.id}`,
          source: "digital",
          created_at: r.created_at,
          order_ref: r.order_id || "—",
          customer: "—",
          email: r.customer_email,
          products: (r.skus || []).join(", ") || "—",
          amount: "—",
          status: r.status || "—",
          delivery: { status: r.status, last_event: r.last_event, last_event_at: r.last_event_at, message_id: r.message_id },
        });
      });

      merged.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      setRows(merged);
      setCounts({
        manual: manualRes.data?.length ?? 0,
        shopify: shopifyRes.data?.length ?? 0,
        hotmart: hotmartRes.data?.length ?? 0,
        digital: digitalRes.data?.length ?? 0,
      });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const statusColor = (s: string) => {
    const v = s.toLowerCase();
    if (["paid", "verified", "approved", "delivered", "sent", "opened"].includes(v)) return "bg-emerald-100 text-emerald-800";
    if (["pending", "processing"].includes(v)) return "bg-amber-100 text-amber-800";
    if (["failed", "rejected", "dlq", "bounced", "error"].includes(v)) return "bg-red-100 text-red-800";
    return "bg-muted text-muted-foreground";
  };

  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background py-10 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <header className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <ShoppingBag className="w-7 h-7 text-primary" /> Pedidos de clientes
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Vista unificada: Yape/Plin, Shopify, Hotmart y entregas digitales (Stripe/PayPal). Actualiza cada 30s.
              </p>
            </div>
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refrescar
            </Button>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["manual", "shopify", "hotmart", "digital"] as Source[]).map((s) => (
              <Card key={s} className="p-4">
                <div className="text-xs text-muted-foreground">{sourceLabel[s]}</div>
                <div className="text-2xl font-bold mt-1">{counts[s]}</div>
              </Card>
            ))}
          </div>

          <Card className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground border-b">
                  <tr>
                    <th className="text-left py-2 pr-3">Fecha</th>
                    <th className="text-left py-2 pr-3">Origen</th>
                    <th className="text-left py-2 pr-3">Orden</th>
                    <th className="text-left py-2 pr-3">Cliente</th>
                    <th className="text-left py-2 pr-3">Email</th>
                    <th className="text-left py-2 pr-3">Productos</th>
                    <th className="text-left py-2 pr-3">Monto</th>
                    <th className="text-left py-2 pr-3">Estado</th>
                    <th className="text-left py-2">Correo entrega</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 align-top">
                      <td className="py-2 pr-3 whitespace-nowrap text-xs">{fmt(r.created_at)}</td>
                      <td className="py-2 pr-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sourceColor[r.source]}`}>
                          {sourceLabel[r.source]}
                        </span>
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs">{r.order_ref}</td>
                      <td className="py-2 pr-3">{r.customer}</td>
                      <td className="py-2 pr-3 text-xs">{r.email}</td>
                      <td className="py-2 pr-3 text-xs max-w-[240px]">{r.products}</td>
                      <td className="py-2 pr-3 text-xs whitespace-nowrap">{r.amount}</td>
                      <td className="py-2 pr-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2 text-xs">
                        {r.delivery ? (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="w-3 h-3 text-primary" />
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${statusColor(r.delivery.status || "")}`}>
                              {r.delivery.last_event || r.delivery.status || "—"}
                            </span>
                            {r.delivery.message_id ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-muted-foreground" />}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">sin envío</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-muted-foreground">
                        {loading ? "Cargando pedidos…" : "Aún no hay pedidos registrados en ninguna fuente."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
};

export default AdminEmailTest;
