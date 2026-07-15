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
  if (a.language) attributes.LANGUAGE = a.language.toLowerCase();
  if (a.source) attributes.ABANDONED_SOURCE = a.source;
  const phoneClean = (a.phone || "").replace(/[^\d+]/g, "");
  if (phoneClean.startsWith("+") && phoneClean.length >= 8) {
    attributes.SMS = phoneClean;
    attributes.WHATSAPP = phoneClean;
  }

  const payload = {
    email,
    attributes,
    listIds: [listId],
    updateEnabled: true,
  };

  try {
    const res = await fetch(`${GATEWAY_URL}/contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[brevo-abandoned] upsert failed [${res.status}]: ${body}`);
      return;
    }
    console.log(`[brevo-abandoned] queued ${email} · ${a.productSku}`);
  } catch (e) {
    console.error("[brevo-abandoned] network error:", e instanceof Error ? e.message : String(e));
  }
}
