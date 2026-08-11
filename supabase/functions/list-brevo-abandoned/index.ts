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
    const eventFilter = ["tienda_abandoned"];

    let q = admin
      .from("brevo_sync_logs")
      .select("id, created_at, event_type, source, origin, email, product_name, product_sku, order_ref, status, http_status, attributes, response, error")
      .in("event_type", eventFilter)
      .order("created_at", { ascending: false })
      .limit(take);
    if (s) q = q.or(`email.ilike.%${s}%,product_sku.ilike.%${s}%,product_name.ilike.%${s}%,order_ref.ilike.%${s}%`);

    const { data: logs, error } = await q;
    if (error) throw error;

    // Enrich with the matching contact data if available
    const emails = Array.from(new Set((logs ?? []).map((l: any) => (l.email ?? "").toLowerCase()).filter(Boolean)));
    const cartsByEmail = new Map<string, any[]>();
    if (emails.length > 0) {
      const { data: contacts } = await admin
        .from("email_contacts")
        .select("email, name, metadata")
        .in("email", emails);
      for (const c of contacts ?? []) {
        const k = String(c.email || "").toLowerCase();
        cartsByEmail.set(k, [c]);
      }
    }

    const rows = (logs ?? []).map((l: any) => {
      const key = String(l.email || "").toLowerCase();
      const list = cartsByEmail.get(key) ?? [];
      const cart = list[0] ?? null;
      const attrs = (l.attributes ?? {}) as Record<string, any>;
      return {
        id: l.id,
        created_at: l.created_at,
        event_type: l.event_type,
        origin: l.origin || "tienda",
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
