// Create a PayPal order server-side. Returns { id } that the client passes to
// PayPal Smart Buttons via createOrder.
const corsHeaders = { 
  "Access-Control-Allow-Origin": "*", 
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa, x-correlation-id, x-trace-id, x-requested-with", 
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Expose-Headers": "x-correlation-id, x-trace-id"
};
import { resolveServerPricing, PricingError, localTotalFromPricing } from "../_shared/catalogPricing.ts";

const PAYPAL_ENV = (Deno.env.get("PAYPAL_ENV") ?? "live").toLowerCase() === "sandbox" ? "sandbox" : "live";
const PAYPAL_BASE = PAYPAL_ENV === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

async function getAccessToken(): Promise<string> {
  const id = Deno.env.get("PAYPAL_CLIENT_ID");
  const secret = Deno.env.get("PAYPAL_SECRET") || Deno.env.get("PAYPAL_CLIENT_SECRET");
  if (!id || !secret) throw new Error("PayPal credentials not configured");
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${id}:${secret}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

// PayPal-supported currencies (server-side allowlist). Anything else -> USD fallback.
const PAYPAL_SUPPORTED = new Set([
  "AUD","BRL","CAD","CNY","CZK","DKK","EUR","HKD","HUF","ILS","JPY",
  "MYR","MXN","TWD","NZD","NOK","PHP","PLN","GBP","RUB","SGD","SEK","CHF","THB","USD",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const traceId = crypto.randomUUID();
  const t0 = Date.now();
  try {
    const body = await req.json().catch(() => ({}));
    const amountReq = Number(body.amount);
    const currencyReq = String(body.currency ?? "USD").toUpperCase().slice(0, 3);
    const amountUsdHint = body.amountUsd != null ? Number(body.amountUsd) : undefined;
    const country = body.country ? String(body.country).toUpperCase().slice(0, 2) : undefined;
    const couponCode = body.couponCode ? String(body.couponCode).trim().toUpperCase().slice(0, 30) : undefined;
    const rawDescription = String(body.description ?? "").trim();
    // Always show the public brand on the PayPal review screen.
    const description = (rawDescription ? `iLingue Relax · ${rawDescription}` : "iLingue Relax").slice(0, 127);
    const bodyItems = body.items && Array.isArray(body.items) ? body.items : [{ id: "paypal-checkout", quantity: 1 }];

    const buyerEmail = body.buyerEmail ? String(body.buyerEmail).slice(0, 254) : undefined;
    // Client-supplied correlation id ties create + capture + client console.
    const rawCorr = String(req.headers.get("x-correlation-id") ?? req.headers.get("X-Correlation-Id") ?? body.correlationId ?? "").slice(0, 64);
    const correlationId = /^[A-Za-z0-9._:-]{6,64}$/.test(rawCorr) ? rawCorr : `srv-${traceId}`;


    // Decide currency + amount with server-side catalog validation.
    let finalAmount = amountReq;
    let finalCurrency = currencyReq;

    let pricing;
    try {
      pricing = await resolveServerPricing({
        items: bodyItems,
        country: country,
        couponCode: couponCode,
        currency: currencyReq
      });
    } catch (e) {
      if (e instanceof PricingError) {
        return new Response(JSON.stringify({ error: e.message, trace: traceId }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw e;
    }
    
    const pricedItems = pricing.items;
    
    // Server-side: ensure we add shipping if it's a physical product, no upsell, and subtotal < 50
    const hasPhysical = pricedItems.some(i => i.isPhysical);
    const hasUpsell = pricedItems.length > 1;
    const shippingUsd = (hasPhysical && !hasUpsell) ? (pricing.totalUsd >= 50 ? 0 : (tierForCountry(country) === "latam" ? 9 : 8)) : 0;
    
    finalAmount = pricing.totalUsd + shippingUsd;
    finalCurrency = "USD";
    
    let currency = finalCurrency;
    let amount = finalAmount;
    let fallbackApplied = false;
    let fallbackReason: string | null = null;

    // Si resolveServerPricing devolvió USD pero el cliente pidió una moneda soportada por PayPal, 
    // intentamos usar la moneda local para que el checkout sea más amigable.
    if (finalCurrency === "USD" && PAYPAL_SUPPORTED.has(currencyReq)) {
      const localTotal = await localTotalFromPricing({
        items: pricedItems,
        couponPercent: pricing.couponPercent,
        couponCode: pricing.couponCode,
        totalUsd: pricing.totalUsd
      }, currencyReq);


      if (localTotal && localTotal > 0) {
        currency = currencyReq;
        amount = localTotal;
      }
    }

    if (!PAYPAL_SUPPORTED.has(currency)) {
      fallbackApplied = true;
      fallbackReason = `currency_not_supported:${currency}`;
      currency = "USD";
      amount = finalAmount;
    }

    console.log(JSON.stringify({
      corr: correlationId, trace: traceId, fn: "paypal-create-order", phase: "input",
      env: PAYPAL_ENV, country: country ?? null,
      requested: { currency: currencyReq, amount: amountReq, amountUsd: amountUsdHint ?? null },
      resolved: { currency, amount },
      fallback: { applied: fallbackApplied, reason: fallbackReason },
      hasEmail: !!buyerEmail,
    }));

    if (!amount || amount < 1) {
      console.warn(JSON.stringify({ corr: correlationId, trace: traceId, fn: "paypal-create-order", phase: "reject", reason: "invalid_amount", amount }));
      return new Response(JSON.stringify({ error: "Invalid amount", trace: traceId, correlationId }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json", "x-correlation-id": correlationId },
      });
    }
    const token = await getAccessToken();
    const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        // Idempotency: PayPal dedupes repeat POSTs with the same key for 6h.
        "PayPal-Request-Id": correlationId,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: correlationId.slice(0, 255),
          custom_id: correlationId.slice(0, 127),
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
            breakdown: (() => {
              const shipVal = (shippingUsd > 0 && !hasUpsell) 
                ? Number((shippingUsd * (amount / (pricing.totalUsd + shippingUsd))).toFixed(2))
                : 0;
              const itemVal = Number((amount - shipVal).toFixed(2));
              
              return {
                item_total: {
                  currency_code: currency,
                  value: itemVal.toFixed(2)
                },
                ...(shipVal > 0 && {
                  shipping: {
                    currency_code: currency,
                    value: shipVal.toFixed(2)
                  }
                })
              };
            })()
          },
          description,
        }],
        ...(buyerEmail && { payer: { email_address: buyerEmail } }),
        application_context: {
          brand_name: "iLingue Relax",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
        },
      }),
    });
    let data;
    try {
      data = await orderRes.json();
    } catch (e) {
      console.error(JSON.stringify({ corr: correlationId, trace: traceId, fn: "paypal-create-order", phase: "json_parse_error", status: orderRes.status, ms: Date.now() - t0 }));
      throw new Error(`Error al procesar respuesta de PayPal (${orderRes.status})`);
    }

    if (!orderRes.ok) {
      console.error(JSON.stringify({
        corr: correlationId, trace: traceId, fn: "paypal-create-order", phase: "paypal_error",
        status: orderRes.status, error: data, currency, amount,
        ms: Date.now() - t0,
      }));

      // Extraer mensaje de error legible de PayPal
      let errorMessage = "No se pudo crear la orden en PayPal";
      if (data?.details?.[0]?.description) {
        errorMessage = `PayPal: ${data.details[0].description}`;
      } else if (data?.message) {
        errorMessage = `PayPal: ${data.message}`;
      } else if (orderRes.status === 401) {
        errorMessage = "Error de autenticación con PayPal. Por favor, informa al administrador.";
      }

      return new Response(JSON.stringify({ 
        error: errorMessage, 
        details: data,
        trace: traceId, 
        correlationId 
      }), {
        status: orderRes.status >= 400 && orderRes.status < 500 ? orderRes.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json", "x-correlation-id": correlationId, "x-trace-id": traceId },
      });
    }
    console.log(JSON.stringify({
      corr: correlationId, trace: traceId, fn: "paypal-create-order", phase: "created",
      orderId: data.id, status: data.status, currency, amount,
      fallback: fallbackApplied, ms: Date.now() - t0,
    }));
    return new Response(JSON.stringify({ id: data.id, currency, amount, fallbackApplied, trace: traceId, correlationId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "x-correlation-id": correlationId, "x-trace-id": traceId },
    });
  } catch (e) {
    console.error(JSON.stringify({ trace: traceId, fn: "paypal-create-order", phase: "exception", error: (e as Error).message, ms: Date.now() - t0 }));
    return new Response(JSON.stringify({ error: (e as Error).message, trace: traceId }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


