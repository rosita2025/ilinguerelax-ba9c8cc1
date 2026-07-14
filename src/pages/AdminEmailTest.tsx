import { useEffect, useMemo, useRef, useState } from "react";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminInvoke } from "@/lib/adminInvoke";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, RefreshCw, Mail, CheckCircle2, XCircle, Gift, PackageCheck, ArrowUpDown, Search, ShieldCheck, ShieldAlert, AlertTriangle, Radio, Send } from "lucide-react";
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
  productLines: ProductLine[];
  amount: string;
  status: string;
  delivery?: {
    status: string | null;
    last_event: string | null;
    last_event_at: string | null;
    message_id: string | null;
  } | null;
}

interface ProductLine {
  sku?: string;
  name: string;
  role: "principal" | "upsell" | "producto";
  bonusCount?: number;
  hasBonus?: boolean;
}

interface ProductMeta {
  sku: string;
  name: string;
  bonusCount: number;
  hasBonus: boolean;
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

const splitSkuText = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean);
  if (typeof value !== "string") return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
};

const bonusCountFrom = (p: any) => {
  const listCount = Array.isArray(p?.bonuses) ? p.bonuses.filter((b: any) => b?.drive_url || b?.name).length : 0;
  return listCount + (p?.bonus_drive_url || p?.bonus_name ? 1 : 0);
};

const buildProductLines = (skus: string[], fallback: string, productMap: Map<string, ProductMeta>): ProductLine[] => {
  if (skus.length > 0) {
    return skus.map((sku, index) => {
      const meta = productMap.get(String(sku));
      return {
        sku: String(sku),
        name: meta?.name || String(sku),
        role: index === 0 ? "principal" : "upsell",
        bonusCount: meta?.bonusCount ?? 0,
        hasBonus: meta?.hasBonus ?? false,
      };
    });
  }
  return fallback && fallback !== "—" ? [{ name: fallback, role: "producto" }] : [];
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

  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<Source | "all">("all");
  const [onlyProblems, setOnlyProblems] = useState(false);
  const [sortKey, setSortKey] = useState<"date" | "order_ref" | "principal_sku" | "upsell_sku">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [liveOn, setLiveOn] = useState(false);
  const [retrying, setRetrying] = useState<Set<string>>(new Set());
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleReload = () => {
    if (reloadTimer.current) clearTimeout(reloadTimer.current);
    reloadTimer.current = setTimeout(() => load(true), 1200);
  };

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
      const productMap = new Map<string, ProductMeta>();
      ((data as any)?.products ?? []).forEach((p: any) => {
        const bonusCount = bonusCountFrom(p);
        if (p?.sku) {
          productMap.set(String(p.sku), {
            sku: String(p.sku),
            name: p.name || String(p.sku),
            bonusCount,
            hasBonus: bonusCount > 0,
          });
        }
      });

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
        const skus = Array.isArray(r.items) ? r.items.map((i: any) => i?.sku || i?.id).filter(Boolean) : [];
        const products = (Array.isArray(r.items) ? r.items.map((i: any) => i?.name).filter(Boolean).join(", ") : "") || "—";
        merged.push({
          id: `m-${r.id}`,
          source: "manual",
          created_at: r.created_at,
          order_ref: r.order_number,
          customer: r.buyer_name || "—",
          email: r.buyer_email,
          products,
          productLines: buildProductLines(skus, products, productMap),
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
        const skus = splitSkuText(meta.skus || d?.skus);
        const products = meta.items_summary || r.product_id || "—";
        merged.push({
          id: `f-${r.id}`,
          source: src,
          created_at: r.created_at,
          order_ref: String(orderRef || "—"),
          customer: meta.customer_name || "—",
          email: email || "—",
          products,
          productLines: buildProductLines(skus, products, productMap),
          amount: `${r.currency || ""} ${Number(r.value ?? 0).toFixed(2)}`.trim(),
          status,
          delivery: d ? { status: d.status, last_event: d.last_event, last_event_at: d.last_event_at, message_id: d.message_id } : null,
        });
        perSource[src]++;
      });

      const matchedDigitalOrders = new Set(
        merged
          .filter((m) => !!m.delivery?.message_id)
          .map((m) => m.order_ref.toLowerCase()),
      );
      (digitalRes.data ?? []).forEach((r: any) => {
        const e = (r.customer_email || "").toLowerCase();
        const orderKey = (r.order_id || "").toLowerCase();
        if (orderKey && matchedDigitalOrders.has(orderKey)) return;
        const src = providerToSource(r.provider);
        const skus = Array.isArray(r.skus) ? r.skus : [];
        const products = skus.map((s: string) => productMap.get(s)?.name || s).join(", ") || "—";
        const amountStr = r.amount != null
          ? `${(r.currency || "USD").toUpperCase()} ${Number(r.amount).toFixed(2)}`
          : "—";
        merged.push({
          id: `d-${r.id}`,
          source: src,
          created_at: r.created_at,
          order_ref: r.order_id || "—",
          customer: r.customer_name || "—",
          email: r.customer_email,
          products,
          productLines: buildProductLines(skus, products, productMap),
          amount: amountStr,
          status: r.status || "—",
          delivery: { status: r.status, last_event: r.last_event, last_event_at: r.last_event_at, message_id: r.message_id },
        });
        perSource[src]++;
      });

      merged.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      setRows(merged);
      setCounts(perSource);
      setLastUpdated(new Date());
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ rows: merged, counts: perSource })); } catch {}
    } catch (e) {
      if (!silent) toast.error((e as Error).message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!adminKey) return;
    load(rows.length > 0);
    const t = setInterval(() => load(true), 15000);

    // Realtime: recompute validación cuando llega/actualiza un envío digital,
    // un evento del funnel (webhook Stripe/PayPal/MP) o un pago manual.
    const ch = supabase
      .channel("admin-orders-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "digital_email_sends" }, () => { setLiveOn(true); scheduleReload(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "email_send_log" }, () => { setLiveOn(true); scheduleReload(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "funnel_events" }, () => { setLiveOn(true); scheduleReload(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "manual_payments" }, () => { setLiveOn(true); scheduleReload(); })
      .subscribe((status) => setLiveOn(status === "SUBSCRIBED"));

    // Focus / visibility → refresh inmediato (por si el usuario vuelve tras un webhook tardío)
    const onFocus = () => load(true);
    const onVis = () => { if (document.visibilityState === "visible") load(true); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      clearInterval(t);
      if (reloadTimer.current) clearTimeout(reloadTimer.current);
      supabase.removeChannel(ch);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey]);

  const retryDelivery = async (r: OrderRow) => {
    if (!r.email || r.email === "—") { toast.error("Falta email del cliente"); return; }
    const skus = r.productLines.map((p) => p.sku).filter(Boolean) as string[];
    if (skus.length === 0) { toast.error("Sin SKUs en la orden"); return; }
    setRetrying((prev) => new Set(prev).add(r.id));
    try {
      const { error } = await supabase.functions.invoke("send-digital-ilinguerelax", {
        body: {
          customerEmail: r.email,
          customerName: r.customer !== "—" ? r.customer : undefined,
          orderId: r.order_ref,
          skus,
          provider: r.source,
          force: true,
        },
      });
      if (error) throw error;
      toast.success("Reenvío disparado — la validación se actualizará en unos segundos");
      scheduleReload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRetrying((prev) => { const n = new Set(prev); n.delete(r.id); return n; });
    }
  };


  const statusColor = (s: string) => {
    const v = s.toLowerCase();
    if (["paid", "verified", "approved", "delivered", "sent", "opened"].includes(v)) return "bg-emerald-100 text-emerald-800";
    if (["pending", "processing"].includes(v)) return "bg-amber-100 text-amber-800";
    if (["failed", "rejected", "dlq", "bounced", "error"].includes(v)) return "bg-red-100 text-red-800";
    return "bg-muted text-muted-foreground";
  };

  const renderProducts = (r: OrderRow) => {
    if (!r.productLines.length) return <span className="text-muted-foreground">{r.products || "—"}</span>;
    return (
      <div className="space-y-2 min-w-[320px]">
        {r.productLines.map((p, index) => (
          <div key={`${r.id}-${p.sku || p.name}-${index}`} className="rounded-md border bg-card p-2">
            <div className="flex items-start gap-2">
              <PackageCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold leading-snug">{p.name}</div>
                {p.sku && <div className="font-mono text-[11px] text-muted-foreground break-all mt-0.5">SKU: {p.sku}</div>}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-medium capitalize">{p.role}</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-[11px] font-medium">
                    <Gift className="w-3 h-3" /> {p.hasBonus ? `Bono incluido (${p.bonusCount})` : "Sin bono extra"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const principalSkuOf = (r: OrderRow) => r.productLines.find((p) => p.role === "principal")?.sku || "";
  const upsellSkusOf = (r: OrderRow) =>
    r.productLines.filter((p) => p.role === "upsell").map((p) => p.sku || p.name).join(", ");

  const isPaid = (r: OrderRow) => {
    const v = (r.status || "").toLowerCase();
    return ["paid", "verified", "approved", "delivered", "sent", "opened", "completed", "succeeded"].includes(v);
  };
  const validateRow = (r: OrderRow) => {
    const hasSkus = r.productLines.some((p) => !!p.sku);
    const emailSent = !!(r.delivery?.message_id) || ["sent", "delivered", "opened"].includes((r.delivery?.status || "").toLowerCase());
    const shouldDeliver = isPaid(r);
    const ok = hasSkus && (!shouldDeliver || emailSent);
    return { hasSkus, emailSent, shouldDeliver, ok };
  };
  const problemCount = useMemo(() => rows.filter((r) => !validateRow(r).ok).length, [rows]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "date" ? "desc" : "asc"); }
  };

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows.filter((r) => {
      if (sourceFilter !== "all" && r.source !== sourceFilter) return false;
      if (onlyProblems && validateRow(r).ok) return false;
      if (!q) return true;
      return (
        r.order_ref.toLowerCase().includes(q) ||
        principalSkuOf(r).toLowerCase().includes(q) ||
        upsellSkusOf(r).toLowerCase().includes(q) ||
        r.productLines.some((p) => (p.sku || "").toLowerCase().includes(q) || p.name.toLowerCase().includes(q)) ||
        r.email.toLowerCase().includes(q) ||
        r.customer.toLowerCase().includes(q)
      );
    });
    const dir = sortDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      let av = "", bv = "";
      if (sortKey === "date") return (a.created_at < b.created_at ? 1 : -1) * dir;
      if (sortKey === "order_ref") { av = a.order_ref; bv = b.order_ref; }
      if (sortKey === "principal_sku") { av = principalSkuOf(a); bv = principalSkuOf(b); }
      if (sortKey === "upsell_sku") { av = upsellSkusOf(a); bv = upsellSkusOf(b); }
      return av.localeCompare(bv) * dir;
    });
    return list;
  }, [rows, query, sourceFilter, sortKey, sortDir, onlyProblems]);


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
              <Card
                key={s}
                className={`p-4 cursor-pointer transition ${sourceFilter === s ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSourceFilter(sourceFilter === s ? "all" : s)}
              >
                <div className="text-xs text-muted-foreground">{sourceLabel[s]}</div>
                <div className="text-2xl font-bold mt-1">{counts[s]}</div>
              </Card>
            ))}
          </div>

          <Card className="p-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por orden, SKU principal, SKU upsell, cliente o correo…"
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "manual", "stripe", "paypal", "mercadopago", "digital"] as const).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={sourceFilter === s ? "default" : "outline"}
                  onClick={() => setSourceFilter(s)}
                >
                  {s === "all" ? "Todos" : sourceLabel[s as Source]}
                </Button>
              ))}
              <Button
                size="sm"
                variant={onlyProblems ? "destructive" : "outline"}
                onClick={() => setOnlyProblems((v) => !v)}
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                Con problemas ({problemCount})
              </Button>
            </div>
            <div className="text-xs text-muted-foreground ml-auto">
              {visibleRows.length} de {rows.length} pedidos
            </div>
          </Card>

          <Card className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground border-b">
                  <tr>
                    <th className="text-left py-2 pr-4">
                      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("order_ref")}>
                        Orden <ArrowUpDown className="w-3 h-3" />
                        {sortKey === "order_ref" && <span className="text-[10px]">{sortDir}</span>}
                      </button>
                    </th>
                    <th className="text-left py-2 pr-4">
                      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("principal_sku")}>
                        SKU principal <ArrowUpDown className="w-3 h-3" />
                        {sortKey === "principal_sku" && <span className="text-[10px]">{sortDir}</span>}
                      </button>
                    </th>
                    <th className="text-left py-2 pr-4">
                      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("upsell_sku")}>
                        SKU upsell / bono <ArrowUpDown className="w-3 h-3" />
                        {sortKey === "upsell_sku" && <span className="text-[10px]">{sortDir}</span>}
                      </button>
                    </th>
                    <th className="text-left py-2 pr-4">Detalle producto</th>
                    <th className="text-left py-2 pr-3">Validación</th>
                    <th className="text-left py-2 pr-3">Entrega digital</th>
                    <th className="text-left py-2 pr-3">Estado pago</th>
                    <th className="text-left py-2 pr-3">Origen</th>
                    <th className="text-left py-2 pr-3">Cliente</th>
                    <th className="text-left py-2 pr-3">Email</th>
                    <th className="text-left py-2 pr-3">Monto</th>
                    <th className="text-left py-2">
                      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("date")}>
                        Fecha <ArrowUpDown className="w-3 h-3" />
                        {sortKey === "date" && <span className="text-[10px]">{sortDir}</span>}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((r) => {
                    const pSku = principalSkuOf(r);
                    const uSku = upsellSkusOf(r);
                    const v = validateRow(r);
                    return (
                    <tr key={r.id} className="border-b last:border-0 align-top">
                      <td className="py-3 pr-4 font-mono text-sm font-bold whitespace-nowrap">{r.order_ref}</td>
                      <td className="py-3 pr-4 font-mono text-xs whitespace-nowrap">
                        {pSku ? <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">{pSku}</span> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs">
                        {uSku ? <span className="px-2 py-0.5 rounded bg-accent/10 text-accent-foreground">{uSku}</span> : <span className="text-muted-foreground">sin upsell</span>}
                      </td>
                      <td className="py-3 pr-4 text-xs">{renderProducts(r)}</td>
                      <td className="py-3 pr-3">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${v.ok ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                            {v.ok ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                            {v.ok ? "OK" : "Revisar"}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[11px] ${v.hasSkus ? "text-emerald-700" : "text-red-700"}`}>
                            {v.hasSkus ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />} SKUs
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[11px] ${v.emailSent ? "text-emerald-700" : v.shouldDeliver ? "text-red-700" : "text-muted-foreground"}`}>
                            {v.emailSent ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />} Email {v.shouldDeliver ? "" : "(pago pendiente)"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-xs">
                        {r.delivery ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1">
                              <Mail className="w-3 h-3 text-primary" />
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${statusColor(r.delivery.status || "")}`}>
                                {r.delivery.last_event || r.delivery.status || "—"}
                              </span>
                              {r.delivery.message_id ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-muted-foreground" />}
                            </span>
                            <div className="text-[11px] text-muted-foreground">{fmt(r.delivery.last_event_at)}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">pendiente / sin envío</span>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sourceColor[r.source]}`}>
                          {sourceLabel[r.source]}
                        </span>
                      </td>
                      <td className="py-3 pr-3">{r.customer}</td>
                      <td className="py-3 pr-3 text-xs">{r.email}</td>
                      <td className="py-3 pr-3 text-xs whitespace-nowrap">{r.amount}</td>
                      <td className="py-3 whitespace-nowrap text-xs">{fmt(r.created_at)}</td>
                    </tr>
                    );
                  })}
                  {visibleRows.length === 0 && (
                    <tr>
                      <td colSpan={12} className="py-10 text-center text-muted-foreground">
                        {loading ? "Cargando pedidos…" : rows.length === 0 ? "Aún no hay pedidos registrados en ninguna fuente." : "Sin resultados para el filtro actual."}
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
