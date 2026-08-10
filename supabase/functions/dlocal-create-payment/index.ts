// dLocal Go — creación de pago (API REST)
// Docs: https://docs.dlocalgo.com/  ·  POST https://api.dlocalgo.com/v1/payments
// Devuelve `redirect_url` para enviar al comprador al checkout de dLocal Go.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import { normalizeSkus } from "../_shared/digitalSku.ts";
import { logOrderEvent } from "../_shared/orderEvents.ts";
import { resolveServerPricing, PricingError, localTotalFromPricing } from "../_shared/catalogPricing.ts";
import { dlocalApiBase } from "../_shared/dlocal.ts";
import { sendInternalEmail } from "../_shared/sendInternalEmail.ts";


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
  // Tarjeta dLocal desactivada; transferencia, efectivo y billetera activas.
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
    // Public brand always visible on the dLocal Go payment / bank voucher.
    const description = `iLingue Relax · ${pricing.items.map((i) => `${i.quantity}x ${i.name}`).join(" · ")}`.slice(0, 250);

    // Registro preventivo del inicio del intento
    console.log(`[dLocal] Inicia creación de pago: ${orderId} (${body.country}) - ${pricing.totalUsd} USD`);




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
          `${dlocalApiBase()}/payment-methods?country=${body.country.toUpperCase()}`,
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
      DO: "DOP", SV: "USD", HN: "HNL", NI: "NIO",
    };
    const countryCode = body.country.toUpperCase();
    const requested = body.currency.toUpperCase();
    const expected = DLOCAL_CURRENCY[countryCode];
    // Si la moneda enviada no es la del país (ni USD), no intentamos en local.
    const wantedCurrency = !expected || requested === expected || requested === "USD"
      ? requested
      : "USD";
    // Importe local calculado 100% en el servidor (total del catálogo × tasa
    // propia). Si no hay tasa autorizada para esa moneda, cobramos en USD.
    const serverLocal = wantedCurrency === "USD"
      ? null
      : localTotalFromPricing(pricing, wantedCurrency);
    const localCurrency = wantedCurrency === "USD" || serverLocal == null ? "USD" : wantedCurrency;
    const localAmount = localCurrency === "USD" ? calculatedUsd : (serverLocal as number);



    // dLocal rechaza el pago en su checkout ("la transacción no pudo ser
    // aprobada") cuando el pagador llega incompleto: nombre sin apellido,
    // teléfono con caracteres raros o sin referencia de usuario.
    const cleanName = body.payerName.replace(/\s+/g, " ").trim().slice(0, 100);
    const payerName = cleanName.includes(" ") ? cleanName : `${cleanName} .`;
    const rawPhone = (body.payerPhone ?? "").replace(/[^\d+]/g, "");
    const payerPhone = rawPhone.replace(/\+/g, "").length >= 8 ? rawPhone : undefined;
    const rawDocument = (body.payerDocument ?? "").replace(/[^\dA-Za-z]/g, "").toUpperCase();
    // dLocal exige documento del pagador para transferencia/efectivo en LatAm.
    // Si el número no cumple el formato del país lo descartamos: es preferible
    // que dLocal se lo pida en su checkout a enviar un "documento inválido"
    // que hace que la transacción nunca se apruebe.
    const DOC_RULES: Record<string, RegExp> = {
      AR: /^\d{7,11}$/,          // DNI / CUIT
      BO: /^\d{5,12}$/,          // CI
      BR: /^(\d{11}|\d{14})$/,   // CPF / CNPJ
      CL: /^\d{7,8}[0-9K]$/,     // RUT con dígito verificador
      CO: /^\d{6,12}$/,          // CC / NIT
      CR: /^\d{9,12}$/,
      EC: /^\d{10,13}$/,
      GT: /^\d{8,13}$/,
      MX: /^[A-Z0-9]{10,18}$/,   // CURP / RFC
      PA: /^[A-Z0-9]{6,20}$/,
      PE: /^(\d{8}|\d{11})$/,    // DNI / RUC
      PY: /^\d{5,12}$/,
      UY: /^\d{7,8}$/,           // CI
      DO: /^\d{9,11}$/,          // Cédula / RNC
      SV: /^\d{8,14}$/,          // DUI / NIT
      HN: /^\d{13,14}$/,         // Identidad / RTN
      NI: /^[A-Z0-9]{13,14}$/,   // Cédula
    };
    const docRule = DOC_RULES[body.country.toUpperCase()];
    const payerDocument = rawDocument && (!docRule || docRule.test(rawDocument))
      ? rawDocument
      : undefined;

    // Vencimiento corto para transferencia/efectivo: dLocal por defecto deja
    // 15-20 días, lo que congela el pedido. 3 días acelera la conciliación.
    const EXPIRATION_DAYS = 3;

    type PayloadOpts = { minimal?: boolean };
    const payloadFor = (amount: number, currency: string, opts: PayloadOpts = {}): Record<string, unknown> => ({
      amount,
      currency,
      country: body.country.toUpperCase(),
      order_id: orderId,
      description,
      success_url: body.successUrl,
      back_url: body.backUrl,
      expiration_type: "DAYS",
      expiration_value: EXPIRATION_DAYS,
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
      payer: {
        name: payerName,
        email: body.payerEmail,
        user_reference: body.payerEmail.toLowerCase(),
        // En el intento "mínimo" quitamos teléfono y documento: dLocal rechaza
        // el pago (5000/5010) cuando el formato no coincide con el del país.
        ...(!opts.minimal && payerPhone ? { phone: payerPhone } : {}),
        ...(!opts.minimal && payerDocument ? { document: payerDocument } : {}),
      },
    });


    const basePayload = payloadFor(localAmount, localCurrency);

    const createPayment = async (payload: Record<string, unknown>) => {
      let lastStatus = 0;
      let lastText = "";
      
      // Reintentos internos para errores 5xx (Bad Gateway, etc)
      for (let i = 0; i < 3; i++) {
        try {
          const resp = await fetch(`${dlocalApiBase()}/payments`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}:${secretKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });
          
          lastStatus = resp.status;
          lastText = await resp.text();
          
          if (resp.ok || (lastStatus < 500 && lastStatus !== 429)) {
            return { ok: resp.ok, status: lastStatus, text: lastText };
          }
          
          console.warn(`dLocal Go API returned ${lastStatus} on attempt ${i + 1}. Retrying...`);
          await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Simple backoff
        } catch (e) {
          console.error(`dLocal Go fetch error on attempt ${i + 1}:`, e);
          lastText = String(e);
          await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        }
      }
      return { ok: false, status: lastStatus || 502, text: lastText };
    };

    const errorCodeOf = (text: string): number | null => {
      try {
        const c = Number(JSON.parse(text)?.code);
        return Number.isFinite(c) ? c : null;
      } catch {
        return null;
      }
    };

    // Cadena de intentos. El checkout hospedado va primero: fijar un
    // payment_method_id con flow REDIRECT hacía que dLocal creara el pago pero
    // luego lo rechazara en su página ("no pudo ser aprobada") cuando ese rail
    // exige datos extra. El rail fijo queda como respaldo y solo entonces
    // consultamos /payment-methods.
    // 1) checkout local · 2) local sin teléfono/documento · 3) rail ·
    // 4) USD · 5) USD mínimo. Así Perú y Chile nunca quedan sin salida por un
    // dato del pagador o un rail puntual.
    const buildAttempts = async (): Promise<Array<{ label: string; payload: Record<string, unknown> }>> => {
      const rest: Array<{ label: string; payload: Record<string, unknown> }> = [];
      if (payerPhone || payerDocument) {
        rest.push({ label: `checkout ${localCurrency} mínimo`, payload: payloadFor(localAmount, localCurrency, { minimal: true }) });
      }
      const rail = await resolveRail();
      if (rail) {
        rest.push({
          label: `rail ${rail}`,
          payload: { ...basePayload, payment_method_id: rail, payment_method_flow: "REDIRECT" },
        });
      }
      if (localCurrency !== "USD") {
        rest.push({ label: "checkout USD", payload: payloadFor(calculatedUsd, "USD") });
        rest.push({ label: "checkout USD mínimo", payload: payloadFor(calculatedUsd, "USD", { minimal: true }) });
      }
      return rest;
    };

    let attempt = await createPayment(basePayload);
    let usedUsdFallback = false;
    const failures: string[] = [];
    if (!attempt.ok) {
      failures.push(`checkout ${localCurrency} [${attempt.status}] ${attempt.text.slice(0, 160)}`);
      console.warn(`dLocal intento "checkout ${localCurrency}" falló [${attempt.status}]: ${attempt.text.slice(0, 200)}`);
      for (const next of await buildAttempts()) {
        attempt = await createPayment(next.payload);
        if (attempt.ok) {
          usedUsdFallback = next.label.startsWith("checkout USD");
          break;
        }
        failures.push(`${next.label} [${attempt.status}] ${attempt.text.slice(0, 160)}`);
        console.warn(`dLocal intento "${next.label}" falló [${attempt.status}]: ${attempt.text.slice(0, 200)}`);
      }
    }

    if (!attempt.ok) {
      console.error(`dLocal Go create payment failed [${attempt.status}] (${failures.length} intentos): ${failures.join(" | ")}`);
      
      // Si recibimos un 502/503 real de dLocal que no es JSON (ej. página de Cloudflare)
      if (attempt.status >= 500 && (!attempt.text || attempt.text.trim().startsWith("<"))) {
        return json({ 
          error: "El servicio de dLocal Go está experimentando dificultades técnicas (Error 502/503). Por favor, intenta de nuevo en unos minutos o usa otro método.", 
          code: attempt.status,
          provider_status: attempt.status,
          is_provider_down: true,
          failures: failures.length
        }, 502);
      }
      }

      const code = errorCodeOf(attempt.text);
      let msg = "No pudimos iniciar el pago con dLocal. Intenta de nuevo en unos segundos o elige otro método.";
      if (code === 5016) msg = "El monto es menor al mínimo permitido por dLocal para tu país. Agrega otro producto o elige otro método de pago.";
      else if (code === 5000 || code === 5010) msg = "Ese método no está disponible ahora mismo en tu país. Elige otro método de pago (transferencia, efectivo o billetera) y lo procesamos al instante.";
      
      return json({ error: msg, code, provider_status: attempt.status, attempts: failures.length }, 502);
    }



    let data: Record<string, unknown>;
    try {
      data = JSON.parse(attempt.text);
    } catch {
      console.error("dLocal Go respuesta no-JSON:", attempt.text.slice(0, 500));
      return json({ error: "Respuesta inválida de dLocal. Intenta de nuevo." }, 502);
    }

    console.log(`dLocal pago creado ${String(data.id ?? "")} · vencimiento solicitado ${EXPIRATION_DAYS} días · expiration_date=${String((data as any).expiration_date ?? "n/d")}`);
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
        const paymentId = data.id ? String(data.id) : orderId;
        const pendingTemplateData = {
          orderNumber: orderId,
          customerName: body.payerName,
          customerEmail: body.payerEmail,
          productName: description,
          amount: usedUsdFallback ? calculatedUsd : localAmount,
          currency: usedUsdFallback ? "USD" : localCurrency,
          method: methodLabel,
          orderDate: new Date().toISOString(),
        };
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
              productName: description,
              localAmount: usedUsdFallback ? calculatedUsd : localAmount,
              localCurrency: usedUsdFallback ? "USD" : localCurrency,
              usdFallback: usedUsdFallback,
              expirationDays: EXPIRATION_DAYS,
              expiresAt: (data as any).expiration_date ?? new Date(Date.now() + EXPIRATION_DAYS * 86400000).toISOString(),
            },

          }),
          logOrderEvent({
            orderNumber: orderId,
            event: "payment_instructions",
            provider: "dlocalgo",
            status: "AWAITING_PAYMENT",
            method: methodLabel,
            reference: data.id ? String(data.id) : null,
            detail: `Cupón / QR / instrucciones de pago generados en dLocal Go · vence en ${EXPIRATION_DAYS} días`,
            customerEmail: body.payerEmail,
            currency: usedUsdFallback ? "USD" : localCurrency,
            amount: usedUsdFallback ? calculatedUsd : localAmount,
          }),
          // Un solo aviso propio al crear las instrucciones. La misma clave se
          // usa en el webhook PENDING para que un callback repetido no duplique.
          sendInternalEmail({
            templateName: "customer-manual-pending",
            recipientEmail: body.payerEmail,
            idempotencyKey: `dlocal-pending-${paymentId}-customer`,
            templateData: pendingTemplateData,
          }),
          sendInternalEmail({
            templateName: "admin-manual-pending",
            recipientEmail: "hola@ilinguerelax.com",
            idempotencyKey: `dlocal-pending-${paymentId}-admin`,
            templateData: {
              ...pendingTemplateData,
              customerWhatsapp: body.payerPhone ?? "",
              country: body.country.toUpperCase(),
            },
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
