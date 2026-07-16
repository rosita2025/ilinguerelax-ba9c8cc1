// Extract native USD amount from a Hotmart raw_payload.
// Cascade (no FX) — usar SOLO el valor PRODUCER en USD (neto real del productor):
//   1) commissions[source=PRODUCER, currency=USD].value  -> "producer"
//   2) null                                              -> "none"

export type HotmartUsdSource = "producer" | "none";

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
  return { amount: null, source: "none" };
}
