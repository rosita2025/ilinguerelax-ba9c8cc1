// Capture a PayPal order server-side after buyer approves in the popup.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const PAYPAL_ENV = (Deno.env.get("PAYPAL_ENV") ?? "live").toLowerCase() === "sandbox" ? "sandbox" : "live";
const PAYPAL_BASE = PAYPAL_ENV === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

async function getAccessToken(): Promise<string> {
  const id = Deno.env.get("PAYPAL_CLIENT_ID");
  const secret = Deno.env.get("PAYPAL_SECRET");
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const orderId = String(body.orderId ?? "").trim();
    if (!/^[A-Z0-9]{5,32}$/i.test(orderId)) {
      return new Response(JSON.stringify({ error: "Invalid orderId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = await getAccessToken();
    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: data }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const status = data.status; // COMPLETED expected
    return new Response(JSON.stringify({ status, order: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
