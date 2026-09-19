// deno-lint-ignore-file no-explicit-any
// Shared helper: given a list of emails, returns the lowercase set of those
// that ALREADY BOUGHT (any provider). Used so admin reports and reminder
// flows never label a real buyer as "abandoned cart".
//
// Source of truth (única fuente confiable de "purchased"):
//  - order_events with an explicit successful payment status/event
//    (viene del webhook real de Stripe / pasarela — verificado en servidor)
//
// funnel_events "Purchase" NO es fuente de verdad: lo dispara el navegador del
// cliente y puede aparecer sin pago real (recarga de la página de confirmación,
// pago rechazado tras el redirect, etc.). Se expone aparte vía
// getClientSidePurchaseEmails() solo con fines informativos/diagnóstico.
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
  // Escapa los comodines de SQL LIKE (% y _) para que un correo con guion
  // bajo (muy común, ej. john_doe@gmail.com) no coincida por accidente con
  // otro correo que difiera en esa posición.
  const escapeIlike = (v: string) => v.replace(/[%_]/g, (c) => `\\${c}`);

  const queries: Promise<void>[] = [
    (async () => {
      // ÚNICA fuente de verdad de compra: order_events confirmados por el
      // webhook del proveedor de pago (Stripe, etc.). Ver nota del encabezado.
      // Antes esto usaba .in("customer_email", emails) con comparación EXACTA
      // (sensible a mayúsculas/minúsculas). Stripe guarda el correo tal cual
      // lo escribió el navegador del cliente (a veces con mayúsculas), así
      // que una compra real podía no reconocerse aquí si el correo no
      // coincidía letra por letra en mayúsculas/minúsculas con el mismo
      // correo en minúsculas. Ahora se compara ignorando mayúsculas.
      if (!emails.length) return;
      const orFilter = emails.map((e) => `customer_email.ilike.${escapeIlike(e)}`).join(",");
      const { data } = await admin
        .from("order_events")
        .select("customer_email, status, event")
        .or(orFilter);
      for (const r of data ?? []) {
        const st = String(r?.status || "").toLowerCase();
        const ev = String(r?.event || "").toLowerCase();
        if (["paid", "approved", "completed", "succeeded"].includes(st) || ev.includes("paid") || ev.includes("approved")) {
          add(r?.customer_email);
        }
      }
    })(),
  ];

  await Promise.allSettled(queries);
  return out;
}

/**
 * Señal INFORMATIVA (no fuente de verdad): correos cuyo navegador disparó un
 * evento "Purchase" en funnel_events. No implica pago confirmado — el evento
 * lo emite el cliente y puede darse sin cobro real. Sirve para detectar en el
 * admin casos sospechosos: evento de compra del navegador SIN orden
 * confirmada en Stripe (pago fallido tras el redirect, recarga de la página
 * de confirmación, etc.). Nunca usar para excluir a alguien de recordatorios.
 */
export async function getClientSidePurchaseEmails(admin: any, rawEmails: string[]): Promise<Set<string>> {
  const emails = [...new Set(
    (rawEmails || []).map((e) => String(e || "").trim().toLowerCase()).filter(Boolean),
  )];
  const out = new Set<string>();
  if (!emails.length) return out;

  const escapeIlike = (v: string) => v.replace(/[%_]/g, (c) => `\\${c}`);
  try {
    const orFilter = emails.map((e) => `email.ilike.${escapeIlike(e)}`).join(",");
    const { data } = await admin
      .from("funnel_events")
      .select("email, event_name")
      .or(orFilter)
      .in("event_name", ["Purchase", "purchase"]);
    for (const r of data ?? []) {
      const s = String(r?.email || "").trim().toLowerCase();
      if (s && emails.includes(s)) out.add(s);
    }
  } catch (_) { /* ignore */ }
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
