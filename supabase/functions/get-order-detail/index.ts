// Detalle completo de un pedido individual para /admin/orders/:id — usa el
// mismo formato de id con prefijo (man-, hm-, mp-, pp-, st-, dl-, sh-,
// cart-) que ya usa list-purchases-status y correct-purchase-email.
import { adminCorsHeaders, assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = adminCorsHeaders;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const { adminKey, id } = await req.json().catch(() => ({}));
    const expected = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expected || adminKey !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!id || typeof id !== "string") {
      return new Response(JSON.stringify({ error: "Falta el id del pedido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const dash = id.indexOf("-");
    const prefix = dash === -1 ? id : id.slice(0, dash);
    const rawId = dash === -1 ? id : id.slice(dash + 1);

    let orderNumber: string | null = null;
    let email: string | null = null;
    let name: string | null = null;
    let amount: number | null = null;
    let currency: string | null = null;
    let country: string | null = null;
    let product: string | null = null;
    let createdAt: string | null = null;
    let providerLabel = "";
    let paymentMethod: string | null = null;
    let rawDetail: Record<string, unknown> = {};
    let items: Array<{ name?: string; sku?: string }> = [];
    let found = false;

    if (prefix === "man") {
      const { data } = await admin.from("manual_payments").select("*").eq("id", rawId).maybeSingle();
      if (data) {
        found = true;
        orderNumber = data.order_number ?? null;
        email = data.buyer_email ?? null;
        name = data.buyer_name ?? null;
        amount = Number(data.amount_usd ?? data.amount_local ?? 0) || null;
        currency = data.amount_usd ? "USD" : (data.currency_local ?? null);
        country = data.buyer_country ?? null;
        createdAt = data.created_at ?? null;
        providerLabel = "Pago manual";
        paymentMethod = data.method ?? null;
        rawDetail = data;
        items = Array.isArray(data.items) ? data.items : [];
      }
    } else if (prefix === "cart") {
      const { data } = await admin.from("persistent_carts").select("*").eq("id", rawId).maybeSingle();
      if (data) {
        found = true;
        orderNumber = rawId;
        email = data.email ?? null;
        name = data.buyer?.fullName ?? data.buyer?.name ?? null;
        country = data.country ?? data.buyer?.country ?? null;
        createdAt = data.last_activity ?? null;
        providerLabel = "Carrito interno (sin pago confirmado)";
        paymentMethod = null;
        rawDetail = data;
        items = Array.isArray(data.items) ? data.items : [];
      }
    } else if (prefix === "sh") {
      const { data } = await admin.from("shopify_sales").select("*").eq("id", rawId).maybeSingle();
      if (data) {
        found = true;
        orderNumber = data.shopify_order_id ?? rawId;
        email = (data.customer_name as string)?.includes("@") ? data.customer_name : null;
        name = !(data.customer_name as string)?.includes("@") ? data.customer_name : null;
        country = data.country ?? null;
        product = data.product_name ?? null;
        createdAt = data.order_created_at ?? null;
        providerLabel = "Shopify (pedido físico)";
        paymentMethod = "Shopify";
        rawDetail = data;
      }
    } else if (prefix === "pp") {
      // PayPal: la fila es un evento webhook con todo el detalle dentro de payload.
      const { data } = await admin.from("paypal_webhook_events").select("*").eq("id", rawId).maybeSingle();
      if (data) {
        found = true;
        const p: any = data.payload ?? {};
        const resource = p?.resource ?? {};
        const payer = resource?.payer ?? {};
        email = payer?.email_address ?? payer?.email ?? null;
        name = payer?.name?.given_name ? `${payer.name.given_name} ${payer.name.surname || ""}`.trim() : null;
        amount = Number(resource?.amount?.value ?? resource?.purchase_units?.[0]?.amount?.value ?? 0) || null;
        currency = resource?.amount?.currency_code ?? resource?.purchase_units?.[0]?.amount?.currency_code ?? null;
        country = payer?.address?.country_code ?? null;
        orderNumber = data.correlation_id ?? data.resource_id ?? rawId;
        createdAt = data.created_at ?? null;
        providerLabel = "PayPal";
        paymentMethod = "PayPal";
        rawDetail = data;
      }
    } else {
      // hm (Hotmart), mp (Mercado Pago), st (Stripe), dl (dLocal Go) —
      // todos viven como filas de funnel_events, diferenciados por su
      // campo "provider" o por patrones dentro de "referrer".
      const { data } = await admin.from("funnel_events").select("*").eq("id", rawId).maybeSingle();
      if (data) {
        found = true;
        let meta: any = {};
        try { meta = JSON.parse(data.referrer || "{}"); } catch { meta = {}; }
        email = data.email || meta.email || meta.buyer_email || meta.payer_email || meta.buyer?.email || null;
        name = data.name || meta.name || meta.buyer_name || meta.payer_name || meta.buyer?.name || null;
        amount = Number(data.value ?? 0) || null;
        currency = data.currency ?? null;
        country = data.country ?? null;
        // El producto puede venir en varios lugares distintos según el
        // proveedor — se intenta cada uno antes de caer en un nombre
        // genérico, para que esta sección NUNCA se vea vacía.
        product = data.product_id || meta.product_name || meta.product || meta.sku || meta.content_name || "Producto digital (sin nombre registrado)";
        orderNumber = meta.order_number || meta.transaction || meta.transaction_code || meta.external_reference || data.session_id || rawId;
        createdAt = data.created_at ?? null;
        providerLabel = prefix === "hm" ? "Hotmart" : prefix === "mp" ? "Mercado Pago" : prefix === "st" ? "Stripe" : "dLocal Go";
        paymentMethod = providerLabel;
        rawDetail = { ...data, parsed_referrer: meta };
        // Si el proveedor registró una lista de productos (poco común para
        // estos 4, pero puede pasar), se usa; si no, al menos 1 item con el
        // producto principal que ya resolvimos arriba.
        items = Array.isArray(meta.items) && meta.items.length > 0
          ? meta.items
          : [{ name: product }];
      }
    }

    if (!found) {
      return new Response(JSON.stringify({ error: "Pedido no encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Red de seguridad final: ningún pedido debe mostrar la sección de
    // productos vacía, sin importar de qué tabla vino.
    if (!product) product = "Producto digital (sin nombre registrado)";
    if (!items || items.length === 0) items = [{ name: product }];

    // Estado real de entrega del material digital (tabla compartida por
    // todos los métodos de pago, cuando el pedido lo generó).
    let delivery: { status: string | null; last_event: string | null; created_at: string | null; updated_at: string | null } | null = null;
    if (orderNumber) {
      const { data: deliveryRow } = await admin
        .from("digital_email_sends")
        .select("status, last_event, created_at, updated_at")
        .eq("order_id", orderNumber)
        .maybeSingle();
      delivery = deliveryRow ?? null;
    }

    // Resumen de conversión: ¿vino de un anuncio de Meta o fue directo/orgánico?
    let fromMetaAds = false;
    let metaAttr: { country?: string; updated_at?: string } | null = null;
    if (email) {
      const { data: attr } = await admin
        .from("meta_attribution")
        .select("email, fbc, fbp, country, updated_at")
        .eq("email", email.toLowerCase())
        .maybeSingle();
      if (attr) {
        fromMetaAds = true;
        metaAttr = attr;
      }
    }

    // Resumen de conversión completo (estilo Shopify "Conversion summary"):
    // todas las visitas (PageView) de este correo, para saber cuántas
    // sesiones tuvo y cuándo fue la primera, no solo si vino de Meta.
    let conversionSummary: {
      session_count: number;
      first_visit_at: string | null;
      first_page: string | null;
      days_before_purchase: number | null;
    } | null = null;
    if (email) {
      const { data: visits } = await admin
        .from("funnel_events")
        .select("session_id, page_path, created_at")
        .eq("email", email.toLowerCase())
        .eq("event_name", "PageView")
        .order("created_at", { ascending: true })
        .limit(200);
      if (visits && visits.length > 0) {
        const sessionIds = new Set(visits.map((v: { session_id: string }) => v.session_id));
        const first = visits[0];
        let days: number | null = null;
        if (createdAt && first.created_at) {
          const ms = new Date(createdAt).getTime() - new Date(first.created_at).getTime();
          days = Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
        }
        conversionSummary = {
          session_count: sessionIds.size,
          first_visit_at: first.created_at,
          first_page: first.page_path,
          days_before_purchase: days,
        };
      }
    }

    return new Response(
      JSON.stringify({
        id,
        provider_label: providerLabel,
        payment_method: paymentMethod,
        order_number: orderNumber,
        email,
        name,
        amount,
        currency,
        country,
        product,
        items,
        created_at: createdAt,
        from_meta_ads: fromMetaAds,
        meta_attribution: metaAttr,
        conversion_summary: conversionSummary,
        delivery,
        raw_detail: rawDetail,
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
