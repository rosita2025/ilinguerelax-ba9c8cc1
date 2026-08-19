// dLocal Go — creación de pago (API REST)
// Docs: https://docs.dlocalgo.com/  ·  POST https://api.dlocalgo.com/v1/payments
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Devuelve `redirect_url` para enviar al comprador al checkout de dLocal Go.
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa", "Access-Control-Allow-Methods": "POST, OPTIONS" };
import { z } from "npm:zod@3.23.8";
import { normalizeSkus } from "../_shared/digitalSku.ts";
import { logOrderEvent } from "../_shared/orderEvents.ts";
import { resolveServerPricing, PricingError, localTotalFromPricing, isRestrictedCurrency } from "../_shared/catalogPricing.ts";
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
  couponCode: z.string().max(30).optional(),
  payerEmail: z.string().email(),
  payerName: z.string().min(1).max(120),
  payerPhone: z.string().max(30).optional(),
  payerDocument: z.string().max(30).optional(),
  payerAddress: z.string().max(160).optional(),
  payerCity: z.string().max(80).optional(),
  payerState: z.string().max(80).optional(),
  payerZip: z.string().max(24).optional(),
  country: z.string().length(2),
  paymentType: z.enum(["transfer", "cash", "wallet"]).optional(),
  currency: z.string().length(3).default("USD"),
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

    let pricing;
    try {
      pricing = await resolveServerPricing({
        items: body.items.map((i) => ({ id: i.id, quantity: i.quantity, price: i.price })),
        country: body.country,
        couponCode: body.couponCode,
        currency: body.currency,
      });
    } catch (e) {
      if (e instanceof PricingError) return json({ error: e.message }, 400);
      throw e;
    }
    const calculatedUsd = Number(pricing.totalUsd.toFixed(2));
    const orderId = body.orderId ?? `ILR-DL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const skus = normalizeSkus(pricing.items.map((i) => i.sku));
    const description = `iLingue Relax · ${pricing.items.map((i) => `${i.quantity}x ${i.name}`).join(" · ")}`.slice(0, 250);

    console.log(`[dLocal] Inicia creación de pago: ${orderId} (${body.country}) - ${pricing.totalUsd} USD`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const notifyParams = new URLSearchParams({

      order: orderId,
      email: body.payerEmail,
      name: body.payerName,
      country: body.country.toUpperCase(),
      skus: skus.join(","),
    });
    const notificationUrl = `${supabaseUrl}/functions/v1/dlocal-go-webhook?${notifyParams.toString()}`;

    const localCurrency = (body.currency || "USD").toUpperCase();
    const localAmount = await localTotalFromPricing(pricing, localCurrency);
    const restricted = isRestrictedCurrency(body.country);

    // Prioritize local currency if supported, NOT restricted, and we have a valid amount.
    // However, if currency is USD, we must honor it.
    const startCurrency = (localCurrency === "USD" || restricted || !localAmount || localAmount <= 0) ? "USD" : localCurrency;
    const startAmount = startCurrency === "USD" ? calculatedUsd : localAmount!;



    const EXPIRATION_DAYS = 3;

    const payloadFor = (amount: number, currency: string, opts: { minimal?: boolean } = {}) => ({
      amount,
      currency,
      country: body.country.toUpperCase(),
      order_id: orderId,
      description,
      success_url: body.successUrl,
      back_url: body.backUrl,
      notification_url: notificationUrl,
      expiration_date: new Date(Date.now() + EXPIRATION_DAYS * 86400000).toISOString(),
      payer: {
        name: body.payerName,
        email: body.payerEmail,
        document: opts.minimal ? undefined : body.payerDocument,
        phone: opts.minimal ? undefined : body.payerPhone,
      },
    });

    const createPayment = async (payload: Record<string, unknown>) => {
      let lastStatus = 0;
      let lastText = "";
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
          if (resp.ok || (lastStatus < 500 && lastStatus !== 429)) return { ok: resp.ok, status: lastStatus, text: lastText };
          console.warn(`dLocal Go API returned ${lastStatus} on attempt ${i + 1}. Retrying...`);
          await new Promise(r => setTimeout(r, 2000 * (i + 1))); // Increased delay to 2s, 4s, 6s
        } catch (e) {
          console.error(`dLocal Go fetch error on attempt ${i + 1}:`, e);
          lastText = String(e);
          await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        }
      }
      return { ok: false, status: lastStatus || 502, text: lastText };
    };

    const resolveRail = async () => {
      if (!body.paymentType) return null;
      try {
        const resp = await fetch(`${dlocalApiBase()}/payment-methods?country=${body.country.toUpperCase()}`, {
          headers: { Authorization: `Bearer ${apiKey}:${secretKey}` },
        });
        if (!resp.ok) return null;
        const methods = await resp.json();
        const found = methods.find((m: any) => m.type?.toLowerCase() === body.paymentType);
        return found?.id || null;
      } catch { return null; }
    };

    const buildAttempts = async () => {
      const rest = [];
      if (body.payerPhone || body.payerDocument) {
      rest.push({ label: `checkout ${localCurrency} mínimo`, payload: payloadFor(localAmount!, localCurrency, { minimal: true }) });
    }
    const rail = await resolveRail();
    if (rail) rest.push({ label: `rail ${rail}`, payload: { ...payloadFor(localAmount!, localCurrency), payment_method_id: rail, payment_method_flow: "REDIRECT" } });
    if (localCurrency !== "USD") {
      rest.push({ label: "checkout USD", payload: payloadFor(calculatedUsd, "USD") });
      rest.push({ label: "checkout USD mínimo", payload: payloadFor(calculatedUsd, "USD", { minimal: true }) });
    }
      return rest;
    };

    let attempt = await createPayment(payloadFor(startAmount, startCurrency));
    const failures = [];
    let usedUsdFallback = restricted || startCurrency === "USD";

    if (!attempt.ok) {
      failures.push(`checkout ${startCurrency} [${attempt.status}] ${attempt.text.slice(0, 160)}`);

      const nextAttempts = await buildAttempts();
      for (const next of nextAttempts) {
        attempt = await createPayment(next.payload);
        if (attempt.ok) {
          usedUsdFallback = next.label.startsWith("checkout USD");
          break;
        }
        failures.push(`${next.label} [${attempt.status}] ${attempt.text.slice(0, 160)}`);
      }
    }

    if (!attempt.ok) {
      const errorDetail = attempt.text.slice(0, 500);
      console.error(`dLocal Go create payment completely failed [${attempt.status}] after ${failures.length} fallbacks: ${failures.join(" | ")}`);
      
      // Log critical failure to admin_payment_errors for diagnostics
      try {
        const admin = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
          { auth: { persistSession: false } }
        );
        await admin.from("admin_payment_errors").insert({
          provider: "dlocalgo",
          error_message: errorDetail,
          error_kind: attempt.status === 502 ? "HTTP 502" : "dlocal_create_failed",
          country: body.country,
          error_detail: {
            failures,
            order_id: orderId,
            status: attempt.status,
            payer: body.payerEmail
          }
        });
      } catch (e) {
        console.error("Failed to log dlocal error to audit table:", e);
      }

      // Log critical failure to order_events for admin visibility
      await logOrderEvent({
        orderNumber: orderId,
        event: "payment_error",
        provider: "dlocalgo",
        status: "FATAL_ERROR",
        detail: `Critical failure creating payment: HTTP ${attempt.status}. Fallbacks exhausted.`,
        customerEmail: body.payerEmail,
        metadata: { failures, lastStatus: attempt.status, country: body.country }
      }).catch(e => console.error("Failed to log critical dlocal error:", e));

      if (attempt.status >= 500 && (!attempt.text || attempt.text.trim().startsWith("<"))) {
        return json({ 
          error: "El servicio de dLocal Go está experimentando dificultades técnicas (Error 502/503). Por favor, intenta de nuevo en unos minutos o usa otro método.", 
          code: attempt.status,
          provider_status: attempt.status,
          is_provider_down: true,
          failures: failures.length
        }, 502);
      }
      return json({ error: "No pudimos procesar el pago con dLocal Go. Por favor, intenta con otro método.", details: attempt.text, failures: failures.length }, 400);
    }

    const data = JSON.parse(attempt.text);
    const redirectUrl = data.redirect_url;
    if (!redirectUrl) return json({ error: "No se recibió URL de redirección" }, 500);

    const audit = (async () => {
      try {
        const paymentId = data.id ? String(data.id) : orderId;
        const methodLabel = body.paymentType === "cash" ? "Pago en efectivo" : body.paymentType === "wallet" ? "Billetera digital" : "dLocal Go";
        const pendingTemplateData = {
          orderNumber: orderId,
          customerName: body.payerName,
          customerEmail: body.payerEmail,
          productName: description,
          amount: usedUsdFallback ? calculatedUsd : (localAmount ?? calculatedUsd),
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
              localAmount: usedUsdFallback ? calculatedUsd : (localAmount ?? calculatedUsd),
              localCurrency: usedUsdFallback ? "USD" : localCurrency,
              usdFallback: usedUsdFallback,
              expirationDays: EXPIRATION_DAYS,
            },
          }),
          sendInternalEmail({
            templateName: "customer-manual-pending",
            recipientEmail: body.payerEmail,
            idempotencyKey: `dlocal-pending-${paymentId}-customer`,
            templateData: pendingTemplateData,
          }),
        ]);
      } catch (e) {
        console.error("dLocal audit log failed:", e);
      }
    })();
    const runtime = (globalThis as any).EdgeRuntime;
    if (runtime?.waitUntil) runtime.waitUntil(audit);

    return json({ id: data.id, orderId, redirect_url: redirectUrl });

  } catch (err) {
    console.error("dlocal-create-payment error:", err);
    return json({ error: "No pudimos iniciar el pago. Intenta de nuevo en unos segundos." }, 500);
  }
});
