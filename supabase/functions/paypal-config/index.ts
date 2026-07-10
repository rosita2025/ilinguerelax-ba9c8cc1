// Returns the public PayPal client_id + environment for the SDK loader.
// clientId is public (embedded in the SDK script URL), safe to expose.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID") ?? "";
  const environment = (Deno.env.get("PAYPAL_ENV") ?? "live").toLowerCase() === "sandbox" ? "sandbox" : "live";
  return new Response(JSON.stringify({ clientId, environment }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
