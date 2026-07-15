import { createClient } from "npm:@supabase/supabase-js@2";
import { upsertBrevoContact } from "../_shared/brevoContact.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hotmart-hottok",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const WEBHOOK_TOKEN = Deno.env.get("HOTMART_WEBHOOK_TOKEN") ?? "";

const labelHotmartProduct = (name: string, productCode?: string | null, productId?: string | null) => {
  const s = `${name} ${productCode || ""} ${productId || ""}`.toLowerCase();
  if (s.includes("coreano") || s.includes("korean")) return { id: "product-coreano-100-mapas", value: 10 };
  if (s.includes("patrones")) return { id: "patrones-especiales", value: 8.08 };
  if (s.includes("estructura") || s.includes("grammar")) return { id: "product-estructuras-gramaticales", value: 12 };
  if (s.includes("8,000") || s.includes("8.000") || s.includes("8000")) return { id: "product-8000", value: 20 };
  if (s.includes("1,000") || s.includes("1.000") || s.includes("1000") || s.includes("verbo")) return { id: "product-1000-verbos", value: 10 };
  if (s.includes("500") && (s.includes("pregunta") || s.includes("question"))) return { id: "product-500-preguntas", value: 10 };
  if (s.includes("spanish")) return { id: "product-spanish-5000-digital", value: 22 };
  return { id: "product-5000", value: 12 };
};

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
    const productName: string = data?.product?.name ?? data?.product?.title ?? body?.product?.name ?? "Hotmart Purchase";

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

      const product = labelHotmartProduct(productName, productCode, productId);
      const priceValue = Number(data?.purchase?.price?.value ?? data?.purchase?.full_price?.value ?? data?.purchase?.approved_price?.value ?? product.value);
      const currency = String(data?.purchase?.price?.currency_code ?? data?.purchase?.currency_code ?? "USD").toUpperCase();
      await supabase.from("funnel_events").insert({
        event_name: "Purchase",
        product_id: product.id,
        value: Number.isFinite(priceValue) ? priceValue : product.value,
        currency,
        session_id: transactionCode,
        page_path: "/hotmart-success",
        country: data?.buyer?.address?.country || data?.purchase?.buyer?.address?.country || null,
        referrer: "hotmart-webhook",
      });

      // Sync buyer as Brevo customer contact (idempotent; updates existing).
      try {
        const buyerName: string | undefined =
          data?.buyer?.name ?? data?.purchase?.buyer?.name ?? undefined;
        const buyerPhone: string | undefined =
          data?.buyer?.checkout_phone ??
          data?.buyer?.phone ??
          data?.purchase?.buyer?.checkout_phone ??
          data?.purchase?.buyer?.phone ??
          undefined;
        const buyerCountry: string | undefined =
          data?.buyer?.address?.country_iso ??
          data?.buyer?.address?.country ??
          data?.purchase?.buyer?.address?.country_iso ??
          data?.purchase?.buyer?.address?.country ??
          undefined;

        // Persist to central contacts (dedupe on email+source).
        try {
          await supabase.from("email_contacts").insert({
            email: buyerEmail.toLowerCase().trim(),
            name: buyerName ?? null,
            source: "hotmart_purchase",
            product_type: product.id,
          });
        } catch (_) { /* conflict ignored */ }

        await upsertBrevoContact({
          email: buyerEmail,
          name: buyerName,
          phone: buyerPhone,
          country: buyerCountry ? String(buyerCountry).slice(0, 2).toUpperCase() : undefined,
          productName,
          skus: [product.id],
          amount: Number.isFinite(priceValue) ? priceValue : product.value,
          currency,
          orderNumber: transactionCode,
          provider: "hotmart",
        });
      } catch (e) {
        console.warn("brevo customer sync failed:", e instanceof Error ? e.message : String(e));
      }
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
