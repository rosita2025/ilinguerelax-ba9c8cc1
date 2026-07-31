// Reenvío de enlaces digitales solicitado por el propio comprador.
//
// Seguridad:
//  - NO acepta SKUs del cliente: los productos salen del envío ya registrado
//  - solo reenvía si existe una entrega previa para ese pedido y ese correo
//    (es decir, un pago ya confirmado por el webhook firmado de la pasarela)
//  - siempre reenvía al mismo correo guardado, nunca a uno nuevo del cuerpo
//  - la entrega real la ejecuta send-digital-ilinguerelax con service-role
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const canonical = (raw: unknown) => String(raw ?? "").trim().toLowerCase();

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const orderId = String(body?.orderId ?? "").trim();
    const email = canonical(body?.email);

    if (!/^[A-Za-z0-9\-_]{4,80}$/.test(orderId) || !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) {
      return json({ error: "Datos inválidos" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: prior } = await supabase
      .from("digital_email_sends")
      .select("customer_email, customer_name, order_id, skus, provider, amount, currency, created_at, status")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Respuesta genérica: no revelamos si el pedido existe.
    if (!prior || canonical(prior.customer_email) !== email) {
      console.warn("[request-digital-resend] no match", { orderId });
      return json({ success: true, sent: false });
    }

    const skus = Array.isArray(prior.skus) ? prior.skus.filter(Boolean) : [];
    if (skus.length === 0) return json({ success: true, sent: false });

    const { error } = await supabase.functions.invoke("send-digital-ilinguerelax", {
      body: {
        customerEmail: prior.customer_email,
        customerName: prior.customer_name || undefined,
        orderId: prior.order_id,
        skus,
        amount: prior.amount ?? undefined,
        currency: prior.currency ?? undefined,
        provider: prior.provider ?? undefined,
        idempotencyKey: `resend:${prior.order_id}:${Date.now()}`,
        force: true,
      },
      headers: { "x-delivery-source": "request-digital-resend" },
    });

    if (error) {
      console.error("[request-digital-resend] delivery failed", error);
      return json({ error: "No se pudo reenviar" }, 500);
    }

    return json({ success: true, sent: true });
  } catch (e) {
    console.error("[request-digital-resend] error", e);
    return json({ error: "Error interno" }, 500);
  }
});
