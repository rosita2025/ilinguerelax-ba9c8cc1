// El teléfono (WhatsApp) del comprador se guarda solo en nuestro sistema (persistent_carts / email_contacts,
// se registra antes de pagar) y NUNCA se envía a Stripe, dLocal ni Mercado Pago. Los webhooks lo leen de aquí.
// deno-lint-ignore no-explicit-any
export async function lookupBuyerPhone(client: any, email: string | null | undefined): Promise<string | undefined> {
  const e = (email || "").trim().toLowerCase();
  if (!e) return undefined;
  try {
    const { data: cart } = await client.from("persistent_carts").select("buyer").eq("email", e).maybeSingle();
    const fromCart = String(cart?.buyer?.phone || "").trim();
    if (fromCart) return fromCart;
    const { data: contact } = await client
      .from("email_contacts")
      .select("metadata")
      .eq("email", e)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const fromContact = String(contact?.metadata?.phone || "").trim();
    return fromContact || undefined;
  } catch (err) {
    console.warn("lookupBuyerPhone failed:", err instanceof Error ? err.message : String(err));
    return undefined;
  }
}
