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
  action: z.enum(["inspect", "sync", "approve", "reject", "list_pending"]),
  orderNumber: z.string().trim().min(4).max(80).regex(/^[A-Za-z0-9\-_]+$/).optional(),
  adminKey: z.string().min(4).max(200),
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

  const { error } = await supabase.functions.invoke("send-digital-ilinguerelax", {
    body: {
      customerEmail: order.email,
      customerName: order.name,
      customerCountry: order.country,
      orderId: order.orderNumber,
      skus: order.skus,
      amount: order.amount,
      currency: order.currency,
      provider: order.provider,
      idempotencyKey: `digital:${order.provider}:${order.orderNumber}`,
    },
  });

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
    const orderNumber = parsed.data.orderNumber.toUpperCase();

    const expectedKey = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expectedKey || parsed.data.adminKey !== expectedKey) {
      return json({ error: "No autorizado" }, 401);
    }

    const supabase = admin();
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
    if (provider === "dlocalgo" && reference && reference !== orderNumber) {
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
    if (!reason || reason.length < 4) {
      return json({ error: "Indica el motivo/comprobante de la aceptación manual" }, 400);
    }
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
