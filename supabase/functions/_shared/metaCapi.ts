// Meta Conversions API (server-side) helper.
// Sends Purchase (and other) events straight from webhooks so sales are
// attributed in Facebook Ads even when the buyer never returns to the site.

const FB_PIXEL_ID = "24959578143733255";
const FB_API_VERSION = "v21.0";

async function sha256(message: string): Promise<string> {
  const buf = new TextEncoder().encode(message);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface CapiPurchaseInput {
  /** Stable id shared with the browser pixel so Meta dedupes (e.g. order number). */
  eventId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  country?: string | null;
  value?: number | null;
  currency?: string | null;
  contentIds?: string[];
  contentName?: string | null;
  orderId?: string | null;
  eventSourceUrl?: string | null;
  eventName?: string;
}

/**
 * Fire-and-forget: never throws, never blocks the webhook's 200 response.
 */
export async function sendPurchaseCapi(input: CapiPurchaseInput): Promise<void> {
  try {
    const accessToken = Deno.env.get("FB_CONVERSIONS_API_TOKEN");
    if (!accessToken) {
      console.log("meta-capi: no FB_CONVERSIONS_API_TOKEN, skipped");
      return;
    }

    const user_data: Record<string, unknown> = {};
    if (input.email) user_data.em = [await sha256(String(input.email).toLowerCase().trim())];
    if (input.firstName) user_data.fn = [await sha256(String(input.firstName).toLowerCase().trim())];
    if (input.lastName) user_data.ln = [await sha256(String(input.lastName).toLowerCase().trim())];
    if (input.country) user_data.country = [await sha256(String(input.country).toLowerCase().trim())];

    const custom_data: Record<string, unknown> = {
      currency: (input.currency || "USD").toUpperCase(),
      content_type: "product",
    };
    if (typeof input.value === "number" && Number.isFinite(input.value)) custom_data.value = input.value;
    if (input.contentIds?.length) custom_data.content_ids = input.contentIds;
    if (input.contentName) custom_data.content_name = input.contentName;
    if (input.orderId) custom_data.order_id = input.orderId;

    const payload = {
      data: [
        {
          event_name: input.eventName || "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          event_id: input.eventId,
          event_source_url: input.eventSourceUrl || "https://ilinguerelax.com/checkout-success",
          action_source: "website",
          user_data,
          custom_data,
        },
      ],
    };

    const res = await fetch(
      `https://graph.facebook.com/${FB_API_VERSION}/${FB_PIXEL_ID}/events?access_token=${accessToken}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("meta-capi error", JSON.stringify(json));
    } else {
      console.log("meta-capi sent", input.eventName || "Purchase", input.eventId, JSON.stringify(json));
    }
  } catch (e) {
    console.error("meta-capi exception", e instanceof Error ? e.message : String(e));
  }
}
