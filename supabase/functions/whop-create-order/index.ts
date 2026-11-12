// Whop — crea el pedido de iLingue para pagar con billetera (Nequi) en Colombia.
// El navegador solo manda id y cantidad; aquí se resuelve el producto y el precio autoritativos, se guarda el pedido
// (`order_created`) y se devuelve el plan de Whop que el navegador abre en su checkout incrustado.
// Si algo no está listo (sin plan para ese producto, cupón, varios productos…), responde `whop_not_available`
// y el checkout cobra con la billetera de dLocal Go como siempre.
import { z } from "npm:zod@3.25.76";
import { normalizeSkus } from "../_shared/digitalSku.ts";
import { logOrderEvent } from "../_shared/orderEvents.ts";
import { resolveServerPricing, PricingError, localTotalFromPricing } from "../_shared/catalogPricing.ts";
import { parseWhopPlanMap } from "../_shared/whop.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const BodySchema = z.object({
  items: z.array(z.object({ id: z.string().min(1).max(200), quantity: z.number().int().min(1).max(50) })).min(1).max(20),
  couponCode: z.string().max(30).optional(),
  payerEmail: z.string().email(),
  payerName: z.string().min(1).max(120),
  payerPhone: z.string().max(30).optional(),
  country: z.string().length(2),
});

const unavailable = (reason: string) => json({ error: "whop_not_available", reason }, 409);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, 400);
    const body = parsed.data;
    const country = body.country.toUpperCase();

    // Whop cobra en pesos colombianos con un plan de precio fijo: solo Colombia, un producto, sin cupón.
    if (country !== "CO") return unavailable("only_colombia");
    if (body.couponCode?.trim()) return unavailable("coupon");
    if (body.items.length !== 1 || body.items[0].quantity !== 1) return unavailable("single_item_only");
    if (!Deno.env.get("WHOP_WEBHOOK_SECRET")) return unavailable("not_configured");

    let pricing;
    try {
      pricing = await resolveServerPricing({
        items: body.items.map((i) => ({ id: i.id, quantity: i.quantity })),
        country,
        currency: "COP",
      });
    } catch (e) {
      if (e instanceof PricingError) return json({ error: e.message }, 400);
      throw e;
    }
    if (pricing.items.some((i) => i.isPhysical)) return unavailable("physical_product");

    const sku = String(pricing.items[0].sku || "").trim().toLowerCase();
    const planId = parseWhopPlanMap(Deno.env.get("WHOP_PLAN_MAP"))[sku];
    if (!planId) return unavailable("no_plan_for_product");

    const localAmount = await localTotalFromPricing(pricing, "COP");
    if (!localAmount || localAmount <= 0) return unavailable("no_cop_price");

    const orderId = `ILR-WH-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
    const skus = normalizeSkus(pricing.items.map((i) => i.sku));
    const description = `iLingue Relax · ${pricing.items.map((i) => `${i.quantity}x ${i.name}`).join(" · ")}`.slice(0, 100);

    await logOrderEvent({
      orderNumber: orderId,
      event: "order_created",
      provider: "whop",
      status: "CREATED",
      method: "Billetera digital (Whop)",
      detail: description,
      customerEmail: body.payerEmail,
      amount: Number(pricing.totalUsd.toFixed(2)),
      currency: "USD",
      metadata: {
        country,
        skus,
        planId,
        productName: description,
        localAmount,
        localCurrency: "COP",
        customerName: body.payerName,
        customerPhone: body.payerPhone ?? null,
      },
    });

    return json({ orderId, planId, amount: localAmount, currency: "COP" });
  } catch (err) {
    console.error("whop-create-order error:", err);
    return json({ error: "No pudimos iniciar el pago. Intenta de nuevo." }, 500);
  }
});
