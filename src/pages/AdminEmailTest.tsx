import { useEffect, useState } from "react";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { adminInvoke } from "@/lib/adminInvoke";
import { ShoppingBag, RefreshCw, Mail, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

type Source = "manual" | "stripe" | "paypal" | "mercadopago" | "digital";

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
  stripe: "Stripe",
  paypal: "PayPal",
  mercadopago: "Mercado Pago",
  digital: "Digital",
};

const sourceColor: Record<Source, string> = {
  manual: "bg-amber-100 text-amber-800",
  stripe: "bg-indigo-100 text-indigo-800",
  paypal: "bg-sky-100 text-sky-800",
  mercadopago: "bg-cyan-100 text-cyan-800",
  digital: "bg-blue-100 text-blue-800",
};

const providerToSource = (p?: string | null): Source => {
  const v = (p || "").toLowerCase();
  if (v.includes("stripe")) return "stripe";
  if (v.includes("paypal")) return "paypal";
  if (v.includes("mercado") || v === "mp") return "mercadopago";
  return "digital";
};

const CACHE_KEY = "admin-orders-cache-v1";

const AdminEmailTest = () => {
  const { adminKey } = useAdminKey();
  const [rows, setRows] = useState<OrderRow[]>(() => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) return JSON.parse(raw).rows || [];
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<Record<Source, number>>(() => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) return JSON.parse(raw).counts || { manual: 0, stripe: 0, paypal: 0, mercadopago: 0, digital: 0 };
    } catch {}
    return { manual: 0, stripe: 0, paypal: 0, mercadopago: 0, digital: 0 };
  });

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data, error } = await adminInvoke("list-admin-orders", {
        body: { adminKey },
      });
      if (error) throw error;
      const manualRes = { data: (data as any)?.manual ?? [] };
      const digitalRes = { data: (data as any)?.digital ?? [] };
      const funnelRes = { data: (data as any)?.funnel ?? [] };

      const digitalByEmail = new Map<string, any>();
      const digitalByOrder = new Map<string, any>();
      (digitalRes.data ?? []).forEach((d: any) => {
        const k = (d.customer_email || "").toLowerCase();
        if (!digitalByEmail.has(k)) digitalByEmail.set(k, d);
        const orderKey = (d.order_id || "").toLowerCase();
        if (orderKey && !digitalByOrder.has(orderKey)) digitalByOrder.set(orderKey, d);
      });

      const merged: OrderRow[] = [];
      const perSource: Record<Source, number> = { manual: 0, stripe: 0, paypal: 0, mercadopago: 0, digital: 0 };

      (manualRes.data ?? []).forEach((r: any) => {
        const d = digitalByOrder.get((r.order_number || "").toLowerCase()) || digitalByEmail.get((r.buyer_email || "").toLowerCase()) || null;
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
        perSource.manual++;
      });

      const matchedOrderRefs = new Set(merged.map((m) => m.order_ref.toLowerCase()).filter(Boolean));

      (funnelRes.data ?? []).forEach((r: any) => {
        let meta: any = {};
        try { meta = r.referrer ? JSON.parse(r.referrer) : {}; } catch { meta = {}; }
        const src = providerToSource(meta.provider || r.referrer || "");
        if (src !== "stripe" && src !== "mercadopago" && src !== "paypal") return;
        const orderRef = meta.external_reference || meta.payment_id || r.session_id || r.id;
        if (matchedOrderRefs.has(String(orderRef).toLowerCase())) return;
        const email = (meta.payer_email || meta.customer_email || "").toLowerCase();
        const d = digitalByOrder.get(String(orderRef).toLowerCase()) || (email ? digitalByEmail.get(email) : null) || null;
        const status = r.event_name === "purchase" || r.event_name === "Purchase" ? "approved" : String(meta.status || r.event_name || "pending").replace(/^mp_/, "");
        merged.push({
          id: `f-${r.id}`,
          source: src,
          created_at: r.created_at,
          order_ref: String(orderRef || "—"),
          customer: meta.customer_name || "—",
          email: email || "—",
          products: r.product_id || meta.items_summary || "—",
          amount: `${r.currency || ""} ${Number(r.value ?? 0).toFixed(2)}`.trim(),
          status,
          delivery: d ? { status: d.status, last_event: d.last_event, last_event_at: d.last_event_at, message_id: d.message_id } : null,
        });
        perSource[src]++;
      });

      const matchedEmails = new Set(merged.map((m) => m.email.toLowerCase()));
      (digitalRes.data ?? []).forEach((r: any) => {
        const e = (r.customer_email || "").toLowerCase();
        if (matchedEmails.has(e)) return;
        const src = providerToSource(r.provider);
        merged.push({
          id: `d-${r.id}`,
          source: src,
          created_at: r.created_at,
          order_ref: r.order_id || "—",
          customer: "—",
          email: r.customer_email,
          products: (r.skus || []).join(", ") || "—",
          amount: "—",
          status: r.status || "—",
          delivery: { status: r.status, last_event: r.last_event, last_event_at: r.last_event_at, message_id: r.message_id },
        });
        perSource[src]++;
      });

      merged.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      setRows(merged);
      setCounts(perSource);
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ rows: merged, counts: perSource })); } catch {}
    } catch (e) {
      if (!silent) toast.error((e as Error).message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!adminKey) return;
    // Silent background refresh so cached data shows instantly
    load(rows.length > 0);
    const t = setInterval(() => load(true), 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey]);

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
                Vista unificada: Yape/Plin, Stripe, PayPal y Mercado Pago. Actualiza cada 30s.
              </p>
            </div>
            <Button variant="outline" onClick={() => load(false)} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refrescar
            </Button>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(["manual", "stripe", "paypal", "mercadopago", "digital"] as Source[]).map((s) => (
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
