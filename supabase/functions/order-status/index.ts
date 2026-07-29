// Estado público de un pedido para el cliente.
// Seguridad: no hay login, así que exigimos número de pedido + correo exacto.
// Sin la combinación correcta no se devuelve absolutamente nada.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

const BodySchema = z.object({
  orderNumber: z.string().trim().min(4).max(80),
  email: z.string().trim().email().max(160),
});

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: "Datos inválidos" }, 400);

    const orderNumber = parsed.data.orderNumber.toUpperCase();
    const email = parsed.data.email.toLowerCase();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [{ data: events }, { data: manual }, { data: sends }] = await Promise.all([
      supabase
        .from("order_events")
        .select("event, status, method, reference, detail, amount, currency, provider, customer_email, created_at")
        .eq("order_number", orderNumber)
        .order("created_at", { ascending: true }),
      supabase
        .from("manual_payments")
        .select("order_number, buyer_email, status, method, amount_usd, currency_local, created_at, verified_at")
        .eq("order_number", orderNumber)
        .maybeSingle(),
      supabase
        .from("digital_email_sends")
        .select("order_id, customer_email, status, created_at, last_event, last_event_at")
        .eq("order_id", orderNumber)
        .order("created_at", { ascending: true }),
    ]);

    // El correo debe coincidir con alguno de los registros del pedido.
    const owners = new Set<string>();
    (events ?? []).forEach((e) => e.customer_email && owners.add(String(e.customer_email).toLowerCase()));
    if (manual?.buyer_email) owners.add(String(manual.buyer_email).toLowerCase());
    (sends ?? []).forEach((s) => s.customer_email && owners.add(String(s.customer_email).toLowerCase()));

    if (owners.size === 0 || !owners.has(email)) {
      // Respuesta genérica: no revelamos si el pedido existe.
      return json({ found: false }, 200);
    }

    const timeline = (events ?? []).map((e) => ({
      event: e.event,
      status: e.status,
      method: e.method,
      reference: e.reference,
      detail: e.detail,
      amount: e.amount,
      currency: e.currency,
      provider: e.provider,
      createdAt: e.created_at,
    }));

    const delivered = (sends ?? []).length > 0 || timeline.some((t) => t.event === "delivery_sent");
    const paid = delivered ||
      timeline.some((t) => t.event === "payment_paid") ||
      manual?.status === "verified";

    const stage: "pending" | "paid" | "delivered" = delivered ? "delivered" : paid ? "paid" : "pending";

    const method =
      [...timeline].reverse().find((t) => t.method)?.method ??
      (manual?.method ? String(manual.method) : null);

    const amount = [...timeline].reverse().find((t) => t.amount != null)?.amount ?? manual?.amount_usd ?? null;
    const currency = [...timeline].reverse().find((t) => t.currency)?.currency ?? manual?.currency_local ?? "USD";

    return json({
      found: true,
      orderNumber,
      stage,
      method,
      amount,
      currency,
      provider: timeline[timeline.length - 1]?.provider ?? "dlocalgo",
      createdAt: timeline[0]?.createdAt ?? manual?.created_at ?? null,
      deliveredAt: (sends ?? [])[0]?.created_at ?? timeline.find((t) => t.event === "delivery_sent")?.createdAt ?? null,
      timeline,
    });
  } catch (e) {
    console.error("order-status error:", e);
    return json({ error: "No pudimos consultar el pedido. Intenta de nuevo." }, 500);
  }
});
