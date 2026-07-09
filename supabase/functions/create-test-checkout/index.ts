import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const environment = (body.environment ?? "sandbox") as StripeEnv;
    const productName: string = body.productName ?? "Test Product";
    const amountInCents: number = Number(body.amountInCents ?? 2200);
    const currency: string = (body.currency ?? "usd").toLowerCase();
    const returnUrl: string = body.returnUrl;
    const customerEmail: string | undefined = body.customerEmail;

    if (!returnUrl) throw new Error("returnUrl is required");
    if (!Number.isFinite(amountInCents) || amountInCents < 50) {
      throw new Error("amountInCents must be >= 50");
    }

    const stripe = createStripeClient(environment);

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: productName },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      ui_mode: "embedded_page",
      return_url: returnUrl,
      payment_intent_data: { description: productName },
      ...(customerEmail && { customer_email: customerEmail }),
    });

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-test-checkout error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
