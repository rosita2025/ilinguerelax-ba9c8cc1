// Returns the public PayPal client_id + environment for the SDK loader.
// clientId is public (embedded in the SDK script URL), safe to expose.
const corsHeaders = { 
  "Access-Control-Allow-Origin": "*", 
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa, x-correlation-id", 
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS" 
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID") ?? "";
  const environment = (Deno.env.get("PAYPAL_ENV") ?? "live").toLowerCase() === "sandbox" ? "sandbox" : "live";
  return new Response(JSON.stringify({ clientId, environment }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
