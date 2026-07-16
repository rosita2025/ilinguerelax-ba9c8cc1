// Extract native USD amount from a Hotmart raw_payload.
// SIN comisiones PRODUCER, SIN conversión FX. Solo USD nativo del payload:
//   1) purchase.original_offer_price (USD).value  -> "offer"
//   2) purchase.price (USD).value                 -> "price"
//   3) null                                       -> "none"

export type HotmartUsdSource = "offer" | "price" | "none";

export interface HotmartUsdResult {
  amount: number | null;
  source: HotmartUsdSource;
}

export function extractHotmartUsd(rawPayload: any): HotmartUsdResult {
  const purchase = rawPayload?.data?.purchase ?? {};

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
