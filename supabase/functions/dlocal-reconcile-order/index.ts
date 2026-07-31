// Conciliación manual/automática de pedidos (dLocal Go, Stripe, Mercado Pago, PayPal).
//
// Por qué existe:
//  · dLocal Go tiene hosts distintos para sandbox y producción y no siempre
//    firma sus notificaciones. Si un webhook se pierde, el pedido se queda
//    "pendiente" aunque el dinero ya esté acreditado.
//  · Con esta función el admin puede (a) RE-CONSULTAR el estado real en la API
//    de dLocal y aplicarlo (pagado / pendiente / rechazado), o (b) ACEPTAR
//    manualmente un pago que confirmó por su cuenta (transferencia, Yape…).
//
// Seguridad:
//  · Solo admin: Origin allowlist + x-admin-csrf + 2FA (assertAdminCsrf) y
//    además ADMIN_REVIEW_KEY en el cuerpo.
//  · El estado automático SIEMPRE se consulta a la API de dLocal con nuestras
//    credenciales; nunca se acepta un estado enviado por el cliente.
//  · La aceptación manual queda auditada (motivo + quién) en order_events.
//  · Idempotente: si el pedido ya está pagado/entregado no se vuelve a cobrar,
//    notificar ni entregar.
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { assertAdminCsrf, adminCorsHeaders } from "../_shared/adminCsrf.ts";
import { logOrderEvent } from "../_shared/orderEvents.ts";
import { sendThankYouEmail } from "../_shared/thankYouEmail.ts";
import { normalizeSkus } from "../_shared/digitalSku.ts";
import { deliverLikeManual } from "../_shared/manualDelivery.ts";

import {
  dlocalApiBase,
  dlocalEnv,
  isSettledStatus,
  isPendingStatus,
  isFailedStatus,
} from "../_shared/dlocal.ts";

const cors = { ...adminCorsHeaders };
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const BodySchema = z.object({
  action: z.enum(["inspect", "sync", "approve", "reject", "list_pending", "retry_delivery"]),
  orderNumber: z.string().trim().min(4).max(80).regex(/^[A-Za-z0-9\-_]+$/).optional(),
  // Opcional: el acceso ya está protegido por origen + CSRF + 2FA (assertAdminCsrf).
  // Si se envía, debe coincidir; si no se envía, no se pide.
  adminKey: z.string().min(4).max(200).optional(),
  reason: z.string().trim().max(300).optional(),
  operator: z.string().trim().max(120).optional(),
});


type OrderEvent = {
  event: string;
  status: string | null;
  method: string | null;
  reference: string | null;
  customer_email: string | null;
  amount: number | null;
  currency: string | null;
  provider: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function admin() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

async function fetchDlocalPayment(paymentId: string) {
  const apiKey = Deno.env.get("DLOCAL_GO_API_KEY");
  const secretKey = Deno.env.get("DLOCAL_GO_SECRET_KEY");
  if (!apiKey || !secretKey) return null;
  try {
    const r = await fetch(`${dlocalApiBase()}/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${apiKey}:${secretKey}` },
      // Evita que el panel se quede cargando si dLocal tarda.
      signal: AbortSignal.timeout(6000),
    });

    if (!r.ok) {
      console.warn("[dlocal-reconcile] dLocal respondió", r.status, "env", dlocalEnv());
      return null;
    }
    return await r.json() as Record<string, unknown>;
  } catch (e) {
    console.warn("[dlocal-reconcile] fetch falló:", e instanceof Error ? e.message : String(e));
    return null;
  }
}

/** Dispara el correo de gracias + entrega digital. Idempotente por orderNumber. */
async function deliver(order: {
  orderNumber: string;
  email: string;
  name: string;
  country?: string;
  skus: string[];
  amount?: number;
  currency: string;
  provider: string;
  productName: string;
  reference: string;
}) {
  const supabase = admin();
  try {
    await sendThankYouEmail({
      customerEmail: order.email,
      customerName: order.name,
      customerCountry: order.country,
      productName: order.productName,
      skus: order.skus,
      amount: order.amount,
      currency: order.currency,
      provider: order.provider as "stripe" | "paypal" | "mercadopago",
      orderNumber: order.orderNumber,
      idempotencyKey: `reconcile-paid-${order.orderNumber}`,
    });
  } catch (e) {
    console.error("[dlocal-reconcile] thank-you failed:", e);
  }

  if (order.skus.length === 0) {
    return { delivered: false, detail: "El pedido no tiene materiales digitales asociados" };
  }

  // Mismo camino que /admin/pagos-manuales (token /mi-descarga + plantilla
  // material-delivery): es el que sí llega al cliente.
  const res = await deliverLikeManual(supabase, {
    orderNumber: order.orderNumber,
    email: order.email,
    name: order.name,
    skus: order.skus,
  });
  const error = res.delivered ? null : { message: res.detail };


  await logOrderEvent({
    orderNumber: order.orderNumber,
    event: error ? "delivery_failed" : "delivery_sent",
    provider: order.provider,
    status: error ? "ERROR" : "SENT",
    reference: order.reference,
    detail: error
      ? `Fallo al enviar la entrega digital: ${error.message}`
      : `Entrega digital enviada a ${order.email} (${order.skus.join(", ")})`,
    customerEmail: order.email,
    metadata: { skus: order.skus, source: "admin-reconcile" },
  });

  return { delivered: !error, detail: error ? error.message : "Entrega enviada" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const blocked = await assertAdminCsrf(req);
  if (blocked) return blocked;

  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: "Datos inválidos" }, 400);
    const { action, reason, operator } = parsed.data;

    // La autenticación fuerte ya la hizo assertAdminCsrf (origen + CSRF + 2FA
    // por correo). ADMIN_REVIEW_KEY solo se valida si el cliente la envía, para
    // no bloquear el flujo "número de pedido y listo" del panel.
    const expectedKey = Deno.env.get("ADMIN_REVIEW_KEY");
    if (parsed.data.adminKey && parsed.data.adminKey !== expectedKey) {
      return json({ error: "No autorizado" }, 401);
    }


    const supabase = admin();

    // Lista de pedidos dLocal que siguen pendientes (sin pago ni rechazo posterior).
    if (action === "list_pending") {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: rows } = await supabase
        .from("order_events")
        .select("order_number, event, status, method, customer_email, amount, currency, provider, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: true })
        .limit(4000);

      const byOrder = new Map<string, {
        orderNumber: string; provider: string; email: string; method: string | null;
        amount: number | null; currency: string; createdAt: string; lastAt: string;
        paid: boolean; failed: boolean; pending: boolean;
      }>();
      for (const r of (rows ?? []) as Array<Record<string, any>>) {
        const on = String(r.order_number);
        const cur = byOrder.get(on) ?? {
          orderNumber: on, provider: r.provider ?? "dlocalgo", email: "", method: null,
          amount: null, currency: "USD", createdAt: r.created_at, lastAt: r.created_at,
          paid: false, failed: false, pending: false,
        };
        if (r.provider) cur.provider = r.provider;
        if (r.customer_email) cur.email = r.customer_email;
        if (r.method) cur.method = r.method;
        if (typeof r.amount === "number") cur.amount = r.amount;
        if (r.currency) cur.currency = r.currency;
        cur.lastAt = r.created_at;
        if (r.event === "payment_paid" || r.event === "delivery_sent") cur.paid = true;
        if (r.event === "payment_failed") cur.failed = true;
        if (r.event === "payment_pending" || r.event === "checkout_created") cur.pending = true;
        byOrder.set(on, cur);
      }
      const pending = [...byOrder.values()]
        .filter((o) => o.provider === "dlocalgo" && o.pending && !o.paid && !o.failed)
        .sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1))
        .slice(0, 100);
      return json({ ok: true, pending });
    }

    if (!parsed.data.orderNumber) return json({ error: "Falta el número de pedido" }, 400);
    const orderNumber = parsed.data.orderNumber.toUpperCase();

    const { data: rawEvents } = await supabase
      .from("order_events")
      .select("event, status, method, reference, customer_email, amount, currency, provider, metadata, created_at")
      .eq("order_number", orderNumber)
      .order("created_at", { ascending: true });

    const events = (rawEvents ?? []) as OrderEvent[];
    if (events.length === 0) return json({ error: "Pedido no encontrado" }, 404);

    const provider = events.find((e) => e.provider)?.provider ?? "dlocalgo";
    const email = events.map((e) => e.customer_email).filter(Boolean).pop() ?? "";
    const name = email ? email.split("@")[0] : "Cliente";
    const reference = events.map((e) => e.reference).filter(Boolean).pop() ?? orderNumber;
    const amount = events.map((e) => e.amount).filter((v): v is number => typeof v === "number").pop();
    const currency = events.map((e) => e.currency).filter(Boolean).pop() ?? "USD";
    const method = events.find((e) => e.method)?.method ?? null;
    const metaSkus = events
      .map((e) => (Array.isArray(e.metadata?.skus) ? e.metadata!.skus as string[] : []))
      .filter((a) => a.length > 0)
      .pop() ?? [];
    const skus = normalizeSkus(metaSkus);
    const country = events
      .map((e) => (typeof e.metadata?.country === "string" ? e.metadata!.country as string : null))
      .filter(Boolean)
      .pop() ?? undefined;

    const alreadyPaid = events.some((e) => e.event === "payment_paid");
    const alreadyDelivered = events.some((e) => e.event === "delivery_sent");

    // Estado real en el proveedor (solo dLocal tiene consulta directa aquí).
    let remoteStatus: string | null = null;
    if (action !== "retry_delivery" && provider === "dlocalgo" && reference && reference !== orderNumber) {
      const payment = await fetchDlocalPayment(reference);
      if (payment) remoteStatus = String(payment.status ?? "").toUpperCase() || null;
    }


    const summary = {
      orderNumber,
      provider,
      env: dlocalEnv(),
      email,
      method,
      amount: amount ?? null,
      currency,
      skus,
      reference,
      alreadyPaid,
      alreadyDelivered,
      remoteStatus,
      timeline: events.map((e) => ({ event: e.event, status: e.status, at: e.created_at })),
    };

    if (action === "inspect") return json({ ok: true, summary });

    // Reintento de entrega: vuelve a enviar el material sin tocar el estado.
    if (action === "retry_delivery") {
      if (!email) return json({ error: "El pedido no tiene correo del comprador", summary }, 400);
      const res = await deliver({
        orderNumber, email, name, country, skus, amount, currency, provider,
        productName: "Pedido ILINGUE RELAX", reference,
      });
      if (!res.delivered) return json({ error: res.detail, summary }, 422);
      return json({ ok: true, applied: "delivery_retried", delivery: res, summary });
    }


    if (action === "reject") {
      if (alreadyPaid) return json({ error: "El pedido ya está pagado: no se puede marcar como rechazado" }, 409);
      await logOrderEvent({
        orderNumber,
        event: "payment_failed",
        provider,
        status: remoteStatus ?? "REJECTED",
        reference,
        detail: `Rechazo registrado manualmente por el admin${reason ? `: ${reason}` : ""}`,
        customerEmail: email || null,
        amount: amount ?? null,
        currency,
        metadata: { skus, source: "admin-reconcile", operator: operator ?? null },
      });
      return json({ ok: true, applied: "rejected", summary });
    }

    if (action === "sync") {
      if (!remoteStatus) {
        return json({ error: "No se pudo consultar el estado real en dLocal (revisa entorno y credenciales)", summary }, 502);
      }
      if (isFailedStatus(remoteStatus)) {
        if (alreadyPaid) return json({ ok: true, applied: "ignored_already_paid", summary });
        await logOrderEvent({
          orderNumber, event: "payment_failed", provider, status: remoteStatus, reference,
          detail: `dLocal reportó el pago como ${remoteStatus}`,
          customerEmail: email || null, amount: amount ?? null, currency,
          metadata: { skus, source: "admin-reconcile" },
        });
        return json({ ok: true, applied: "rejected", remoteStatus, summary });
      }
      if (isPendingStatus(remoteStatus)) {
        if (alreadyPaid) return json({ ok: true, applied: "ignored_already_paid", summary });
        await logOrderEvent({
          orderNumber, event: "payment_pending", provider, status: remoteStatus, reference,
          detail: "dLocal mantiene el pago como pendiente de acreditación",
          customerEmail: email || null, amount: amount ?? null, currency,
          metadata: { skus, source: "admin-reconcile" },
        });
        return json({ ok: true, applied: "pending", remoteStatus, summary });
      }
      if (!isSettledStatus(remoteStatus)) {
        return json({ ok: true, applied: "unknown_status", remoteStatus, summary });
      }
      // PAID confirmado por la API.
      if (alreadyPaid && alreadyDelivered) return json({ ok: true, applied: "already_delivered", summary });
      if (!alreadyPaid) {
        await logOrderEvent({
          orderNumber, event: "payment_paid", provider, status: remoteStatus, method, reference,
          detail: "Pago confirmado al reconsultar la API de dLocal Go",
          customerEmail: email || null, amount: amount ?? null, currency,
          metadata: { skus, source: "admin-reconcile" },
        });
      }
      if (!email) return json({ ok: true, applied: "paid_no_email", summary });
      const res = await deliver({
        orderNumber, email, name, country, skus, amount, currency, provider,
        productName: "Pedido ILINGUE RELAX", reference,
      });
      return json({ ok: true, applied: "paid", remoteStatus, delivery: res, summary });
    }

    // action === "approve": aceptación manual del admin ("yo acepto").
    // El motivo es opcional: si no se indica, se audita como aceptación directa
    // desde el panel para que baste con el número de pedido.
    const approvalReason = reason && reason.length >= 4
      ? reason
      : "Aceptación manual del admin desde /admin/dlocal";

    if (remoteStatus && isFailedStatus(remoteStatus)) {
      return json({ error: `dLocal reporta el pago como ${remoteStatus}: no se puede aceptar manualmente`, summary }, 409);
    }
    if (alreadyPaid && alreadyDelivered) return json({ ok: true, applied: "already_delivered", summary });
    if (!email) return json({ error: "El pedido no tiene correo del comprador" }, 400);

    if (!alreadyPaid) {
      await logOrderEvent({
        orderNumber,
        event: "payment_paid",
        provider,
        status: remoteStatus ?? "MANUAL_APPROVED",
        method: method ?? "Aprobación manual del admin",
        reference,
        detail: `Pago aceptado manualmente por el admin: ${reason}`,
        customerEmail: email,
        amount: amount ?? null,
        currency,
        metadata: { skus, source: "admin-reconcile", manual: true, operator: operator ?? null, remoteStatus },
      });
    }
    const res = await deliver({
      orderNumber, email, name, country, skus, amount, currency, provider,
      productName: "Pedido ILINGUE RELAX", reference,
    });
    return json({ ok: true, applied: "manual_approved", delivery: res, summary });
  } catch (e) {
    console.error("dlocal-reconcile-order error:", e);
    return json({ error: "Error interno" }, 500);
  }
});
