// Correct the buyer email on any purchase (Hotmart / Mercado Pago / PayPal /
// Manual) and optionally re-send the digital delivery to the corrected
// address. Called from AdminPurchasesStatus.
import { adminCorsHeaders, assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { normalizeSkus } from "../_shared/digitalSku.ts";

const corsHeaders = adminCorsHeaders;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const { adminKey, rowId, newEmail, resend } = await req.json().catch(() => ({}));
    const expected = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expected || adminKey !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof rowId !== "string" || !rowId.includes("-")) {
      return new Response(JSON.stringify({ error: "rowId inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const email = String(newEmail || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 200) {
      return new Response(JSON.stringify({ error: "Correo inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dash = rowId.indexOf("-");
    const prefix = rowId.slice(0, dash);
    const id = rowId.slice(dash + 1);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let provider = "";
    let previousEmail: string | null = null;
    let deliveryPayload: Record<string, unknown> | null = null;

    if (prefix === "hot") {
      provider = "hotmart";
      const { data: row, error } = await admin
        .from("hotmart_purchases")
        .select("id, email, transaction_code, product_code, status, raw_payload")
        .eq("id", id).maybeSingle();
      if (error || !row) throw new Error("Compra Hotmart no encontrada");
      previousEmail = row.email;
      await admin.from("hotmart_purchases").update({ email }).eq("id", id);
      const p: any = row.raw_payload ?? {};
      const buyerName = p?.data?.buyer?.name ?? null;
      const price = p?.data?.purchase?.price?.value ?? null;
      const cur = p?.data?.purchase?.price?.currency_value ?? null;
      const skus = normalizeSkus([row.product_code].filter(Boolean) as string[]);
      if ((row.status || "").toLowerCase() === "approved" && skus.length) {
        deliveryPayload = {
          customerEmail: email, customerName: buyerName,
          orderId: row.transaction_code, skus, amount: price, currency: cur,
          provider: "hotmart", force: true,
          idempotencyKey: `hot-correct-${row.id}-${email}`,
        };
      }
    } else if (prefix === "mp") {
      provider = "mercadopago";
      const { data: row, error } = await admin
        .from("funnel_events")
        .select("id, email, event_data, event_type")
        .eq("id", id).maybeSingle();
      if (error || !row) throw new Error("Evento MP no encontrado");
      previousEmail = row.email;
      const d: any = { ...(row.event_data ?? {}) };
      d.payer_email = email;
      await admin.from("funnel_events").update({ email, event_data: d }).eq("id", id);
      const skuList: string[] = Array.isArray(d.skus) ? d.skus :
                                d.sku ? [d.sku] :
                                Array.isArray(d.items) ? d.items.map((i: any) => i.sku).filter(Boolean) : [];
      const skus = normalizeSkus(skuList);
      const status = (d.status || row.event_type.replace(/^mp_/, "")).toLowerCase();
      if ((status === "approved" || row.event_type === "purchase") && skus.length) {
        deliveryPayload = {
          customerEmail: email, customerName: d.payer_name ?? null,
          orderId: d.payment_id ?? d.mp_id ?? id, skus,
          amount: d.amount ?? d.transaction_amount ?? null,
          currency: d.currency ?? d.currency_id ?? null,
          provider: "mercadopago", force: true,
          idempotencyKey: `mp-correct-${id}-${email}`,
        };
      }
    } else if (prefix === "pp") {
      provider = "paypal";
      const { data: row, error } = await admin
        .from("paypal_webhook_events")
        .select("id, event_type, resource_id, payload")
        .eq("id", id).maybeSingle();
      if (error || !row) throw new Error("Evento PayPal no encontrado");
      const p: any = row.payload ?? {};
      previousEmail = p?.resource?.payer?.email_address ?? p?.resource?.payer?.email ?? null;
      // Overlay corrected email in payload without touching the original signed webhook copy
      const nextPayload = JSON.parse(JSON.stringify(p));
      if (!nextPayload.resource) nextPayload.resource = {};
      if (!nextPayload.resource.payer) nextPayload.resource.payer = {};
      nextPayload.resource.payer.email_address = email;
      nextPayload._corrected_email = { previous: previousEmail, corrected_at: new Date().toISOString() };
      await admin.from("paypal_webhook_events").update({ payload: nextPayload }).eq("id", id);
      const resource = p?.resource ?? {};
      const description = resource?.purchase_units?.[0]?.description || resource?.description || "";
      const skus = normalizeSkus([description].filter(Boolean) as string[]);
      if (row.event_type === "PAYMENT.CAPTURE.COMPLETED" && skus.length) {
        deliveryPayload = {
          customerEmail: email,
          customerName: resource?.payer?.name?.given_name ?? null,
          orderId: row.resource_id ?? id, skus,
          amount: resource?.amount?.value ? Number(resource.amount.value) : null,
          currency: resource?.amount?.currency_code ?? null,
          provider: "paypal", force: true,
          idempotencyKey: `pp-correct-${id}-${email}`,
        };
      }
    } else if (prefix === "man") {
      provider = "manual";
      const { data: row, error } = await admin
        .from("manual_payments")
        .select("id, order_number, buyer_email, buyer_name, buyer_phone, buyer_country, amount_usd, currency_local, items, status")
        .eq("id", id).maybeSingle();
      if (error || !row) throw new Error("Pago manual no encontrado");
      previousEmail = row.buyer_email;
      await admin.from("manual_payments").update({ buyer_email: email }).eq("id", id);
      const items = Array.isArray(row.items) ? row.items : [];
      const skus = normalizeSkus(items.map((it: any) => it.sku).filter(Boolean));
      const st = (row.status || "").toLowerCase();
      if ((st === "verified" || st === "approved") && skus.length) {
        deliveryPayload = {
          customerEmail: email, customerName: row.buyer_name,
          customerPhone: row.buyer_phone, customerCountry: row.buyer_country,
          orderId: row.order_number, skus, amount: row.amount_usd,
          currency: row.currency_local || "USD", provider: "manual", force: true,
          idempotencyKey: `man-correct-${id}-${email}`,
        };
      }
    } else {
      return new Response(JSON.stringify({ error: "Prefijo desconocido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Audit
    await admin.from("digital_delivery_audit").insert({
      source: `email_correction/${provider}`,
      customer_email: email,
      order_id: rowId,
      status: "email_corrected",
      provider,
      items: [{ previous_email: previousEmail, new_email: email }],
    }).then(() => null).catch(() => null);

    let delivery: { ok: boolean; status: number; body?: string } | null = null;
    if (resend && deliveryPayload) {
      const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-digital-ilinguerelax`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify(deliveryPayload),
      });
      delivery = { ok: res.ok, status: res.status, body: (await res.text()).slice(0, 400) };
    }

    return new Response(JSON.stringify({
      success: true, provider, previousEmail, newEmail: email,
      resend: Boolean(resend), delivery, canResend: Boolean(deliveryPayload),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("correct-purchase-email error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
