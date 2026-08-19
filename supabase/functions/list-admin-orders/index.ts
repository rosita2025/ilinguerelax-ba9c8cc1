import { adminCorsHeaders, assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { sendEmail } from "../_shared/brevo.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = adminCorsHeaders;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const { adminKey, action, orderId, trackingNumber, shippingProvider, source, shippingProofUrl } = await req.json().catch(() => ({}));
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

    // Acción: Actualizar tracking
    if (action === "update_tracking" && orderId) {
      if (!trackingNumber && !shippingProvider && !shippingProofUrl) {
        throw new Error("Tracking number, provider, or proof URL is required");
      }

      const table = source === "manual" ? "manual_payments" :
                    source === "shopify" ? "shopify_sales" :
                    source === "gateway" ? "physical_shipments" : null;

      if (!table) throw new Error("Source table not supported for tracking updates");

      const idField = table === "shopify_sales" ? "id" : "order_number";

      const patch: Record<string, unknown> = {
        tracking_number: trackingNumber || null,
        shipping_provider: shippingProvider || null,
        shipping_proof_url: shippingProofUrl || null,
      };
      if (table === "physical_shipments") {
        patch.status = trackingNumber ? "shipped" : "pending";
      }

      const { error: updateError } = await admin
        .from(table)
        .update(patch)
        .eq(idField, orderId);

      if (updateError) throw updateError;

      // Log event with more metadata
      await admin.from("order_events").insert({
        order_number: String(orderId),
        event: "tracking_updated",
        status: trackingNumber ? "shipped" : "pending",
        provider: source === "gateway" ? "gateway" : source,
        reference: trackingNumber || null,
        detail: [shippingProvider, trackingNumber].filter(Boolean).join(" · ").slice(0, 500) || null,
        metadata: {
          trackingNumber,
          shippingProvider,
          shippingProofUrl,
          source,
          updated_at: new Date().toISOString(),
        },
      });

      // Send tracking email if tracking was added (and not just cleared)
      if (trackingNumber) {
        try {
          // Fetch order details to get customer email
          const selectCols = table === "manual_payments"
            ? "buyer_email, buyer_name"
            : table === "shopify_sales"
              ? "customer_email, customer_name"
              : "email, customer_name";
          const { data: orderData } = await admin
            .from(table)
            .select(selectCols)
            .eq(idField, orderId)
            .maybeSingle();

          const email = orderData?.buyer_email || orderData?.customer_email || orderData?.email;
          const name = orderData?.buyer_name || orderData?.customer_name || "Cliente";


          if (email) {
            const isAmazon = shippingProvider?.toLowerCase().includes("amazon");
            const trackingLink = isAmazon 
              ? `https://www.amazon.com/progress-tracker/package/ref=pt_redirect_from_gp?shipmentId=${trackingNumber}`
              : trackingNumber.startsWith('http') ? trackingNumber : null;

            await sendEmail({
              to: [{ email, name }],
              subject: `📦 Tu pedido ${orderId} ha sido enviado`,
              htmlContent: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
                  <h1 style="color: #0d9488;">¡Tu pedido está en camino!</h1>
                  <p>Hola ${name},</p>
                  <p>Nos alegra informarte que tu pedido <strong>${orderId}</strong> ha sido enviado.</p>
                  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">Número de seguimiento:</p>
                    <p style="margin: 5px 0 15px 0; font-size: 18px; font-weight: bold; color: #111827;">${trackingNumber}</p>
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">Transportista:</p>
                    <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold; color: #111827;">${shippingProvider || "Courier"}</p>
                  </div>
                  ${trackingLink ? `
                    <div style="text-align: center; margin-top: 25px;">
                      <a href="${trackingLink}" style="display: inline-block; background: #0d9488; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Rastrear mi pedido</a>
                    </div>
                  ` : `
                    <p>Puedes rastrear tu pedido ingresando el número anterior en la web del transportista.</p>
                  `}
                  <p style="margin-top: 30px; font-size: 14px; color: #6b7280; text-align: center;">
                    También puedes ver el estado detallado en: <br>
                    <a href="https://ilinguerelax.com/mi-pedido?order=${orderId}&email=${encodeURIComponent(email)}" style="color: #0d9488; text-decoration: underline;">https://ilinguerelax.com/mi-pedido</a>
                  </p>
                  <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                  <p style="font-size: 12px; color: #9ca3af; text-align: center;">iLingue Relax · Aprendizaje sin estrés</p>
                </div>
              `,
              provider: "resend"
            });
            console.log(`Tracking email sent to ${email} for order ${orderId}`);
          }
        } catch (emailError) {
          console.error("Error sending tracking email:", emailError);
          // Don't throw, we want the tracking update to succeed even if email fails
        }
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [manual, shopify, hotmart, digital, funnel, emailLog, products, access] = await Promise.all([
      admin.from("manual_payments").select("*").order("created_at", { ascending: false }).limit(200),
      admin.from("shopify_sales").select("*").order("created_at", { ascending: false }).limit(200),
      admin.from("hotmart_purchases").select("*").order("created_at", { ascending: false }).limit(200),
      admin.from("digital_email_sends").select("*").order("created_at", { ascending: false }).limit(200),
      admin.from("funnel_events").select("*").in("event_name", ["Purchase", "purchase", "mp_pending", "mp_in_process"]).order("created_at", { ascending: false }).limit(300),
      admin.from("email_send_log").select("*").order("created_at", { ascending: false }).limit(300),
      admin.from("digital_products").select("sku,name,bonus_name,bonus_drive_url,bonuses,active,drive_url,updated_at,is_physical").limit(500),
      admin.from("download_token_access").select("id,token_id,action,sku,ip,created_at").order("created_at", { ascending: false }).limit(300),
    ]);

    const accessRows = access.data ?? [];
    const tokenIds = [...new Set(accessRows.map((r: { token_id: string }) => r.token_id))];
    let tokenMap = new Map<string, {
      order_number: string; email: string; download_count: number; max_downloads: number;
      expires_at: string; revoked: boolean;
    }>();
    if (tokenIds.length) {
      const { data: toks } = await admin
        .from("download_tokens")
        .select("id,order_number,email,download_count,max_downloads,expires_at,revoked")
        .in("id", tokenIds);
      tokenMap = new Map((toks ?? []).map((t: { id: string }) => [t.id, t as never]));
    }
    const providerByOrder = new Map<string, string>();
    for (const d of (digital.data ?? []) as { order_id: string | null; provider: string | null }[]) {
      if (d.order_id && d.provider) providerByOrder.set(String(d.order_id).toUpperCase(), d.provider);
    }
    for (const m of (manual.data ?? []) as { order_number: string | null; method: string | null }[]) {
      if (m.order_number && !providerByOrder.has(String(m.order_number).toUpperCase())) {
        providerByOrder.set(String(m.order_number).toUpperCase(), m.method || "manual");
      }
    }
    const tokenAccess = accessRows.map((r: {
      id: number; token_id: string; action: string; sku: string | null; ip: string | null; created_at: string;
    }) => {
      const tok = tokenMap.get(r.token_id);
      const order = tok?.order_number ?? null;
      return {
        id: r.id,
        created_at: r.created_at,
        action: r.action,
        sku: r.sku,
        ip: r.ip,
        order_number: order,
        email: tok?.email ?? null,
        provider: order ? (providerByOrder.get(order.toUpperCase()) ?? null) : null,
        download_count: tok?.download_count ?? null,
        max_downloads: tok?.max_downloads ?? null,
        expires_at: tok?.expires_at ?? null,
        revoked: tok?.revoked ?? null,
      };
    });

    return new Response(
      JSON.stringify({
        manual: manual.data ?? [],
        shopify: shopify.data ?? [],
        hotmart: hotmart.data ?? [],
        digital: digital.data ?? [],
        funnel: funnel.data ?? [],
        emailLog: emailLog.data ?? [],
        products: products.data ?? [],
        tokenAccess,
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