import { adminCorsHeaders, assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = adminCorsHeaders;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const { adminKey, action, orderId, trackingNumber, shippingProvider, source } = await req.json().catch(() => ({}));
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
      if (!trackingNumber && !shippingProvider) {
        throw new Error("Tracking number or provider is required");
      }

      const table = source === "manual" ? "manual_payments" : 
                    source === "shopify" ? "shopify_sales" : null;
      
      if (!table) throw new Error("Source table not supported for tracking updates");

      const idField = table === "manual_payments" ? "order_number" : "id";
      
      const { error: updateError } = await admin
        .from(table)
        .update({ 
          tracking_number: trackingNumber || null,
          shipping_provider: shippingProvider || null 
        })
        .eq(idField, orderId);

      if (updateError) throw updateError;

      // Log event with more metadata
      await admin.from("order_events").insert({
        order_id: orderId,
        event_type: "tracking_updated",
        details: { 
          trackingNumber, 
          shippingProvider, 
          source,
          updated_at: new Date().toISOString()
        }
      });

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