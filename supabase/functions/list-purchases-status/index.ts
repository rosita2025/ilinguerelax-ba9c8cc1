// Unified purchases status panel.
// Aggregates Hotmart, Mercado Pago, PayPal and Manual (Yape/Plin) payments
// into a single normalised list with "why blocked" / "failed step" reasons.
import { adminCorsHeaders, assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = adminCorsHeaders;

type Provider = "mercadopago" | "paypal" | "stripe" | "manual" | "hotmart";
type Mapped = "approved" | "pending" | "refused" | "refunded" | "chargeback" | "cancelled" | "blocked" | "unknown";

interface Row {
  id: string;
  provider: Provider;
  received_at: string;
  email: string | null;
  amount: number | null;
  currency: string | null;
  product: string | null;
  transaction: string | null;
  raw_status: string;
  mapped_status: Mapped;
  failure_reason: string | null;   // human readable "why blocked"
  failed_step: string | null;      // which step failed
  payload: unknown;
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
    const take = Math.min(Math.max(Number(limit) || 200, 1), 500);
    const s = typeof search === "string" ? search.trim().toLowerCase() : "";

    const rows: Row[] = [];


    // ─── Mercado Pago (funnel_events) ─────────────────────────────────
    if (!provider || provider === "mercadopago") {
      const { data } = await admin
        .from("funnel_events")
        .select("id, created_at, event_type, event_data, email")
        .like("event_type", "mp_%")
        .or("event_type.eq.mp_approved,event_type.eq.mp_pending,event_type.eq.mp_rejected,event_type.eq.mp_in_process,event_type.eq.mp_refunded,event_type.eq.mp_cancelled,event_type.eq.mp_charged_back,event_type.eq.purchase")
        .order("created_at", { ascending: false })
        .limit(take);
      // Also include event_type=purchase from MP (approved path)
      const { data: purchases } = await admin
        .from("funnel_events")
        .select("id, created_at, event_type, event_data, email")
        .eq("event_type", "purchase")
        .contains("event_data", { provider: "mercadopago" } as any)
        .order("created_at", { ascending: false })
        .limit(take);
      const all = [...(data ?? []), ...(purchases ?? [])];
      const seen = new Set<string>();
      for (const r of all) {
        if (seen.has(r.id)) continue; seen.add(r.id);
        const d: any = r.event_data ?? {};
        const status = d.status ?? (r.event_type === "purchase" ? "approved" : r.event_type.replace(/^mp_/, ""));
        const detail = d.status_detail;
        const { mapped: m, reason } = mapMp(status, detail);
        rows.push({
          id: `mp-${r.id}`, provider: "mercadopago", received_at: r.created_at,
          email: r.email ?? d.payer_email ?? null,
          amount: d.amount ?? d.transaction_amount ?? null,
          currency: d.currency ?? d.currency_id ?? null,
          product: d.product ?? d.description ?? null,
          transaction: d.payment_id ?? d.mp_id ?? null,
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
        const email = resource?.payer?.email_address ?? resource?.payer?.email ?? null;
        const amt = resource?.amount?.value ?? resource?.purchase_units?.[0]?.amount?.value ?? null;
        const cur = resource?.amount?.currency_code ?? resource?.purchase_units?.[0]?.amount?.currency_code ?? null;
        rows.push({
          id: `pp-${r.id}`, provider: "paypal", received_at: r.created_at,
          email, amount: amt ? Number(amt) : null, currency: cur,
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
      const { data } = await admin
        .from("funnel_events")
        .select("id, created_at, event_name, event_data, email, product_id, value, currency, referrer")
        .or("event_data->>provider.eq.stripe,referrer.ilike.%\"provider\":\"stripe\"%")
        .order("created_at", { ascending: false })
        .limit(take);

      for (const r of data ?? []) {
        let d: any = r.event_data ?? {};
        if (Object.keys(d).length === 0 && r.referrer) {
          try { d = JSON.parse(r.referrer); } catch { d = {}; }
        }
        
        const status = d.status || (r.event_name === "Purchase" ? "approved" : "pending");
        let mapped: Mapped = "unknown";
        if (status === "approved" || status === "succeeded") mapped = "approved";
        else if (status === "pending" || status === "processing") mapped = "pending";
        else if (status === "failed" || status === "requires_payment_method") mapped = "refused";
        else if (status === "canceled") mapped = "cancelled";

        rows.push({
          id: `st-${r.id}`, 
          provider: "stripe", 
          received_at: r.created_at,
          email: r.email || d.customer_email || d.email || null,
          amount: r.value || d.amount || null,
          currency: r.currency || d.currency || null,
          product: r.product_id || d.items_summary || d.product_name || null,
          transaction: d.payment_intent_id || d.session_id || d.id || null,
          raw_status: status,
          mapped_status: mapped,
          failure_reason: d.failure_message || d.last_payment_error?.message || null,
          failed_step: r.event_name === "InitiateCheckout" ? "Checkout iniciado (Stripe)" : null,
          payload: d,
        });
      }
    }

    // ─── Hotmart (funnel_events) ───────────────────────────────────────
    if (!provider || provider === "hotmart") {
      const { data } = await admin
        .from("funnel_events")
        .select("id, created_at, event_name, event_data, email, product_id, value, currency, referrer")
        .or("event_name.eq.Purchase,event_name.eq.purchase,event_name.eq.InitiateCheckout")
        .or("event_data->>provider.eq.hotmart,referrer.eq.hotmart-webhook")
        .order("created_at", { ascending: false })
        .limit(take);

      for (const r of data ?? []) {
        const d: any = r.event_data ?? {};
        // Match both 'Purchase' and 'purchase' lowercase
        const isPurchase = r.event_name.toLowerCase() === "purchase";
        const status = d.status || (isPurchase ? "approved" : "pending");
        
        rows.push({
          id: `hm-${r.id}`, 
          provider: "hotmart", 
          received_at: r.created_at,
          email: r.email || d.email || d.buyer_email || null,
          amount: r.value || d.amount || d.value || null,
          currency: r.currency || d.currency || null,
          product: r.product_id || d.product_name || d.name || null,
          transaction: d.transaction || d.transaction_code || d.hottok || null,
          raw_status: status,
          mapped_status: status === "approved" ? "approved" : 
                         (status === "pending" || status === "processing") ? "pending" :
                         (status === "refunded") ? "refunded" : "unknown",
          failure_reason: d.failure_reason || null,
          failed_step: r.event_name === "InitiateCheckout" ? "Checkout iniciado (Hotmart)" : 
                       isPurchase ? "Compra aprobada (Hotmart)" : null,
          payload: d,
        });
      }
    }

    // ─── Manual (Yape/Plin/Binance) se gestionan en /admin/manual-payments ─
    // Excluidos de este dashboard para evitar duplicación.

    // ─── Filter + sort ────────────────────────────────────────────────
    let filtered = rows;
    if (mapped && mapped !== "all") filtered = filtered.filter((r) => r.mapped_status === mapped);
    if (s) filtered = filtered.filter((r) =>
      (r.email ?? "").toLowerCase().includes(s) ||
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
