// Upserts a Brevo contact for every real purchase.
// Called from sendThankYouEmail (stripe/paypal/mp webhooks) and from
// manage-manual-payments after admin verification.
//
// Uses the Lovable connector gateway. Never call api.brevo.com directly.

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
}

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
  if (phone) {
    attributes.SMS = phone;
    attributes.WHATSAPP = phone;
  }
  if (a.country) attributes.COUNTRY_CODE = a.country.toUpperCase();
  if (a.orderNumber) attributes.LAST_ORDER = a.orderNumber;
  if (typeof a.amount === "number") attributes.LAST_ORDER_AMOUNT = a.amount;
  if (a.currency) attributes.LAST_ORDER_CURRENCY = a.currency.toUpperCase();
  if (a.productName) attributes.LAST_PRODUCT = a.productName;
  if (a.skus && a.skus.length) attributes.LAST_SKUS = a.skus.join(", ");
  if (a.provider) attributes.LAST_PROVIDER = a.provider;
  attributes.LAST_ORDER_DATE = new Date().toISOString().slice(0, 10); // YYYY-MM-DD for Brevo date type

  const listIdsRaw = Deno.env.get("BREVO_CUSTOMERS_LIST_ID");
  const listIds = listIdsRaw
    ? listIdsRaw.split(",").map((s) => Number(s.trim())).filter((n) => Number.isFinite(n))
    : undefined;

  const payload: Record<string, unknown> = {
    email,
    attributes,
    updateEnabled: true,
  };
  if (listIds && listIds.length) payload.listIds = listIds;

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
      console.error(`[brevo-contact] upsert failed [${res.status}]: ${body}`);
      return;
    }
    console.log(`[brevo-contact] upserted ${email}`);

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
    console.error("[brevo-contact] network error:", e instanceof Error ? e.message : String(e));
  }
}
