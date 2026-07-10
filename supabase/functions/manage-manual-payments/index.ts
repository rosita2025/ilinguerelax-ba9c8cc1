import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Mapa producto → material digital. Se compara por coincidencia parcial (case-insensitive)
// contra el nombre del ítem guardado en la orden.
const MATERIALS: Array<{ match: RegExp; productName: string; downloadUrl: string; accessKey?: string }> = [
  {
    match: /patrones|alfabeto|combinaciones secretas/i,
    productName: "Patrones Especiales, Alfabeto y Combinaciones Secretas en Inglés",
    downloadUrl: "https://ilinguerelax.com/descarga/patrones-ingles",
    accessKey: "123A",
  },
  {
    match: /coreano|100 mapas|mapas mentales/i,
    productName: "100 Mapas Mentales de Coreano",
    downloadUrl: "https://ilinguerelax.com/descarga/coreano-100-mapas",
  },
];

function resolveMaterials(items: Array<{ name?: string }> = []) {
  const out: Array<{ productName: string; downloadUrl: string; accessKey?: string }> = [];
  const seen = new Set<string>();
  for (const it of items) {
    const name = (it?.name || "").toString();
    const hit = MATERIALS.find((m) => m.match.test(name));
    if (hit && !seen.has(hit.downloadUrl)) {
      seen.add(hit.downloadUrl);
      out.push({ productName: hit.productName, downloadUrl: hit.downloadUrl, accessKey: hit.accessKey });
    }
  }
  return out;
}

async function sendTemplate(admin: ReturnType<typeof createClient>, templateName: string, recipientEmail: string, idempotencyKey: string, templateData: Record<string, unknown>) {
  try {
    const { error } = await admin.functions.invoke("send-transactional-email", {
      body: { templateName, recipientEmail, idempotencyKey, templateData },
    });
    if (error) console.error(`[manual-payments] ${templateName} failed`, error);
  } catch (e) {
    console.error(`[manual-payments] ${templateName} exception`, e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, orderId, adminKey, notes } = await req.json();

    const expectedKey = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expectedKey || adminKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "list") {
      const { data, error } = await admin
        .from("manual_payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return new Response(JSON.stringify({ orders: data ?? [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify" && orderId) {
      // Cargar la orden completa para tener los datos del comprador y productos
      const { data: order, error: readErr } = await admin
        .from("manual_payments")
        .select("*")
        .eq("id", orderId)
        .single();
      if (readErr || !order) throw readErr ?? new Error("Order not found");

      // Marcar como verificada
      const { error: updErr } = await admin
        .from("manual_payments")
        .update({
          status: "verified",
          verified_at: new Date().toISOString(),
          verified_by: "admin",
          notes: notes ?? order.notes ?? null,
        })
        .eq("id", orderId);
      if (updErr) throw updErr;

      // Enviar 1) gracias por tu compra y 2) entrega de materiales
      const items = Array.isArray(order.items) ? order.items : [];
      const productNames = items.map((i: any) => i?.name).filter(Boolean).join(" + ") || "Tu pedido ILINGUE RELAX";
      const materials = resolveMaterials(items);

      await sendTemplate(admin, "thank-you", order.buyer_email, `manual-thanks-${order.order_number}`, {
        orderNumber: order.order_number,
        customerName: order.buyer_name,
        customerEmail: order.buyer_email,
        customerPhone: order.buyer_phone,
        customerCountry: order.buyer_country,
        productName: productNames,
        amount: Number(order.amount_local ?? order.amount_usd),
        currency: order.currency_local || "USD",
        provider: "yape_plin",
        orderDate: order.created_at,
      });

      await sendTemplate(admin, "material-delivery", order.buyer_email, `manual-material-${order.order_number}`, {
        customerName: order.buyer_name,
        orderNumber: order.order_number,
        materials,
      });

      return new Response(JSON.stringify({ success: true, materialsSent: materials.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reject" && orderId) {
      const { error } = await admin
        .from("manual_payments")
        .update({ status: "rejected", notes: notes ?? null })
        .eq("id", orderId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reset" && orderId) {
      const { error } = await admin
        .from("manual_payments")
        .update({ status: "pending", verified_at: null, verified_by: null })
        .eq("id", orderId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[manage-manual-payments]", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
