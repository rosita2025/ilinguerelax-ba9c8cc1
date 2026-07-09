import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";

const ItemSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
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
  // Peruvian Soles conversion rate (approx). Frontend can override.
  usdToPen: z.number().positive().max(10).default(3.75),
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

    // Convert USD -> PEN (Mercado Pago Peru operates in Soles).
    const mpItems = body.items.map((item) => ({
      id: item.id,
      title: item.name.slice(0, 250),
      description: item.description?.slice(0, 250) ?? undefined,
      picture_url: item.image ?? undefined,
      quantity: item.quantity,
      currency_id: "PEN",
      unit_price: Number((item.price * discountMultiplier * body.usdToPen).toFixed(2)),
    }));

    const preferencePayload: Record<string, unknown> = {
      items: mpItems,
      back_urls: {
        success: body.successUrl ?? body.returnUrl,
        failure: body.failureUrl ?? body.returnUrl,
        pending: body.pendingUrl ?? body.returnUrl,
      },
      auto_return: body.autoReturn,
      statement_descriptor: "ILINGUE RELAX",
      external_reference: body.orderId ?? crypto.randomUUID(),
      binary_mode: false,
      metadata: {
        source: "checkout-prueba-1",
        order_id: body.orderId ?? "",
        coupon_code: body.couponCode ?? "",
        coupon_percent: body.couponPercent,
        usd_to_pen: body.usdToPen,
        total_usd: calculatedTotalUsd,
        item_count: body.items.reduce((sum, item) => sum + item.quantity, 0),
      },
      // Filtrar tipos según selección del cliente
      payment_methods: {
        excluded_payment_types:
          body.paymentType === "yape"
            ? [{ id: "credit_card" }, { id: "debit_card" }, { id: "ticket" }, { id: "atm" }, { id: "bank_transfer" }]
            : body.paymentType === "transfer"
            ? [{ id: "credit_card" }, { id: "debit_card" }, { id: "ticket" }, { id: "atm" }, { id: "digital_wallet" }, { id: "account_money" }]
            : body.paymentType === "cash"
            ? [{ id: "credit_card" }, { id: "debit_card" }, { id: "bank_transfer" }, { id: "digital_wallet" }, { id: "account_money" }]
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
        JSON.stringify({ error: data?.message || "MP error", details: data }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        id: data.id,
        init_point: data.init_point,
        sandbox_init_point: data.sandbox_init_point,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("create-mercadopago-preference error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
