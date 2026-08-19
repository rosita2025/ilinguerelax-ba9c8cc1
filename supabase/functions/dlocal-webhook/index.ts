// dLocal Go — receptor de notificaciones (webhook)
// dLocal Go llama a `notification_url` en cada cambio de estado del pago.
// Seguridad: NUNCA confiamos en el body. Re-consultamos el pago en la API de
// dLocal Go con nuestras credenciales y solo entregamos si está PAID.
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa", "Access-Control-Allow-Methods": "POST, OPTIONS" };
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendThankYouEmail } from "../_shared/thankYouEmail.ts";
import { normalizeSkus, splitSkuList } from "../_shared/digitalSku.ts";
import { sendPurchaseCapi } from "../_shared/metaCapi.ts";
import {
  verifyDlocalSignature,
  isSettledStatus,
  isPendingStatus,
  DLOCAL_SETTLED_STATUSES,
  DLOCAL_PENDING_STATUSES,
  DLOCAL_FAILED_STATUSES,
  dlocalApiBase,
} from "../_shared/dlocal.ts";
import { logOrderEvent } from "../_shared/orderEvents.ts";
import { deliverLikeManual } from "../_shared/manualDelivery.ts";
import { checkAmount, describeAmountCheck } from "../_shared/dlocalAmounts.ts";
import { sendInternalEmail } from "../_shared/sendInternalEmail.ts";
import { upsertPhysicalShipment } from "../_shared/physicalShipments.ts";

const API_BASE = dlocalApiBase();

function authHeader(): string {
  const apiKey = Deno.env.get("DLOCAL_GO_API_KEY");
  const secretKey = Deno.env.get("DLOCAL_GO_SECRET_KEY");
  if (!apiKey || !secretKey) throw new Error("DLOCAL_GO credentials missing");
  return `Bearer ${apiKey}:${secretKey}`;
}

async function fetchPayment(id: string) {
  // Reintenta hasta 3 veces: un 5xx o un corte de red momentáneo de dLocal no
  // debe hacernos perder la confirmación de un pago ya realizado.
  let lastErr = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(`${API_BASE}/payments/${encodeURIComponent(id)}`, {
        headers: { Authorization: authHeader() },
      });
      const text = await r.text();
      if (r.ok) return JSON.parse(text);
      lastErr = `status ${r.status}`;
      // 4xx = no va a cambiar reintentando.
      if (r.status < 500 && r.status !== 429) break;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : "network error";
    }
    if (attempt < 3) await new Promise((res) => setTimeout(res, attempt * 700));
  }
  throw new Error(`dLocal GET /payments/${id} failed (${lastErr})`);
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const q = url.searchParams;

  try {
    const rawBody = await req.text();

    // 1) Firma HMAC-SHA256 de dLocal Go. Si no valida, NO descartamos la
    // notificación: dLocal no firma todas sus llamadas (retries, cambios de
    // estado de efectivo/transferencia) y perder un PAID significa una compra
    // pagada sin entregar. En ese caso exigimos que la notificación traiga el
    // `order` que nosotros mismos pusimos en la notification_url y que coincida
    // con el order_id que devuelve la API de dLocal (paso 3). El estado siempre
    // se consulta a la API con nuestras credenciales, nunca se toma del body.
    const signatureOk = await verifyDlocalSignature(req, rawBody);
    const expectedOrderParam = (url.searchParams.get("order") || "").trim();
    if (!signatureOk && !expectedOrderParam) {
      console.warn("dLocal webhook rechazado: sin firma válida y sin order en la URL");
      return new Response(JSON.stringify({ error: "invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!signatureOk) {
      console.warn("dLocal webhook sin firma válida: se valida contra la API por order_id");
    }


    let body: Record<string, unknown> = {};
    try { body = rawBody ? JSON.parse(rawBody) : {}; } catch { body = {}; }

    const paymentId = String(
      (body as any)?.payment_id ?? (body as any)?.id ?? q.get("payment_id") ?? q.get("id") ?? "",
    ).trim();

    if (!paymentId || !/^[A-Za-z0-9_-]{4,80}$/.test(paymentId)) {
      console.log("dLocal webhook ignorado: payment_id ausente o inválido");
      return new Response(JSON.stringify({ received: true, ignored: "no payment id" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Estado real consultado directamente a dLocal Go (nunca del body).
    const payment = await fetchPayment(paymentId);
    const status = String(payment.status || "").toUpperCase();
    const ALLOWED_STATUS: readonly string[] = [
      ...DLOCAL_SETTLED_STATUSES,
      ...DLOCAL_PENDING_STATUSES,
      ...DLOCAL_FAILED_STATUSES,
    ];
    if (!ALLOWED_STATUS.includes(status)) {
      console.warn("dLocal webhook: estado desconocido", { paymentId, status });
      return new Response(JSON.stringify({ received: true, ignored: "unknown status" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3) El pago debe corresponder a una orden creada por nosotros.
    const expectedOrder = (q.get("order") || "").trim();
    const remoteOrder = String(payment.order_id || "").trim();
    const orderMismatch = expectedOrder && remoteOrder && expectedOrder !== remoteOrder;
    // Sin firma válida exigimos coincidencia estricta de order_id.
    if (orderMismatch || (!signatureOk && expectedOrder !== remoteOrder)) {
      console.warn("dLocal webhook rechazado: order_id no coincide", { paymentId });
      return new Response(JSON.stringify({ error: "order mismatch" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    console.log("dLocal webhook:", { paymentId, status, order: payment.order_id });



    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const orderNumber = String(payment.order_id || q.get("order") || `ILR-DL-${paymentId}`);
    const customerEmail = String(payment.payer?.email || q.get("email") || "").trim().toLowerCase();
    const customerName = String(payment.payer?.name || q.get("name") || customerEmail.split("@")[0] || "Cliente");
    const country = String(payment.country || q.get("country") || "").toUpperCase() || undefined;
    const phone = q.get("phone") || undefined;
    const skus = normalizeSkus(splitSkuList(q.get("skus") ?? ""));
    const summary = q.get("summary") || payment.description || "Producto iLingue Relax";
    const amount = Number(payment.amount ?? q.get("usd") ?? 0) || undefined;
    const currency = String(payment.currency || "USD").toUpperCase();
    const couponCode = (q.get("coupon") || "").trim().toUpperCase() || undefined;
    const couponPctRaw = Number(q.get("coupon_pct"));
    const couponPercent = Number.isFinite(couponPctRaw) && couponPctRaw > 0 ? couponPctRaw : undefined;

    // 3.b) Sin firma válida exigimos, además del order_id coincidente, que el
    // pedido exista realmente en nuestro historial (lo crea dlocal-create-payment).
    // Así una notificación falsa no puede inventar un pedido nuevo.
    if (!signatureOk) {
      const { count } = await supabase
        .from("order_events")
        .select("id", { count: "exact", head: true })
        .eq("order_number", orderNumber)
        .eq("provider", "dlocalgo");
      if (!count) {
        console.warn("dLocal webhook rechazado: sin firma y pedido desconocido", { orderNumber });
        return new Response(JSON.stringify({ error: "unknown order" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }


    // 4) IDEMPOTENCIA: dLocal reintenta la misma notificación varias veces
    // (y a veces la envía duplicada). Reclamamos el evento una sola vez con un
    // índice único (provider, event_key). Si ya existe, salimos con 200 sin
    // volver a cobrar, registrar, notificar ni entregar el producto.
    const eventKey = `${paymentId}:${status}`;
    const { error: claimErr } = await supabase
      .from("payment_webhook_events")
      .insert({
        provider: "dlocalgo",
        event_key: eventKey,
        order_number: orderNumber,
        reference: paymentId,
        status,
        payload: { amount: amount ?? null, currency, country: country ?? null, skus, signed: signatureOk },
      });
    if (claimErr) {
      // 23505 = índice único → notificación repetida.
      if ((claimErr as { code?: string }).code === "23505") {
        console.log("dLocal webhook duplicado ignorado", { paymentId, status });
        return new Response(JSON.stringify({ received: true, duplicate: true, status }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("dLocal webhook: no se pudo registrar la idempotencia:", claimErr.message);
    }

    // 5) VALIDACIÓN DE ESTADO: el pedido nunca puede retroceder. Si ya está
    // pagado y entregado, una notificación posterior de pendiente/rechazo no
    // debe reescribir su estado ni volver a enviar correos, y un PAID repetido
    // (con otro payment_id) no debe entregar dos veces el producto.
    const { data: priorEvents } = await supabase
      .from("order_events")
      .select("event")
      .eq("order_number", orderNumber)
      .in("event", ["payment_paid", "delivery_sent"]);
    const alreadyPaid = (priorEvents ?? []).some((e) => e.event === "payment_paid");
    const alreadyDelivered = (priorEvents ?? []).some((e) => e.event === "delivery_sent");
    if (alreadyPaid && !isSettledStatus(status)) {
      console.warn("dLocal webhook ignorado: el pedido ya estaba pagado", { orderNumber, status });
      return new Response(JSON.stringify({ received: true, ignored: "already paid", status }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (alreadyPaid && alreadyDelivered && isSettledStatus(status)) {
      console.log("dLocal webhook: pedido ya pagado y entregado, sin acción", { orderNumber });
      return new Response(JSON.stringify({ received: true, ignored: "already delivered", status }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("funnel_events").insert({
      event_name: isSettledStatus(status) ? "Purchase" : `dlocal_${status.toLowerCase()}`,
      product_id: skus[0] || orderNumber,
      value: amount ?? null,
      currency,
      country: country ?? null,
      provider: "dlocalgo",
      email: customerEmail || null,
      name: customerName || null,
      referrer: JSON.stringify({
        ...payment,
        localAmount: amount,
        localCurrency: currency,
        payer_name: customerName,
        payer_email: customerEmail,
        status: status,
        provider: "dlocalgo"
      })
    }).then(({ error }) => { if (error) console.error("dLocal funnel log failed:", error.message); });



    if (!isSettledStatus(status)) {
      // Transferencia / efectivo: dLocal deja el pago en PENDING mientras el
      // cliente paga en el banco o en la caja. Igual que Mercado Pago Perú,
      // le enviamos el comprobante "pago pendiente" con las instrucciones y
      // avisamos al admin. La entrega digital se dispara sola cuando dLocal
      // vuelve a llamar este webhook con estado PAID.

      // Estados finales fallidos: quedan registrados en el historial del pedido
      // para que /mi-pedido y el admin muestren el estado real.
      if (!isPendingStatus(status)) {
        await logOrderEvent({
          orderNumber,
          event: "payment_failed",
          provider: "dlocalgo",
          status,
          reference: paymentId,
          detail: `dLocal reportó el pago como ${status}`,
          customerEmail: customerEmail || null,
          amount: amount ?? null,
          currency,
          metadata: { country: country ?? null, skus },
        });
      }

      if (isPendingStatus(status) && customerEmail) {
        const rawMethod = String(
          payment.payment_method_id || payment.payment_method_type || q.get("ptype") || "",
        ).toUpperCase();
        const method = rawMethod.includes("TICKET") || rawMethod.includes("CASH")
          ? "Pago en efectivo (dLocal Go)"
          : rawMethod.includes("WALLET")
          ? "Billetera digital (dLocal Go)"
          : "Transferencia bancaria (dLocal Go)";

        const templateData = {
          orderNumber,
          customerName,
          customerEmail,
          productName: summary,
          amount: amount ?? null,
          currency,
          method,
          orderDate: new Date().toISOString(),
        };
        const idemBase = `dlocal-pending-${paymentId}`;

        await logOrderEvent({
          orderNumber,
          event: "payment_pending",
          provider: "dlocalgo",
          status,
          method,
          reference: paymentId,
          detail: "dLocal confirmó el pedido como pendiente de pago",
          customerEmail,
          amount: amount ?? null,
          currency,
          metadata: { country: country ?? null, skus },
        });

        await Promise.allSettled([
          sendInternalEmail({
            templateName: "customer-manual-pending",
            recipientEmail: customerEmail,
            idempotencyKey: `${idemBase}-customer`,
            templateData,
          }),
          sendInternalEmail({
            templateName: "admin-manual-pending",
            recipientEmail: "hola@ilinguerelax.com",
            idempotencyKey: `${idemBase}-admin`,
            templateData: {
              ...templateData,
              customerEmail,
              customerWhatsapp: phone ?? "",
              country: country ?? "",
            },
          }),
        ]).catch((e) => console.error("dLocal pending emails failed:", e));
      }

      return new Response(JSON.stringify({ received: true, status }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    // ---- Conciliación de montos -------------------------------------------
    // Comparamos lo acreditado por dLocal contra el importe que registramos al
    // crear el pedido (16.65 PEN, 3.70 PEN, …). Un pago de MENOS no se entrega.
    const { data: expectedRows } = await supabase
      .from("order_events")
      .select("amount, currency, created_at")
      .eq("order_number", orderNumber)
      .in("event", ["order_created", "payment_pending", "payment_instructions"])
      .order("created_at", { ascending: true })
      .limit(10);
    const expectedRow = (expectedRows ?? []).find((r) => typeof r.amount === "number" && r.amount > 0);
    const amountCheck = checkAmount(
      (expectedRow?.amount as number | undefined) ?? null,
      (expectedRow?.currency as string | undefined) ?? currency,
      { amount: amount ?? null, currency },
    );
    if (amountCheck.mismatch) {
      console.warn("[dlocal-webhook] discrepancia de monto", orderNumber, amountCheck.reason);
      await logOrderEvent({
        orderNumber,
        event: "payment_mismatch",
        provider: "dlocalgo",
        status: amountCheck.underpaid ? "AMOUNT_MISMATCH" : "AMOUNT_OVERPAID",
        reference: paymentId,
        detail: describeAmountCheck(amountCheck),
        customerEmail: customerEmail || null,
        amount: amount ?? null,
        currency,
        metadata: { country: country ?? null, skus, amountCheck },
      });
    }

    await logOrderEvent({
      orderNumber,
      event: "payment_paid",
      provider: "dlocalgo",
      status,
      method: String(payment.payment_method_id || payment.payment_method_type || q.get("ptype") || "dLocal Go"),
      reference: paymentId,
      detail: amountCheck.mismatch
        ? `Pago confirmado por dLocal Go con discrepancia de monto: ${describeAmountCheck(amountCheck)}`
        : "Pago confirmado por dLocal Go",
      customerEmail: customerEmail || null,
      amount: amount ?? null,
      currency,
      metadata: { country: country ?? null, skus },
    });

    if (amountCheck.underpaid) {
      // Pago incompleto o en otra moneda: se retiene la entrega para revisión.
      return new Response(JSON.stringify({ received: true, held: "amount_mismatch", check: amountCheck.reason }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!customerEmail) {
      console.error("dLocal PAID sin email de comprador", { paymentId, orderNumber });
      return new Response(JSON.stringify({ received: true, warning: "no email" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await sendPurchaseCapi({
      eventId: `Purchase_${orderNumber}`,
      email: customerEmail,
      country: country ?? null,
      value: amount ?? null,
      currency,
      contentIds: skus,
      contentName: summary,
      orderId: orderNumber,
    }).catch((e) => console.error("dLocal CAPI failed:", e));

    try {
      await sendThankYouEmail({
        customerEmail,
        customerName,
        customerPhone: phone,
        customerCountry: country,
        productName: summary,
        skus,
        amount,
        currency,
        provider: "dlocalgo",
        orderNumber,
        // Basado en pedido (no paymentId): webhook, barrido y reintentos
        // comparten la misma llave y jamás generan otra confirmación.
        idempotencyKey: `dlocal-paid-${orderNumber}`,
        couponCode,
        couponPercent,
      });
    } catch (e) {
      console.error("dLocal thank-you failed:", e);
    }

    await upsertPhysicalShipment({
      adminClient: supabase,
      orderNumber,
      email: customerEmail,
      customerName,
      provider: "dlocalgo",
      address: { country: country ?? null },
      skus,
    });



    if (skus.length > 0) {
      // Una sola ruta de entrega. Usa `manual-material-<pedido>`, la misma llave
      // que conciliación y barrido, evitando los dos correos de materiales que
      // antes salían al competir webhook + sweep.
      let delivery: { delivered: boolean; detail: string };
      try {
        delivery = await deliverLikeManual(supabase, {
          orderNumber, email: customerEmail, name: customerName, skus,
        });
      } catch (e) {
        delivery = { delivered: false, detail: e instanceof Error ? e.message : String(e) };
      }
      const delivered = delivery.delivered;

      await logOrderEvent({
        orderNumber,
        event: delivered ? "delivery_sent" : "delivery_failed",
        provider: "dlocalgo",
        status: delivered ? "SENT" : "ERROR",
        reference: paymentId,
        detail: delivered
          ? `Entrega digital enviada a ${customerEmail} (${skus.join(", ")})`
          : `Fallo al enviar la entrega digital: ${delivery.detail}`,
        customerEmail,
        metadata: { skus },
      });
      if (!delivered) console.error("dLocal digital delivery failed:", delivery.detail);

    } else {
      console.warn("dLocal PAID sin SKUs de entrega", { paymentId, orderNumber });
    }

    return new Response(JSON.stringify({ received: true, status }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("dlocal-webhook error:", err);
    return new Response(JSON.stringify({ error: "internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
