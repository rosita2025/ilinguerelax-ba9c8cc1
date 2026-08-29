// deno-lint-ignore-file no-explicit-any
// Shared helper: given a list of emails, returns the lowercase set of those
// that ALREADY BOUGHT (any provider). Used so admin reports and reminder
// flows never label a real buyer as "abandoned cart".
//
// Sources of truth (any hit = purchased):
//  - digital_email_sends (digital delivery sent)
//  - order_events (paid/approved/completed payment events)
//  - manual_payments (verified/completed)
//  - funnel_events (Purchase events)
//  - shopify_sales (physical orders)
//  - persistent_carts.converted = true

export async function getPurchasedEmails(admin: any, rawEmails: string[]): Promise<Set<string>> {
  const emails = [...new Set(
    (rawEmails || []).map((e) => String(e || "").trim().toLowerCase()).filter(Boolean),
  )];
  const out = new Set<string>();
  if (!emails.length) return out;

  const add = (v: unknown) => {
    const s = String(v || "").trim().toLowerCase();
    if (s && emails.includes(s)) out.add(s);
  };

  const queries: Promise<void>[] = [
    (async () => {
      const { data } = await admin
        .from("digital_email_sends")
        .select("customer_email, status")
        .in("customer_email", emails);
      for (const r of data ?? []) if (r?.status !== "failed") add(r?.customer_email);
    })(),
    (async () => {
      const { data } = await admin
        .from("order_events")
        .select("customer_email, status, event")
        .in("customer_email", emails);
      for (const r of data ?? []) {
        const st = String(r?.status || "").toLowerCase();
        const ev = String(r?.event || "").toLowerCase();
        if (["paid", "approved", "completed", "succeeded"].includes(st) || ev.includes("paid") || ev.includes("approved")) {
          add(r?.customer_email);
        }
      }
    })(),
    (async () => {
      const { data } = await admin
        .from("manual_payments")
        .select("buyer_email, status")
        .in("buyer_email", emails)
        .in("status", ["verified", "completed", "paid", "approved"]);
      for (const r of data ?? []) add(r?.buyer_email);
    })(),
    (async () => {
      const { data } = await admin
        .from("funnel_events")
        .select("email, event_name")
        .in("email", emails)
        .in("event_name", ["Purchase", "purchase"]);
      for (const r of data ?? []) add(r?.email);
    })(),
    (async () => {
      const { data } = await admin
        .from("persistent_carts")
        .select("email, converted")
        .in("email", emails)
        .eq("converted", true);
      for (const r of data ?? []) add(r?.email);
    })(),
  ];

  await Promise.allSettled(queries);
  return out;
}

/** Marks any open persistent cart of these buyers as converted (self-healing). */
export async function markCartsConverted(admin: any, emails: string[]): Promise<void> {
  const list = [...new Set((emails || []).map((e) => String(e || "").trim().toLowerCase()).filter(Boolean))];
  if (!list.length) return;
  try {
    await admin
      .from("persistent_carts")
      .update({ converted: true })
      .in("email", list)
      .eq("converted", false);
  } catch (_) { /* ignore */ }
}
