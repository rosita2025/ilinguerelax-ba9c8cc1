const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa", "Access-Control-Allow-Methods": "POST, OPTIONS" };
import { createStripeClient, type StripeEnv } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const env = (url.searchParams.get("env") === "live" ? "live" : "sandbox") as StripeEnv;
    const stripe = createStripeClient(env);

    // List all payment method configurations + resolve enabled methods
    const configs = await stripe.paymentMethodConfigurations.list({ limit: 20 });

    const result = configs.data.map((cfg: any) => {
      const enabled: string[] = [];
      const disabled: string[] = [];
      for (const [key, value] of Object.entries(cfg)) {
        if (
          value &&
          typeof value === "object" &&
          "display_preference" in (value as any)
        ) {
          const pref = (value as any).display_preference?.value;
          if (pref === "on") enabled.push(key);
          else if (pref === "off") disabled.push(key);
        }
      }
      return {
        id: cfg.id,
        name: cfg.name,
        is_default: cfg.is_default,
        active: cfg.active,
        enabled: enabled.sort(),
        disabled: disabled.sort(),
      };
    });

    return new Response(JSON.stringify({ env, configurations: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
