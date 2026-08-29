// deno-lint-ignore-file no-explicit-any
// Shared helper: given a list of emails, returns the lowercase set of those
// that ALREADY BOUGHT (any provider). Used so admin reports and reminder
// flows never label a real buyer as "abandoned cart".
//
// Sources of truth (any hit = purchased):
//  - order_events with an explicit successful payment status/event
//  - funnel_events emitted as Purchase by a confirmed provider flow
//
// Delivery emails, manual review flags, and persistent_carts.converted are not
// payment evidence. They may be written before/without a completed charge and
// must never promote an abandoned checkout to "purchased" by themselves.

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
        .from("funnel_events")
        .select("email, event_name")
        .in("email", emails)
        .in("event_name", ["Purchase", "purchase"]);
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
