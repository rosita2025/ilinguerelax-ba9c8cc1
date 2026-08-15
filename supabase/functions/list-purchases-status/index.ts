// Unified purchases status panel.
// Aggregates Hotmart, Mercado Pago, PayPal and Manual (Yape/Plin) payments
// into a single normalised list with "why blocked" / "failed step" reasons.
import { adminCorsHeaders, assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = adminCorsHeaders;

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

// Mercado Pago status_detail → Spanish reason
const MP_REASONS: Record<string, string> = {
  cc_rejected_insufficient_amount: "Tarjeta sin saldo suficiente",
  cc_rejected_bad_filled_card_number: "Número de tarjeta incorrecto",
  cc_rejected_bad_filled_date: "Fecha de expiración incorrecta",
  cc_rejected_bad_filled_security_code: "CVV incorrecto",
  cc_rejected_bad_filled_other: "Datos de tarjeta incorrectos",
  cc_rejected_call_for_authorize: "El banco requiere autorización — cliente debe llamar",
  cc_rejected_card_disabled: "Tarjeta desactivada — cliente debe llamar al banco",
  cc_rejected_duplicated_payment: "Pago duplicado detectado",
  cc_rejected_high_risk: "Bloqueado por sospecha de fraude (alto riesgo)",
  cc_rejected_max_attempts: "Superó el número de intentos permitidos",
  cc_rejected_other_reason: "Rechazado por el banco (motivo no especificado)",
  cc_rejected_card_type_not_allowed: "Tipo de tarjeta no aceptado",
  cc_rejected_blacklist: "Tarjeta en lista negra",
  pending_contingency: "En procesamiento — puede tardar hasta 2 días",
  pending_review_manual: "En revisión manual por Mercado Pago",
  pending_waiting_payment: "Esperando pago (Pago Efectivo / OXXO)",
  accredited: "Acreditado correctamente",
};

// PayPal event → step
const PAYPAL_STEPS: Record<string, { step: string; reason?: string; mapped: Mapped }> = {
  "CHECKOUT.ORDER.APPROVED":       { step: "Orden aprobada, esperando captura", mapped: "pending" },
  "PAYMENT.CAPTURE.COMPLETED":     { step: "Cobrado", mapped: "approved" },
  "PAYMENT.CAPTURE.DENIED":        { step: "Captura rechazada", reason: "El banco denegó la captura del pago", mapped: "refused" },
  "PAYMENT.CAPTURE.PENDING":       { step: "Captura pendiente", reason: "Esperando aprobación de PayPal", mapped: "pending" },
  "PAYMENT.CAPTURE.REFUNDED":      { step: "Reembolsado", mapped: "refunded" },
  "PAYMENT.CAPTURE.REVERSED":      { step: "Revertido (chargeback)", mapped: "chargeback" },
};

function mapManual(status: string): Mapped {
  const s = (status || "").toLowerCase();
  if (s === "approved" || s === "verified") return "approved";
  if (s === "pending") return "pending";
  if (s === "rejected" || s === "refused") return "refused";
  if (s === "cancelled") return "cancelled";
  return "unknown";
}

function mapMp(status: string, statusDetail?: string): { mapped: Mapped; reason: string | null } {
  const s = (status || "").toLowerCase();
  if (s === "approved") return { mapped: "approved", reason: null };
  if (s === "in_process" || s === "pending") return { mapped: "pending", reason: statusDetail ? (MP_REASONS[statusDetail] ?? statusDetail) : null };
  if (s === "rejected") {
    const reason = statusDetail ? (MP_REASONS[statusDetail] ?? statusDetail) : "Rechazado por el banco";
    const blocked = statusDetail?.startsWith("cc_rejected_call_for_authorize") ||
                    statusDetail === "cc_rejected_card_disabled" ||
                    statusDetail === "cc_rejected_high_risk" ||
                    statusDetail === "cc_rejected_blacklist";
    return { mapped: blocked ? "blocked" : "refused", reason };
  }
  if (s === "refunded") return { mapped: "refunded", reason: null };
  if (s === "cancelled") return { mapped: "cancelled", reason: null };
  if (s === "charged_back") return { mapped: "chargeback", reason: null };
  return { mapped: "unknown", reason: null };
}

function mapDlocal(status: string): Mapped {
  const s = (status || "").toUpperCase();
  if (s === "PAID" || s === "SETTLED") return "approved";
  if (s === "PENDING") return "pending";
  if (s === "REJECTED") return "refused";
  if (s === "CANCELLED") return "cancelled";
  if (s === "REFUNDED") return "refunded";
  return "unknown";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const { adminKey, provider, mapped, search, limit } = await req.json().catch(() => ({}));
    const expected = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expected || adminKey !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const take = Math.min(Math.max(Number(limit) || 500, 1), 2000);
    const s = typeof search === "string" ? search.trim().toLowerCase() : "";

    const rows: Row[] = [];

    // ─── Shopify (Physical Orders) ────────────────────────────────────
    if (!provider || provider === "shopify") {
      const { data } = await admin
        .from("shopify_sales")
        .select("id, shopify_order_id, customer_name, country, product_name, order_created_at")
        .order("order_created_at", { ascending: false })
        .limit(take);
      
      for (const r of data ?? []) {
        rows.push({
          id: `sh-${r.id}`,
          provider: "shopify",
          received_at: r.order_created_at,
          email: r.customer_name?.includes("@") ? r.customer_name : null, 
          name: !r.customer_name?.includes("@") ? r.customer_name : null,
          country: r.country || null,
          amount: null,
          currency: "USD",
          product: r.product_name,
          transaction: r.shopify_order_id,
          raw_status: "approved",
          mapped_status: "approved",
          failure_reason: null,
          failed_step: "Orden física recibida",
          payload: r,
        });
      }
    }

    // ─── Mercado Pago (funnel_events) ─────────────────────────────────
    if (!provider || provider === "mercadopago") {
      const { data } = await admin
        .from("funnel_events")
        .select("id, created_at, event_name, referrer, email, name, provider, product_id, value, currency, session_id")
        .or("provider.eq.mercadopago,referrer.ilike.%\"provider\":\"mercadopago\"%,event_name.ilike.mp_%")
        .order("created_at", { ascending: false })
        .limit(take);

      for (const r of data ?? []) {
        let d: any = {};
        try { d = JSON.parse(r.referrer || "{}"); } catch { d = {}; }
        
        const status = d.status ?? (r.event_name.toLowerCase() === "purchase" ? "approved" : r.event_name.toLowerCase().replace(/^mp_/, ""));
        const detail = d.status_detail;
        const { mapped: m, reason } = mapMp(status, detail);
        rows.push({
          id: `mp-${r.id}`, provider: "mercadopago", received_at: r.created_at,
          email: r.email ?? d.payer_email ?? d.customer_email ?? null,
          name: r.name ?? d.payer_name ?? d.customer_name ?? null,
          country: r.country || d.country || d.country_id || null,
          amount: d.amount ?? d.transaction_amount ?? null,
          currency: d.currency ?? d.currency_id ?? null,
          product: d.product ?? d.description ?? d.items_summary ?? null,
          transaction: d.payment_id ?? d.mp_id ?? d.transaction ?? null,
          raw_status: `${status}${detail ? ` · ${detail}` : ""}`,
          mapped_status: m, failure_reason: reason,
          failed_step: m === "pending" ? "Esperando confirmación del banco" :
                       (m === "refused" || m === "blocked") ? "Rechazado en pasarela" : null,
          payload: d,
        });
      }
    }

    // ─── PayPal ───────────────────────────────────────────────────────
    if (!provider || provider === "paypal") {
      const { data } = await admin
        .from("paypal_webhook_events")
        .select("id, event_id, event_type, correlation_id, resource_id, payload, created_at")
        .order("created_at", { ascending: false })
        .limit(take);

      for (const r of data ?? []) {
        const meta = PAYPAL_STEPS[r.event_type] ?? { step: r.event_type, mapped: "unknown" as Mapped };
        const p: any = r.payload ?? {};
        const resource = p?.resource ?? {};
        const payer = resource?.payer ?? {};
        const email = payer?.email_address ?? payer?.email ?? null;
        const name = payer?.name?.given_name ? `${payer.name.given_name} ${payer.name.surname || ""}` : null;
        const amt = resource?.amount?.value ?? resource?.purchase_units?.[0]?.amount?.value ?? null;
        const cur = resource?.amount?.currency_code ?? resource?.purchase_units?.[0]?.amount?.currency_code ?? null;
        rows.push({
          id: `pp-${r.id}`, provider: "paypal", received_at: r.created_at,
          email, name, 
          country: resource?.payer?.address?.country_code || null,
          amount: amt ? Number(amt) : null, currency: cur,
          product: resource?.purchase_units?.[0]?.description ?? null,
          transaction: r.resource_id ?? r.correlation_id,
          raw_status: r.event_type,
          mapped_status: meta.mapped, failure_reason: meta.reason ?? null,
          failed_step: meta.step,
          payload: p,
        });
      }
    }

    // ─── Stripe (funnel_events) ───────────────────────────────────────
    if (!provider || provider === "stripe") {
      const { data: stripeEvents } = await admin
        .from("funnel_events")
        .select("id, created_at, event_name, referrer, email, name, country, product_id, value, currency, provider")
        .or("provider.eq.stripe,referrer.ilike.%\"provider\":\"stripe\"%,event_name.eq.Purchase,event_name.eq.InitiateCheckout,event_name.eq.BeginCheckout")
        .order("created_at", { ascending: false })
        .limit(take);

      const purchaseEmails = new Set((stripeEvents ?? []).filter(r => r.event_name === "Purchase").map(p => p.email).filter(Boolean));

      for (const r of stripeEvents ?? []) {
        let d: any = {};
        try { d = JSON.parse(r.referrer || "{}"); } catch { d = {}; }
        
        const isAbandoned = r.event_name === "InitiateCheckout" || r.event_name === "BeginCheckout";
        if (isAbandoned && r.email && purchaseEmails.has(r.email)) continue;

        const status = d.status || (r.event_name === "Purchase" ? "approved" : isAbandoned ? "abandoned" : "pending");
        let mapped: Mapped = "unknown";
        if (status === "approved" || status === "succeeded") mapped = "approved";
        else if (status === "pending" || status === "processing") mapped = "pending";
        else if (status === "failed" || status === "requires_payment_method") mapped = "refused";
        else if (status === "canceled") mapped = "cancelled";
        else if (status === "abandoned") mapped = "abandoned";

        rows.push({
          id: `st-${r.id}`, 
          provider: "stripe", 
          received_at: r.created_at,
          email: r.email || d.customer_email || d.email || d.payer_email || null,
          name: r.name || d.customer_name || d.name || d.payer_name || null,
          country: r.country || d.customer_country || d.country || null,
          amount: r.value || d.amount || d.transaction_amount || null,
          currency: r.currency || d.currency || d.currency_id || null,
          product: r.product_id || d.items_summary || d.product_name || d.description || null,
          transaction: d.payment_intent_id || d.session_id || d.id || d.payment_id || null,
          raw_status: status,
          mapped_status: mapped,
          failure_reason: d.failure_message || d.last_payment_error?.message || d.status_detail || null,
          failed_step: r.event_name === "InitiateCheckout" ? "Checkout iniciado (Stripe)" : 
                       mapped === "refused" ? "Pago fallido en pasarela" : null,
          payload: d,
        });
      }
    }

    // ─── Hotmart (funnel_events) ───────────────────────────────────────
    if (!provider || provider === "hotmart") {
      const { data } = await admin
        .from("funnel_events")
        .select("id, created_at, event_name, referrer, session_id, product_id, value, currency, provider, email, name, country")
        .or("provider.eq.hotmart,referrer.ilike.%hotmart-webhook%,referrer.ilike.%\"provider\":\"hotmart\"%,event_name.ilike.purchase%,session_id.ilike.HP%,referrer.ilike.%\"hottok\":%,session_id.ilike.%HP1413567978%,referrer.ilike.%HP1413567978%")
        .order("created_at", { ascending: false })
        .limit(take);

      for (const r of data ?? []) {
        let d: any = {};
        try { d = JSON.parse(r.referrer || "{}"); } catch { d = {}; }
        
        const isPurchase = r.event_name.toLowerCase().includes("purchase");
        const status = d.status || (isPurchase ? "approved" : "pending");
        
        rows.push({
          id: `hm-${r.id}`, 
          provider: "hotmart", 
          received_at: r.created_at,
          email: r.email || d.email || d.buyer_email || d.payer_email || null,
          name: r.name || d.name || d.buyer_name || d.payer_name || null,
          country: r.country || d.country || d.buyer_address_country || null,
          amount: r.value || d.amount || d.value || null,
          currency: r.currency || d.currency || null,
          product: r.product_id || d.product_name || d.name || null,
          transaction: r.session_id || d.transaction || d.transaction_code || d.hottok || null,
          raw_status: status,
          mapped_status: (status === "approved" || status === "complete" || status === "succeeded" || status === "Purchase") ? "approved" : 
                         (status === "pending" || status === "processing") ? "pending" :
                         (status === "InitiateCheckout" || status === "abandoned") ? "abandoned" :
                         (status === "refunded") ? "refunded" : 
                         (status === "chargeback") ? "chargeback" :
                         (status === "expired" || status === "canceled" || status === "failed") ? "cancelled" : "unknown",
          failure_reason: d.failure_reason || d.status_detail || null,
          failed_step: r.event_name === "InitiateCheckout" ? "Checkout iniciado (Hotmart)" : 
                       isPurchase ? "Compra (Hotmart)" : null,
          payload: d,
        });
      }
    }

    // ─── dLocal Go (funnel_events) ────────────────────────────────────
    if (!provider || provider === "dlocalgo") {
      const { data } = await admin
        .from("funnel_events")
        .select("id, created_at, event_name, referrer, session_id, product_id, value, currency, provider, email, name, country")
        .or("provider.eq.dlocalgo,referrer.ilike.%\"provider\":\"dlocalgo\"%,event_name.ilike.dlocal_%")
        .order("created_at", { ascending: false })
        .limit(take);

      for (const r of data ?? []) {
        let d: any = {};
        try { d = JSON.parse(r.referrer || "{}"); } catch { d = {}; }
        
        const status = d.status || r.event_name.replace(/^dlocal_/, "").toUpperCase();
        const mapped = mapDlocal(status);
        
        rows.push({
          id: `dl-${r.id}`,
          provider: "dlocalgo",
          received_at: r.created_at,
          email: r.email || d.customer_email || d.email || null,
          name: r.name || d.customer_name || d.payer_name || d.name || null,
          country: r.country || d.country || d.payer_address_country || null,
          amount: d.localAmount || r.value || d.amount || null,
          currency: d.localCurrency || r.currency || d.currency || null,
          product: r.product_id || d.items_summary || d.product_name || null,
          transaction: r.session_id || d.payment_id || d.order_id || null,
          raw_status: status,
          mapped_status: mapped,
          failure_reason: d.detail || d.error_reason || null,
          failed_step: mapped === "pending" ? "Esperando pago en efectivo/transf" : null,
          payload: d,
        });
      }
    }

    // ─── Carritos Abandonados (persistent_carts) ───────────────────────
    if (!provider || provider === "internal_cart") {
      const { data } = await admin
        .from("persistent_carts")
        .select("id, email, buyer, items, country, language, last_activity, converted")
        .eq("converted", false)
        .order("last_activity", { ascending: false })
        .limit(take);
      
      for (const r of data ?? []) {
        const buyer = r.buyer || {};
        const items = Array.isArray(r.items) ? r.items : [];
        const productSummary = items.map((it: any) => it.id).join(", ");
        
        rows.push({
          id: `cart-${r.id}`,
          provider: "internal_cart",
          received_at: r.last_activity,
          email: r.email,
          name: buyer.fullName || buyer.name || null,
          amount: null,
          currency: null,
          product: productSummary || "Carrito vacío",
          transaction: r.cart_token || null,
          raw_status: "abandoned",
          mapped_status: "abandoned",
          failure_reason: null,
          failed_step: "Abandono en checkout interno",
          payload: r,
        });
      }
    }

    // ─── Global Deduplication & Internal Cart Cleanup ──────────────────
    const dedup = new Map<string, Row>();
    const emailToApproved = new Set<string>();

    for (const row of rows) {
      if (row.mapped_status === "approved" && row.email) {
        emailToApproved.add(row.email.toLowerCase());
      }
      
      const key = row.transaction ? `${row.provider}:${row.transaction}` : `${row.provider}:${row.email}:${row.product}`;
      const existing = dedup.get(key);
      
      if (!existing) {
        dedup.set(key, row);
        continue;
      }

      const statusPriority: Record<Mapped, number> = {
        approved: 10, pending: 5, refused: 3, chargeback: 2, refunded: 2,
        blocked: 2, cancelled: 1, abandoned: 0, unknown: 0
      };

      if (statusPriority[row.mapped_status] > statusPriority[existing.mapped_status]) {
        row.is_merged = true;
        dedup.set(key, row);
      } else {
        existing.is_merged = true;
      }
    }

    let filtered = Array.from(dedup.values());
    filtered = filtered.filter(r => {
      if (r.provider === "internal_cart" && r.email && emailToApproved.has(r.email.toLowerCase())) {
        return false;
      }
      return true;
    });

    if (mapped && mapped !== "all") filtered = filtered.filter((r) => r.mapped_status === mapped);
    if (s) filtered = filtered.filter((r) =>
      (r.email ?? "").toLowerCase().includes(s) ||
      (r.name ?? "").toLowerCase().includes(s) ||
      (r.transaction ?? "").toLowerCase().includes(s) ||
      (r.product ?? "").toLowerCase().includes(s));
    
    filtered.sort((a, b) => b.received_at.localeCompare(a.received_at));

    const summary = filtered.reduce((acc: Record<string, number>, r) => {
      acc[r.mapped_status] = (acc[r.mapped_status] ?? 0) + 1;
      acc[`_${r.provider}`] = (acc[`_${r.provider}`] ?? 0) + 1;
      return acc;
    }, {});

    return new Response(JSON.stringify({ rows: filtered.slice(0, take), summary, total: filtered.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("list-purchases-status error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});