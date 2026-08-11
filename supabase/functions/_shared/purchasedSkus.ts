// deno-lint-ignore-file no-explicit-any
// Shared helper: returns the lowercase set of SKUs already purchased by a
// given email across manual_payments and digital_email_sends.
// Used to filter abandoned-cart reminders and persistent_carts so we NEVER
// remind a buyer about a product they already own.

export async function getPurchasedSkus(admin: any, rawEmail: string): Promise<Set<string>> {
  const email = (rawEmail || "").trim().toLowerCase();
  const out = new Set<string>();
  if (!email) return out;

  const push = (v: unknown) => {
    if (!v) return;
    const s = String(v).trim().toLowerCase();
    if (s) out.add(s);
  };

  // 1) digital_email_sends.skus (text[])
  try {
    const { data } = await admin
      .from("digital_email_sends")
      .select("skus, status")
      .ilike("customer_email", email)
      .limit(200);
    for (const row of data ?? []) {
      if (row?.status === "failed") continue;
      const arr = Array.isArray(row?.skus) ? row.skus : [];
      for (const s of arr) push(s);
    }
  } catch (_) { /* ignore */ }

  // 2) manual_payments.items (jsonb) — only verified/completed statuses
  try {
    const { data } = await admin
      .from("manual_payments")
      .select("items, status")
      .ilike("buyer_email", email)
      .in("status", ["verified", "completed", "paid", "approved"])
      .limit(200);
    for (const row of data ?? []) {
      const items = Array.isArray(row?.items) ? row.items : [];
      for (const it of items) {
        push(it?.id ?? it?.sku ?? it?.product ?? it);
      }
    }
  } catch (_) { /* ignore */ }


  return out;
}
