// Modo de PRUEBA para dLocal Go — simula los estados PENDING / PAID / REJECTED
// sin esperar un pago real, para validar la entrega digital y los mensajes que
// recibe el cliente (/mi-pedido, correo pendiente, correo de gracias + token).
//
// Seguridad (nunca puede tocar dinero ni pedidos reales):
//  · Solo admin: Origin allowlist + x-admin-csrf + 2FA (assertAdminCsrf) y
//    además ADMIN_REVIEW_KEY en el cuerpo.
//  · Se puede apagar por completo con DLOCAL_TEST_MODE=off.
//  · SOLO opera sobre pedidos con prefijo `ILR-TEST-`: cualquier otro número
//    se rechaza, así que jamás puede aprobar/rechazar una compra real.
//  · Todos los eventos quedan marcados con metadata.simulated = true y
//    provider `dlocalgo-test`, para que no contaminen reportes ni ingresos.
//  · No llama a la API de dLocal: los estados son locales y simulados.
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { assertAdminCsrf, adminCorsHeaders, adminLog } from "../_shared/adminCsrf.ts";
import { logOrderEvent } from "../_shared/orderEvents.ts";
import { sendThankYouEmail } from "../_shared/thankYouEmail.ts";
import { normalizeSkus } from "../_shared/digitalSku.ts";

const cors = { ...adminCorsHeaders };
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const TEST_PREFIX = "ILR-TEST-";
const TEST_PROVIDER = "dlocalgo-test";

function testModeEnabled(): boolean {
  const raw = (Deno.env.get("DLOCAL_TEST_MODE") ?? "").trim().toLowerCase();
  return !(raw === "off" || raw === "false" || raw === "0" || raw === "disabled");
}

const BodySchema = z.object({
  action: z.enum(["create", "pending", "paid", "rejected", "inspect", "cleanup"]),
  adminKey: z.string().min(4).max(200),
  orderNumber: z.string().trim().min(4).max(80).regex(/^[A-Za-z0-9\-_]+$/).optional(),
  email: z.string().trim().email().max(200).optional(),
  name: z.string().trim().max(120).optional(),
  country: z.string().trim().max(4).optional(),
  currency: z.string().trim().min(3).max(3).optional(),
  amount: z.number().min(0).max(10000).optional(),
  method: z.enum(["transfer", "cash", "wallet"]).optional(),
  skus: z.array(z.string().trim().min(2).max(200)).max(10).optional(),
  sendEmails: z.boolean().optional(),
});

function admin() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

function newTestOrder(): string {
  const rnd = crypto.randomUUID().replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  return `${TEST_PREFIX}${rnd}`;
}

function methodLabel(m?: string): string {
  if (m === "cash") return "Pago en efectivo (dLocal Go)";
  if (m === "wallet") return "Billetera digital (dLocal Go)";
  return "Transferencia bancaria (dLocal Go)";
}

type Ev = {
  event: string; status: string | null; method: string | null; reference: string | null;
  customer_email: string | null; amount: number | null; currency: string | null;
  metadata: Record<string, unknown> | null; created_at: string;
};

async function loadEvents(orderNumber: string): Promise<Ev[]> {
  const { data } = await admin()
    .from("order_events")
    .select("event, status, method, reference, customer_email, amount, currency, metadata, created_at")
    .eq("order_number", orderNumber)
    .order("created_at", { ascending: true });
  return (data ?? []) as Ev[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const blocked = await assertAdminCsrf(req);
  if (blocked) return blocked;

  if (!testModeEnabled()) {
    return json({ error: "El modo de prueba está desactivado (DLOCAL_TEST_MODE=off)" }, 403);
  }

  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: "Datos inválidos" }, 400);

    const expectedKey = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expectedKey || parsed.data.adminKey !== expectedKey) return json({ error: "No autorizado" }, 401);

    const { action, sendEmails = true } = parsed.data;
    const supabase = admin();

    // ---------- crear pedido simulado ----------
    if (action === "create") {
      const email = (parsed.data.email ?? "").trim().toLowerCase();
      if (!email) return json({ error: "Indica el correo de prueba que recibirá los mensajes" }, 400);
      const orderNumber = newTestOrder();
      const skus = normalizeSkus(parsed.data.skus ?? []);
      const currency = (parsed.data.currency ?? "USD").toUpperCase();
      const amount = parsed.data.amount ?? 10;
      const method = methodLabel(parsed.data.method);

      await logOrderEvent({
        orderNumber,
        event: "order_created",
        provider: TEST_PROVIDER,
        status: "TEST",
        method,
        reference: `TEST-${orderNumber}`,
        detail: "Pedido de PRUEBA creado desde el simulador de dLocal (no es una compra real)",
        customerEmail: email,
        amount,
        currency,
        metadata: {
          simulated: true,
          skus,
          country: parsed.data.country ?? null,
          name: parsed.data.name ?? null,
          method: parsed.data.method ?? "transfer",
        },
      });

      adminLog("dlocal-test-simulator", "info", "test_order_created", { orderNumber });
      return json({ ok: true, orderNumber, events: await loadEvents(orderNumber) });
    }

    // ---------- acciones sobre un pedido de prueba existente ----------
    const orderNumber = (parsed.data.orderNumber ?? "").trim().toUpperCase();
    if (!orderNumber.startsWith(TEST_PREFIX)) {
      return json({ error: `El simulador solo acepta pedidos de prueba (${TEST_PREFIX}…). Los pedidos reales no se pueden simular.` }, 400);
    }

    const events = await loadEvents(orderNumber);
    if (events.length === 0) return json({ error: "Pedido de prueba no encontrado" }, 404);
    if (!events.every((e) => e.metadata?.simulated === true)) {
      return json({ error: "Ese pedido no es simulado" }, 400);
    }

    const email = parsed.data.email?.trim().toLowerCase()
      || events.map((e) => e.customer_email).filter(Boolean).pop()
      || "";
    const name = parsed.data.name
      || (events.map((e) => e.metadata?.name).find((v) => typeof v === "string") as string | undefined)
      || (email ? email.split("@")[0] : "Cliente");
    const currency = (parsed.data.currency ?? events.map((e) => e.currency).filter(Boolean).pop() ?? "USD").toUpperCase();
    const amount = parsed.data.amount ?? events.map((e) => e.amount).filter((v): v is number => typeof v === "number").pop() ?? 10;
    const country = parsed.data.country
      ?? (events.map((e) => e.metadata?.country).find((v) => typeof v === "string") as string | undefined);
    const skus = normalizeSkus(
      parsed.data.skus
      ?? (events.map((e) => e.metadata?.skus).find((v) => Array.isArray(v)) as string[] | undefined)
      ?? [],
    );
    const rawMethod = parsed.data.method
      ?? (events.map((e) => e.metadata?.method).find((v) => typeof v === "string") as string | undefined);
    const method = methodLabel(rawMethod);
    const reference = `TEST-${orderNumber}`;
    const baseMeta = { simulated: true, skus, country: country ?? null, name, method: rawMethod ?? "transfer" };

    if (action === "inspect") {
      return json({ ok: true, orderNumber, email, amount, currency, skus, events });
    }

    if (action === "cleanup") {
      const { error } = await supabase.from("order_events").delete().eq("order_number", orderNumber);
      if (error) return json({ error: "No se pudo borrar el pedido de prueba" }, 500);
      adminLog("dlocal-test-simulator", "info", "test_order_deleted", { orderNumber });
      return json({ ok: true, deleted: orderNumber });
    }

    if (action === "pending") {
      await logOrderEvent({
        orderNumber,
        event: "payment_pending",
        provider: TEST_PROVIDER,
        status: "PENDING",
        method,
        reference,
        detail: "SIMULADO: dLocal reportó el pedido como pendiente de pago",
        customerEmail: email || null,
        amount,
        currency,
        metadata: baseMeta,
      });

      if (sendEmails && email) {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "customer-manual-pending",
            recipientEmail: email,
            idempotencyKey: `dlocal-test-pending-${orderNumber}`,
            templateData: {
              orderNumber, customerName: name, productName: skus.join(", ") || "Producto de prueba",
              amount, currency, method, orderDate: new Date().toISOString(),
            },
          },
        }).catch((e) => console.error("[test-sim] pending email failed:", e));
      }

      return json({ ok: true, applied: "pending", orderNumber, events: await loadEvents(orderNumber) });
    }

    if (action === "rejected") {
      await logOrderEvent({
        orderNumber,
        event: "payment_failed",
        provider: TEST_PROVIDER,
        status: "REJECTED",
        method,
        reference,
        detail: "SIMULADO: dLocal reportó el pago como REJECTED",
        customerEmail: email || null,
        amount,
        currency,
        metadata: baseMeta,
      });
      return json({ ok: true, applied: "rejected", orderNumber, events: await loadEvents(orderNumber) });
    }

    // ---------- PAID: mismo flujo que el webhook real ----------
    await logOrderEvent({
      orderNumber,
      event: "payment_paid",
      provider: TEST_PROVIDER,
      status: "PAID",
      method,
      reference,
      detail: "SIMULADO: pago confirmado (prueba, sin cobro real)",
      customerEmail: email || null,
      amount,
      currency,
      metadata: baseMeta,
    });

    if (!email) return json({ ok: true, applied: "paid", warning: "sin correo, no se envió nada", orderNumber });

    let delivery: { delivered: boolean; detail: string } = { delivered: false, detail: "Sin SKUs de prueba" };

    if (sendEmails) {
      try {
        await sendThankYouEmail({
          customerEmail: email,
          customerName: name,
          customerCountry: country,
          productName: skus.join(", ") || "Producto de prueba",
          skus,
          amount,
          currency,
          provider: "mercadopago",
          orderNumber,
          idempotencyKey: `dlocal-test-paid-${orderNumber}`,
        });
      } catch (e) {
        console.error("[test-sim] thank-you failed:", e);
      }

      if (skus.length > 0) {
        const { error } = await supabase.functions.invoke("send-digital-ilinguerelax", {
          body: {
            customerEmail: email,
            customerName: name,
            customerCountry: country,
            orderId: orderNumber,
            skus,
            amount,
            currency,
            provider: TEST_PROVIDER,
            idempotencyKey: `digital:dlocal-test:${orderNumber}`,
          },
        });
        delivery = { delivered: !error, detail: error ? error.message : `Entrega enviada a ${email}` };
        await logOrderEvent({
          orderNumber,
          event: error ? "delivery_failed" : "delivery_sent",
          provider: TEST_PROVIDER,
          status: error ? "ERROR" : "SENT",
          reference,
          detail: error ? `SIMULADO: fallo de entrega: ${error.message}` : `SIMULADO: entrega digital enviada a ${email}`,
          customerEmail: email,
          metadata: baseMeta,
        });
      }
    }

    return json({ ok: true, applied: "paid", orderNumber, delivery, events: await loadEvents(orderNumber) });
  } catch (err) {
    console.error("dlocal-test-simulator error:", err);
    return json({ error: "Error interno" }, 500);
  }
});
