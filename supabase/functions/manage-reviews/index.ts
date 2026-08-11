import { assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const { action, reviewId, adminKey } = await req.json();

    // Simple admin key check
    const expectedKey = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expectedKey || adminKey !== expectedKey) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "list") {
      const { data, error } = await supabaseAdmin
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return new Response(
        JSON.stringify({ reviews: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "approve" && reviewId) {
      // Get review details first to send coupon
      const { data: review } = await supabaseAdmin
        .from("reviews")
        .select("customer_email, customer_name")
        .eq("id", reviewId)
        .single();

      const { error } = await supabaseAdmin
        .from("reviews")
        .update({ status: "approved" })
        .eq("id", reviewId);

      if (error) throw error;

      // Send coupon via the new function if we have the email
      if (review?.customer_email) {
        try {
          await supabaseAdmin.functions.invoke("send-review-coupon", {
            body: { email: review.customer_email, name: review.customer_name }
          });
          console.log(`Coupon invitation sent for review ${reviewId}`);
        } catch (couponErr) {
          console.error("Failed to trigger coupon send:", couponErr);
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "reject" && reviewId) {
      const { error } = await supabaseAdmin
        .from("reviews")
        .update({ status: "rejected" })
        .eq("id", reviewId);

      if (error) throw error;
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete" && reviewId) {
      const { error } = await supabaseAdmin
        .from("reviews")
        .delete()
        .eq("id", reviewId);

      if (error) throw error;
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
