// Historial de auditoría por pedido.
// Cada paso relevante del pago (pendiente, cupón/QR generado, PAID, entrega
// enviada) se guarda en public.order_events con timestamp y referencia del
// proveedor, para que soporte y el cliente puedan seguir el pedido.
import { createClient } from "npm:@supabase/supabase-js@2";

export type OrderEventName =
  | "order_created"
  | "payment_instructions"
  | "payment_pending"
  | "payment_paid"
  | "payment_failed"
  | "delivery_sent"
  | "delivery_failed";

export interface OrderEventInput {
  orderNumber: string;
  event: OrderEventName;
  provider?: string;
  status?: string | null;
  method?: string | null;
  reference?: string | null;
  detail?: string | null;
  customerEmail?: string | null;
  amount?: number | null;
  currency?: string | null;
  metadata?: Record<string, unknown>;
}

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

/** Nunca lanza: el log de auditoría jamás debe romper un cobro o una entrega. */
export async function logOrderEvent(input: OrderEventInput): Promise<void> {
  try {
    const orderNumber = String(input.orderNumber || "").trim();
    if (!orderNumber) return;

    const { error } = await admin().from("order_events").insert({
      order_number: orderNumber,
      customer_email: input.customerEmail?.trim().toLowerCase() || null,
      provider: input.provider || "dlocalgo",
      event: input.event,
      status: input.status ?? null,
      method: input.method ?? null,
      reference: input.reference ?? null,
      detail: input.detail ? String(input.detail).slice(0, 500) : null,
      amount: input.amount ?? null,
      currency: input.currency ?? null,
      metadata: input.metadata ?? {},
    });

    // 23505 = evento duplicado (mismo pedido + evento + referencia): esperado
    // cuando el proveedor reintenta el webhook.
    if (error && error.code !== "23505") {
      console.error("logOrderEvent failed:", error.message);
    }
  } catch (e) {
    console.error("logOrderEvent error:", e instanceof Error ? e.message : e);
  }
}
