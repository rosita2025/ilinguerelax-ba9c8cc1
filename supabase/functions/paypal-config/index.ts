// Returns the public PayPal client_id + environment for the SDK loader.
// clientId is public (embedded in the SDK script URL), safe to expose.
const corsHeaders = { 
  "Access-Control-Allow-Origin": "*", 
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa, x-correlation-id, x-trace-id, x-requested-with", 
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Expose-Headers": "x-correlation-id, x-trace-id"
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  
  const traceId = crypto.randomUUID();
  const rawCorr = String(req.headers.get("x-correlation-id") ?? req.headers.get("X-Correlation-Id") ?? "").slice(0, 64);
  const correlationId = rawCorr || `cfg-${traceId}`;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Audit the connection attempt for visibility in admin
    await supabase.from("order_events").insert({
      order_number: "PAYPAL-INIT",
      event: "paypal_config_requested",
      status: "info",
      provider: "paypal",
      metadata: { correlationId, traceId, userAgent: req.headers.get("user-agent") }
    });

    // Verify database health before returning
    const { error: dbError } = await supabase.from("order_events").select("id").limit(1);
    if (dbError) {
      console.error("[paypal-config] DB Health check failed:", dbError);
    }
    
    const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const secret = Deno.env.get("PAYPAL_SECRET") || Deno.env.get("PAYPAL_CLIENT_SECRET");
    
    if (!clientId || !secret) {
      console.error("[paypal-config] MISSING CREDENTIALS:", { hasClientId: !!clientId, hasSecret: !!secret });
      return new Response(JSON.stringify({ 
        error: "PayPal no está configurado (faltan credenciales)", 
        traceId, 
        correlationId,
        healthy: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const environment = (Deno.env.get("PAYPAL_ENV") ?? "live").toLowerCase() === "sandbox" ? "sandbox" : "live";
    
    return new Response(JSON.stringify({ clientId, environment, traceId, correlationId, healthy: !dbError }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "x-correlation-id": correlationId, "x-trace-id": traceId },
    });
  } catch (err) {
    console.error(`[paypal-config] error:`, err);
    return new Response(JSON.stringify({ error: String(err), traceId }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
