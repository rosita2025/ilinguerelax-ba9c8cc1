import { adminCorsHeaders, assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = adminCorsHeaders;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const { adminKey, origin, search, limit } = await req.json().catch(() => ({}));
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

    const take = Math.min(Math.max(Number(limit) || 200, 1), 500);
    const s = typeof search === "string" ? search.trim().toLowerCase() : "";
    const eventFilter =
      origin === "hotmart" ? ["hotmart_abandoned"] :
      origin === "tienda"  ? ["tienda_abandoned"] :
      ["hotmart_abandoned", "tienda_abandoned"];

    let q = admin
      .from("brevo_sync_logs")
      .select("id, created_at, event_type, source, origin, email, product_name, product_sku, order_ref, status, http_status, attributes, response, error")
      .in("event_type", eventFilter)
      .order("created_at", { ascending: false })
      .limit(take);
    if (s) q = q.or(`email.ilike.%${s}%,product_sku.ilike.%${s}%,product_name.ilike.%${s}%,order_ref.ilike.%${s}%`);

    const { data: logs, error } = await q;
    if (error) throw error;

    // Enrich with the matching abandoned_carts row (payload capturado desde la tienda / Hotmart)
    const emails = Array.from(new Set((logs ?? []).map((l: any) => (l.email ?? "").toLowerCase()).filter(Boolean)));
    const cartsByEmail = new Map<string, any[]>();
    if (emails.length > 0) {
      const { data: carts } = await admin
        .from("abandoned_carts")
        .select("id, customer_email, customer_name, customer_phone, product_type, language, country, is_completed, converted, created_at, updated_at, metadata")
        .in("customer_email", emails)
        .order("created_at", { ascending: false })
        .limit(1000);
      for (const c of carts ?? []) {
        const k = String(c.customer_email || "").toLowerCase();
        const arr = cartsByEmail.get(k) ?? [];
        arr.push(c);
        cartsByEmail.set(k, arr);
      }
    }

    const rows = (logs ?? []).map((l: any) => {
      const key = String(l.email || "").toLowerCase();
      const list = cartsByEmail.get(key) ?? [];
      // Prefer the abandoned cart closest in time to the log
      const logTs = new Date(l.created_at).getTime();
      const cart = list.slice().sort((a, b) =>
        Math.abs(new Date(a.created_at).getTime() - logTs) - Math.abs(new Date(b.created_at).getTime() - logTs)
      )[0] ?? null;
      const attrs = (l.attributes ?? {}) as Record<string, any>;
      return {
        id: l.id,
        created_at: l.created_at,
        event_type: l.event_type,
        origin: l.origin || (l.event_type === "hotmart_abandoned" ? "hotmart" : "tienda"),
        source: l.source ?? null,
        email: l.email,
        product_name: l.product_name,
        product_sku: l.product_sku,
        order_ref: l.order_ref,
        status: l.status,
        http_status: l.http_status,
        error: l.error,
        response_preview: typeof l.response === "string" ? l.response.slice(0, 1200) : null,
        attributes: attrs,
        summary: {
          ORIGEN: attrs.ORIGEN ?? null,
          SEGMENTO: attrs.SEGMENTO ?? null,
          TAGS: attrs.TAGS ?? null,
          HOTMART_PRODUCT_ID: attrs.HOTMART_PRODUCT_ID ?? null,
          HOTMART_PRODUCT_CODE: attrs.HOTMART_PRODUCT_CODE ?? null,
          TIENDA_SKU: attrs.TIENDA_SKU ?? null,
          COUNTRY_CODE: attrs.COUNTRY_CODE ?? attrs.PAIS_CODE ?? null,
          COUNTRY_STATUS: attrs.COUNTRY_STATUS ?? null,
          COUNTRY_MISSING_REASON: attrs.COUNTRY_MISSING_REASON ?? attrs.PAIS_MOTIVO ?? null,
        },
        cart,
      };
    });

    const summary = {
      total: rows.length,
      hotmart: rows.filter((r) => r.origin === "hotmart").length,
      tienda: rows.filter((r) => r.origin === "tienda").length,
      errors: rows.filter((r) => r.status && r.status !== "ok" && r.status !== "success").length,
    };

    return new Response(JSON.stringify({ rows, summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
