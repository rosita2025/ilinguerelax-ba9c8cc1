import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hotmart-hottok",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const WEBHOOK_TOKEN = Deno.env.get("HOTMART_WEBHOOK_TOKEN") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();

    // Hotmart sends `hottok` in body or `X-HOTMART-HOTTOK` header.
    const providedToken =
      body?.hottok ?? req.headers.get("x-hotmart-hottok") ?? "";
    if (!WEBHOOK_TOKEN || providedToken !== WEBHOOK_TOKEN) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event: string = body?.event ?? body?.data?.purchase?.status ?? "";
    const data = body?.data ?? body;
    const buyerEmail: string | undefined =
      data?.buyer?.email ?? data?.purchase?.buyer?.email;
    const transactionCode: string | undefined =
      data?.purchase?.transaction ?? data?.transaction ?? body?.transaction;
    const productCode: string | undefined =
      data?.product?.ucode ?? data?.product?.id?.toString();
    const productId: string | undefined = data?.product?.id?.toString();

    if (!buyerEmail || !transactionCode) {
      return new Response(JSON.stringify({ error: "missing fields", body }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map Hotmart events to statuses
    const evUpper = (event || "").toString().toUpperCase();
    let status = "approved";
    if (evUpper.includes("REFUND")) status = "refunded";
    else if (evUpper.includes("CHARGEBACK")) status = "chargeback";
    else if (evUpper.includes("CANCEL")) status = "cancelled";
    else if (evUpper.includes("APPROVED") || evUpper.includes("COMPLETE")) status = "approved";

    if (status === "approved") {
      const { error } = await supabase.from("hotmart_purchases").upsert(
        {
          email: buyerEmail.toLowerCase().trim(),
          transaction_code: transactionCode,
          product_code: productCode ?? null,
          product_id: productId ?? null,
          purchased_at: new Date().toISOString(),
          refund_deadline: new Date(Date.now() + 7 * 864e5).toISOString(),
          status: "approved",
          raw_payload: body,
        },
        { onConflict: "transaction_code" },
      );
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("hotmart_purchases")
        .update({ status, raw_payload: body })
        .eq("transaction_code", transactionCode);
      if (error) throw error;
    }

    return new Response(JSON.stringify({ ok: true, status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("hotmart-purchase-webhook error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
