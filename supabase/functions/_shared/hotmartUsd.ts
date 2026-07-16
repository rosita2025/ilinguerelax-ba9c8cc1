// Extract native USD amount from a Hotmart raw_payload.
// SOLO commissions[source=PRODUCER, currency=USD]. Sin offer, sin price, sin FX.

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
