/**
 * Registra/actualiza un envío físico para pedidos pagados con pasarela
 * (Stripe, dLocal, etc.), que no viven en manual_payments ni shopify_sales.
 * Solo se crea la fila si alguno de los SKU comprados es físico.
 */
export async function upsertPhysicalShipment(params: {
  adminClient: any;
  orderNumber: string;
  email?: string | null;
  customerName?: string | null;
  provider: string;
  address?: {
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    country?: string | null;
  } | null;
  skus: string[];
}): Promise<boolean> {
  const { adminClient, orderNumber, email, customerName, provider, address, skus } = params;
  try {
    if (!orderNumber || !skus?.length) return false;

    const { data: products, error } = await adminClient
      .from("digital_products")
      .select("sku,is_physical")
      .in("sku", skus);
    if (error) throw error;

    const hasPhysical = (products ?? []).some((p: { is_physical?: boolean }) => p.is_physical === true);
    if (!hasPhysical) return false;

    const cleanAddress = address
      ? Object.fromEntries(Object.entries(address).filter(([, v]) => v != null && String(v).trim() !== ""))
      : null;

    const { data: existing } = await adminClient
      .from("physical_shipments")
      .select("order_number,shipping_address")
      .eq("order_number", orderNumber)
      .maybeSingle();

    const payload: Record<string, unknown> = {
      order_number: orderNumber,
      email: email ?? null,
      customer_name: customerName ?? null,
      provider,
    };
    if (cleanAddress && Object.keys(cleanAddress).length) payload.shipping_address = cleanAddress;

    if (existing) {
      // No pisamos el estado de envío ni una dirección ya guardada.
      if (!payload.shipping_address) delete payload.shipping_address;
      const { error: updError } = await adminClient
        .from("physical_shipments")
        .update(payload)
        .eq("order_number", orderNumber);
      if (updError) throw updError;
    } else {
      const { error: insError } = await adminClient
        .from("physical_shipments")
        .insert({ ...payload, status: "pending" });
      if (insError) throw insError;

      // Aviso previo (una sola vez): "tu digital ya está, el tracking va en camino".
      if (email) {
        try {
          await sendShippingEmail(adminClient, {
            kind: "pre_notice",
            orderNumber,
            email: String(email),
            name: customerName ?? null,
            once: true,
          });
        } catch (e) {
          console.error("[physical-shipments] pre-notice failed:", e);
        }
      }
    }

    console.log("[physical-shipments] registered", { orderNumber, provider });
    return true;
  } catch (e) {
    console.error("[physical-shipments] upsert failed:", e);
    return false;
  }
}

