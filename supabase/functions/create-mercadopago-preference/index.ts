import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import { normalizeSkus } from "../_shared/digitalSku.ts";
import { logOrderEvent } from "../_shared/orderEvents.ts";

const ItemSchema = z.object({
  id: z.string().min(1).max(200),
  name: z.string().min(1).max(300),
  price: z.number().positive().max(10000),
  quantity: z.number().int().min(1).max(50),
  image: z.string().url().optional(),
  description: z.string().max(500).optional(),
});

const BodySchema = z.object({
  orderId: z.string().min(1).max(80).optional(),
  items: z.array(ItemSchema).min(1).max(20),
  couponPercent: z.number().min(0).max(90).default(0),
  couponCode: z.string().max(20).optional(),
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
    const discountMultiplier = 1 - body.couponPercent / 100;
    const calculatedTotalUsd = Number(
      body.items
        .reduce((sum, item) => sum + item.price * item.quantity * discountMultiplier, 0)
        .toFixed(2),
    );

    if (body.expectedTotalUsd && Math.abs(calculatedTotalUsd - body.expectedTotalUsd) > 0.01) {
      return new Response(
        JSON.stringify({ error: "Cart total mismatch" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Enviamos precios en USD y dejamos que Mercado Pago aplique el tipo de
    // cambio local del comprador automáticamente (no hacemos conversión manual).
    const mpItems = body.items.map((item) => ({
      id: item.id,
      title: item.name.slice(0, 250),
      description: item.description?.slice(0, 250) ?? undefined,
      picture_url: item.image ?? undefined,
      quantity: item.quantity,
      currency_id: "USD",
      unit_price: Number((item.price * discountMultiplier).toFixed(2)),
    }));
    const productSummary = body.items
      .map((i) => `${i.quantity}x ${i.name}`)
      .join(" · ")
      .slice(0, 300);
    const deliverySkus = normalizeSkus(body.items.map((i) => i.id)).join(",").slice(0, 490);

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
      statement_descriptor: "ILINGUE RELAX",
      external_reference: orderNumber,
      binary_mode: false,
      metadata: {
        source: "checkout-prueba-1",
        order_id: orderNumber,
        coupon_code: body.couponCode ?? "",
        coupon_percent: body.couponPercent,
        total_usd: calculatedTotalUsd,
        item_count: body.items.reduce((sum, item) => sum + item.quantity, 0),
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
