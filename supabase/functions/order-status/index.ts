// Estado público de un pedido para el cliente.
// Seguridad: no hay login, así que exigimos número de pedido + correo exacto del comprador.
// Validación extra:
//  - el correo se canonicaliza (mayúsculas, puntos/alias de Gmail, dominios mal escritos)
//  - se compara SOLO contra los correos realmente vinculados a ese pedido
//  - respuesta genérica idéntica cuando no coincide (no revela si el pedido existe)
//  - límite de intentos por IP para evitar adivinar correos de pedidos ajenos
//  - la respuesta nunca incluye correos, detalles internos ni referencias completas
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { normalizeEmailBasic } from "../_shared/emailGuard.ts";

// Dos formas de identificarse:
//  a) número de pedido + correo exacto (flujo manual)
//  b) token de descarga (el mismo de /mi-descarga): es secreto, aleatorio y ya
//     está ligado al pedido, así que reemplaza al correo.
const TOKEN_RE = /^[A-Za-z0-9_-]{20,120}$/;
const BodySchema = z.union([
  z.object({
    orderNumber: z.string().trim().min(4).max(80).regex(/^[A-Za-z0-9\-_]+$/),
    email: z.string().trim().email().max(160),
  }),
  // c) id de transacción del proveedor (Stripe, dLocal, Mercado Pago, PayPal)
  //    + correo del comprador. El id solo no basta: siempre validamos el correo.
  z.object({
    transactionId: z.string().trim().min(4).max(120).regex(/^[A-Za-z0-9\-_:.]+$/),
    email: z.string().trim().email().max(160),
  }),
  z.object({ token: z.string().trim().regex(TOKEN_RE) }),
]);



const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

/** Canonicaliza para comparar identidades: gmail ignora puntos y +alias. */
function canonicalEmail(raw: unknown): string {
  const base = normalizeEmailBasic(raw);
  const at = base.lastIndexOf("@");
  if (at <= 0) return base;
  let local = base.slice(0, at);
  const domain = base.slice(at + 1);
  local = local.split("+")[0];
  if (domain === "gmail.com" || domain === "googlemail.com") local = local.replace(/\./g, "");
  return `${local}@${domain === "googlemail.com" ? "gmail.com" : domain}`;
}

/** Deja visible solo el final de una referencia de pago. */
function maskRef(v: unknown): string | null {
  const s = v == null ? "" : String(v);
  if (!s) return null;
  return s.length <= 4 ? "••••" : `••••${s.slice(-4)}`;
}

// Límite de intentos por IP (por isolate). Evita enumerar correos de pedidos ajenos.
const MAX_ATTEMPTS = 12;
const WINDOW_MS = 10 * 60 * 1000;
const attempts = new Map<string, { n: number; until: number }>();

function tooManyAttempts(ip: string): boolean {
  const now = Date.now();
  const cur = attempts.get(ip);
  if (!cur || cur.until < now) {
    attempts.set(ip, { n: 1, until: now + WINDOW_MS });
    return false;
  }
  cur.n += 1;
  return cur.n > MAX_ATTEMPTS;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    if (tooManyAttempts(ip)) {
      return json({ error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." }, 429);
    }

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: "Datos inválidos" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let orderNumber: string;
    let email: string | null = null;

    if ("token" in parsed.data) {
      // El token de descarga ya prueba la propiedad del pedido.
      const { data: tk } = await supabase
        .from("download_tokens")
        .select("order_number, email, revoked")
        .eq("token", parsed.data.token)
        .maybeSingle();
      if (!tk || tk.revoked) return json({ found: false }, 200);
      orderNumber = String(tk.order_number).toUpperCase();
      email = canonicalEmail(tk.email);
    } else if ("transactionId" in parsed.data) {
      // Búsqueda por id de transacción del proveedor: resolvemos el pedido y
      // luego el correo se valida igual que en el flujo normal (más abajo).
      const txId = parsed.data.transactionId;
      email = canonicalEmail(parsed.data.email);
      if (!email.includes("@")) return json({ error: "Datos inválidos" }, 400);

      const [{ data: byEvent }, { data: byWebhook }] = await Promise.all([
        supabase
          .from("order_events")
          .select("order_number")
          .eq("reference", txId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("payment_webhook_events")
          .select("order_number")
          .eq("reference", txId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      const resolved = byEvent?.order_number ?? byWebhook?.order_number ?? null;
      // Aceptamos también que el cliente pegue directamente su número de pedido.
      const fallback = /^ILR-/i.test(txId) ? txId : null;
      if (!resolved && !fallback) return json({ found: false }, 200);
      orderNumber = String(resolved ?? fallback).toUpperCase();
    } else {
      orderNumber = parsed.data.orderNumber.toUpperCase();
      email = canonicalEmail(parsed.data.email);
      if (!email.includes("@")) return json({ error: "Datos inválidos" }, 400);
    }



    const [{ data: events }, { data: manual }, { data: sends }] = await Promise.all([
      supabase
        .from("order_events")
        .select("event, status, method, reference, amount, currency, provider, customer_email, created_at")
        .eq("order_number", orderNumber)
        .order("created_at", { ascending: true }),
      supabase
        .from("manual_payments")
        .select("order_number, buyer_email, status, method, amount_usd, amount_local, currency_local, created_at, verified_at")
        .eq("order_number", orderNumber)
        .maybeSingle(),
      supabase
        .from("digital_email_sends")
        .select("order_id, customer_email, status, created_at, last_event, last_event_at")
        .eq("order_id", orderNumber)
        .order("created_at", { ascending: true }),
    ]);

    // El correo debe coincidir con alguno de los correos vinculados al pedido.
    const owners = new Set<string>();
    (events ?? []).forEach((e) => e.customer_email && owners.add(canonicalEmail(e.customer_email)));
    if (manual?.buyer_email) owners.add(canonicalEmail(manual.buyer_email));
    (sends ?? []).forEach((s) => s.customer_email && owners.add(canonicalEmail(s.customer_email)));

    // Con token válido el pedido ya está probado; con correo debe coincidir.
    const byToken = "token" in parsed.data;
    if (!byToken && (owners.size === 0 || !owners.has(email!))) {
      console.warn("[order-status] acceso denegado", { orderNumber, ip });
      // Respuesta genérica: no revelamos si el pedido existe ni a quién pertenece.
      return json({ found: false }, 200);
    }


    type Item = {
      event: string;
      status: string | null;
      method: string | null;
      reference: string | null;
      detail: string | null;
      amount: number | null;
      currency: string | null;
      provider: string | null;
      createdAt: string;
    };

    const timeline: Item[] = (events ?? []).map((e) => ({
      event: e.event,
      status: e.status,
      method: e.method,
      reference: maskRef(e.reference),
      detail: null as string | null, // detalle interno nunca se expone al cliente
      amount: e.amount,
      currency: e.currency,
      provider: e.provider,
      createdAt: e.created_at,
    }));

    const has = (ev: string) => timeline.some((t) => t.event === ev);
    const push = (i: Item) => timeline.push(i);

    // Pagos manuales (Yape/Plin, SPEI, Binance…) no siempre escriben en order_events.
    // Reconstruimos el historial para que el cliente vea las horas reales.
    if (manual) {
      const mMethod = manual.method ? String(manual.method) : null;
      if (manual.created_at && !has("order_created")) {
        push({
          event: "order_created",
          status: manual.status ?? null,
          method: mMethod,
          reference: null,
          detail: null,
          amount: null,
          currency: null,
          provider: "manual",
          createdAt: manual.created_at,
        });
      }
      if (manual.created_at && !has("payment_pending")) {
        push({
          event: "payment_pending",
          status: "pending",
          method: mMethod,
          reference: null,
          detail: null,
          amount: manual.amount_local ?? manual.amount_usd ?? null,
          currency: manual.currency_local ?? "USD",
          provider: "manual",
          createdAt: manual.created_at,
        });
      }
      if (manual.status === "verified" && manual.verified_at && !has("payment_paid")) {
        push({
          event: "payment_paid",
          status: "paid",
          method: mMethod,
          reference: null,
          detail: null,
          amount: manual.amount_local ?? manual.amount_usd ?? null,
          currency: manual.currency_local ?? "USD",
          provider: "manual",
          createdAt: manual.verified_at,
        });
      }
    }

    // Entrega digital: usa la fecha real del envío del correo.
    if (!has("delivery_sent")) {
      const sent = (sends ?? []).find((s) => s.created_at);
      if (sent) {
        push({
          event: "delivery_sent",
          status: sent.status ?? "sent",
          method: null,
          reference: null,
          detail: null,
          amount: null,
          currency: null,
          provider: "email",
          createdAt: sent.created_at,
        });
      }
    }

    timeline.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());


    const delivered = (sends ?? []).length > 0 || timeline.some((t) => t.event === "delivery_sent");
    const paid = delivered ||
      timeline.some((t) => t.event === "payment_paid") ||
      manual?.status === "verified";

    const stage: "pending" | "paid" | "delivered" = delivered ? "delivered" : paid ? "paid" : "pending";

    // Resultado de la transacción para la pantalla de estado de pago.
    // El rechazo solo cuenta si el pedido no terminó pagado (un intento fallido
    // seguido de un pago aprobado sigue siendo "aprobado").
    const rejected = !paid && (
      timeline.some((t) => t.event === "payment_failed") || manual?.status === "rejected"
    );
    const outcome: "approved" | "rejected" | "processing" = paid
      ? "approved"
      : rejected
        ? "rejected"
        : "processing";

    const method =
      [...timeline].reverse().find((t) => t.method)?.method ??
      (manual?.method ? String(manual.method) : null);

    const amount = [...timeline].reverse().find((t) => t.amount != null)?.amount ?? manual?.amount_usd ?? null;
    const currency = [...timeline].reverse().find((t) => t.currency)?.currency ?? manual?.currency_local ?? "USD";

    return json({
      found: true,
      orderNumber,
      stage,
      outcome,

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
