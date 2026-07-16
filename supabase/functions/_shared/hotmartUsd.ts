// Extract native USD amount from a Hotmart raw_payload.
// Cascade (no FX) — precio de oferta bruto (sin descontar comisión Hotmart):
//   1) purchase.original_offer_price (USD).value          -> "offer"  (bruto real de la oferta)
//   2) purchase.price (USD).value                         -> "price"  (bruto cobrado)
//   3) commissions[source=PRODUCER, currency=USD].value   -> "producer" (neto del productor, ya con comisión Hotmart descontada)
//   4) null                                               -> "none"

export type HotmartUsdSource = "offer" | "price" | "producer" | "none";

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

  const commissions = Array.isArray(purchase.commissions) ? purchase.commissions : [];
  const producer = commissions.find((c: any) =>
    String(c?.source || "").toUpperCase() === "PRODUCER" &&
    String(c?.currency_value || c?.currency_code || "").toUpperCase() === "USD"
  );
  if (producer && Number(producer.value) > 0) {
    return { amount: Number(producer.value), source: "producer" };
  }

  return { amount: null, source: "none" };
}
