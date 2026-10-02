// Detalle completo de un pedido individual para /admin/orders/:id — usa el
// mismo formato de id con prefijo (man-, hm-, mp-, pp-, st-, dl-, sh-,
// cart-) que ya usa list-purchases-status y correct-purchase-email.
import { adminCorsHeaders, assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { normalizeSkus, splitSkuList } from "../_shared/digitalSku.ts";

const corsHeaders = adminCorsHeaders;

const rowItemName = (items: Array<{ name?: string; sku?: string }>, sku: string): string | null =>
  items.find((i) => i.sku === sku)?.name ?? null;

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
    let metaSkus: string[] = [];
    let itemsSummary: string | null = null;
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
        try { meta = JSON.parse(data.referrer || "{}"); } catch {
          // El referrer se corta a 2000 caracteres: si el JSON quedó incompleto,
          // se rescatan los SKUs y el resumen con una búsqueda directa.
          meta = {};
          const rawRef = String(data.referrer || "");
          const mSkus = rawRef.match(/"skus":"([^"]*)"/);
          const mSum = rawRef.match(/"items_summary":"([^"]*)"/);
          if (mSkus) meta.skus = mSkus[1];
          if (mSum) meta.items_summary = mSum[1];
        }
        email = data.email || meta.email || meta.buyer_email || meta.payer_email || meta.buyer?.email || null;
        name = data.name || meta.name || meta.buyer_name || meta.payer_name || meta.buyer?.name || null;
        amount = Number(data.value ?? 0) || null;
        currency = data.currency ?? null;
        country = data.country ?? null;
        // El producto puede venir en varios lugares distintos según el
        // proveedor — se intenta cada uno antes de caer en un nombre
        // genérico, para que esta sección NUNCA se vea vacía.
        // "stripe-checkout", "dlocal-…" y similares son nombres de pasarela, no de
        // producto: se ignoran para que se use el producto real (SKUs del pedido).
        const genericId = /checkout|^stripe|^dlocal|^mp$|^hotmart$|^paypal/i.test(String(data.product_id || ""));
        product = (genericId ? null : data.product_id) || meta.product_name || meta.product || meta.sku || meta.content_name || meta.items_summary || null;
        metaSkus = splitSkuList(meta.skus);
        itemsSummary = typeof meta.items_summary === "string" ? meta.items_summary : null;
        orderNumber = meta.order_number || meta.transaction || meta.transaction_code || meta.external_reference || data.session_id || rawId;
        createdAt = data.created_at ?? null;
        providerLabel = prefix === "hm" ? "Hotmart" : prefix === "mp" ? "Mercado Pago" : prefix === "st" ? "Stripe" : "dLocal Go";
        paymentMethod = providerLabel;
        rawDetail = { ...data, parsed_referrer: meta };
        // Si el proveedor registró una lista de productos (poco común para
        // estos 4, pero puede pasar), se usa; si no, al menos 1 item con el
        // producto principal que ya resolvimos arriba.
        items = Array.isArray(meta.items) && meta.items.length > 0 ? meta.items : [];
      }
    }

    if (!found) {
      return new Response(JSON.stringify({ error: "Pedido no encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Las tres consultas son independientes: se hacen a la vez para que el
    // detalle abra rápido (antes iban una detrás de otra).
    const emailLc = email ? email.toLowerCase() : null;
    const [deliveryRes, attrRes, byEmailRes, orderEventsRes] = await Promise.all([
      // Estado real de entrega del material digital.
      orderNumber
        ? admin.from("digital_email_sends").select("status, last_event, created_at, updated_at, skus").eq("order_id", orderNumber).order("created_at", { ascending: false }).limit(1)
        : Promise.resolve({ data: [] }),
      // ¿Hay atribución guardada de un clic en un anuncio de Meta?
      emailLc
        ? admin.from("meta_attribution").select("email, fbc, fbp, country, updated_at").eq("email", emailLc).maybeSingle()
        : Promise.resolve({ data: null }),
      // Eventos que ya traen este correo (checkout, compras por webhook…).
      emailLc
        ? admin.from("funnel_events").select("client_id, session_id").eq("email", emailLc).limit(200)
        : Promise.resolve({ data: [] }),
      // SKUs que registró la pasarela al aprobar el pago (Stripe, dLocal…).
      orderNumber
        ? admin.from("order_events").select("metadata").eq("order_number", orderNumber).eq("event", "payment_paid").limit(5)
        : Promise.resolve({ data: [] }),
    ]);
    const deliveryRow = ((deliveryRes.data ?? []) as Array<{ status: string | null; last_event: string | null; created_at: string | null; updated_at: string | null; skus?: unknown }>)[0] ?? null;
    const delivery = deliveryRow
      ? { status: deliveryRow.status, last_event: deliveryRow.last_event, created_at: deliveryRow.created_at, updated_at: deliveryRow.updated_at }
      : null;
    const metaAttr = (attrRes.data ?? null) as { country?: string; updated_at?: string } | null;
    const fromMetaAds = !!metaAttr;

    // ── Productos comprados (principal, upsells y bonos) ─────────────────
    // Se juntan los SKUs de todas las fuentes que los guardan: la fila del
    // pedido, el pago aprobado (order_events), el envío digital y el propio
    // evento del embudo; luego se traducen al nombre real del catálogo.
    const evSkus = ((orderEventsRes.data ?? []) as Array<{ metadata: { skus?: unknown } | null }>)
      .flatMap((r) => splitSkuList(r.metadata?.skus));
    const rowSkus = items.map((i) => i.sku || (i as { id?: string }).id).filter((v): v is string => !!v);
    const allSkus = normalizeSkus([...rowSkus, ...metaSkus, ...evSkus, ...splitSkuList(deliveryRow?.skus)]).slice(0, 12);

    type CatalogRow = { sku: string; name: string | null; bonus_name: string | null; bonuses: unknown; is_physical: boolean | null };
    let catalog: CatalogRow[] = [];
    let upsellLinks: Array<{ product_sku: string; upsell_sku: string }> = [];
    if (allSkus.length) {
      const [catRes, upRes] = await Promise.all([
        admin.from("digital_products").select("sku, name, bonus_name, bonuses, is_physical").in("sku", allSkus),
        admin.from("product_upsells").select("product_sku, upsell_sku").in("product_sku", allSkus),
      ]);
      catalog = (catRes.data ?? []) as CatalogRow[];
      upsellLinks = (upRes.data ?? []) as typeof upsellLinks;
    }
    const catBySku = new Map(catalog.map((c) => [c.sku, c]));
    // Un SKU es upsell si otro SKU del mismo pedido lo ofrece como upsell.
    const upsellSet = new Set(upsellLinks.filter((l) => allSkus.includes(l.upsell_sku)).map((l) => l.upsell_sku));
    const mainSku = allSkus.find((k) => !upsellSet.has(k)) ?? allSkus[0] ?? null;

    const bonusNames = (c: CatalogRow | undefined): string[] => {
      if (!c) return [];
      const out: string[] = [];
      if (Array.isArray(c.bonuses)) {
        for (const b of c.bonuses as Array<{ name?: string }>) if (b?.name) out.push(String(b.name));
      }
      if (c.bonus_name && !out.includes(c.bonus_name)) out.push(c.bonus_name);
      return out;
    };

    let resolvedItems: Array<{ sku: string | null; name: string; role: "main" | "upsell"; bonuses: string[]; is_physical: boolean }> = [];
    if (allSkus.length) {
      resolvedItems = allSkus
        .map((k) => ({ k, c: catBySku.get(k) }))
        .sort((a, b) => (a.k === mainSku ? -1 : b.k === mainSku ? 1 : 0))
        .map(({ k, c }) => ({
          sku: k,
          name: c?.name || rowItemName(items, k) || k,
          role: (k === mainSku ? "main" : "upsell") as "main" | "upsell",
          bonuses: bonusNames(c),
          is_physical: !!c?.is_physical,
        }));
    } else {
      // Sin SKUs registrados: se usa el nombre que haya dejado la pasarela.
      const fallbackNames = items.map((i) => i.name).filter((v): v is string => !!v);
      const names = fallbackNames.length ? fallbackNames : [itemsSummary || product || "Producto no registrado por la pasarela"];
      resolvedItems = names.map((n, i) => ({ sku: null, name: n, role: (i === 0 ? "main" : "upsell") as "main" | "upsell", bonuses: [], is_physical: false }));
    }
    items = resolvedItems as unknown as typeof items;
    product = resolvedItems[0]?.name ?? product ?? "Producto no registrado por la pasarela";
    const hasUpsell = resolvedItems.some((i) => i.role === "upsell");

    // ── Recorrido completo del cliente ────────────────────────────────────
    // El correo se une con el navegador (client_id) cuando lo escribe en el
    // checkout; con eso traemos TODAS sus visitas, también las de días antes.
    type Ev = { event_name: string; session_id: string | null; page_path: string | null; product_id: string | null; country: string | null; referrer: string | null; created_at: string; is_bot: boolean | null };
    const linked = (byEmailRes.data ?? []) as { client_id: string | null; session_id: string | null }[];
    const clientIds = [...new Set(linked.map((r) => r.client_id).filter((v): v is string => !!v))].slice(0, 10);
    const sessionIdsLinked = [...new Set(linked.map((r) => r.session_id).filter((v): v is string => !!v))].slice(0, 20);

    const events: Ev[] = [];
    if (clientIds.length || sessionIdsLinked.length) {
      const cols = "event_name, session_id, page_path, product_id, country, referrer, created_at, is_bot";
      const [byClient, bySession] = await Promise.all([
        clientIds.length
          ? admin.from("funnel_events").select(cols).in("client_id", clientIds).order("created_at", { ascending: true }).limit(1500)
          : Promise.resolve({ data: [] }),
        sessionIdsLinked.length
          ? admin.from("funnel_events").select(cols).in("session_id", sessionIdsLinked).order("created_at", { ascending: true }).limit(500)
          : Promise.resolve({ data: [] }),
      ]);
      const seen = new Set<string>();
      for (const e of [...((byClient.data ?? []) as Ev[]), ...((bySession.data ?? []) as Ev[])]) {
        const k = `${e.created_at}|${e.event_name}|${e.session_id}|${e.page_path}`;
        if (seen.has(k)) continue;
        seen.add(k);
        events.push(e);
      }
      events.sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
    }

    // Origen de una visita según su "referrer" guardado (utm:origen:campaña,
    // enlace externo o vacío).
    const classify = (ref: string | null): { source: string; channel: "meta" | "organic" | "direct" | "other" } => {
      if (!ref) return { source: "Directo", channel: "direct" };
      const r = ref.toLowerCase();
      if (r.startsWith("utm:")) {
        const src = r.split(":")[1] || "";
        if (["facebook", "fb", "instagram", "ig", "meta", "facebook_ads", "instagram_ads", "meta_ads", "an", "audience_network", "messenger"].includes(src)) return { source: "Meta Ads", channel: "meta" };
        if (["google", "bing", "yahoo", "duckduckgo"].includes(src)) return { source: "Google / buscadores", channel: "organic" };
        return { source: src ? src[0].toUpperCase() + src.slice(1) : "Campaña", channel: "other" };
      }
      try {
        const host = new URL(ref).hostname.replace(/^www\./, "");
        if (/(^|\.)(facebook|instagram|fb|l\.facebook|m\.facebook)\./.test(host + ".")) return { source: "Meta (orgánico/enlace)", channel: "other" };
        if (/google|bing|yahoo|duckduckgo|baidu|yandex|naver/.test(host)) return { source: "Google / buscadores", channel: "organic" };
        return { source: host, channel: "other" };
      } catch {
        return { source: "Directo", channel: "direct" };
      }
    };

    const purchaseMs = createdAt ? new Date(createdAt).getTime() : Date.now();
    // Solo visitas humanas anteriores (o iguales) a la compra.
    const humans = events.filter((e) => e.is_bot !== true && new Date(e.created_at).getTime() <= purchaseMs + 60_000);
    const visits = humans.filter((e) => e.event_name === "PageView" || e.event_name === "ViewContent");
    const DAY = 1000 * 60 * 60 * 24;

    let conversionSummary: Record<string, unknown> | null = null;
    if (visits.length > 0) {
      const first = visits[0];
      const last = visits[visits.length - 1];
      const sessions = new Set(visits.map((v) => v.session_id).filter(Boolean));
      const firstMs = new Date(first.created_at).getTime();
      const lastMs = new Date(last.created_at).getTime();

      // Vistas del producto comprado: se compara con el producto del pedido.
      const productKey = String(items[0]?.sku || product || "").toLowerCase();
      const norm = (v: string | null) => String(v || "").toLowerCase();
      const viewsOfProduct = humans.filter((e) =>
        e.event_name === "ViewContent" && !!productKey && !!e.product_id &&
        (norm(e.product_id).includes(productKey) || (norm(e.product_id).length > 3 && productKey.includes(norm(e.product_id)))),
      ).length;
      const viewsTotal = humans.filter((e) => e.event_name === "ViewContent").length;

      // Países vistos (el más frecuente primero).
      const countryCount = new Map<string, number>();
      for (const v of visits) if (v.country) countryCount.set(v.country, (countryCount.get(v.country) ?? 0) + 1);
      const countries = [...countryCount.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);

      const firstTouch = classify(first.referrer);
      const lastTouch = classify(last.referrer);
      // Canal final de la venta: Meta si hay clic guardado o si el primer/último
      // contacto fue de Meta; si no, orgánico o directo.
      const channel: "meta" | "organic" | "direct" | "other" =
        fromMetaAds || firstTouch.channel === "meta" || lastTouch.channel === "meta"
          ? "meta"
          : firstTouch.channel !== "direct" ? firstTouch.channel : lastTouch.channel;

      // Sesiones: una fila por sesión con fecha, primera página y vistas.
      const bySession = new Map<string, { at: string; first_page: string | null; views: number }>();
      for (const v of visits) {
        const sid = v.session_id || "sin-sesion";
        const cur = bySession.get(sid);
        if (!cur) bySession.set(sid, { at: v.created_at, first_page: v.page_path, views: 1 });
        else cur.views += 1;
      }

      conversionSummary = {
        session_count: sessions.size,
        first_visit_at: first.created_at,
        first_page: first.page_path,
        last_visit_at: last.created_at,
        last_page: last.page_path,
        days_before_purchase: Math.max(0, Math.round((purchaseMs - firstMs) / DAY)),
        days_since_last_visit: Math.max(0, Math.round((purchaseMs - lastMs) / DAY)),
        page_views: visits.length,
        product_views: viewsOfProduct,
        product_views_total: viewsTotal,
        countries,
        first_source: firstTouch.source,
        last_source: lastTouch.source,
        channel,
        sessions: [...bySession.values()].slice(0, 12),
      };
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
        has_upsell: hasUpsell,
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
