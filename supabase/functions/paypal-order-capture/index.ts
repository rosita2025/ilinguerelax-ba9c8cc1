// PayPal directo: confirma (captura) la orden cuando el cliente vuelve de PayPal y entrega el producto.
// Es idempotente: si el cliente recarga la página, no se entrega dos veces.
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.25.76";
import { sendThankYouEmail } from "../_shared/thankYouEmail.ts";
import { sendPurchaseCapi } from "../_shared/metaCapi.ts";
import { invokeInternalFunction } from "../_shared/invokeInternal.ts";
import { logOrderEvent } from "../_shared/orderEvents.ts";

const BodySchema = z.object({ paypalOrderId: z.string().min(5).max(64).regex(/^[A-Za-z0-9-]+$/) });

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const paypalBase = () => (Deno.env.get("PAYPAL_ENV") === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com");

// El token de PayPal dura ~9 horas: se reutiliza mientras la instancia siga viva (ahorra una llamada a PayPal por pago).
let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;
  const id = Deno.env.get("PAYPAL_CLIENT_ID");
  // PAYPAL_CLIENT_SECRET es el nombre nuevo; PAYPAL_SECRET es el de la versión anterior: se prueban los dos si hace falta.
  const secrets = [Deno.env.get("PAYPAL_CLIENT_SECRET"), Deno.env.get("PAYPAL_SECRET")]
    .filter((v, i, arr): v is string => !!v && arr.indexOf(v) === i);
  if (!id || secrets.length === 0) throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET no configurados");
  let last = "";
  for (const secret of secrets) {
    const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
      method: "POST",
      headers: { Authorization: `Basic ${btoa(`${id}:${secret}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.access_token) {
      cachedToken = { value: data.access_token as string, expiresAt: Date.now() + Math.max(60, Math.min(Number(data.expires_in) || 3000, 3000) - 120) * 1000 };
      return data.access_token as string;
    }
    last = `PayPal auth ${res.status}: ${data?.error_description || data?.error || "sin token"} (${Deno.env.get("PAYPAL_ENV") === "sandbox" ? "modo sandbox" : "modo live"})`;
  }
  throw new Error(last);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Invalid input" }, 400);
    const { paypalOrderId } = parsed.data;

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // El pedido lo creó nuestro servidor: sin ese registro no se captura nada.
    const { data: created } = await supabase
      .from("order_events")
      .select("order_number, customer_email, amount, currency, metadata")
      .eq("provider", "paypal")
      .eq("event", "order_created")
      .eq("reference", paypalOrderId)
      .limit(1)
      .maybeSingle();
    if (!created) return json({ status: "not_found" }, 404);

    const orderNumber = String(created.order_number);
    const email = String(created.customer_email ?? "");
    const meta = (created.metadata ?? {}) as Record<string, unknown>;

    const { data: alreadyPaid } = await supabase
      .from("order_events")
      .select("id")
      .eq("order_number", orderNumber)
      .eq("event", "payment_paid")
      .limit(1)
      .maybeSingle();
    if (alreadyPaid) return json({ status: "paid", orderNumber, email });

    const token = await accessToken();
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    let orderData: Record<string, any> | null = null;

    const capRes = await fetch(`${paypalBase()}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: "POST",
      headers: { ...headers, "PayPal-Request-Id": `capture-${paypalOrderId}` },
      body: "{}",
    });
    orderData = await capRes.json().catch(() => ({}));
    if (!capRes.ok) {
      const issue = JSON.stringify(orderData?.details ?? orderData?.name ?? "").toUpperCase();
      if (capRes.status === 422 && issue.includes("ORDER_ALREADY_CAPTURED")) {
        const getRes = await fetch(`${paypalBase()}/v2/checkout/orders/${paypalOrderId}`, { headers });
        orderData = await getRes.json().catch(() => ({}));
      } else {
        console.error("PayPal capture error:", capRes.status, JSON.stringify(orderData).slice(0, 800));
        await logOrderEvent({ orderNumber, event: "payment_failed", provider: "paypal", status: "ERROR", method: "PayPal", reference: paypalOrderId, detail: `Captura rechazada (${capRes.status}) ${issue.slice(0, 200)}`, customerEmail: email });
        return json({ status: "failed", orderNumber, email });
      }
    }

    const capture = orderData?.purchase_units?.[0]?.payments?.captures?.[0];
    const captureStatus = String(capture?.status ?? orderData?.status ?? "").toUpperCase();
    if (captureStatus === "PENDING") {
      await logOrderEvent({ orderNumber, event: "payment_pending", provider: "paypal", status: "PENDING", method: "PayPal", reference: paypalOrderId, detail: "PayPal dejó el pago pendiente de revisión", customerEmail: email });
      return json({ status: "pending", orderNumber, email });
    }
    if (captureStatus !== "COMPLETED") {
      await logOrderEvent({ orderNumber, event: "payment_failed", provider: "paypal", status: captureStatus || "UNKNOWN", method: "PayPal", reference: paypalOrderId, detail: `Estado de PayPal: ${captureStatus || "desconocido"}`, customerEmail: email });
      return json({ status: "failed", orderNumber, email });
    }

    // Seguridad: lo cobrado debe coincidir con lo que creó el servidor.
    const paidValue = Number(capture?.amount?.value);
    const paidCurrency = String(capture?.amount?.currency_code ?? "").toUpperCase();
    const expected = Number(created.amount);
    if (!(Math.abs(paidValue - expected) <= 0.01) || paidCurrency !== String(created.currency ?? "").toUpperCase()) {
      console.error("PayPal amount mismatch", { paidValue, paidCurrency, expected, currency: created.currency, orderNumber });
    }

    const skus = (Array.isArray(meta.skus) ? meta.skus : []) as string[];
    const itemsSummary = String(meta.itemsSummary ?? "Producto iLingue Relax");
    const payerName = String(meta.payerName || orderData?.payer?.name?.given_name || email.split("@")[0] || "");
    const country = String(meta.country || orderData?.payer?.address?.country_code || "");
    const couponCode = String(meta.couponCode || "").trim().toUpperCase() || undefined;
    const couponPercent = Number(meta.couponPercent) > 0 ? Number(meta.couponPercent) : undefined;
    const captureId = String(capture?.id ?? paypalOrderId);

    await logOrderEvent({
      orderNumber, event: "payment_paid", provider: "paypal", status: "COMPLETED", method: "PayPal",
      reference: captureId, detail: "Pago confirmado por PayPal", customerEmail: email,
      amount: paidValue, currency: paidCurrency, metadata: { skus, paypalOrderId },
    });

    // Cuenta la compra en la analítica del admin (misma tabla que usan los otros métodos).
    try {
      await supabase.from("funnel_events").insert({
        event_name: "Purchase",
        product_id: skus[0] ?? null,
        value: paidValue,
        currency: paidCurrency,
        country: country || null,
        page_path: "paypal-capture",
        referrer: JSON.stringify({ provider: "paypal", orderNumber, paypalOrderId, customer_email: email, skus }).slice(0, 2000),
      });
    } catch (e) {
      console.error("paypal funnel_events insert failed:", e);
    }

    await sendPurchaseCapi({
      eventId: `Purchase_${orderNumber}`, email, country: country || null, value: paidValue,
      currency: paidCurrency, contentIds: skus, contentName: itemsSummary, orderId: orderNumber,
    });

    try {
      await sendThankYouEmail({
        customerEmail: email, customerName: payerName, customerPhone: String(meta.payerPhone || "") || undefined,
        customerCountry: country || undefined, productName: itemsSummary, skus, amount: paidValue,
        currency: paidCurrency, provider: "paypal", orderNumber, idempotencyKey: `paypal-approved-${captureId}`,
        couponCode, couponPercent,
      });
    } catch (e) {
      console.error("PayPal thank-you failed:", e);
    }

    try {
      if (skus.length > 0) {
        const { error: digitalErr } = await invokeInternalFunction("send-digital-ilinguerelax", {
          customerEmail: email, customerName: payerName, customerPhone: String(meta.payerPhone || "") || undefined,
          customerCountry: country || undefined, orderId: orderNumber, skus, amount: paidValue,
          currency: paidCurrency, provider: "paypal", idempotencyKey: `digital:paypal:${captureId}`,
        });
        await logOrderEvent({
          orderNumber, event: digitalErr ? "delivery_failed" : "delivery_sent", provider: "paypal",
          status: digitalErr ? "ERROR" : "SENT", reference: captureId,
          detail: digitalErr ? `Fallo al enviar la entrega digital: ${digitalErr.message}` : `Entrega digital enviada a ${email} (${skus.join(", ")})`,
          customerEmail: email, metadata: { skus },
        });
      } else {
        console.warn("PayPal paid order has no delivery SKUs", { orderNumber });
      }
    } catch (e) {
      console.error("PayPal digital delivery exception:", e);
    }

    return json({ status: "paid", orderNumber, email });
  } catch (err) {
    console.error("paypal-order-capture error:", err);
    return json({ status: "error" }, 500);
  }
});
