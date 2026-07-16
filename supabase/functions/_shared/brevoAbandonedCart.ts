// Pushes an abandoned-cart contact to Brevo with rich attributes.
// The actual Day 1/7/15/30 emails are sent by a Brevo Automation workflow
// that triggers on the ABANDONED_CART list + ABANDONED_AT attribute.
//
// Requires runtime secrets:
//   - LOVABLE_API_KEY
//   - BREVO_API_KEY (connector)
//   - BREVO_ABANDONED_CART_LIST_ID  (numeric Brevo list id)

interface Args {
  email: string;
  name?: string;
  phone?: string;           // E.164 international (WhatsApp/SMS)
  productSku: string;
  productName?: string;
  productUrl?: string;      // absolute checkout / product page URL
  priceUsd?: number;
  couponCode?: string;      // e.g. "NEW10"
  couponPercent?: number;   // % de descuento sugerido/aplicado
  couponAmount?: number;    // monto absoluto (misma moneda que priceUsd)
  language?: string;        // es|en|fr|pt
  country?: string;         // ISO-2, e.g. PE, US, FR
  countryReason?: string;   // motivo cuando country falta (ip_unavailable, hotmart_payload_incomplete, etc.)
  source?: string;          // "checkout" | "hotmart" | ...
  productCategory?: string; // categoría/tipo de oferta explícita (opcional)
  paymentMethod?: string;   // stripe | paypal | yape_plin | mercadopago_transfer | ...
  triggerReason?: string;   // initial | email_change | cart_change | country_change | data_change | manual
}

import { logBrevoSync } from "./brevoLog.ts";
import { inferProductCategory, CATEGORY_LABEL } from "./brevoCategory.ts";
import { resolveBrevoAudiences } from "./brevoProductAudiences.ts";
import { normalizeCountry } from "./brevoCountry.ts";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/brevo";

function splitName(full?: string): { first?: string; last?: string } {
  if (!full) return {};
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0] };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export async function pushAbandonedCartToBrevo(a: Args): Promise<boolean> {
  const email = (a.email || "").trim().toLowerCase();
  if (!email) return false;

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
  const LIST_ID_RAW = Deno.env.get("BREVO_ABANDONED_CART_LIST_ID");
  if (!LOVABLE_API_KEY || !BREVO_API_KEY) {
    console.warn("[brevo-abandoned] Missing LOVABLE_API_KEY or BREVO_API_KEY — skipping");
    return false;
  }
  const listId = LIST_ID_RAW ? Number(LIST_ID_RAW) : NaN;
  if (!Number.isFinite(listId)) {
    console.warn("[brevo-abandoned] BREVO_ABANDONED_CART_LIST_ID not set — skipping");
    return false;
  }

  const { first, last } = splitName(a.name);

  const attributes: Record<string, unknown> = {
    ABANDONED_AT: new Date().toISOString().slice(0, 10),
    ABANDONED_PRODUCT_SKU: a.productSku,
  };
  if (first) attributes.NOMBRE = first;
  if (last) attributes.APELLIDOS = last;
  if (a.productName) attributes.ABANDONED_PRODUCT_NAME = a.productName;
  if (a.productUrl) attributes.ABANDONED_CART_URL = a.productUrl;
  if (typeof a.priceUsd === "number") attributes.ABANDONED_PRICE_USD = a.priceUsd;
  // ABANDONED_COUPON se setea más abajo con normalización + tag/nota
  if (a.language) {
    const lang = a.language.toLowerCase();
    attributes.LANGUAGE = lang;   // segmentar automatización por idioma
    attributes.LANG = lang;
  }
  const country = normalizeCountry(a.country);
  if (country.code) {
    attributes.COUNTRY = country.code;
    attributes.COUNTRY_CODE = country.code;
    attributes.PAIS_CODE = country.code;
  }
  if (country.name) {
    attributes.COUNTRY_NAME = country.name;
    attributes.PAIS = country.name;
  }
  attributes.COUNTRY_STATUS = country.status;
  if (country.status !== "ok" && country.raw) attributes.COUNTRY_RAW = country.raw.slice(0, 64);
  // Motivo explícito de por qué falta el país (nunca inventamos, solo registramos)
  if (country.status !== "ok") {
    const reason = (a.countryReason || (country.status === "invalid" ? "invalid_format" : "unknown_source")).toString().slice(0, 64);
    attributes.COUNTRY_MISSING_REASON = reason;
    attributes.PAIS_MOTIVO = reason;
  }
  // Validación estricta de ORIGEN: solo 'hotmart' o 'tienda'.
  // Fuentes conocidas de tienda propia: checkout, stripe, paypal, mercadopago, yape, plin, manual, web.
  const rawSource = (a.source ?? "").toString().trim().toLowerCase();
  const HOTMART_SOURCES = new Set(["hotmart"]);
  const TIENDA_SOURCES = new Set([
    "checkout", "stripe", "paypal", "mercadopago", "mp",
    "yape", "plin", "manual", "web", "tienda",
  ]);
  let origin: "hotmart" | "tienda";
  let originStatus: "ok" | "missing" | "invalid" = "ok";
  if (HOTMART_SOURCES.has(rawSource)) {
    origin = "hotmart";
  } else if (TIENDA_SOURCES.has(rawSource)) {
    origin = "tienda";
  } else {
    originStatus = rawSource ? "invalid" : "missing";
    origin = "tienda"; // fallback seguro: la tienda propia
    console.warn(
      `[brevo-abandoned] ORIGEN ${originStatus} (source="${rawSource}") → forzado a "${origin}"`,
    );
    await logBrevoSync({
      event_type: "origen_validation",
      source: "brevo_abandoned",
      origin,
      email: (a.email || "").trim().toLowerCase(),
      product_name: a.productName,
      product_sku: a.productSku,
      status: "failed",
      attributes: { received_source: rawSource || null, forced_to: origin },
      error: `ORIGEN ${originStatus}`,
    });
  }
  if (a.source) attributes.ABANDONED_SOURCE = a.source;
  const paymentMethod = (a.paymentMethod || "").trim().toLowerCase().slice(0, 40);
  if (paymentMethod) {
    attributes.ABANDONED_PAYMENT_METHOD = paymentMethod;
    attributes.PAYMENT_METHOD_SELECTED = paymentMethod;
  } else {
    attributes.ABANDONED_PAYMENT_METHOD = "not_selected";
    attributes.PAYMENT_METHOD_SELECTED = "not_selected";
  }
  attributes.ORIGEN = origin;
  attributes.ORIGEN_STATUS = originStatus;
  // IDs de canal para saber en Brevo qué producto/plataforma abandonó
  if (origin === "hotmart") {
    attributes.HOTMART_PRODUCT_ID = a.productSku;
    attributes.HOTMART_PRODUCT_CODE = a.productSku;
  } else {
    attributes.TIENDA_SKU = a.productSku;
  }
  // Categoría/tipo de oferta para agrupar en Brevo (8,000 palabras, pack, coreano…)
  const category = inferProductCategory({
    productName: a.productName,
    sku: a.productSku,
    explicit: a.productCategory,
  });
  const categoryLabel = CATEGORY_LABEL[category];
  attributes.CATEGORIA = category;
  attributes.PRODUCT_CATEGORY = category;
  attributes.CATEGORIA_LABEL = categoryLabel;

  // Cupón sugerido/aplicado en el carrito abandonado (para segmentar campañas por descuento)
  const couponCodeRaw = (a.couponCode || "").trim().toUpperCase();
  const couponCode = couponCodeRaw.slice(0, 32);
  const couponPercent = Number.isFinite(a.couponPercent as number) ? (a.couponPercent as number) : undefined;
  const couponAmount = Number.isFinite(a.couponAmount as number) ? (a.couponAmount as number) : undefined;
  if (couponCode) {
    attributes.ABANDONED_COUPON = couponCode;
    attributes.COUPON_USED = "si";
    attributes.COUPON_APPLIED = true;
  } else {
    attributes.COUPON_USED = "no";
    attributes.COUPON_APPLIED = false;
  }
  if (typeof couponPercent === "number" && couponPercent > 0) attributes.ABANDONED_COUPON_PERCENT = couponPercent;
  if (typeof couponAmount === "number" && couponAmount > 0) attributes.ABANDONED_COUPON_AMOUNT = couponAmount;

  const noteParts = [
    origin === "hotmart" ? "Hotmart" : "Tienda",
    "abandonado",
    a.productName || "",
    `cat=${categoryLabel}`,
    `sku=${a.productSku}`,
    typeof a.priceUsd === "number" ? `usd=${a.priceUsd}` : "",
    couponCode
      ? `cupón=${couponCode}${typeof couponPercent === "number" && couponPercent > 0 ? ` (-${couponPercent}%)` : typeof couponAmount === "number" && couponAmount > 0 ? ` (-${couponAmount})` : ""}`
      : "",
  ].filter(Boolean);
  attributes.ABANDONED_NOTE = noteParts.join(" · ");

  // TAGS: incluye categoría y cupón para filtrar por oferta/descuento abandonado
  const eventKind: "compra" | "abandonado" = "abandonado";
  const tagList = [eventKind, origin, `${eventKind}_${origin}`, `cat_${category}`];
  if (couponCode) tagList.push(`cupon_${couponCode.toLowerCase()}`);

  // Audiencias/segmentos por producto (tabla brevo_product_audiences, editable en admin)
  const audiences = await resolveBrevoAudiences({
    eventKind,
    origin,
    hotmartProductId: origin === "hotmart" ? a.productSku : undefined,
    hotmartProductCode: origin === "hotmart" ? a.productSku : undefined,
    tiendaSku: origin === "tienda" ? a.productSku : undefined,
    skus: [a.productSku].filter(Boolean),
    category,
  });
  for (const t of audiences.tags) tagList.push(t);
  if (audiences.labels.length) attributes.PRODUCT_AUDIENCES = audiences.labels.join(", ");

  attributes.TAGS = tagList.join(",");
  attributes.SEGMENTO = `${eventKind}_${origin}`;

  const rawPhone = (a.phone || "").trim();
  const phoneClean = rawPhone.replace(/[^\d+]/g, "");
  const phoneValid = phoneClean.startsWith("+") && phoneClean.length >= 8 && phoneClean.length <= 16;
  if (phoneValid) {
    attributes.SMS = phoneClean;
    attributes.WHATSAPP = phoneClean;
    attributes.TELEFONO_PROVISTO = "si";
    attributes.PHONE_PROVIDED = true;
    attributes.PHONE_STATUS = "ok";
  } else {
    attributes.TELEFONO_PROVISTO = "no";
    attributes.PHONE_PROVIDED = false;
    if (rawPhone) {
      attributes.PHONE_RAW = rawPhone.slice(0, 32);
      attributes.PHONE_STATUS = "invalid_format";
    } else {
      attributes.PHONE_STATUS = "missing";
    }
  }

  const parseIds = (raw?: string | null) =>
    raw ? raw.split(",").map((s) => Number(s.trim())).filter((n) => Number.isFinite(n)) : [];
  const extraListIds = parseIds(
    origin === "hotmart"
      ? Deno.env.get("BREVO_LIST_HOTMART_ABANDONO")
      : Deno.env.get("BREVO_LIST_TIENDA_ABANDONO"),
  );
  const allListIds = Array.from(new Set([listId, ...extraListIds, ...audiences.listIds]));

  const payload = {
    email,
    attributes,
    listIds: allListIds,
    updateEnabled: true,
  };

  // event log metadata (origin already defined above)
  const event_type = origin === "hotmart" ? "hotmart_abandoned" : "tienda_abandoned";
  const baseLog = {
    event_type,
    source: "brevo_abandoned",
    origin,
    email,
    product_name: a.productName,
    product_sku: a.productSku,
  } as const;

  try {
    const send = (body: typeof payload) => fetch(`${GATEWAY_URL}/contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": BREVO_API_KEY,
      },
      body: JSON.stringify(body),
    });
    let res = await send(payload);
    if (!res.ok) {
      const body = await res.text();
      if (res.status === 400 && /phone|sms|whatsapp/i.test(body)) {
        const retryPayload = {
          ...payload,
          attributes: { ...payload.attributes },
        };
        delete (retryPayload.attributes as Record<string, unknown>).SMS;
        delete (retryPayload.attributes as Record<string, unknown>).WHATSAPP;
        res = await send(retryPayload);
        if (res.ok) {
          console.log(`[brevo-abandoned] queued ${email} · ${a.productSku} (without phone)`);
          await logBrevoSync({ ...baseLog, status: "success", http_status: res.status, attributes: retryPayload.attributes as Record<string, unknown>, response: "queued (without phone)" });
          return true;
        }
        const retryBody = await res.text();
        console.error(`[brevo-abandoned] upsert retry failed [${res.status}]: ${retryBody}`);
        await logBrevoSync({ ...baseLog, status: "failed", http_status: res.status, attributes: retryPayload.attributes as Record<string, unknown>, error: retryBody });
        return false;
      }
      console.error(`[brevo-abandoned] upsert failed [${res.status}]: ${body}`);
      await logBrevoSync({ ...baseLog, status: "failed", http_status: res.status, attributes, error: body });
      return false;
    }
    console.log(`[brevo-abandoned] queued ${email} · ${a.productSku}`);
    await logBrevoSync({ ...baseLog, status: "success", http_status: res.status, attributes, response: "queued" });
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[brevo-abandoned] network error:", msg);
    await logBrevoSync({ ...baseLog, status: "failed", attributes, error: `network: ${msg}` });
    return false;
  }
}
