// dLocal Go SmartFields — entrega la API key pública que necesita el SDK
// del navegador para tokenizar tarjetas. NUNCA expone la secret key.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("DLOCAL_SMARTFIELDS_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "SmartFields no está configurado" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ apiKey, country: null, enabled: true }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    },
  );
});
