import { z } from "npm:zod@3.23.8";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";
import { invokeInternalFunction } from "../_shared/invokeInternal.ts";

const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga",
  "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf",
]);
function toStripeAmount(amount: number, currency: string): number {
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currency.toLowerCase());
  return Math.round(isZeroDecimal ? amount : amount * 100);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BodySchema = z.object({
  environment: z.enum(["sandbox", "live"]).default("sandbox"),
  stripeCustomerId: z.string().min(1),
  upsellSku: z.string().min(1),
  upsellName: z.string().min(1),
  amountUsd: z.number().positive(),
  currency: z.string().length(3).default("usd"),
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  customerPhone: z.string().optional().default(""),
  customerCountry: z.string().length(2),
  originalOrderId: z.string().optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const body = parsed.data;
    const stripe = createStripeClient(body.environment as StripeEnv);

    // Busca el método de pago guardado más reciente de este Customer.
    const paymentMethods = await stripe.paymentMethods.list({
      customer: body.stripeCustomerId,
      type: "card",
      limit: 1,
    });
    const paymentMethodId = paymentMethods.data[0]?.id;
    if (!paymentMethodId) {
      return new Response(
        JSON.stringify({ error: "no_saved_card", message: "No se encontró una tarjeta guardada para este cliente." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const currency = body.currency.toLowerCase();
    const amount = toStripeAmount(body.amountUsd, currency);

    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        customer: body.stripeCustomerId,
        payment_method: paymentMethodId,
        off_session: true,
        confirm: true,
        description: `Upsell 1-clic: ${body.upsellName}`,
        receipt_email: body.customerEmail,
        metadata: {
          source: "post-purchase-upsell",
          sku: body.upsellSku,
          original_order: body.originalOrderId ?? "",
        },
      });
    } catch (chargeErr) {
      const e = chargeErr as { code?: string; message?: string };
      // El banco pidió verificación extra (3D Secure) — no se puede cobrar
      // automático. Le avisamos al frontend para que ofrezca pagar aparte.
      if (e.code === "authentication_required") {
        return new Response(
          JSON.stringify({ error: "authentication_required", message: "El banco requiere verificación adicional. Paga este upsell por separado." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw chargeErr;
    }

    if (paymentIntent.status !== "succeeded") {
      return new Response(
        JSON.stringify({ error: "not_succeeded", status: paymentIntent.status }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Cobro exitoso → entrega el upsell igual que cualquier compra digital.
    const deliveryBody = {
      customerEmail: body.customerEmail,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerCountry: body.customerCountry,
      orderId: paymentIntent.id,
      skus: [body.upsellSku],
      amount: body.amountUsd,
      currency: body.currency.toUpperCase(),
      provider: "stripe",
      idempotencyKey: `post-upsell:${paymentIntent.id}`,
    };
    const { error: digitalErr } = await invokeInternalFunction("send-digital-ilinguerelax", deliveryBody);
    if (digitalErr) {
      console.error("[charge-saved-payment-method] delivery failed after successful charge:", digitalErr);
    }

    return new Response(JSON.stringify({ success: true, paymentIntentId: paymentIntent.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("charge-saved-payment-method error:", err);
    const e = err as { message?: string };
    return new Response(
      JSON.stringify({ error: "charge_failed", message: e?.message?.slice(0, 200) ?? "No se pudo procesar el cobro." }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
