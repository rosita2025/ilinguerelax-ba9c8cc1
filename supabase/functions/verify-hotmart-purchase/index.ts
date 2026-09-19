import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Verifica contra el servidor que exista una compra de Hotmart APROBADA
 * (registrada por el webhook `hotmart-purchase-pixel`, autenticado con hottok)
 * que coincida con los parámetros del redirect.
 *
 * Nunca confía en los parámetros de la URL: sólo los usa como criterio de búsqueda.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const transaction = typeof body.transaction === "string" ? body.transaction.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const pagePath = typeof body.page_path === "string" ? body.page_path.slice(0, 500) : "/hotmart-success";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let row: Record<string, unknown> | null = null;

    if (transaction) {
      const { data } = await supabase
        .from("funnel_events")
        .select("product_id,value,currency,email,session_id,created_at")
        .eq("provider", "hotmart")
        .eq("event_name", "Purchase")
        .eq("session_id", transaction)
        .order("created_at", { ascending: false })
        .limit(1);
      row = data?.[0] ?? null;
    }

    if (!row && email) {
      // Fallback: Hotmart no siempre reenvía la transacción en el redirect.
      // Aceptamos una compra aprobada del mismo correo en las últimas 6 horas.
      const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("funnel_events")
        .select("product_id,value,currency,email,session_id,created_at")
        .eq("provider", "hotmart")
        .eq("event_name", "Purchase")
        .ilike("email", email)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1);
      row = data?.[0] ?? null;
    }

    if (!row) {
      // Auditoría: página de gracias cargada sin compra confirmada en el servidor.
      console.warn("hotmart-success unverified visit", { transaction, hasEmail: !!email });
      try {
        await supabase.from("funnel_events").insert({
          event_name: "hotmart_success_unverified",
          page_path: pagePath,
          provider: "hotmart",
          session_id: transaction || null,
          email: email || null,
          event_data: { transaction, email, reason: "no_approved_purchase_found" },
        });
      } catch (_) { /* auditoría best-effort */ }

      return new Response(JSON.stringify({ verified: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        verified: true,
        product_id: row.product_id ?? null,
        value: typeof row.value === "number" ? row.value : Number(row.value) || 0,
        currency: row.currency ?? "USD",
        transaction: row.session_id ?? transaction ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("verify-hotmart-purchase error:", msg);
    // Ante un fallo, NO verificamos (fail-closed).
    return new Response(JSON.stringify({ verified: false, error: msg }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
