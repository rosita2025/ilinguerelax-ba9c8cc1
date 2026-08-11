import { adminCorsHeaders, assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = adminCorsHeaders;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const { adminKey, action } = await req.json().catch(() => ({}));
    const expected = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expected || adminKey !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action !== "clear_all") {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Delete all records from hotmart_purchases and abandoned_carts
    // We use .neq('id', 'placeholder') or just .gt('id', '000...') for broad deletes in Supabase JS
    const [purchases, abandoned] = await Promise.all([
      admin.from("hotmart_purchases").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      admin.from("abandoned_carts").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
    ]);

    if (purchases.error) throw purchases.error;
    if (abandoned.error) throw abandoned.error;

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Auditoría de Hotmart limpiada correctamente." 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
