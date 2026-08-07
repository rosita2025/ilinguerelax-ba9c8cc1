import { createClient } from "npm:@supabase/supabase-js@2";
import { upsertBrevoContact } from "../_shared/brevoContact.ts";
import { sendPurchaseCapi } from "../_shared/metaCapi.ts";

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

    // Map Hotmart events → estado interno + estado Brevo (mapeo EXPLÍCITO por evento oficial)
    const evUpper = (event || "").toString().toUpperCase().trim();

    // PURCHASE_COMPLETE es el fin del periodo de reembolso (~30 días) de una
    // venta ya contada como PURCHASE_APPROVED — NO es una compra nueva.
    // Ignorar por completo para evitar duplicar ventas en /admin/analytics
    // y /admin/hotmart-audit. El usuario también lo desactivó en el panel
    // de Hotmart; este guard es defensa en profundidad.
    if (evUpper === "PURCHASE_COMPLETE") {
      console.log("[hotmart] PURCHASE_COMPLETE ignorado (duplicado de PURCHASE_APPROVED)");
      return new Response(JSON.stringify({ ok: true, ignored: "PURCHASE_COMPLETE" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mapa oficial de eventos Hotmart:
    //  APROBADAS: PURCHASE_APPROVED, PURCHASE_COMPLETE
    //  PENDIENTES: PURCHASE_BILLET_PRINTED, PURCHASE_DELAYED, PURCHASE_OUT_OF_SHOPPING_CART, PURCHASE_PROTEST (bajo revisión)
    //  RECHAZADAS: PURCHASE_REFUSED, PURCHASE_EXPIRED
    //  POSVENTA:   PURCHASE_REFUNDED, PURCHASE_CHARGEBACK, PURCHASE_CANCELED / PURCHASE_CANCELLED
    const EVENT_MAP: Record<string, { status: string; brevo: "compra" | "pendiente" | "rechazado" | "reembolso" | "chargeback" | "cancelado" }> = {
      PURCHASE_APPROVED:            { status: "approved",   brevo: "compra" },
      PURCHASE_COMPLETE:            { status: "approved",   brevo: "compra" },
      PURCHASE_BILLET_PRINTED:      { status: "pending",    brevo: "pendiente" },
      PURCHASE_DELAYED:             { status: "pending",    brevo: "pendiente" },
      PURCHASE_OUT_OF_SHOPPING_CART:{ status: "pending",    brevo: "pendiente" },
      PURCHASE_PROTEST:             { status: "pending",    brevo: "pendiente" },
      PURCHASE_REFUSED:             { status: "refused",    brevo: "rechazado" },
      PURCHASE_EXPIRED:             { status: "refused",    brevo: "rechazado" },
      PURCHASE_REFUNDED:            { status: "refunded",   brevo: "reembolso" },
      PURCHASE_CHARGEBACK:          { status: "chargeback", brevo: "chargeback" },
      PURCHASE_CANCELED:            { status: "cancelled",  brevo: "cancelado" },
      PURCHASE_CANCELLED:           { status: "cancelled",  brevo: "cancelado" },
    };

    let status = "pending";
    let brevoStatus: "compra" | "pendiente" | "rechazado" | "reembolso" | "chargeback" | "cancelado" = "pendiente";

    if (EVENT_MAP[evUpper]) {
      status = EVENT_MAP[evUpper].status;
      brevoStatus = EVENT_MAP[evUpper].brevo;
    } else {
      // Fallback tolerante por si Hotmart envía variantes o el status viene en purchase.status
      if (evUpper.includes("REFUND")) { status = "refunded"; brevoStatus = "reembolso"; }
      else if (evUpper.includes("CHARGEBACK")) { status = "chargeback"; brevoStatus = "chargeback"; }
      else if (evUpper.includes("CANCEL")) { status = "cancelled"; brevoStatus = "cancelado"; }
      else if (evUpper.includes("REFUSED") || evUpper.includes("EXPIRED")) { status = "refused"; brevoStatus = "rechazado"; }
      else if (evUpper.includes("APPROVED") || evUpper.includes("COMPLETE")) { status = "approved"; brevoStatus = "compra"; }
      else if (
        evUpper.includes("BILLET") || evUpper.includes("WAITING_PAYMENT") ||
        evUpper.includes("DELAYED") || evUpper.includes("PROTEST") ||
        evUpper.includes("OUT_OF_SHOPPING_CART") || evUpper.includes("PIX") ||
        evUpper.includes("OXXO") || evUpper.includes("BOLETO")
      ) { status = "pending"; brevoStatus = "pendiente"; }
      // Cualquier otro evento desconocido queda como "pendiente" por seguridad.
      console.log(`[hotmart] evento no mapeado explícitamente: "${evUpper}" → status=${status}`);
    }

    // Persistir estado en hotmart_purchases (upsert siempre, no sólo aprobados)
    const product = labelHotmartProduct(productName, productCode, productId);
    const priceValue = Number(data?.purchase?.price?.value ?? data?.purchase?.full_price?.value ?? data?.purchase?.approved_price?.value ?? product.value);
    const currency = String(data?.purchase?.price?.currency_code ?? data?.purchase?.currency_code ?? "USD").toUpperCase();

    const { error: upsertErr } = await supabase.from("hotmart_purchases").upsert(
      {
        email: buyerEmail.toLowerCase().trim(),
        transaction_code: transactionCode,
        product_code: productCode ?? null,
        product_id: productId ?? null,
        purchased_at: new Date().toISOString(),
        refund_deadline: new Date(Date.now() + 7 * 864e5).toISOString(),
        status,
        raw_payload: body,
      },
      { onConflict: "transaction_code" },
    );
    if (upsertErr) throw upsertErr;

    // Sólo registrar Purchase en el funnel/píxel para aprobadas
    if (status === "approved") {
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

      await sendPurchaseCapi({
        eventId: `Purchase_HM_${transactionCode}`,
        email: buyerEmail,
        country: data?.buyer?.address?.country_iso || data?.buyer?.address?.country || null,
        value: Number.isFinite(priceValue) ? priceValue : product.value,
        currency,
        contentIds: [product.id],
        contentName: productName || product.id,
        orderId: transactionCode,
        eventSourceUrl: "https://ilinguerelax.com/hotmart-success",
      });
    }
    
    // Iniciar la entrega digital segura (tokenizada) inmediatamente tras la aprobación
    if (status === "approved" && buyerEmail) {
      const buyerName = data?.buyer?.name ?? data?.purchase?.buyer?.name ?? undefined;
      const buyerPhone = data?.buyer?.checkout_phone ?? data?.buyer?.phone ?? undefined;
      const buyerCountry = data?.buyer?.address?.country_iso ?? data?.buyer?.address?.country ?? undefined;
      
      try {
        await invokeInternalFunction("send-digital-ilinguerelax", {
          customerEmail: buyerEmail.toLowerCase().trim(),
          customerName: buyerName,
          customerPhone: buyerPhone,
          customerCountry: buyerCountry,
          orderId: transactionCode,
          skus: [product.id],
          amount: priceValue,
          currency,
          provider: "hotmart",
          idempotencyKey: `digital:hotmart:${transactionCode}`,
        });
      } catch (e) {
        console.error("[hotmart-webhook] digital delivery trigger failed:", e);
      }


    // Sincronizar SIEMPRE a Brevo (compra, pendiente, rechazado, reembolso, chargeback, cancelado)
    try {
      const buyerName: string | undefined =
        data?.buyer?.name ?? data?.purchase?.buyer?.name ?? undefined;
      const buyerPhone: string | undefined =
        data?.buyer?.checkout_phone ?? data?.buyer?.phone ??
        data?.purchase?.buyer?.checkout_phone ?? data?.purchase?.buyer?.phone ?? undefined;
      const buyerCountry: string | undefined =
        data?.buyer?.address?.country_iso ?? data?.buyer?.address?.country ??
        data?.purchase?.buyer?.address?.country_iso ?? data?.purchase?.buyer?.address?.country ?? undefined;

      if (status === "approved") {
        try {
          await supabase.from("email_contacts").insert({
            email: buyerEmail.toLowerCase().trim(),
            name: buyerName ?? null,
            source: "hotmart_purchase",
            product_type: product.id,
          });
        } catch (_) { /* conflict ignored */ }
      }

      const couponRaw =
        data?.purchase?.offer?.coupon_code ?? data?.purchase?.offer?.code ??
        data?.purchase?.coupon?.code ?? data?.purchase?.coupon_code ??
        data?.purchase?.origin?.src ?? undefined;
      const couponCode = couponRaw ? String(couponRaw).trim().toUpperCase() : undefined;
      const couponAmountRaw = Number(
        data?.purchase?.price?.discount_value ?? data?.purchase?.discount?.value ??
        data?.purchase?.coupon?.value ?? NaN,
      );
      const couponAmount = Number.isFinite(couponAmountRaw) && couponAmountRaw > 0 ? couponAmountRaw : undefined;

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
        origin: "hotmart",
        hotmartProductId: productId,
        hotmartProductCode: productCode,
        couponCode,
        couponAmount,
        purchaseStatus: brevoStatus,
      });
    } catch (e) {
      console.warn("brevo sync failed:", e instanceof Error ? e.message : String(e));
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
