// Whop — receptor de avisos (webhook) `payment.succeeded`.
// Seguridad: se verifica la firma (HMAC) con el secreto del webhook y el pedido se toma de NUESTRO registro
// (`order_created` creado por whop-create-order), nunca de lo que diga el navegador: producto, correo y precio esperado salen de ahí.
// Se entrega el producto solo si el pago está «paid», el plan es el esperado y el importe cubre lo que cobramos.
import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyWhopWebhook, whopMoney } from "../_shared/whop.ts";
import { logOrderEvent } from "../_shared/orderEvents.ts";
import { checkAmount, describeAmountCheck } from "../_shared/dlocalAmounts.ts";
import { deliverLikeManual } from "../_shared/manualDelivery.ts";
import { sendThankYouEmail } from "../_shared/thankYouEmail.ts";
import { sendPurchaseCapi } from "../_shared/metaCapi.ts";
import { normalizeSkus } from "../_shared/digitalSku.ts";

const ok = (b: Record<string, unknown> = { received: true }, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const rawBody = await req.text();
    const valid = await verifyWhopWebhook(rawBody, req.headers, Deno.env.get("WHOP_WEBHOOK_SECRET"));
    if (!valid) {
      console.warn("whop-webhook rechazado: firma inválida");
      return ok({ error: "invalid signature" }, 401);
    }

    let event: any;
    try { event = JSON.parse(rawBody); } catch { return ok({ error: "invalid json" }, 400); }
    if (event?.type !== "payment.succeeded") return ok({ received: true, ignored: event?.type ?? "unknown" });

    const payment = event.data ?? {};
    const paymentId = String(payment.id || "").trim();
    if (!/^pay_[A-Za-z0-9]+$/.test(paymentId)) return ok({ received: true, ignored: "no payment id" });
    if (String(payment.status || "").toLowerCase() !== "paid") return ok({ received: true, ignored: `status ${payment.status}` });

    const orderNumber = String(payment.metadata?.order_id || "").trim();
    if (!/^ILR-WH-[A-Z0-9]{6,20}$/.test(orderNumber)) {
      console.warn("whop-webhook: pago sin order_id nuestro", { paymentId });
      return ok({ received: true, ignored: "no order id" });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Idempotencia: Whop entrega «al menos una vez» y reintenta con el mismo webhook-id.
    const { error: claimErr } = await supabase.from("payment_webhook_events").insert({
      provider: "whop",
      event_key: String(event.id || req.headers.get("webhook-id") || paymentId),
      order_number: orderNumber,
      reference: paymentId,
      status: "PAID",
      payload: { paymentId },
    });
    if ((claimErr as { code?: string } | null)?.code === "23505") return ok({ received: true, duplicate: true });

    // Pedido que creamos nosotros.
    const { data: created } = await supabase
      .from("order_events")
      .select("customer_email, amount, currency, metadata")
      .eq("order_number", orderNumber)
      .eq("provider", "whop")
      .eq("event", "order_created")
      .order("created_at", { ascending: true })
      .limit(1);
    const order = created?.[0];
    if (!order) {
      console.warn("whop-webhook: pedido desconocido", { orderNumber, paymentId });
      return ok({ received: true, ignored: "unknown order" });
    }
    const meta = (order.metadata ?? {}) as Record<string, any>;
    const skus = normalizeSkus(Array.isArray(meta.skus) ? meta.skus : []);
    const email = String(order.customer_email || "").trim().toLowerCase();
    const name = String(meta.customerName || email.split("@")[0] || "Cliente");
    const country = String(meta.country || "CO").toUpperCase();

    // Ya entregado: nada más que hacer.
    const { data: prior } = await supabase.from("order_events").select("event").eq("order_number", orderNumber).in("event", ["delivery_sent"]);
    if ((prior ?? []).length > 0) return ok({ received: true, ignored: "already delivered" });

    // El pago debe haberse hecho por la configuración de checkout que creamos para ESE pedido.
    const paidConfig = String(payment.checkout_configuration_id || "");
    if (meta.checkoutConfigId && paidConfig !== meta.checkoutConfigId) {
      await logOrderEvent({
        orderNumber, event: "payment_mismatch", provider: "whop", status: "CHECKOUT_MISMATCH", reference: paymentId,
        detail: `Whop cobró por ${paidConfig || "otro checkout"} y el pedido esperaba ${meta.checkoutConfigId}`, customerEmail: email,
        metadata: { skus, paidConfig, expected: meta.checkoutConfigId },
      });
      return ok({ received: true, held: "checkout_mismatch" });
    }

    // Importe: lo cobrado (en la moneda que vio el comprador) debe cubrir lo que calculó nuestro servidor.
    const paid = whopMoney(payment.presentment_total) ?? whopMoney(payment.total);
    const check = checkAmount(Number(meta.localAmount) || null, String(meta.localCurrency || "COP"), {
      amount: paid?.amount ?? null,
      currency: paid?.currency ?? null,
    });
    if (check.mismatch) {
      await logOrderEvent({
        orderNumber, event: "payment_mismatch", provider: "whop", status: check.underpaid ? "AMOUNT_MISMATCH" : "AMOUNT_OVERPAID",
        reference: paymentId, detail: describeAmountCheck(check), customerEmail: email,
        amount: paid?.amount ?? null, currency: paid?.currency ?? null, metadata: { skus, amountCheck: check },
      });
    }
    await logOrderEvent({
      orderNumber, event: "payment_paid", provider: "whop", status: "PAID", method: meta.whopMethod === "installments" ? "Cuotas con Addi (Whop)" : "Billetera digital (Whop)", reference: paymentId,
      detail: check.mismatch ? `Pago confirmado por Whop con discrepancia: ${describeAmountCheck(check)}` : "Pago confirmado por Whop",
      customerEmail: email, amount: paid?.amount ?? null, currency: paid?.currency ?? null, metadata: { skus, country },
    });
    if (check.underpaid) return ok({ received: true, held: "amount_mismatch" });
    if (!email || skus.length === 0) return ok({ received: true, warning: "no email or skus" });

    await sendPurchaseCapi({
      eventId: `Purchase_${orderNumber}`,
      email,
      country,
      value: Number(order.amount) > 0 ? Number(order.amount) : null,
      currency: "USD",
      contentIds: skus,
      contentName: String(meta.productName || "iLingue Relax"),
      orderId: orderNumber,
    }).catch((e) => console.error("Whop CAPI failed:", e));

    try {
      await sendThankYouEmail({
        customerEmail: email, customerName: name, customerPhone: meta.customerPhone ?? undefined, customerCountry: country,
        productName: String(meta.productName || "Producto iLingue Relax"), skus,
        amount: paid?.amount, currency: paid?.currency ?? "COP", provider: "whop", orderNumber,
        idempotencyKey: `whop-paid-${orderNumber}`,
      });
    } catch (e) {
      console.error("Whop thank-you failed:", e);
    }

    let delivery: { delivered: boolean; detail: string };
    try {
      delivery = await deliverLikeManual(supabase, { orderNumber, email, name, skus });
    } catch (e) {
      delivery = { delivered: false, detail: e instanceof Error ? e.message : String(e) };
    }
    await logOrderEvent({
      orderNumber, event: delivery.delivered ? "delivery_sent" : "delivery_failed", provider: "whop",
      status: delivery.delivered ? "SENT" : "ERROR", reference: paymentId,
      detail: delivery.delivered ? `Entrega digital enviada a ${email} (${skus.join(", ")})` : `Fallo al enviar la entrega digital: ${delivery.detail}`,
      customerEmail: email, metadata: { skus },
    });

    return ok({ received: true });
  } catch (err) {
    console.error("whop-webhook error:", err);
    // 500 para que Whop reintente (la idempotencia evita duplicar la entrega).
    return ok({ error: "internal error" }, 500);
  }
});
