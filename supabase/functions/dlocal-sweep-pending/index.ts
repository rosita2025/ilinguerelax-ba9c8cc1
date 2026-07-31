// dLocal Go — barrido de pedidos que se quedaron "pendientes" para siempre.
//
// Por qué existe:
//   Cuando el comprador abre el checkout de dLocal y NO completa el pago
//   (cierra la pestaña, no llena los datos, abandona el cupón de efectivo),
//   dLocal NUNCA envía un webhook. El pedido queda con `payment_pending` /
//   `order_created` en public.order_events y el cliente ve "pago pendiente"
//   eternamente en /mi-pedido, aunque nunca pagó nada.
//
// Qué hace:
//   1. Busca pedidos de dLocal sin `payment_paid` ni `payment_failed`.
//   2. Consulta el estado REAL en la API de dLocal con nuestras credenciales
//      (nunca se confía en datos del navegador).
//      · pagado  → deja `payment_paid` (el webhook perdido se recupera aquí y
//                  la entrega la dispara el reintento de delivery del admin).
//      · fallido → deja `payment_failed` con el estado real.
//      · sigue pendiente y ya venció la ventana → `payment_failed` = ABANDONED.
//   3. Si el pedido nunca llegó a generar un pago en dLocal y ya venció la
//      ventana corta, se marca ABANDONED igual.
//
// Seguridad: función interna. Solo se acepta con la service role key o con
// CRON_SHARED_SECRET (pg_cron / admin backend). Nunca queda abierta al público.
import { createClient } from "npm:@supabase/supabase-js@2";
import { assertInternalCall, internalCors } from "../_shared/internalAuth.ts";
import { logOrderEvent } from "../_shared/orderEvents.ts";
import {
  dlocalApiBase,
  isSettledStatus,
  isPendingStatus,
  isFailedStatus,
} from "../_shared/dlocal.ts";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...internalCors, "Content-Type": "application/json" } });

const HOUR = 60 * 60 * 1000;
/** Rails inmediatos (tarjeta, billetera, redirect): si en 6 h no hay pago, se abandonó. */
const FAST_WINDOW_MS = 6 * HOUR;
/** Efectivo y transferencia: el cupón/CBU tiene vigencia real de días. */
const SLOW_WINDOW_MS = 72 * HOUR;
/** Tope absoluto: nada queda pendiente más de 7 días. */
const HARD_WINDOW_MS = 7 * 24 * HOUR;
/** No revisamos pedidos más viejos que esto (ya barridos antes). */
const LOOKBACK_MS = 30 * 24 * HOUR;

function isSlowRail(method: string | null, status: string | null): boolean {
  const v = `${method ?? ""} ${status ?? ""}`.toUpperCase();
  return /TICKET|CASH|EFECTIVO|TRANSFER|BANK|BOLETO|OXXO|PAGOEFECTIVO|SPEI|PIX/.test(v);
}

async function fetchDlocalPayment(paymentId: string): Promise<Record<string, unknown> | null> {
  const apiKey = Deno.env.get("DLOCAL_GO_API_KEY");
  const secretKey = Deno.env.get("DLOCAL_GO_SECRET_KEY");
  if (!apiKey || !secretKey) return null;
  try {
    const r = await fetch(`${dlocalApiBase()}/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${apiKey}:${secretKey}` },
    });
    if (!r.ok) {
      console.warn("[dlocal-sweep] dLocal respondió", r.status, "para", paymentId);
      return null;
    }
    return await r.json() as Record<string, unknown>;
  } catch (e) {
    console.warn("[dlocal-sweep] fetch falló:", e instanceof Error ? e.message : String(e));
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: internalCors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const blocked = assertInternalCall(req);
  if (blocked) return blocked;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const since = new Date(Date.now() - LOOKBACK_MS).toISOString();
    const { data: rows, error } = await supabase
      .from("order_events")
      .select("order_number, event, status, method, reference, customer_email, amount, currency, metadata, created_at")
      .eq("provider", "dlocalgo")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(4000);
    if (error) return json({ error: error.message }, 500);

    type Row = NonNullable<typeof rows>[number];
    const byOrder = new Map<string, Row[]>();
    for (const r of rows ?? []) {
      const key = String(r.order_number).toUpperCase();
      const list = byOrder.get(key) ?? [];
      list.push(r);
      byOrder.set(key, list);
    }

    const now = Date.now();
    let checked = 0, abandoned = 0, rejected = 0, recovered = 0, stillPending = 0;

    for (const [orderNumber, events] of byOrder) {
      // Ya resuelto: no se toca (jamás se sobrescribe un pedido cerrado).
      if (events.some((e) => e.event === "payment_paid" || e.event === "payment_failed")) continue;

      const last = events[events.length - 1];
      const age = now - new Date(last.created_at).getTime();
      const method = (events.find((e) => e.method)?.method ?? null) as string | null;
      const window = isSlowRail(method, last.status) ? SLOW_WINDOW_MS : FAST_WINDOW_MS;

      const reference = events.map((e) => e.reference).filter(Boolean).pop() as string | null;
      const email = events.map((e) => e.customer_email).filter(Boolean).pop() as string | null;
      const amount = events.map((e) => e.amount).filter((v) => typeof v === "number").pop() as number | undefined;
      const currency = (events.map((e) => e.currency).filter(Boolean).pop() as string | null) ?? "USD";
      const rawSkus = (events
        .map((e) => (Array.isArray((e.metadata as Record<string, unknown> | null)?.skus)
          ? (e.metadata as { skus: string[] }).skus
          : []))
        .filter((a) => a.length > 0)
        .pop()) ?? [];
      const skus = normalizeSkus(rawSkus);
      const country = events
        .map((e) => (typeof (e.metadata as Record<string, unknown> | null)?.country === "string"
          ? (e.metadata as { country: string }).country
          : null))
        .filter(Boolean)
        .pop() ?? undefined;

      // El estado real SIEMPRE se consulta en dLocal, sin esperar la ventana:
      // el efectivo/transferencia se acredita a los minutos y dLocal muchas
      // veces no manda webhook. Así el cliente recibe su entrega enseguida.
      let remote: string | null = null;
      if (reference && reference !== orderNumber) {
        const payment = await fetchDlocalPayment(reference);
        const remoteOrder = String(payment?.order_id ?? "").trim().toUpperCase();
        // El pago consultado debe pertenecer a ESTE pedido.
        if (payment && (!remoteOrder || remoteOrder === orderNumber)) {
          remote = String(payment.status ?? "").toUpperCase() || null;
        }
      }
      checked++;

      if (remote && isSettledStatus(remote)) {
        // Webhook perdido con dinero acreditado: registramos el pago y
        // ENTREGAMOS automáticamente (gracias por tu compra + materiales),
        // sin esperar a que el admin lo haga a mano.
        await logOrderEvent({
          orderNumber,
          event: "payment_paid",
          provider: "dlocalgo",
          status: remote,
          method,
          reference,
          detail: "Pago confirmado al reconciliar con la API de dLocal (webhook no recibido)",
          customerEmail: email,
          amount: amount ?? null,
          currency,
          metadata: { skus, source: "sweep", autoDelivery: true },
        });
        recovered++;

        if (email) {
          const alreadyDelivered = events.some((e) => e.event === "delivery_sent");
          if (!alreadyDelivered) {
            const name = email.split("@")[0];
            try {
              await sendThankYouEmail({
                customerEmail: email,
                customerName: name,
                customerCountry: country,
                productName: skus.join(", ") || "Materiales iLingue Relax",
                skus,
                amount,
                currency,
                provider: "mercadopago",
                orderNumber,
                idempotencyKey: `sweep-paid-${orderNumber}`,
              });
            } catch (e) {
              console.error("[dlocal-sweep] thank-you falló:", e instanceof Error ? e.message : String(e));
            }

            if (skus.length > 0) {
              const res = await deliverLikeManual(supabase, { orderNumber, email, name, skus });
              await logOrderEvent({
                orderNumber,
                event: res.delivered ? "delivery_sent" : "delivery_failed",
                provider: "dlocalgo",
                status: res.delivered ? "SENT" : "ERROR",
                reference,
                detail: res.delivered
                  ? `Entrega digital automática enviada a ${email} (${skus.join(", ")})`
                  : `Fallo al enviar la entrega automática: ${res.detail}`,
                customerEmail: email,
                metadata: { skus, source: "sweep-auto" },
              });
              if (res.delivered) delivered++;
              else deliveryFailed++;
            }
          }
        }
        continue;
      }


      if (remote && isFailedStatus(remote)) {
        await logOrderEvent({
          orderNumber,
          event: "payment_failed",
          provider: "dlocalgo",
          status: remote,
          method,
          reference,
          detail: `dLocal reportó el pago como ${remote}`,
          customerEmail: email,
          amount: amount ?? null,
          currency,
          metadata: { skus, source: "sweep" },
        });
        rejected++;
        continue;
      }

      const stillOpen = remote ? isPendingStatus(remote) : false;
      if (stillOpen && age < HARD_WINDOW_MS) {
        stillPending++;
        continue;
      }

      // Sin pago creado en dLocal, o pendiente pasado el tope: checkout abandonado.
      await logOrderEvent({
        orderNumber,
        event: "payment_failed",
        provider: "dlocalgo",
        status: "ABANDONED",
        method,
        reference,
        detail: "El pago no se completó en dLocal (checkout abandonado o cupón vencido)",
        customerEmail: email,
        amount: amount ?? null,
        currency,
        metadata: { skus, source: "sweep", remoteStatus: remote },
      });
      abandoned++;
    }

    const result = { ok: true, orders: byOrder.size, checked, abandoned, rejected, recovered, stillPending };
    console.log("[dlocal-sweep]", JSON.stringify(result));
    return json(result);
  } catch (err) {
    console.error("dlocal-sweep-pending error:", err);
    return json({ error: "internal error" }, 500);
  }
});
