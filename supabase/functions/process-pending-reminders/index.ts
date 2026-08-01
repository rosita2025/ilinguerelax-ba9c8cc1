// Recordatorios de "pago pendiente" para la tienda online.
//
// Qué resuelve:
//  · Cuando el cliente elige transferencia, efectivo o billetera digital (dLocal,
//    Mercado Pago, Yape/Plin, Binance, SPEI) el pedido queda PENDIENTE. Antes solo
//    el admin recibía el aviso y el cliente se olvidaba de pagar.
//  · Esta tarea inscribe esos pedidos y les envía recordatorios en los
//    días 1, 2 y 3 mientras sigan sin pagar.
//  · La secuencia se DETIENE automáticamente cuando el pago se acredita
//    (webhook del proveedor) o cuando el admin lo acepta manualmente
//    ("yo acepto"), y también si el pedido se rechaza/abandona.
//
// Seguridad: solo llamadas internas (service role o CRON_SHARED_SECRET).
import { createClient } from "npm:@supabase/supabase-js@2";
import { assertInternalCall, internalCors } from "../_shared/internalAuth.ts";
import { sendInternalEmail } from "../_shared/sendInternalEmail.ts";

const cors = internalCors;
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

/** Días del recordatorio, en orden. */
const STEP_DAYS = [1, 2, 3] as const;
const DAY_MS = 24 * 60 * 60 * 1000;
/** El cupón de dLocal vence en 3 días; no inscribimos pedidos viejos. */
const ENROLL_WINDOW_MS = 4 * DAY_MS;
/**
 * Espaciado mínimo real entre dos recordatorios del MISMO pedido.
 * Sin esto, un pedido inscrito tarde tenía los días 1, 2 y 3 ya vencidos y el
 * cron (cada 15 min) mandaba un correo por ejecución: el cliente recibía la
 * secuencia completa en una hora y parecían correos duplicados.
 */
const MIN_GAP_MS = 20 * 60 * 60 * 1000; // 20 h

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
  last_sent_at?: string | null;
};

/** Último envío (ms) de la secuencia, o null si aún no se envió nada. */
function r_lastSentAt(r: Reminder): number | null {
  if (!r.last_sent_at) return null;
  const t = new Date(r.last_sent_at).getTime();
  return Number.isFinite(t) ? t : null;
}

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
    if (r.event === "payment_pending" || r.event === "payment_instructions") cur.pending = true;
    const meta = r.metadata as Record<string, unknown> | null;
    if (typeof meta?.productName === "string") cur.data.product_name = meta.productName;
    if (r.event === "payment_paid" || r.event === "delivery_sent" || r.event === "payment_failed") cur.closed = true;
    byOrder.set(on, cur);
  }
  for (const [on, v] of byOrder) {
    if (!v.pending || v.closed || !v.data.customer_email) continue;
    if (!candidates.has(on)) candidates.set(on, v.data);
  }

  if (candidates.size === 0) return 0;

  const now = Date.now();
  const payload = [...candidates.values()].map((c) => ({
    ...c,
    step: 0,
    // Nunca antes de 1 h desde la inscripción, aunque el pedido sea antiguo.
    next_at: new Date(
      Math.max(new Date(c.order_created_at).getTime() + STEP_DAYS[0] * DAY_MS, now + 60 * 60 * 1000),
    ).toISOString(),
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

  const blocked = await assertInternalCall(req);
  if (blocked) return blocked;

  const supabase = admin();
  const result = { enrolled: 0, sent: 0, resolved: 0, errors: 0 };

  try {
    result.enrolled = await enroll(supabase);

    const { data: due } = await supabase
      .from("pending_payment_reminders")
      .select("id, order_number, customer_email, customer_name, provider, method, amount, currency, product_name, order_created_at, step, last_sent_at")
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

      // Guarda anti-duplicados 1: nunca dos correos del mismo pedido en <20 h,
      // aunque el cron se solape o el pedido llegue con días vencidos.
      const lastSent = r_lastSentAt(r);
      if (lastSent && Date.now() - lastSent < MIN_GAP_MS) {
        await supabase
          .from("pending_payment_reminders")
          .update({ next_at: new Date(lastSent + MIN_GAP_MS).toISOString() })
          .eq("id", r.id);
        continue;
      }

      // Guarda anti-duplicados 2: si ya quedó registrado el envío de este día,
      // avanzamos el paso sin volver a escribir al cliente.
      const { data: already } = await supabase
        .from("order_events")
        .select("id")
        .eq("order_number", r.order_number)
        .eq("event", "reminder_sent")
        .contains("metadata", { day })
        .limit(1);
      if (already && already.length > 0) {
        await supabase
          .from("pending_payment_reminders")
          .update({
            step: stepIndex + 1,
            next_at: new Date(Date.now() + MIN_GAP_MS).toISOString(),
          })
          .eq("id", r.id);
        continue;
      }

      // Reserva del envío: si otra ejecución del cron ya tomó esta fila,
      // `next_at` cambió y el update no afecta ninguna fila → no enviamos.
      const { data: claimed } = await supabase
        .from("pending_payment_reminders")
        .update({ next_at: new Date(Date.now() + MIN_GAP_MS).toISOString() })
        .eq("id", r.id)
        .eq("step", stepIndex)
        .eq("resolved", false)
        .lte("next_at", new Date().toISOString())
        .select("id");
      if (!claimed || claimed.length === 0) continue;

      const { error } = await sendInternalEmail({
        ...{
          templateName: "customer-pending-reminder",
          recipientEmail: r.customer_email,
          idempotencyKey: `pending-reminder-${r.order_number}-d${day}`,
          templateData: {
            orderNumber: r.order_number,
            customerName: r.customer_name ?? "",
            customerEmail: r.customer_email,
            productName: r.product_name ?? "Tu pedido iLingue Relax",
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
      const sentAt = new Date().toISOString();

      // Registro auditable: queda constancia de que el recordatorio salió solo
      // (cron), con día, paso y correo destino. Así en /mi-pedido y en el admin
      // se ve como envío automático y no como una acción manual del equipo.
      try {
        await supabase.from("order_events").insert({
          order_number: r.order_number,
          customer_email: r.customer_email,
          provider: r.provider ?? "system",
          event: "reminder_sent",
          status: "pending",
          method: r.method,
          amount: r.amount,
          currency: r.currency,
          detail: `Recordatorio automático de pago pendiente (día ${day}${isLast ? ", último aviso" : ""})`,
          metadata: {
            automated: true,
            trigger: "cron:process-pending-reminders",
            step: stepIndex + 1,
            day,
            isLast,
            sentAt,
            template: "customer-pending-reminder",
            recipient: r.customer_email,
          },
        });
      } catch (e) {
        console.warn("[pending-reminders] no se pudo registrar el evento:", e instanceof Error ? e.message : String(e));
      }

      const nextStep = stepIndex + 1;
      const base = new Date(r.order_created_at).getTime();

      if (isLast) {
        // Solo días 1, 2 y 3: tras el tercer aviso la secuencia se cierra y el
        // cliente no vuelve a recibir correos de pago pendiente.
        await supabase
          .from("pending_payment_reminders")
          .update({
            step: nextStep,
            last_sent_at: sentAt,
            resolved: true,
            resolved_reason: "secuencia_completa",
            resolved_at: sentAt,
            next_at: new Date(Date.now() + 365 * DAY_MS).toISOString(),
          })
          .eq("id", r.id);
        result.resolved++;
        continue;
      }

      await supabase
        .from("pending_payment_reminders")
        .update({
          step: nextStep,
          last_sent_at: sentAt,
          next_at: new Date(
            Math.max(base + STEP_DAYS[nextStep] * DAY_MS, Date.now() + MIN_GAP_MS),
          ).toISOString(),
        })
        .eq("id", r.id);

    }

    return json({ ok: true, ...result });
  } catch (e) {
    console.error("[pending-reminders] error:", e);
    return json({ error: "Error interno", ...result }, 500);
  }
});
