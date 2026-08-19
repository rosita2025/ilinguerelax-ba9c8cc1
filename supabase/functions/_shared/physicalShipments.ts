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

    const { error: upsertError } = await adminClient
      .from("physical_shipments")
      .upsert(
        {
          order_number: orderNumber,
          email: email ?? null,
          customer_name: customerName ?? null,
          provider,
          shipping_address: cleanAddress && Object.keys(cleanAddress).length ? cleanAddress : null,
          status: "pending",
        },
        { onConflict: "order_number", ignoreDuplicates: false },
      );
    if (upsertError) throw upsertError;

    console.log("[physical-shipments] registered", { orderNumber, provider });
    return true;
  } catch (e) {
    console.error("[physical-shipments] upsert failed:", e);
    return false;
  }
}
