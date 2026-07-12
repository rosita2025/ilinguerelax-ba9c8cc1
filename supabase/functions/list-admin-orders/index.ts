import { assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const { adminKey } = await req.json().catch(() => ({}));
    const expected = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expected || adminKey !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [manual, shopify, hotmart, digital, funnel, emailLog] = await Promise.all([
      admin.from("manual_payments").select("*").order("created_at", { ascending: false }).limit(200),
      admin.from("shopify_sales").select("*").order("created_at", { ascending: false }).limit(200),
      admin.from("hotmart_purchases").select("*").order("created_at", { ascending: false }).limit(200),
      admin.from("digital_email_sends").select("*").order("created_at", { ascending: false }).limit(200),
      admin.from("funnel_events").select("*").in("event_name", ["Purchase", "purchase", "mp_pending", "mp_in_process"]).order("created_at", { ascending: false }).limit(300),
      admin.from("email_send_log").select("*").order("created_at", { ascending: false }).limit(300),
    ]);

    return new Response(
      JSON.stringify({
        manual: manual.data ?? [],
        shopify: shopify.data ?? [],
        hotmart: hotmart.data ?? [],
        digital: digital.data ?? [],
        funnel: funnel.data ?? [],
        emailLog: emailLog.data ?? [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
