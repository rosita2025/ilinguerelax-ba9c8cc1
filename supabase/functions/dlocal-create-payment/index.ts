// dLocal Go — creación de pago (API REST)
// Docs: https://docs.dlocalgo.com/  ·  POST https://api.dlocalgo.com/v1/payments
// Devuelve `redirect_url` para enviar al comprador al checkout de dLocal Go.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import { normalizeSkus } from "../_shared/digitalSku.ts";
import { logOrderEvent } from "../_shared/orderEvents.ts";
import { resolveServerPricing, PricingError } from "../_shared/catalogPricing.ts";

// SEGURIDAD: el navegador solo aporta id y cantidad; precio, nombre y cupón
// se resuelven en el servidor desde el catálogo.
const ItemSchema = z.object({
  id: z.string().min(1).max(200),
  name: z.string().max(300).optional(),
  price: z.number().optional(),
  quantity: z.number().int().min(1).max(50),
});

const BodySchema = z.object({
  orderId: z.string().min(1).max(80).optional(),
  items: z.array(ItemSchema).min(1).max(20),
  couponPercent: z.number().min(0).max(100).optional(),
  couponCode: z.string().max(20).optional(),
  payerEmail: z.string().email(),
  payerName: z.string().min(1).max(120),
  payerPhone: z.string().max(30).optional(),
  payerDocument: z.string().max(30).optional(),
  country: z.string().length(2),
  paymentType: z.enum(["transfer", "cash", "wallet"]).optional(),
  currency: z.string().length(3).default("USD"),
  // Aceptados por compatibilidad con clientes viejos, pero IGNORADOS: el
  // importe se calcula siempre en el servidor desde el catálogo + FX propio.
  amount: z.number().positive().max(200000).optional(),
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

    // Precio autoritativo del servidor (ignora price/couponPercent del cliente).
    let pricing;
    try {
      pricing = await resolveServerPricing({
        items: body.items.map((i) => ({ id: i.id, quantity: i.quantity, price: i.price })),
        country: body.country,
        couponCode: body.couponCode,
      });
    } catch (e) {
      if (e instanceof PricingError) return json({ error: e.message }, 400);
      throw e;
    }
    const calculatedUsd = Number(pricing.totalUsd.toFixed(2));
    // SEGURIDAD: el navegador NO influye en el importe. Si mandó otro total,
    // solo lo registramos; el cobro usa el total del catálogo y la tasa FX
    // del servidor.
    const clientUsd = body.expectedTotalUsd ?? null;
    if (clientUsd && Math.abs(calculatedUsd - clientUsd) > 0.01) {
      console.warn("cart total mismatch (ignorado)", { clientUsd, calculatedUsd });
    }

    const orderId = body.orderId ?? `ILR-DL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const skus = normalizeSkus(pricing.items.map((i) => i.sku));
    const description = pricing.items.map((i) => `${i.quantity}x ${i.name}`).join(" · ").slice(0, 250);


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
      ...(pricing.couponCode ? { coupon: pricing.couponCode } : {}),
      ...(pricing.couponPercent ? { coupon_pct: String(pricing.couponPercent) } : {}),
      ...(body.payerPhone ? { phone: body.payerPhone } : {}),
      ...(body.paymentType ? { ptype: body.paymentType } : {}),

    });
    const notificationUrl = supabaseUrl
      ? `${supabaseUrl}/functions/v1/dlocal-webhook?${notifyParams.toString()}`
      : undefined;

    // Rail específico (transferencia / efectivo / billetera) como RESPALDO.
    // La consulta a /payment-methods es perezosa: el primer intento usa el
    // checkout completo de dLocal, que no necesita el rail, así que no
    // gastamos un viaje de red extra en el 99% de los pagos que salen bien.
    let railLookupDone = false;
    let paymentMethodId: string | undefined;
    const resolveRail = async (): Promise<string | undefined> => {
      if (railLookupDone || !body.paymentType) return paymentMethodId;
      railLookupDone = true;
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
      return paymentMethodId;
    };


    // Moneda oficial que dLocal Go acepta en cada país LatAm. Si el cliente
    // manda otra (por caché o geo-IP desfasado), cobramos en USD en vez de
    // fallar: dLocal acepta USD en toda su cobertura.
    const DLOCAL_CURRENCY: Record<string, string> = {
      AR: "ARS", BO: "BOB", BR: "BRL", CL: "CLP", CO: "COP", CR: "CRC",
      EC: "USD", GT: "GTQ", MX: "MXN", PA: "USD", PE: "PEN", PY: "PYG", UY: "UYU",
    };
    const countryCode = body.country.toUpperCase();
    // Monedas sin decimales: dLocal rechaza montos con centavos.
    const ZERO_DECIMAL = new Set(["CLP", "PYG", "COP", "ARS", "CRC", "GTQ"]);
    const requested = body.currency.toUpperCase();
    const expected = DLOCAL_CURRENCY[countryCode];
    // Si la moneda enviada no es la del país (ni USD), no intentamos en local.
    const localCurrency = !expected || requested === expected || requested === "USD"
      ? requested
      : "USD";
    const localAmount = localCurrency === "USD" && requested !== "USD"
      ? calculatedUsd
      : ZERO_DECIMAL.has(localCurrency)
      ? Math.round(body.amount * fxScale)
      : Number((body.amount * fxScale).toFixed(2));


    // dLocal rechaza el pago en su checkout ("la transacción no pudo ser
    // aprobada") cuando el pagador llega incompleto: nombre sin apellido,
    // teléfono con caracteres raros o sin referencia de usuario.
    const cleanName = body.payerName.replace(/\s+/g, " ").trim().slice(0, 100);
    const payerName = cleanName.includes(" ") ? cleanName : `${cleanName} .`;
    const rawPhone = (body.payerPhone ?? "").replace(/[^\d+]/g, "");
    const payerPhone = rawPhone.replace(/\+/g, "").length >= 8 ? rawPhone : undefined;
    const payerDocument = (body.payerDocument ?? "").replace(/[^\dA-Za-z]/g, "") || undefined;

    const payloadFor = (amount: number, currency: string): Record<string, unknown> => ({
      amount,
      currency,
      country: body.country.toUpperCase(),
      order_id: orderId,
      description,
      success_url: body.successUrl,
      back_url: body.backUrl,
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
      payer: {
        name: payerName,
        email: body.payerEmail,
        user_reference: body.payerEmail.toLowerCase(),
        ...(payerPhone ? { phone: payerPhone } : {}),
        ...(payerDocument ? { document: payerDocument } : {}),
      },
    });

    const basePayload = payloadFor(localAmount, localCurrency);

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

    // Cadena de intentos. El checkout hospedado va primero: fijar un
    // payment_method_id con flow REDIRECT hacía que dLocal creara el pago pero
    // luego lo rechazara en su página ("no pudo ser aprobada") cuando ese rail
    // exige datos extra. El rail fijo queda como respaldo y solo entonces
    // consultamos /payment-methods.
    // 1) checkout completo + moneda local · 2) rail elegido · 3) USD.
    const buildAttempts = async (): Promise<Array<{ label: string; payload: Record<string, unknown> }>> => {
      const rest: Array<{ label: string; payload: Record<string, unknown> }> = [];
      const rail = await resolveRail();
      if (rail) {
        rest.push({
          label: `rail ${rail}`,
          payload: { ...basePayload, payment_method_id: rail, payment_method_flow: "REDIRECT" },
        });
      }
      if (localCurrency !== "USD") {
        rest.push({ label: "checkout USD", payload: payloadFor(calculatedUsd, "USD") });
      }
      return rest;
    };

    let attempt = await createPayment(basePayload);
    let usedUsdFallback = false;
    if (!attempt.ok) {
      console.warn(`dLocal intento "checkout ${localCurrency}" falló [${attempt.status}]: ${attempt.text.slice(0, 200)}`);
      for (const next of await buildAttempts()) {
        attempt = await createPayment(next.payload);
        if (attempt.ok) {
          usedUsdFallback = next.label === "checkout USD";
          break;
        }
        console.warn(`dLocal intento "${next.label}" falló [${attempt.status}]: ${attempt.text.slice(0, 200)}`);
      }
    }

    if (!attempt.ok) {
      console.error(`dLocal Go create payment failed [${attempt.status}]: ${attempt.text}`);
      let msg = "No pudimos iniciar el pago con dLocal. Intenta de nuevo o elige otro método.";
      try {
        const code = Number(JSON.parse(attempt.text)?.code);
        if (code === 5016) msg = "El monto es menor al mínimo permitido por dLocal para tu país. Agrega otro producto o elige otro método de pago.";
        else if (code === 5000) msg = "dLocal no está disponible en tu país. Por favor elige otro método de pago.";
        else if (code === 5010) msg = "Ese método no está disponible ahora en tu país. Por favor elige otro método de pago.";
      } catch { /* respuesta no JSON */ }
      return json({ error: msg }, 502);
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

    // Auditoría del pedido: se ejecuta DESPUÉS de responder. El comprador
    // recibe el link de pago de inmediato y el historial se escribe en
    // segundo plano con waitUntil (la función sigue viva hasta terminarlo).
    const audit = (async () => {
      try {
        await Promise.all([
          logOrderEvent({
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
            metadata: {
              country: body.country.toUpperCase(),
              skus,
              localAmount: usedUsdFallback ? calculatedUsd : localAmount,
              localCurrency: usedUsdFallback ? "USD" : localCurrency,
              usdFallback: usedUsdFallback,
            },
          }),
          logOrderEvent({
            orderNumber: orderId,
            event: "payment_instructions",
            provider: "dlocalgo",
            status: "AWAITING_PAYMENT",
            method: methodLabel,
            reference: data.id ? String(data.id) : null,
            detail: "Cupón / QR / instrucciones de pago generados en dLocal Go",
            customerEmail: body.payerEmail,
            currency: usedUsdFallback ? "USD" : localCurrency,
            amount: usedUsdFallback ? calculatedUsd : localAmount,
          }),
        ]);
      } catch (e) {
        console.error("dLocal audit log failed:", e instanceof Error ? e.message : e);
      }
    })();
    const runtime = (globalThis as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } }).EdgeRuntime;
    if (runtime?.waitUntil) runtime.waitUntil(audit);
    else void audit;

    return json({ id: data.id, orderId, redirect_url: redirectUrl });

  } catch (err) {
    console.error("dlocal-create-payment error:", err);
    return json({ error: "No pudimos iniciar el pago. Intenta de nuevo en unos segundos." }, 500);
  }

});
