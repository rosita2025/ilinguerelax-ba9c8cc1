// Upserts a Brevo contact for every real purchase.
// Called from sendThankYouEmail (stripe/paypal/mp webhooks) and from
// manage-manual-payments after admin verification.
//
// Uses the Lovable connector gateway. Never call api.brevo.com directly.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { logBrevoSync } from "./brevoLog.ts";
import { inferProductCategory, CATEGORY_LABEL } from "./brevoCategory.ts";
import { resolveBrevoAudiences } from "./brevoProductAudiences.ts";
import { normalizeCountry } from "./brevoCountry.ts";


interface Args {
  email: string;
  name?: string;
  phone?: string;      // E.164 preferred (e.g. +51987654321)
  country?: string;    // ISO alpha-2 (e.g. PE, US, ES)
  productName?: string;
  skus?: string[];
  amount?: number;
  currency?: string;
  orderNumber?: string;
  provider?: string;
  origin?: "hotmart" | "tienda"; // canal real de venta para separar en Brevo
  hotmartProductId?: string;    // Hotmart numeric product id
  hotmartProductCode?: string;  // Hotmart ucode / product code
  tiendaSku?: string;           // SKU interno de la tienda propia
  productCategory?: string;     // categoría/tipo de oferta explícita (opcional)
  couponCode?: string;          // código de cupón usado (ej. NEW10, BLACKFRIDAY)
  couponPercent?: number;       // % de descuento aplicado (0-100)
  couponAmount?: number;        // monto absoluto descontado (en la moneda de la orden)
  /** Estado del ciclo de vida de la compra. Default "compra" (aprobada). */
  purchaseStatus?: "compra" | "pendiente" | "rechazado" | "reembolso" | "chargeback" | "cancelado";
}

const STATUS_EVENT_MAP: Record<string, string> = {
  compra: "purchase",
  pendiente: "pending",
  rechazado: "refused",
  reembolso: "refunded",
  chargeback: "chargeback",
  cancelado: "cancelled",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/brevo";

function splitName(full?: string): { first?: string; last?: string } {
  if (!full) return {};
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0] };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function normalizePhone(raw?: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  // Brevo expects E.164 with leading '+'. If missing, skip to avoid rejection.
  if (/^\+\d{6,15}$/.test(trimmed.replace(/[\s-]/g, ""))) {
    return trimmed.replace(/[\s-]/g, "");
  }
  return undefined;
}

export async function upsertBrevoContact(a: Args): Promise<void> {
  const email = (a.email || "").trim().toLowerCase();
  if (!email) return;

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
  if (!LOVABLE_API_KEY || !BREVO_API_KEY) {
    console.warn("[brevo-contact] Missing LOVABLE_API_KEY or BREVO_API_KEY — skipping");
    return;
  }

  const { first, last } = splitName(a.name);
  const phone = normalizePhone(a.phone);

  const attributes: Record<string, unknown> = {};
  // Brevo uses NOMBRE/APELLIDOS (aliased to firstname/lastname) and COUNTRY_CODE in this account.
  if (first) attributes.NOMBRE = first;
  if (last) attributes.APELLIDOS = last;
  const rawPhoneTrim = (a.phone || "").trim();
  if (phone) {
    attributes.SMS = phone;
    attributes.WHATSAPP = phone;
    attributes.TELEFONO_PROVISTO = "si";
    attributes.PHONE_PROVIDED = true;
  } else {
    attributes.TELEFONO_PROVISTO = "no";
    attributes.PHONE_PROVIDED = false;
    if (rawPhoneTrim) {
      // Hotmart mandó algo pero no es E.164 válido → dejar rastro sin romper Brevo
      attributes.PHONE_RAW = rawPhoneTrim.slice(0, 32);
      attributes.PHONE_STATUS = "invalid_format";
    } else {
      attributes.PHONE_STATUS = "missing";
    }
  }
  const country = normalizeCountry(a.country);
  if (country.code) {
    attributes.COUNTRY_CODE = country.code;
    attributes.COUNTRY = country.code;
    attributes.PAIS_CODE = country.code;
  }
  if (country.name) {
    attributes.COUNTRY_NAME = country.name;
    attributes.PAIS = country.name;
  }
  attributes.COUNTRY_STATUS = country.status;
  if (country.status !== "ok" && country.raw) attributes.COUNTRY_RAW = country.raw.slice(0, 64);
  if (a.orderNumber) attributes.LAST_ORDER = a.orderNumber;
  if (typeof a.amount === "number") attributes.LAST_ORDER_AMOUNT = a.amount;
  if (a.currency) attributes.LAST_ORDER_CURRENCY = a.currency.toUpperCase();
  if (a.productName) {
    attributes.LAST_PRODUCT = a.productName;
    attributes.LAST_PRODUCT_NAME = a.productName;
  }
  if (a.skus && a.skus.length) attributes.LAST_SKUS = a.skus.join(", ");
  if (a.provider) attributes.LAST_PROVIDER = a.provider;
  // ORIGEN separa claramente Hotmart vs Tienda propia (Stripe/PayPal/MP/Yape…)
  // Validación estricta: debe ser 'hotmart' o 'tienda'. Si falta o viene mal,
  // se infiere del provider y se registra un log para auditar el webhook fuente.
  const rawOrigin = (a.origin ?? "").toString().trim().toLowerCase();
  let origin: "hotmart" | "tienda";
  let originStatus: "ok" | "missing" | "invalid" = "ok";
  if (rawOrigin === "hotmart" || rawOrigin === "tienda") {
    origin = rawOrigin;
  } else {
    originStatus = rawOrigin ? "invalid" : "missing";
    origin = a.provider === "hotmart" ? "hotmart" : "tienda";
    console.warn(
      `[brevo-contact] ORIGEN ${originStatus} (recibido="${rawOrigin}", provider="${a.provider ?? ""}") → forzado a "${origin}"`,
    );
  }
  attributes.ORIGEN = origin;
  attributes.LAST_ORIGIN = origin;
  attributes.ORIGEN_STATUS = originStatus;

  // Actualizar también email_contacts para asegurar que send-marketing-drip lo encuentre
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await supabase.from("email_contacts").upsert({
      email,
      name: a.name || undefined,
      source: "store_purchase",
      origin: origin,
      product_type: a.tiendaSku || (a.skus && a.skus[0]) || undefined,
      metadata: {
        order_number: a.orderNumber,
        provider: a.provider,
        amount: a.amount,
        currency: a.currency,
        phone: phone || undefined,
        country: country.code || undefined,
      },
      updated_at: new Date().toISOString(),
    }, { onConflict: "email,source" });
  } catch (e) {
    console.warn("[brevo-contact] email_contacts sync failed:", e);
  }

  // IDs exactos por canal para saber qué compró en cada plataforma.
  if (a.hotmartProductId) attributes.HOTMART_PRODUCT_ID = a.hotmartProductId;
  if (a.hotmartProductCode) attributes.HOTMART_PRODUCT_CODE = a.hotmartProductCode;
  const tiendaSku = a.tiendaSku ?? (origin === "tienda" && a.skus?.length ? a.skus[0] : undefined);
  if (tiendaSku) attributes.TIENDA_SKU = tiendaSku;

  // Categoría/tipo de oferta para agrupar compradores (8,000 palabras, pack, coreano…)
  const category = inferProductCategory({
    productName: a.productName,
    sku: tiendaSku ?? a.hotmartProductId ?? a.hotmartProductCode,
    skus: a.skus,
    explicit: a.productCategory,
  });
  const categoryLabel = CATEGORY_LABEL[category];
  attributes.CATEGORIA = category;
  attributes.PRODUCT_CATEGORY = category;
  attributes.CATEGORIA_LABEL = categoryLabel;

  // Cupón usado (para segmentar campañas por descuento)
  const couponCodeRaw = (a.couponCode || "").trim().toUpperCase();
  const couponCode = couponCodeRaw.slice(0, 32);
  const couponPercent = Number.isFinite(a.couponPercent as number) ? (a.couponPercent as number) : undefined;
  const couponAmount = Number.isFinite(a.couponAmount as number) ? (a.couponAmount as number) : undefined;
  if (couponCode) {
    attributes.LAST_COUPON = couponCode;
    attributes.COUPON_USED = "si";
    attributes.COUPON_APPLIED = true;
  } else {
    attributes.COUPON_USED = "no";
    attributes.COUPON_APPLIED = false;
  }
  if (typeof couponPercent === "number" && couponPercent > 0) attributes.LAST_COUPON_PERCENT = couponPercent;
  if (typeof couponAmount === "number" && couponAmount > 0) attributes.LAST_COUPON_AMOUNT = couponAmount;

  // NOTA legible tipo "Hotmart · 5,000 palabras · cat=5000_palabras · id=123456 · trx=HP123"
  const noteParts: string[] = [
    origin === "hotmart" ? "Hotmart" : "Tienda",
    a.productName || "",
    `cat=${categoryLabel}`,
    a.hotmartProductId ? `id=${a.hotmartProductId}` : "",
    a.hotmartProductCode ? `code=${a.hotmartProductCode}` : "",
    tiendaSku ? `sku=${tiendaSku}` : "",
    a.orderNumber ? `trx=${a.orderNumber}` : "",
    couponCode
      ? `cupón=${couponCode}${typeof couponPercent === "number" && couponPercent > 0 ? ` (-${couponPercent}%)` : typeof couponAmount === "number" && couponAmount > 0 ? ` (-${couponAmount})` : ""}`
      : "",
  ].filter(Boolean);
  attributes.LAST_PURCHASE_NOTE = noteParts.join(" · ");
  attributes.LAST_ORDER_DATE = new Date().toISOString().slice(0, 10); // YYYY-MM-DD for Brevo date type

  // Estado del ciclo de vida (compra/pendiente/rechazado/reembolso/chargeback/cancelado)
  const purchaseStatus = a.purchaseStatus ?? "compra";
  attributes.PURCHASE_STATUS = purchaseStatus;
  attributes.LAST_PURCHASE_STATUS = purchaseStatus;
  attributes.LAST_PURCHASE_STATUS_AT = new Date().toISOString();

  // TAGS: incluye categoría, cupón y estado para filtrar por oferta/descuento/estado
  const eventKind: "compra" | "abandonado" = "compra";
  const tagList = [
    eventKind,
    origin,
    `${eventKind}_${origin}`,
    `cat_${category}`,
    `estado_${purchaseStatus}`,
    `${purchaseStatus}_${origin}`,
  ];
  if (couponCode) tagList.push(`cupon_${couponCode.toLowerCase()}`);

  // Audiencias/segmentos por producto (tabla brevo_product_audiences, editable en admin)
  const audiences = await resolveBrevoAudiences({
    eventKind,
    origin,
    hotmartProductId: a.hotmartProductId,
    hotmartProductCode: a.hotmartProductCode,
    tiendaSku,
    skus: a.skus,
    category,
  });
  for (const t of audiences.tags) tagList.push(t);
  if (audiences.labels.length) attributes.PRODUCT_AUDIENCES = audiences.labels.join(", ");

  attributes.TAGS = tagList.join(",");
  attributes.SEGMENTO = `${purchaseStatus}_${origin}`;

  const parseIds = (raw?: string | null) =>
    raw ? raw.split(",").map((s) => Number(s.trim())).filter((n) => Number.isFinite(n)) : [];

  // Sólo agregar a la lista de "compradores" cuando la compra está aprobada.
  const listIds = [
    ...parseIds(Deno.env.get("BREVO_CUSTOMERS_LIST_ID")),
    ...(purchaseStatus === "compra"
      ? parseIds(
          origin === "hotmart"
            ? Deno.env.get("BREVO_LIST_HOTMART_COMPRA")
            : Deno.env.get("BREVO_LIST_TIENDA_COMPRA"),
        )
      : []),
    ...audiences.listIds,
  ];

  const payload: Record<string, unknown> = {
    email,
    attributes,
    updateEnabled: true,
  };
  if (listIds.length) payload.listIds = Array.from(new Set(listIds));

  const eventOrigin = origin;
  const statusSuffix = STATUS_EVENT_MAP[purchaseStatus] ?? "purchase";
  const event_type = eventOrigin === "hotmart"
    ? `hotmart_${statusSuffix}`
    : `tienda_${statusSuffix}`;
  const baseLog = {
    event_type,
    source: "brevo_contact",
    origin: eventOrigin,
    email,
    product_name: a.productName,
    product_sku: a.tiendaSku ?? a.hotmartProductId ?? a.hotmartProductCode ?? (a.skus?.[0]),
    order_ref: a.orderNumber,
  } as const;

  const send = (p: Record<string, unknown>) => fetch(`${GATEWAY_URL}/contacts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": BREVO_API_KEY,
    },
    body: JSON.stringify(p),
  });

  try {
    let res = await send(payload);
    if (!res.ok) {
      const body = await res.text();
      // Si Brevo rechaza por teléfono inválido, reintentar sin SMS/WHATSAPP
      // y marcar PHONE_STATUS=rejected para no perder el contacto.
      if (res.status === 400 && /phone|sms|whatsapp/i.test(body) && (attributes.SMS || attributes.WHATSAPP)) {
        const retryAttrs = { ...attributes };
        delete retryAttrs.SMS;
        delete retryAttrs.WHATSAPP;
        retryAttrs.TELEFONO_PROVISTO = "no";
        retryAttrs.PHONE_PROVIDED = false;
        retryAttrs.PHONE_STATUS = "rejected_by_brevo";
        retryAttrs.PHONE_RAW = String(attributes.SMS ?? attributes.WHATSAPP ?? "").slice(0, 32);
        const retryPayload = { ...payload, attributes: retryAttrs };
        res = await send(retryPayload);
        if (res.ok) {
          console.log(`[brevo-contact] upserted ${email} (sin teléfono, rechazado por Brevo)`);
          await logBrevoSync({ ...baseLog, status: "success", http_status: res.status, attributes: retryAttrs, response: "upserted (phone rejected)" });
        } else {
          const retryBody = await res.text();
          console.error(`[brevo-contact] retry failed [${res.status}]: ${retryBody}`);
          await logBrevoSync({ ...baseLog, status: "failed", http_status: res.status, attributes: retryAttrs, error: retryBody });
          return;
        }
      } else {
        console.error(`[brevo-contact] upsert failed [${res.status}]: ${body}`);
        await logBrevoSync({ ...baseLog, status: "failed", http_status: res.status, attributes, error: body });
        return;
      }
    } else {
      console.log(`[brevo-contact] upserted ${email}`);
      await logBrevoSync({ ...baseLog, status: "success", http_status: res.status, attributes, response: "upserted" });
    }

    // Deduplicar: si el comprador estaba en la lista de carrito abandonado,
    // quitarlo para que no reciba más correos de recuperación ni cuente doble.
    const abandonedRaw = Deno.env.get("BREVO_ABANDONED_CART_LIST_ID");
    const abandonedId = abandonedRaw ? Number(abandonedRaw) : NaN;
    if (Number.isFinite(abandonedId)) {
      try {
        const rm = await fetch(
          `${GATEWAY_URL}/contacts/lists/${abandonedId}/contacts/remove`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "X-Connection-Api-Key": BREVO_API_KEY,
            },
            body: JSON.stringify({ emails: [email] }),
          },
        );
        if (rm.ok) {
          console.log(`[brevo-contact] removed ${email} from abandoned-cart list`);
        } else if (rm.status !== 400 && rm.status !== 404) {
          // 400/404 = ya no estaba en la lista → ignorar
          const body = await rm.text();
          console.warn(`[brevo-contact] remove-from-abandoned failed [${rm.status}]: ${body}`);
        }
      } catch (e) {
        console.warn("[brevo-contact] remove-from-abandoned network error:", e instanceof Error ? e.message : String(e));
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[brevo-contact] network error:", msg);
    await logBrevoSync({ ...baseLog, status: "failed", attributes, error: `network: ${msg}` });
  }
}
