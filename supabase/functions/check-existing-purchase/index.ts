import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ok = (alreadyPurchased: boolean) =>
  new Response(JSON.stringify({ alreadyPurchased }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { email, sku } = await req.json();
    if (!email || !sku || typeof email !== "string" || typeof sku !== "string") {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedSku = sku.trim().toLowerCase();

    // Solo órdenes REALES confirmadas: entregas digitales efectivamente
    // enviadas y pagos manuales verificados. Nunca funnel_events (eventos del
    // navegador) — mismo criterio de "fuente de verdad" del fix de compras
    // falsas.
    try {
      const { data, error } = await admin
        .from("digital_email_sends")
        .select("skus, status")
        .ilike("customer_email", normalizedEmail)
        .limit(200);
      if (error) throw error;
      for (const row of data ?? []) {
        if (row?.status === "failed") continue;
        const skus: unknown[] = Array.isArray(row?.skus) ? row.skus : [];
        if (skus.some((s) => String(s || "").trim().toLowerCase() === normalizedSku)) return ok(true);
      }
    } catch (e) {
      console.error("check-existing-purchase digital_email_sends failed:", (e as Error)?.message);
      return ok(false);
    }

    try {
      const { data, error } = await admin
        .from("manual_payments")
        .select("items")
        .ilike("buyer_email", normalizedEmail)
        .in("status", ["verified", "completed", "paid", "approved"])
        .limit(200);
      if (error) throw error;
      for (const row of data ?? []) {
        const items: Record<string, unknown>[] = Array.isArray(row?.items) ? row.items : [];
        for (const it of items) {
          const id = String((it?.id ?? it?.sku ?? "") || "").trim().toLowerCase();
          if (id === normalizedSku) return ok(true);
        }
      }
    } catch (e) {
      console.error("check-existing-purchase manual_payments failed:", (e as Error)?.message);
      return ok(false);
    }

    return ok(false);
  } catch (err) {
    console.error("check-existing-purchase error:", err);
    // Ante cualquier fallo NUNCA bloqueamos al comprador.
    return ok(false);
  }
});
