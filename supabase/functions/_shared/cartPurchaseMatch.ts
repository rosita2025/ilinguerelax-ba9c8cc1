// deno-lint-ignore-file no-explicit-any
// Une carritos «abandonados» con compras reales hechas con OTRO correo.
// Caso real: la clienta escribió su correo con un error (…@hotmail.com.com) en el carrito y pagó con dLocal con otro correo:
// el carrito seguía como «abandonado» aunque ya compró. La coincidencia por correo no lo ve, así que aquí se compara
// con CUIDADO (para no marcar como comprado a quien no compró): mismo nombre completo (mínimo 2 palabras) Y además el mismo
// teléfono (últimos 8 dígitos) o el mismo país, y un pago confirmado hecho entre 2 h antes y 72 h después del carrito.

const nameKey = (s: unknown): string => {
  const tokens = String(s ?? "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z\s]/g, " ")
    .split(/\s+/).filter((t) => t.length > 1);
  return tokens.length >= 2 ? [...new Set(tokens)].sort().join(" ") : "";
};
const phoneKey = (s: unknown): string => {
  const d = String(s ?? "").replace(/\D/g, "");
  return d.length >= 8 ? d.slice(-8) : "";
};

export type CartMatch = { paidEmail: string; orderNumber: string; by: "nombre + teléfono" | "nombre + país" };

export async function matchCartsToPaidOrders(
  admin: any,
  carts: { id: string; email?: string | null; buyer?: any; country?: string | null; last_activity?: string | null }[],
): Promise<Map<string, CartMatch>> {
  const out = new Map<string, CartMatch>();
  try {
    const candidates = carts.filter((c) => nameKey(c.buyer?.fullName ?? c.buyer?.name ?? c.buyer?.customerName));
    if (!candidates.length) return out;
    const since = new Date(Date.now() - 8 * 86400000).toISOString();
    const { data: paid } = await admin
      .from("order_events")
      .select("order_number, customer_email, created_at")
      .eq("event", "payment_paid")
      .gte("created_at", since)
      .limit(1000);
    const paidRows = (paid ?? []) as { order_number: string; customer_email: string | null; created_at: string }[];
    const nums = [...new Set(paidRows.map((p) => p.order_number).filter(Boolean))];
    if (!nums.length) return out;
    const created: Record<string, { name: string; phone: string; country: string }> = {};
    for (let i = 0; i < nums.length; i += 100) {
      const { data } = await admin
        .from("order_events")
        .select("order_number, metadata")
        .eq("event", "order_created")
        .in("order_number", nums.slice(i, i + 100));
      for (const r of (data ?? []) as { order_number: string; metadata: any }[]) {
        created[r.order_number] = {
          name: nameKey(r.metadata?.customerName),
          phone: phoneKey(r.metadata?.customerPhone),
          country: String(r.metadata?.country ?? "").toUpperCase(),
        };
      }
    }
    for (const c of candidates) {
      const cName = nameKey(c.buyer?.fullName ?? c.buyer?.name ?? c.buyer?.customerName);
      const cPhone = phoneKey(c.buyer?.phone);
      const cCountry = String(c.country ?? c.buyer?.country ?? "").toUpperCase();
      const cartAt = new Date(c.last_activity ?? Date.now()).getTime();
      for (const p of paidRows) {
        const o = created[p.order_number];
        if (!o || !o.name || o.name !== cName) continue;
        if (c.email && p.customer_email && c.email.toLowerCase() === p.customer_email.toLowerCase()) continue; // ya lo ve la coincidencia por correo
        const at = new Date(p.created_at).getTime();
        if (at < cartAt - 2 * 3600_000 || at > cartAt + 72 * 3600_000) continue;
        const byPhone = !!cPhone && cPhone === o.phone;
        const byCountry = !!cCountry && cCountry === o.country;
        if (!byPhone && !byCountry) continue;
        out.set(String(c.id), { paidEmail: String(p.customer_email ?? ""), orderNumber: p.order_number, by: byPhone ? "nombre + teléfono" : "nombre + país" });
        break;
      }
    }
  } catch (e) {
    console.error("cartPurchaseMatch failed:", e instanceof Error ? e.message : String(e));
  }
  return out;
}
