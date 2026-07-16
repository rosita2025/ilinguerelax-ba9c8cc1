// Extract native USD amount from a Hotmart raw_payload.
// Cascade (no FX):
//   1) commissions[source=PRODUCER, currency=USD].value  -> "producer"
//   2) purchase.original_offer_price (USD).value          -> "offer"
//   3) purchase.price (USD).value                         -> "price"
//   4) null                                               -> "none"

export type HotmartUsdSource = "producer" | "offer" | "price" | "none";

export interface HotmartUsdResult {
  amount: number | null;
  source: HotmartUsdSource;
}

export function extractHotmartUsd(rawPayload: any): HotmartUsdResult {
  const purchase = rawPayload?.data?.purchase ?? {};

  const commissions = Array.isArray(purchase.commissions) ? purchase.commissions : [];
  const producer = commissions.find((c: any) =>
    String(c?.source || "").toUpperCase() === "PRODUCER" &&
    String(c?.currency_value || c?.currency_code || "").toUpperCase() === "USD"
  );
  if (producer && Number(producer.value) > 0) {
    return { amount: Number(producer.value), source: "producer" };
  }

  const offer = purchase.original_offer_price ?? {};
  const offerIsUsd = String(offer.currency_value || offer.currency_code || "").toUpperCase() === "USD";
  if (offerIsUsd && Number(offer.value) > 0) {
    return { amount: Number(offer.value), source: "offer" };
  }

  const price = purchase.price ?? {};
  const priceIsUsd = String(price.currency_value || price.currency_code || "").toUpperCase() === "USD";
  if (priceIsUsd && Number(price.value) > 0) {
    return { amount: Number(price.value), source: "price" };
  }

  return { amount: null, source: "none" };
}
