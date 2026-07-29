// dLocal Go — creación de pago (API REST)
// Docs: https://docs.dlocalgo.com/  ·  POST https://api.dlocalgo.com/v1/payments
// Devuelve `redirect_url` para enviar al comprador al checkout de dLocal Go.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import { normalizeSkus } from "../_shared/digitalSku.ts";
import { logOrderEvent } from "../_shared/orderEvents.ts";

const ItemSchema = z.object({
  id: z.string().min(1).max(200),
  name: z.string().min(1).max(300),
  price: z.number().positive().max(10000),
  quantity: z.number().int().min(1).max(50),
});

const BodySchema = z.object({
  orderId: z.string().min(1).max(80).optional(),
  items: z.array(ItemSchema).min(1).max(20),
  couponPercent: z.number().min(0).max(90).default(0),
  couponCode: z.string().max(20).optional(),
  payerEmail: z.string().email(),
  payerName: z.string().min(1).max(120),
  payerPhone: z.string().max(30).optional(),
  country: z.string().length(2),
  paymentType: z.enum(["transfer", "cash", "wallet"]).optional(),
  currency: z.string().length(3).default("USD"),
  amount: z.number().positive().max(200000),
  expectedTotalUsd: z.number().positive().max(200000).optional(),
  successUrl: z.string().url(),
  backUrl: z.string().url(),
});

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("DLOCAL_GO_API_KEY");
  const secretKey = Deno.env.get("DLOCAL_GO_SECRET_KEY");
  if (!apiKey || !secretKey) return json({ error: "dLocal Go no está configurado" }, 500);

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, 400);
    }
    const body = parsed.data;

    // Validación server-side del total en USD (evita manipulación del carrito).
    const discount = 1 - body.couponPercent / 100;
    const calculatedUsd = Number(
      body.items.reduce((sum, i) => sum + i.price * i.quantity * discount, 0).toFixed(2),
    );
    if (body.expectedTotalUsd && Math.abs(calculatedUsd - body.expectedTotalUsd) > 0.01) {
      return json({ error: "Cart total mismatch" }, 400);
    }

    const orderId = body.orderId ?? `ILR-DL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const skus = normalizeSkus(body.items.map((i) => i.id));
    const description = body.items.map((i) => `${i.quantity}x ${i.name}`).join(" · ").slice(0, 250);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    // Los datos de entrega viajan en la URL de notificación: dLocal Go la llama
    // tal cual la enviamos, así el webhook sabe qué SKUs entregar sin tabla extra.
    const notifyParams = new URLSearchParams({
      order: orderId,
      email: body.payerEmail,
      name: body.payerName,
      country: body.country.toUpperCase(),
      skus: skus.join(","),
      summary: description,
      usd: String(calculatedUsd),
      ...(body.couponCode ? { coupon: body.couponCode } : {}),
      ...(body.couponPercent ? { coupon_pct: String(body.couponPercent) } : {}),
      ...(body.payerPhone ? { phone: body.payerPhone } : {}),
      ...(body.paymentType ? { ptype: body.paymentType } : {}),

    });
    const notificationUrl = supabaseUrl
      ? `${supabaseUrl}/functions/v1/dlocal-webhook?${notifyParams.toString()}`
      : undefined;

    // Restringe el checkout de dLocal Go a un solo tipo de rail (transferencia
    // o efectivo). Consultamos los métodos disponibles del país y elegimos el
    // primero cuyo tipo coincida; si la consulta falla, dejamos el checkout
    // completo de dLocal (mejor cobrar que bloquear la venta).
    let paymentMethodId: string | undefined;
    if (body.paymentType) {
      try {
        const pmResp = await fetch(
          `https://api.dlocalgo.com/v1/payment-methods?country=${body.country.toUpperCase()}`,
          { headers: { Authorization: `Bearer ${apiKey}:${secretKey}` } },
        );
        if (pmResp.ok) {
          const list = await pmResp.json();
          const methods: Array<Record<string, unknown>> = Array.isArray(list)
            ? list
            : Array.isArray((list as { data?: unknown[] }).data)
            ? (list as { data: Array<Record<string, unknown>> }).data
            : [];
          const wanted = body.paymentType === "cash"
            ? ["TICKET", "CASH"]
            : body.paymentType === "wallet"
            ? ["WALLET", "E_WALLET", "EWALLET", "DIGITAL_WALLET"]
            : ["BANK_TRANSFER", "BANK-TRANSFER", "TRANSFER", "BANK"];
          const match = methods.find((m) => {
            const type = String(m.type ?? m.payment_method_type ?? "").toUpperCase().replace(/\s+/g, "_");
            return wanted.includes(type);
          });
          const id = match?.id ?? match?.payment_method_id;
          if (id) paymentMethodId = String(id);
        } else {
          console.warn(`dLocal payment-methods lookup failed [${pmResp.status}]`);
        }
      } catch (e) {
        console.warn("dLocal payment-methods lookup error:", e);
      }
    }

    const basePayload: Record<string, unknown> = {
      amount: Number(body.amount.toFixed(2)),
      currency: body.currency.toUpperCase(),
      country: body.country.toUpperCase(),
      order_id: orderId,
      description,
      success_url: body.successUrl,
      back_url: body.backUrl,
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
      payer: {
        name: body.payerName.slice(0, 100),
        email: body.payerEmail,
        ...(body.payerPhone ? { phone: body.payerPhone } : {}),
      },
    };

    const createPayment = async (payload: Record<string, unknown>) => {
      const resp = await fetch("https://api.dlocalgo.com/v1/payments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}:${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      return { ok: resp.ok, status: resp.status, text: await resp.text() };
    };

    // Intento 1: checkout restringido al rail elegido (transferencia / efectivo /
    // billetera). Intento 2 (fallback): checkout completo de dLocal, para que un
    // método no disponible en el país nunca haga fallar la venta.
    let attempt = await createPayment(
      paymentMethodId
        ? { ...basePayload, payment_method_id: paymentMethodId, payment_method_flow: "REDIRECT" }
        : basePayload,
    );
    if (!attempt.ok && paymentMethodId) {
      console.warn(
        `dLocal create payment falló con payment_method_id=${paymentMethodId} [${attempt.status}]; reintentando sin restricción`,
      );
      attempt = await createPayment(basePayload);
    }

    if (!attempt.ok) {
      console.error(`dLocal Go create payment failed [${attempt.status}]: ${attempt.text}`);
      return json({ error: "No pudimos iniciar el pago con dLocal. Intenta de nuevo o elige otro método." }, 502);
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(attempt.text);
    } catch {
      console.error("dLocal Go respuesta no-JSON:", attempt.text.slice(0, 500));
      return json({ error: "Respuesta inválida de dLocal. Intenta de nuevo." }, 502);
    }

    const redirectUrl = (data.redirect_url || (data as any).redirectUrl) as string | undefined;
    if (!redirectUrl) {
      console.error("dLocal Go response without redirect_url:", attempt.text.slice(0, 500));
      return json({ error: "dLocal no devolvió la URL de pago. Intenta de nuevo." }, 502);
    }

    const methodLabel = body.paymentType === "cash"
      ? "Pago en efectivo (dLocal Go)"
      : body.paymentType === "wallet"
      ? "Billetera digital (dLocal Go)"
      : body.paymentType === "transfer"
      ? "Transferencia bancaria (dLocal Go)"
      : "dLocal Go";

    await logOrderEvent({
      orderNumber: orderId,
      event: "order_created",
      provider: "dlocalgo",
      status: "CREATED",
      method: methodLabel,
      reference: data.id ? String(data.id) : null,
      detail: description,
      customerEmail: body.payerEmail,
      amount: calculatedUsd,
      currency: "USD",
      metadata: { country: body.country.toUpperCase(), skus, localAmount: body.amount, localCurrency: body.currency },
    });
    await logOrderEvent({
      orderNumber: orderId,
      event: "payment_instructions",
      provider: "dlocalgo",
      status: "AWAITING_PAYMENT",
      method: methodLabel,
      reference: data.id ? String(data.id) : null,
      detail: "Cupón / QR / instrucciones de pago generados en dLocal Go",
      customerEmail: body.payerEmail,
      currency: body.currency.toUpperCase(),
      amount: body.amount,
    });

    return json({ id: data.id, orderId, redirect_url: redirectUrl });

  } catch (err) {
    console.error("dlocal-create-payment error:", err);
    return json({ error: "No pudimos iniciar el pago. Intenta de nuevo en unos segundos." }, 500);
  }

});
