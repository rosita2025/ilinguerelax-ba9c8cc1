const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa", "Access-Control-Allow-Methods": "POST, OPTIONS" };
import { z } from "npm:zod@3.23.8";
import { normalizeSkus } from "../_shared/digitalSku.ts";
import { logOrderEvent } from "../_shared/orderEvents.ts";
import { resolveServerPricing, PricingError, localTotalFromPricing } from "../_shared/catalogPricing.ts";

// SEGURIDAD: precio/nombre del cliente se ignoran; se resuelven en servidor.
const ItemSchema = z.object({
  id: z.string().min(1).max(200),
  name: z.string().max(300).optional(),
  price: z.number().optional(),
  quantity: z.number().int().min(1).max(50),
  image: z.string().max(500).optional(),
  description: z.string().max(500).optional(),
});

const BodySchema = z.object({
  orderId: z.string().min(1).max(80).optional(),
  items: z.array(ItemSchema).min(1).max(20),
  couponPercent: z.number().min(0).max(100).optional(),
  country: z.string().length(2).optional(),
  couponCode: z.string().max(30).optional(),
  payerEmail: z.string().email().optional(),
  payerName: z.string().max(120).optional(),
  payerPhone: z.string().max(30).optional(),
  expectedTotalUsd: z.number().positive().max(200000).optional(),
  returnUrl: z.string().url(),
  successUrl: z.string().url().optional(),
  failureUrl: z.string().url().optional(),
  pendingUrl: z.string().url().optional(),
  autoReturn: z.enum(["approved", "all"]).default("approved"),
  // Deprecated: la conversión ahora la hace Mercado Pago automáticamente.
  usdToPen: z.number().positive().max(10).optional(),
  // Filtro opcional: "yape" (solo billeteras), "transfer" (solo transferencias bancarias), "all"
  paymentType: z.enum(["yape", "transfer", "cash", "all"]).default("all"),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
  if (!accessToken) {
    return new Response(
      JSON.stringify({ error: "MERCADOPAGO_ACCESS_TOKEN no configurado" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
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
    let pricing;
    try {
      pricing = await resolveServerPricing({
        items: body.items.map((i) => ({ id: i.id, quantity: i.quantity, price: i.price })),
        country: body.country ?? "PE",
        couponCode: body.couponCode,
      });
    } catch (e) {
      if (e instanceof PricingError) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw e;
    }
    const discountMultiplier = 1 - pricing.couponPercent / 100;
    const calculatedTotalUsd = Number(pricing.totalUsd.toFixed(2));

    if (body.expectedTotalUsd && Math.abs(calculatedTotalUsd - body.expectedTotalUsd) > 0.01) {
      // No bloqueamos la venta: cobramos el total del catálogo y lo registramos.
      console.warn("cart total adjusted", {
        clientUsd: body.expectedTotalUsd,
        calculatedUsd: calculatedTotalUsd,
      });
    }

    // Perú (moneda de la cuenta MP): cobramos en SOLES el importe EXACTO que
    // vio el comprador, usando el precio local del catálogo (`local_prices` /
    // `price_pen`) en vez de dejar que MP aplique su propio tipo de cambio.
    // En el resto de países la cuenta solo admite USD, así que se mantiene USD.
    const buyerCountry = String(body.country ?? "PE").toUpperCase().slice(0, 2);
    const penTotal = buyerCountry === "PE" ? await localTotalFromPricing(pricing, "PEN") : null;
    const useLocal = penTotal != null && penTotal > 0;

    const usdSubtotal = pricing.items.reduce(
      (sum, i) => sum + i.unitUsd * discountMultiplier * i.quantity,
      0,
    );
    // Repartimos el total local entre los ítems respetando su peso relativo,
    // para que la suma coincida al céntimo con el total mostrado.
    const mpItems = pricing.items.map((item) => {
      const usdLine = item.unitUsd * discountMultiplier;
      const unitLocal = useLocal && usdSubtotal > 0
        ? Number(((usdLine / usdSubtotal) * (penTotal as number)).toFixed(2))
        : 0;
      return {
        id: item.id,
        title: item.name.slice(0, 250),
        description: item.description?.slice(0, 250) ?? undefined,
        picture_url: item.image ?? undefined,
        quantity: item.quantity,
        currency_id: useLocal ? "PEN" : "USD",
        unit_price: useLocal ? unitLocal : Number(usdLine.toFixed(2)),
      };
    });
    const productSummary = pricing.items
      .map((i) => `${i.quantity}x ${i.name}`)
      .join(" · ")
      .slice(0, 300);
    const deliverySkus = normalizeSkus(pricing.items.map((i) => i.sku)).join(",").slice(0, 490);

    // Número de pedido legible (ILR-MP-XXXXXX). Es la referencia que ve el
    // cliente en /mi-pedido y la que usa soporte junto con su correo.
    const orderNumber = (body.orderId ?? `ILR-MP-${crypto.randomUUID().slice(0, 6).toUpperCase()}`).toUpperCase();
    const methodLabel = body.paymentType === "yape"
      ? "Billetera digital (Mercado Pago)"
      : body.paymentType === "transfer"
      ? "Transferencia bancaria (Mercado Pago)"
      : body.paymentType === "cash"
      ? "Pago en efectivo (Mercado Pago)"
      : "Mercado Pago";

    // Webhook URL — Mercado Pago llamará aquí en cada cambio de estado del pago.
    // Sin esto el webhook nunca se dispara (fue el bug encontrado en el test live).
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const notificationUrl = supabaseUrl
      ? `${supabaseUrl}/functions/v1/mercadopago-webhook`
      : undefined;

    const preferencePayload: Record<string, unknown> = {
      items: mpItems,
      back_urls: {
        success: body.successUrl ?? body.returnUrl,
        failure: body.failureUrl ?? body.returnUrl,
        pending: body.pendingUrl ?? body.returnUrl,
      },
      auto_return: body.autoReturn,
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
      statement_descriptor: "iLingue Relax",
      external_reference: orderNumber,
      binary_mode: false,
      metadata: {
        source: "checkout-prueba-1",
        order_id: orderNumber,
        coupon_code: pricing.couponCode ?? "",
        coupon_percent: pricing.couponPercent,
        total_usd: calculatedTotalUsd,
        item_count: pricing.items.reduce((sum, item) => sum + item.quantity, 0),
        items_summary: productSummary,
        skus: deliverySkus,
        customer_email: body.payerEmail ?? "",
        customer_name: body.payerName ?? "",
        customer_phone: body.payerPhone ?? "",
      },
      // Filtrar tipos según selección del cliente
      payment_methods: {
        excluded_payment_types:
          body.paymentType === "yape"
            ? [{ id: "credit_card" }, { id: "debit_card" }, { id: "ticket" }, { id: "atm" }, { id: "bank_transfer" }]
            : body.paymentType === "transfer"
            ? [{ id: "credit_card" }, { id: "debit_card" }, { id: "ticket" }, { id: "atm" }, { id: "digital_wallet" }]
            : body.paymentType === "cash"
            ? [{ id: "credit_card" }, { id: "debit_card" }, { id: "bank_transfer" }, { id: "digital_wallet" }]
            : [],
        installments: 12,
      },
    };

    if (body.payerEmail || body.payerName) {
      const nameParts = (body.payerName ?? "").trim().split(/\s+/);
      const payer: Record<string, unknown> = {};
      if (body.payerEmail) payer.email = body.payerEmail;
      if (nameParts[0]) payer.name = nameParts[0].slice(0, 50);
      if (nameParts.length > 1) payer.surname = nameParts.slice(1).join(" ").slice(0, 50);
      if (body.payerPhone) {
        const digits = body.payerPhone.replace(/\D/g, "");
        if (digits) payer.phone = { area_code: "", number: digits };
      }
      preferencePayload.payer = payer;
    }

    const resp = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferencePayload),
    });

    const data = await resp.json();
    if (!resp.ok) {
      console.error("MP preference error:", data);
      return new Response(
        JSON.stringify({ error: "No pudimos iniciar el pago con Mercado Pago. Intenta de nuevo o elige otro método." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await logOrderEvent({
      orderNumber,
      event: "order_created",
      provider: "mercadopago",
      status: "CREATED",
      method: methodLabel,
      reference: data.id ? String(data.id) : null,
      detail: productSummary,
      customerEmail: body.payerEmail ?? null,
      amount: calculatedTotalUsd,
      currency: "USD",
      metadata: { skus: deliverySkus, paymentType: body.paymentType },
    });
    if (body.paymentType === "transfer" || body.paymentType === "cash" || body.paymentType === "yape") {
      await logOrderEvent({
        orderNumber,
        event: "payment_instructions",
        provider: "mercadopago",
        status: "AWAITING_PAYMENT",
        method: methodLabel,
        reference: data.id ? String(data.id) : null,
        detail: "Instrucciones de pago (cupón / QR / transferencia) generadas en Mercado Pago",
        customerEmail: body.payerEmail ?? null,
        amount: calculatedTotalUsd,
        currency: "USD",
      });
    }

    return new Response(
      JSON.stringify({
        id: data.id,
        orderId: orderNumber,
        init_point: data.init_point,
        sandbox_init_point: data.sandbox_init_point,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("create-mercadopago-preference error:", err);
    return new Response(
      JSON.stringify({ error: "No pudimos iniciar el pago. Intenta de nuevo en unos segundos." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
