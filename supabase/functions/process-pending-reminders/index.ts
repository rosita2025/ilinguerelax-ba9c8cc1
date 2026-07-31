// Recordatorios de "pago pendiente" para la tienda online.
//
// Qué resuelve:
//  · Cuando el cliente elige transferencia, efectivo o billetera digital (dLocal,
//    Mercado Pago, Yape/Plin, Binance, SPEI) el pedido queda PENDIENTE. Antes solo
//    el admin recibía el aviso y el cliente se olvidaba de pagar.
//  · Esta tarea inscribe esos pedidos y les envía recordatorios en los
//    días 1, 3, 7, 10 y 15 mientras sigan sin pagar.
//  · La secuencia se DETIENE automáticamente cuando el pago se acredita
//    (webhook del proveedor) o cuando el admin lo acepta manualmente
//    ("yo acepto"), y también si el pedido se rechaza/abandona.
//
// Seguridad: solo llamadas internas (service role o CRON_SHARED_SECRET).
import { createClient } from "npm:@supabase/supabase-js@2";
import { assertInternalCall, internalCors } from "../_shared/internalAuth.ts";

const cors = internalCors;
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

/** Días del recordatorio, en orden. */
const STEP_DAYS = [1, 3, 7, 10, 15] as const;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Solo miramos pedidos recientes: nada más viejo que 20 días entra a la secuencia. */
const ENROLL_WINDOW_MS = 20 * DAY_MS;

type Reminder = {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string | null;
  provider: string;
  method: string | null;
  amount: number | null;
  currency: string;
  product_name: string | null;
  order_created_at: string;
  step: number;
};

function admin() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

/** Inscribe pedidos pendientes nuevos (tienda manual + pasarelas). */
async function enroll(supabase: ReturnType<typeof admin>) {
  const since = new Date(Date.now() - ENROLL_WINDOW_MS).toISOString();
  const candidates = new Map<string, Omit<Reminder, "id" | "step">>();

  // 1) Pedidos manuales de la tienda (Yape/Plin, Binance, SPEI, transferencia).
  const { data: manual } = await supabase
    .from("manual_payments")
    .select("order_number, buyer_email, buyer_name, method, amount_usd, amount_local, currency_local, items, status, created_at")
    .eq("status", "pending")
    .gte("created_at", since)
    .limit(500);

  for (const m of (manual ?? []) as Array<Record<string, any>>) {
    if (!m.buyer_email) continue;
    const items = Array.isArray(m.items) ? m.items : [];
    candidates.set(String(m.order_number), {
      order_number: String(m.order_number),
      customer_email: String(m.buyer_email).toLowerCase(),
      customer_name: m.buyer_name ?? null,
      provider: "manual",
      method: m.method ?? null,
      amount: m.amount_local ?? m.amount_usd ?? null,
      currency: m.currency_local || "USD",
      product_name: items.map((i: any) => i?.name).filter(Boolean).join(" + ") || null,
      order_created_at: m.created_at,
    });
  }

  // 2) Pedidos de pasarela (dLocal, Mercado Pago) que quedaron pendientes.
  const { data: rows } = await supabase
    .from("order_events")
    .select("order_number, event, method, customer_email, amount, currency, provider, metadata, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(5000);

  const byOrder = new Map<string, { pending: boolean; closed: boolean; data: Omit<Reminder, "id" | "step"> }>();
  for (const r of (rows ?? []) as Array<Record<string, any>>) {
    const on = String(r.order_number);
    const cur = byOrder.get(on) ?? {
      pending: false,
      closed: false,
      data: {
        order_number: on,
        customer_email: "",
        customer_name: null,
        provider: r.provider ?? "dlocalgo",
        method: null,
        amount: null,
        currency: "USD",
        product_name: null,
        order_created_at: r.created_at,
      },
    };
    if (r.provider) cur.data.provider = r.provider;
    if (r.customer_email) cur.data.customer_email = String(r.customer_email).toLowerCase();
    if (r.method) cur.data.method = r.method;
    if (typeof r.amount === "number") cur.data.amount = r.amount;
    if (r.currency) cur.data.currency = r.currency;
    if (r.event === "payment_pending") cur.pending = true;
    if (r.event === "payment_paid" || r.event === "delivery_sent" || r.event === "payment_failed") cur.closed = true;
    byOrder.set(on, cur);
  }
  for (const [on, v] of byOrder) {
    if (!v.pending || v.closed || !v.data.customer_email) continue;
    if (!candidates.has(on)) candidates.set(on, v.data);
  }

  if (candidates.size === 0) return 0;

  const payload = [...candidates.values()].map((c) => ({
    ...c,
    step: 0,
    next_at: new Date(new Date(c.order_created_at).getTime() + STEP_DAYS[0] * DAY_MS).toISOString(),
  }));

  // onConflict order_number → no duplicamos ni reiniciamos secuencias en curso.
  const { error } = await supabase
    .from("pending_payment_reminders")
    .upsert(payload, { onConflict: "order_number", ignoreDuplicates: true });
  if (error) console.error("[pending-reminders] enroll error:", error.message);
  return payload.length;
}

/** ¿El pedido ya se pagó / rechazó? Devuelve el motivo o null si sigue pendiente. */
async function resolutionReason(
  supabase: ReturnType<typeof admin>,
  orderNumber: string,
): Promise<string | null> {
  const { data: events } = await supabase
    .from("order_events")
    .select("event")
    .eq("order_number", orderNumber)
    .in("event", ["payment_paid", "delivery_sent", "payment_failed"])
    .limit(1);
  if (events && events.length > 0) {
    return events[0].event === "payment_failed" ? "rechazado" : "pagado";
  }

  const { data: manual } = await supabase
    .from("manual_payments")
    .select("status")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (manual && manual.status && manual.status !== "pending") {
    return manual.status === "rejected" ? "rechazado" : "pagado";
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const blocked = assertInternalCall(req);
  if (blocked) return blocked;

  const supabase = admin();
  const result = { enrolled: 0, sent: 0, resolved: 0, errors: 0 };

  try {
    result.enrolled = await enroll(supabase);

    const { data: due } = await supabase
      .from("pending_payment_reminders")
      .select("id, order_number, customer_email, customer_name, provider, method, amount, currency, product_name, order_created_at, step")
      .eq("resolved", false)
      .lte("next_at", new Date().toISOString())
      .order("next_at", { ascending: true })
      .limit(60);

    for (const r of (due ?? []) as Reminder[]) {
      const reason = await resolutionReason(supabase, r.order_number);
      if (reason) {
        await supabase
          .from("pending_payment_reminders")
          .update({ resolved: true, resolved_reason: reason, resolved_at: new Date().toISOString() })
          .eq("id", r.id);
        result.resolved++;
        continue;
      }

      const stepIndex = r.step; // 0 → día 1, 1 → día 3, ...
      if (stepIndex >= STEP_DAYS.length) {
        await supabase
          .from("pending_payment_reminders")
          .update({ resolved: true, resolved_reason: "vencido", resolved_at: new Date().toISOString() })
          .eq("id", r.id);
        result.resolved++;
        continue;
      }

      const day = STEP_DAYS[stepIndex];
      const isLast = stepIndex === STEP_DAYS.length - 1;

      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "customer-pending-reminder",
          recipientEmail: r.customer_email,
          idempotencyKey: `pending-reminder-${r.order_number}-d${day}`,
          templateData: {
            orderNumber: r.order_number,
            customerName: r.customer_name ?? "",
            customerEmail: r.customer_email,
            productName: r.product_name ?? "Tu pedido ILINGUE RELAX",
            amount: r.amount,
            currency: r.currency,
            method: r.method ?? "",
            day,
            isLast,
          },
        },
      });

      if (error) {
        result.errors++;
        console.error(`[pending-reminders] envío falló ${r.order_number} d${day}:`, error.message);
        // Reintento en 6 h sin avanzar el paso.
        await supabase
          .from("pending_payment_reminders")
          .update({ next_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() })
          .eq("id", r.id);
        continue;
      }

      result.sent++;
      const nextStep = stepIndex + 1;
      const base = new Date(r.order_created_at).getTime();
      await supabase
        .from("pending_payment_reminders")
        .update({
          step: nextStep,
          last_sent_at: new Date().toISOString(),
          next_at: nextStep < STEP_DAYS.length
            ? new Date(base + STEP_DAYS[nextStep] * DAY_MS).toISOString()
            : new Date(Date.now() + DAY_MS).toISOString(),
          ...(isLast ? {} : {}),
        })
        .eq("id", r.id);
    }

    return json({ ok: true, ...result });
  } catch (e) {
    console.error("[pending-reminders] error:", e);
    return json({ error: "Error interno", ...result }, 500);
  }
});
