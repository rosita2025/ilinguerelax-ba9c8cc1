// Mercado Pago Webhook receiver
// Docs: https://www.mercadopago.com.pe/developers/es/docs/your-integrations/notifications/webhooks
// Validates x-signature header (HMAC SHA256) and logs payment events.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendThankYouEmail } from "../_shared/thankYouEmail.ts";
import { normalizeSkus, splitSkuList } from "../_shared/digitalSku.ts";
import { sendPurchaseCapi } from "../_shared/metaCapi.ts";
import { logOrderEvent } from "../_shared/orderEvents.ts";

const encoder = new TextEncoder();

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function parseSignatureHeader(header: string | null): { ts?: string; v1?: string } {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(",")) {
    const [k, v] = part.split("=", 2).map((s) => s?.trim());
    if (k && v) out[k] = v;
  }
  return { ts: out.ts, v1: out.v1 };
}

async function verifySignature(req: Request, dataId: string): Promise<boolean> {
  const secret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
  if (!secret) {
    // Fail-closed: sin secreto NO se acepta ninguna notificación. Aceptarla
    // permitiría a cualquiera inyectar un data.id y generar pedidos/correos.
    console.error("MERCADOPAGO_WEBHOOK_SECRET not set — rejecting webhook (fail-closed)");
    return false;
  }

  const sigHeader = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id") ?? "";
  const { ts, v1 } = parseSignatureHeader(sigHeader);
  if (!ts || !v1) return false;

  // MP manifest: `id:<dataId>;request-id:<requestId>;ts:<ts>;`
  // IMPORTANT per MP docs: data.id MUST be lowercased in the manifest.
  // Ref: https://www.mercadopago.com.pe/developers/en/docs/your-integrations/notifications/webhooks#validate-origin
  const idLower = String(dataId).toLowerCase();
  const manifests = [
    `id:${idLower};request-id:${requestId};ts:${ts};`,
    // Fallback for legacy events that sign without request-id or with raw id
    `id:${idLower};ts:${ts};`,
    `id:${dataId};request-id:${requestId};ts:${ts};`,
  ];
  for (const m of manifests) {
    const expected = await hmacSha256Hex(secret, m);
    // Constant-time compare not critical here (HMAC output length is fixed)
    if (expected === v1) return true;
  }
  return false;
}

async function mpGet(path: string) {
  const token = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN missing");
  const r = await fetch(`https://api.mercadopago.com${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`MP ${path} failed ${r.status}: ${t}`);
  }
  return await r.json();
}

const fetchPayment = (id: string) => mpGet(`/v1/payments/${id}`);
const fetchPlan = (id: string) => mpGet(`/preapproval_plan/${id}`);
const fetchSubscription = (id: string) => mpGet(`/preapproval/${id}`);
const fetchInvoice = (id: string) => mpGet(`/authorized_payments/${id}`);
const fetchMerchantOrder = (id: string) => mpGet(`/merchant_orders/${id}`);

function getPaymentSkus(payment: any): string[] {
  return normalizeSkus([
    ...splitSkuList(payment.metadata?.skus),
    ...splitSkuList(payment.metadata?.sku),
    ...((payment.additional_info?.items ?? []).map((item: any) => item?.id || item?.title) as string[]),
  ]);
}

const ALERT_TO = "hola@ilinguerelax.com";
const ALERT_FROM = "Alertas ILINGUE <hola@ilinguerelax.com>";

async function raiseAlert(params: {
  reason: string;
  severity?: "warn" | "error" | "critical";
  data_id?: string;
  event_type?: string;
  http_status?: number;
  payload?: unknown;
  error_message?: string;
}) {
  const severity = params.severity ?? "error";
  console.error(`[MP ALERT ${severity}] ${params.reason}`, params);

  // 1. Log to DB (best-effort)
  let notified = false;
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 2. Send email via Resend (best-effort, only for error/critical)
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && severity !== "warn") {
      try {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: ALERT_FROM,
            to: [ALERT_TO],
            subject: `[MP Webhook ${severity.toUpperCase()}] ${params.reason}`,
            html: `
              <h2>Mercado Pago Webhook Alert</h2>
              <p><b>Severity:</b> ${severity}</p>
              <p><b>Reason:</b> ${params.reason}</p>
              <p><b>Event type:</b> ${params.event_type ?? "n/a"}</p>
              <p><b>Data ID:</b> ${params.data_id ?? "n/a"}</p>
              <p><b>HTTP status:</b> ${params.http_status ?? "n/a"}</p>
              <p><b>Error:</b> <code>${(params.error_message ?? "").slice(0, 500)}</code></p>
              <pre style="background:#f4f4f4;padding:8px;overflow:auto;font-size:12px">
${JSON.stringify(params.payload ?? {}, null, 2).slice(0, 3000)}
              </pre>
              <p style="color:#666;font-size:12px">Revisa el panel de Mercado Pago si el problema persiste.</p>
            `,
          }),
        });
        notified = r.ok;
        if (!r.ok) console.error("Resend alert failed:", r.status, await r.text());
      } catch (e) {
        console.error("Resend alert threw:", e);
      }
    }

    await supabase.from("webhook_alerts").insert({
      provider: "mercadopago",
      severity,
      reason: params.reason,
      data_id: params.data_id ?? null,
      event_type: params.event_type ?? null,
      http_status: params.http_status ?? null,
      payload: params.payload ?? null,
      error_message: params.error_message ?? null,
      notified,
    });
  } catch (e) {
    console.error("raiseAlert failed:", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // MP sends data.id both in body and query (?data.id=...&type=payment)
    const body = await req.json().catch(() => ({}));
    const dataId =
      body?.data?.id?.toString() ??
      url.searchParams.get("data.id") ??
      url.searchParams.get("id") ??
      "";
    const type = body?.type ?? body?.topic ?? url.searchParams.get("type") ?? "";

    console.log("MP webhook received:", { type, dataId, action: body?.action });

    if (!dataId) {
      // Bot/scanner golpeando la URL pública sin payload real. Ignorar en silencio
      // (sin log en DB, sin correo) para no llenar la bandeja de alertas falsas.
      console.log("MP webhook ignored: no data.id (probable bot/scanner)");
      return new Response(JSON.stringify({ received: true, ignored: "no data.id" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ok = await verifySignature(req, dataId);
    if (!ok) {
      // Firma inválida = bot/scanner. MP nunca movió dinero. Silencio total:
      // sin correo y sin insertar en webhook_alerts (evita spam y ruido).
      console.log("MP webhook rejected: invalid HMAC (probable bot/scanner)", { dataId, type });
      return new Response("Invalid signature", { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let logged: Record<string, unknown> | null = null;

    switch (type) {
      case "payment": {
        const payment = await fetchPayment(dataId);
        logged = {
          event_type: payment.status === "approved" ? "Purchase" : `mp_${payment.status}`,
          product_id: (payment.metadata?.skus ? String(payment.metadata.skus).split(",")[0].trim() : "")
            || getPaymentSkus(payment)[0]
            || payment.metadata?.source
            || "checkout-prueba-1",
          product_name: payment.description ?? "Mercado Pago",

          amount: payment.transaction_amount ?? null,
          currency: payment.currency_id ?? "PEN",
          country: payment.payer?.address?.country_id ?? "PE",
          metadata: {
            provider: "mercadopago",
            kind: "payment",
            payment_id: payment.id,
            status: payment.status,
            status_detail: payment.status_detail,
            payment_method: payment.payment_method_id,
            payment_type: payment.payment_type_id,
            payer_email: payment.payer?.email || payment.metadata?.customer_email,
            customer_email: payment.payer?.email || payment.metadata?.customer_email,
            customer_name: payment.metadata?.customer_name,
            customer_phone: payment.metadata?.customer_phone,
            preference_id: payment.metadata?.preference_id,
            external_reference: payment.external_reference,
            items_summary: payment.metadata?.items_summary || payment.description,
            skus: payment.metadata?.skus || getPaymentSkus(payment).join(","),
          },
        };

        // Send pending-payment emails for transferencia/efectivo/ticket/atm
        // so the customer keeps a receipt if the tab/battery dies.
        const isPending = payment.status === "pending" || payment.status === "in_process";
        const payerEmail = payment.payer?.email || payment.metadata?.customer_email;
        if (isPending && payerEmail) {
          const orderNumber = payment.external_reference || `MP-${payment.id}`;
          const method = payment.payment_type_id === "ticket"
            ? "Efectivo / Ticket (Mercado Pago)"
            : payment.payment_type_id === "bank_transfer"
              ? "Transferencia (Mercado Pago)"
              : payment.payment_type_id === "atm"
                ? "Cajero / ATM (Mercado Pago)"
                : `Mercado Pago (${payment.payment_method_id || payment.payment_type_id || "pendiente"})`;
          const customerName = [payment.payer?.first_name, payment.payer?.last_name]
            .filter(Boolean).join(" ") || payment.metadata?.customer_name || payerEmail.split("@")[0];
          const templateData = {
            orderNumber,
            customerName,
            productName: payment.metadata?.items_summary || payment.description || "Producto ILINGUE RELAX",
            amount: payment.transaction_amount ?? null,
            currency: payment.currency_id || "PEN",
            method,
            orderDate: payment.date_created || new Date().toISOString(),
          };
          const idemBase = `mp-pending-${payment.id}`;

          await logOrderEvent({
            orderNumber,
            event: "payment_pending",
            provider: "mercadopago",
            status: String(payment.status),
            method,
            reference: String(payment.id),
            detail: "Mercado Pago registró el pedido como pendiente de pago",
            customerEmail: payerEmail,
            amount: payment.transaction_amount ?? null,
            currency: payment.currency_id || "PEN",
            metadata: { paymentType: payment.payment_type_id, skus: getPaymentSkus(payment) },
          });
          // Fire both emails in parallel, best-effort
          await Promise.allSettled([
            supabase.functions.invoke("send-transactional-email", {
              body: {
                templateName: "customer-manual-pending",
                recipientEmail: payerEmail,
                idempotencyKey: `${idemBase}-customer`,
                templateData,
              },
            }),
            supabase.functions.invoke("send-transactional-email", {
              body: {
                templateName: "admin-manual-pending",
                recipientEmail: "hola@ilinguerelax.com",
                idempotencyKey: `${idemBase}-admin`,
                templateData: {
                  ...templateData,
                  customerEmail: payerEmail,
                  customerWhatsapp: payment.payer?.phone
                    ? `${payment.payer.phone.area_code || ""}${payment.payer.phone.number || ""}`
                    : "",
                  country: payment.payer?.address?.country_id || "",
                },
              },
            }),
          ]).catch((e) => console.error("MP pending emails failed:", e));
        }

        // Approved payment → send customer thank-you + admin-sale notification
        if (payment.status === "approved" && payerEmail) {
          const customerName = [payment.payer?.first_name, payment.payer?.last_name]
            .filter(Boolean).join(" ") || payment.metadata?.customer_name || payerEmail.split("@")[0];
          const orderNumber = payment.external_reference || `ILR-MP-${payment.id}`;
          const couponCode = String(payment.metadata?.coupon_code || "").trim().toUpperCase() || undefined;
          const couponPctRaw = Number(payment.metadata?.coupon_percent);
          const couponPercent = Number.isFinite(couponPctRaw) && couponPctRaw > 0 ? couponPctRaw : undefined;
          const skusForDelivery = getPaymentSkus(payment);

          await logOrderEvent({
            orderNumber,
            event: "payment_paid",
            provider: "mercadopago",
            status: "approved",
            method: payment.payment_type_id === "ticket"
              ? "Pago en efectivo (Mercado Pago)"
              : payment.payment_type_id === "bank_transfer"
              ? "Transferencia bancaria (Mercado Pago)"
              : payment.payment_type_id === "digital_wallet"
              ? "Billetera digital (Mercado Pago)"
              : `Mercado Pago (${payment.payment_method_id || payment.payment_type_id || "pago"})`,
            reference: String(payment.id),
            detail: "Pago confirmado por Mercado Pago",
            customerEmail: payerEmail,
            amount: payment.transaction_amount ?? null,
            currency: payment.currency_id || "PEN",
            metadata: { skus: skusForDelivery },
          });
          // Meta Conversions API: registrar la venta aunque el comprador no
          // regrese a la página de éxito (pixel del navegador puede no dispararse).
          await sendPurchaseCapi({
            eventId: `Purchase_${orderNumber}`,
            email: payerEmail,
            country: payment.payer?.address?.country_id || null,
            value: payment.transaction_amount ?? null,
            currency: payment.currency_id || "PEN",
            contentIds: skusForDelivery,
            contentName: payment.metadata?.items_summary || payment.description || undefined,
            orderId: orderNumber,
          });
          // Siempre enviamos "Gracias por tu compra" (con producto y precio).
          // Si además hay SKUs digitales, luego se dispara la entrega de materiales.
          try {
            await sendThankYouEmail({
              customerEmail: payerEmail,
              customerName,
              customerPhone: payment.metadata?.customer_phone || undefined,
              customerCountry: payment.payer?.address?.country_id || undefined,
              productName: payment.metadata?.items_summary || payment.description || "Producto ILINGUE RELAX",
              skus: skusForDelivery,
              amount: payment.transaction_amount ?? undefined,
              currency: payment.currency_id || "PEN",
              provider: "mercadopago",
              orderNumber,
              idempotencyKey: `mp-approved-${payment.id}`,
              couponCode,
              couponPercent,
            });
          } catch (e) {
            console.error("MP approved thank-you failed:", e);
          }
          try {
            const skus = getPaymentSkus(payment);
            if (skus.length > 0) {
              const { error: digitalErr } = await supabase.functions.invoke("send-digital-ilinguerelax", {
                body: {
                  customerEmail: payerEmail,
                  customerName,
                  customerPhone: payment.metadata?.customer_phone || undefined,
                  customerCountry: payment.payer?.address?.country_id || undefined,
                  orderId: orderNumber,
                  skus,
                  amount: payment.transaction_amount ?? undefined,
                  currency: payment.currency_id || "PEN",
                  provider: "mercadopago",
                  idempotencyKey: `digital:mp:${payment.id}`,
                },
              });
              await logOrderEvent({
                orderNumber,
                event: digitalErr ? "delivery_failed" : "delivery_sent",
                provider: "mercadopago",
                status: digitalErr ? "ERROR" : "SENT",
                reference: String(payment.id),
                detail: digitalErr
                  ? `Fallo al enviar la entrega digital: ${digitalErr.message}`
                  : `Entrega digital enviada a ${payerEmail} (${skus.join(", ")})`,
                customerEmail: payerEmail,
                metadata: { skus },
              });
              if (digitalErr) console.error("MP digital delivery failed:", digitalErr);
            } else {
              console.warn("MP approved payment has no delivery SKUs", { payment_id: payment.id, external_reference: payment.external_reference });
            }
          } catch (e) {
            console.error("MP digital delivery exception:", e);
          }
        }
        break;
      }
      case "plan": {
        const plan = await fetchPlan(dataId);
        logged = {
          event_type: "mp_plan_update",
          product_id: plan.id,
          product_name: plan.reason ?? "MP Plan",
          amount: plan.auto_recurring?.transaction_amount ?? null,
          currency: plan.auto_recurring?.currency_id ?? "PEN",
          country: "PE",
          metadata: { provider: "mercadopago", kind: "plan", plan_id: plan.id, status: plan.status },
        };
        break;
      }
      case "subscription":
      case "preapproval": {
        const sub = await fetchSubscription(dataId);
        logged = {
          event_type: "mp_subscription_update",
          product_id: sub.preapproval_plan_id ?? sub.id,
          product_name: sub.reason ?? "MP Subscription",
          amount: sub.auto_recurring?.transaction_amount ?? null,
          currency: sub.auto_recurring?.currency_id ?? "PEN",
          country: "PE",
          metadata: {
            provider: "mercadopago",
            kind: "subscription",
            subscription_id: sub.id,
            status: sub.status,
            payer_email: sub.payer_email,
            external_reference: sub.external_reference,
          },
        };
        break;
      }
      case "invoice":
      case "authorized_payment": {
        const invoice = await fetchInvoice(dataId);
        logged = {
          event_type: "mp_invoice_update",
          product_id: invoice.preapproval_id ?? invoice.id,
          product_name: invoice.reason ?? "MP Invoice",
          amount: invoice.transaction_amount ?? null,
          currency: invoice.currency_id ?? "PEN",
          country: "PE",
          metadata: {
            provider: "mercadopago",
            kind: "invoice",
            invoice_id: invoice.id,
            status: invoice.status,
            payment_id: invoice.payment?.id,
          },
        };
        break;
      }
      case "merchant_order": {
        const order = await fetchMerchantOrder(dataId);
        logged = {
          event_type: "mp_merchant_order",
          product_id: order.preference_id ?? order.id?.toString(),
          product_name: "MP Merchant Order",
          amount: order.total_amount ?? null,
          currency: order.currency_id ?? "PEN",
          country: "PE",
          metadata: {
            provider: "mercadopago",
            kind: "merchant_order",
            order_id: order.id,
            status: order.status,
            order_status: order.order_status,
            preference_id: order.preference_id,
            payments: (order.payments ?? []).map((p: any) => ({ id: p.id, status: p.status })),
          },
        };
        break;
      }
      case "point_integration_wh": {
        logged = {
          event_type: "mp_point_integration",
          product_id: dataId,
          product_name: "MP Point Integration",
          amount: null,
          currency: "PEN",
          country: "PE",
          metadata: { provider: "mercadopago", kind: "point_integration_wh", raw: body },
        };
        break;
      }
      default: {
        console.log("MP webhook ignored type:", type);
        return new Response(JSON.stringify({ received: true, ignored: type }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (logged) {
      const row = {
        event_name: logged.event_type as string,
        product_id: (logged.product_id as string) ?? null,
        value: (logged.amount as number) ?? null,
        currency: (logged.currency as string) ?? null,
        country: (logged.country as string) ?? null,
        page_path: `mp-webhook:${type}`,
        referrer: JSON.stringify(logged.metadata ?? {}).slice(0, 2000),
      };
      const { error: insErr } = await supabase.from("funnel_events").insert(row);
      if (insErr) {
        await raiseAlert({
          reason: "Insert en funnel_events falló",
          severity: "error",
          data_id: dataId,
          event_type: type,
          payload: row,
          error_message: insErr.message,
        });
      } else {
        console.log("MP event logged:", { type, dataId, event_name: row.event_name, value: row.value, currency: row.currency });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    await raiseAlert({
      reason: "Excepción no controlada en webhook MP",
      severity: "critical",
      error_message: err instanceof Error ? err.message : String(err),
      payload: { stack: err instanceof Error ? err.stack : undefined },
    });
    // Return 200 to avoid infinite retries when the problem is on our side.
    return new Response(JSON.stringify({ received: true, error: String(err) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
