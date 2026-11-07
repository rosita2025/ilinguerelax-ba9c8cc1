import { z } from "npm:zod@3.25.76";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

/**
 * Estado de pago de una sesión de Stripe Checkout (página hospedada). Lo usa la pantalla de regreso del checkout para
 * distinguir un pago ya cobrado de un pago diferido sin pagar todavía (por ejemplo el voucher de OXXO en México).
 * Solo devuelve el estado: no entrega nada. La entrega la hace siempre el webhook firmado de Stripe.
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const BodySchema = z.object({
  environment: z.enum(["sandbox", "live"]).default("sandbox"),
  session_id: z.string().regex(/^cs_[A-Za-z0-9_]{10,200}$/),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Invalid input" }, 400);
    const stripe = createStripeClient(parsed.data.environment as StripeEnv);
    const session = await stripe.checkout.sessions.retrieve(parsed.data.session_id);
    return json({ payment_status: session.payment_status, status: session.status });
  } catch (err) {
    console.error("checkout-session-status error:", err);
    return json({ error: "No se pudo consultar el estado del pago." }, 502);
  }
});
