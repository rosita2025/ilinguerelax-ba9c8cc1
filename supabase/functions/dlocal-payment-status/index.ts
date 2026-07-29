// Estado en vivo de un pago de dLocal Go para la pantalla de retorno del checkout.
// Se usa cuando el comprador vuelve desde checkout.dlocal.com (aprobado, rechazado
// o cancelado) para mostrarle un mensaje claro en vez de dejarlo en una pantalla
// de error sin información.
//
// Seguridad:
//  - no hay login: exigimos número de pedido + correo del comprador y comparamos
//    SOLO contra los correos ya vinculados a ese pedido en public.order_events
//  - respuesta genérica ({ found:false }) cuando no coincide: no revela si existe
//  - límite de intentos por IP para evitar sondear pedidos ajenos
//  - nunca devolvemos correos, referencias completas ni datos internos
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { isSettledStatus, isPendingStatus, isFailedStatus } from "../_shared/dlocal.ts";
import { logOrderEvent } from "../_shared/orderEvents.ts";

const API_BASE = "https://api.dlocalgo.com/v1";

const BodySchema = z.object({
  orderId: z.string().trim().min(4).max(80).regex(/^[A-Za-z0-9\-_]+$/),
  email: z.string().trim().email().max(160),
});

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function canonical(raw: unknown): string {
  const base = String(raw ?? "").trim().toLowerCase();
  const at = base.lastIndexOf("@");
  if (at <= 0) return base;
  let local = base.slice(0, at).split("+")[0];
  let domain = base.slice(at + 1);
  if (domain === "googlemail.com") domain = "gmail.com";
  if (domain === "gmail.com") local = local.replace(/\./g, "");
  return `${local}@${domain}`;
}

const MAX_ATTEMPTS = 20;
const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, { n: number; until: number }>();
function tooMany(ip: string): boolean {
  const now = Date.now();
  const cur = hits.get(ip);
  if (!cur || cur.until < now) {
    hits.set(ip, { n: 1, until: now + WINDOW_MS });
    return false;
  }
  cur.n += 1;
  return cur.n > MAX_ATTEMPTS;
}

/** Traduce el estado crudo de dLocal a los 4 estados que entiende el checkout. */
function normalize(status: string): "paid" | "pending" | "rejected" | "unknown" {
  const s = status.toUpperCase();
  // AUTHORIZED/VERIFIED NO son "pagado": el dinero aún no está acreditado.
  if (isSettledStatus(s)) return "paid";
  if (isPendingStatus(s)) return "pending";
  if (isFailedStatus(s)) return "rejected";
  return "unknown";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
      || req.headers.get("cf-connecting-ip") || "unknown";
    if (tooMany(ip)) return json({ error: "Demasiados intentos. Espera unos minutos." }, 429);

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: "Datos inválidos" }, 400);

    const orderNumber = parsed.data.orderId.toUpperCase();
    const email = canonical(parsed.data.email);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: events } = await supabase
      .from("order_events")
      .select("event, status, reference, customer_email, method, created_at")
      .eq("order_number", orderNumber)
      .order("created_at", { ascending: true });

    const owners = new Set((events ?? []).map((e) => canonical(e.customer_email)).filter(Boolean));
    if (owners.size === 0 || !owners.has(email)) {
      console.warn("[dlocal-payment-status] acceso denegado", { orderNumber, ip });
      return json({ found: false }, 200);
    }

    const method = (events ?? []).find((e) => e.method)?.method ?? null;
    // Si el webhook ya confirmó el pago, no hace falta consultar a dLocal.
    if ((events ?? []).some((e) => e.event === "payment_paid")) {
      return json({ found: true, status: "paid", rawStatus: "PAID", method });
    }
    if ((events ?? []).some((e) => e.event === "payment_failed")) {
      const last = [...(events ?? [])].reverse().find((e) => e.event === "payment_failed");
      return json({ found: true, status: "rejected", rawStatus: last?.status ?? "REJECTED", method });
    }

    const paymentId = (events ?? []).map((e) => e.reference).filter(Boolean).pop();
    const apiKey = Deno.env.get("DLOCAL_GO_API_KEY");
    const secretKey = Deno.env.get("DLOCAL_GO_SECRET_KEY");
    if (!paymentId || !apiKey || !secretKey) {
      return json({ found: true, status: "pending", rawStatus: "UNKNOWN", method });
    }

    let raw: Record<string, unknown> | null = null;
    try {
      const resp = await fetch(`${API_BASE}/payments/${encodeURIComponent(String(paymentId))}`, {
        headers: { Authorization: `Bearer ${apiKey}:${secretKey}` },
      });
      if (resp.ok) raw = await resp.json();
      else console.warn("[dlocal-payment-status] dLocal respondió", resp.status);
    } catch (e) {
      console.warn("[dlocal-payment-status] fetch dLocal falló:", e instanceof Error ? e.message : String(e));
    }

    if (!raw) return json({ found: true, status: "pending", rawStatus: "UNKNOWN", method });

    const rawStatus = String(raw.status ?? "UNKNOWN");
    const statusDetail = raw.status_detail ? String(raw.status_detail).slice(0, 200) : null;
    const status = normalize(rawStatus);

    // Deja el rechazo/expiración en el historial del pedido para /mi-pedido.
    if (status === "rejected") {
      await logOrderEvent({
        orderNumber,
        event: "payment_failed",
        provider: "dlocalgo",
        status: rawStatus.toUpperCase(),
        method,
        reference: String(paymentId),
        detail: statusDetail ?? "dLocal no aprobó la transacción",
        customerEmail: parsed.data.email,
      });
    }

    return json({ found: true, status, rawStatus, statusDetail, method });
  } catch (err) {
    console.error("dlocal-payment-status error:", err);
    return json({ error: "No pudimos consultar el estado del pago." }, 500);
  }
});
