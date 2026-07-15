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
  language?: string;        // es|en|fr|pt
  country?: string;         // ISO-2, e.g. PE, US, FR
  source?: string;          // "checkout" | "hotmart" | ...
}

import { logBrevoSync } from "./brevoLog.ts";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/brevo";

function splitName(full?: string): { first?: string; last?: string } {
  if (!full) return {};
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0] };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export async function pushAbandonedCartToBrevo(a: Args): Promise<void> {
  const email = (a.email || "").trim().toLowerCase();
  if (!email) return;

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
  const LIST_ID_RAW = Deno.env.get("BREVO_ABANDONED_CART_LIST_ID");
  if (!LOVABLE_API_KEY || !BREVO_API_KEY) {
    console.warn("[brevo-abandoned] Missing LOVABLE_API_KEY or BREVO_API_KEY — skipping");
    return;
  }
  const listId = LIST_ID_RAW ? Number(LIST_ID_RAW) : NaN;
  if (!Number.isFinite(listId)) {
    console.warn("[brevo-abandoned] BREVO_ABANDONED_CART_LIST_ID not set — skipping");
    return;
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
  if (a.couponCode) attributes.ABANDONED_COUPON = a.couponCode;
  if (a.language) {
    const lang = a.language.toLowerCase();
    attributes.LANGUAGE = lang;   // segmentar automatización por idioma
    attributes.LANG = lang;
  }
  if (a.country) attributes.COUNTRY = a.country.toUpperCase();
  const origin = a.source === "hotmart" ? "hotmart" : "tienda";
  if (a.source) {
    attributes.ABANDONED_SOURCE = a.source;
    attributes.ORIGEN = origin;
  }
  // IDs de canal para saber en Brevo qué producto/plataforma abandonó
  if (origin === "hotmart") {
    attributes.HOTMART_PRODUCT_ID = a.productSku;
    attributes.HOTMART_PRODUCT_CODE = a.productSku;
  } else {
    attributes.TIENDA_SKU = a.productSku;
  }
  const noteParts = [
    origin === "hotmart" ? "Hotmart" : "Tienda",
    "abandonado",
    a.productName || "",
    `sku=${a.productSku}`,
    typeof a.priceUsd === "number" ? `usd=${a.priceUsd}` : "",
  ].filter(Boolean);
  attributes.ABANDONED_NOTE = noteParts.join(" · ");

  // TAGS: atributo tipo texto/categoría en Brevo para filtrar de un vistazo.
  const eventKind: "compra" | "abandonado" = "abandonado";
  const tagList = [eventKind, origin, `${eventKind}_${origin}`];
  attributes.TAGS = tagList.join(",");
  attributes.SEGMENTO = `${eventKind}_${origin}`;

  const phoneClean = (a.phone || "").replace(/[^\d+]/g, "");
  if (phoneClean.startsWith("+") && phoneClean.length >= 8) {
    attributes.SMS = phoneClean;
    attributes.WHATSAPP = phoneClean;
  }

  const parseIds = (raw?: string | null) =>
    raw ? raw.split(",").map((s) => Number(s.trim())).filter((n) => Number.isFinite(n)) : [];
  const extraListIds = parseIds(
    origin === "hotmart"
      ? Deno.env.get("BREVO_LIST_HOTMART_ABANDONO")
      : Deno.env.get("BREVO_LIST_TIENDA_ABANDONO"),
  );
  const allListIds = Array.from(new Set([listId, ...extraListIds]));

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
          return;
        }
        const retryBody = await res.text();
        console.error(`[brevo-abandoned] upsert retry failed [${res.status}]: ${retryBody}`);
        await logBrevoSync({ ...baseLog, status: "failed", http_status: res.status, attributes: retryPayload.attributes as Record<string, unknown>, error: retryBody });
        return;
      }
      console.error(`[brevo-abandoned] upsert failed [${res.status}]: ${body}`);
      await logBrevoSync({ ...baseLog, status: "failed", http_status: res.status, attributes, error: body });
      return;
    }
    console.log(`[brevo-abandoned] queued ${email} · ${a.productSku}`);
    await logBrevoSync({ ...baseLog, status: "success", http_status: res.status, attributes, response: "queued" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[brevo-abandoned] network error:", msg);
    await logBrevoSync({ ...baseLog, status: "failed", attributes, error: `network: ${msg}` });
  }
}
