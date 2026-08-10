// Entrega digital verificada para el comprador.
//
// Devuelve los enlaces de descarga (producto + bonos + upsells comprados) SOLO
// cuando existe un pago realmente confirmado para ese pedido. Sustituye a la
// acción `get_delivery` de manage-products, que aceptaba SKUs sueltos y por eso
// permitía sacar cualquier Google Drive del catálogo sin haber pagado.
//
// Seguridad:
//  - sin login: exigimos número de pedido + correo y comparamos contra los
//    correos ya vinculados a ese pedido (order_events / manual_payments)
//  - el pago se confirma contra la base (evento payment_paid del webhook) y,
//    para dLocal Go, se re-consulta la API oficial antes de habilitar el acceso
//  - los SKUs salen del propio pedido, nunca del cuerpo de la petición
//  - respuesta genérica cuando no coincide y límite de intentos por IP
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa", "Access-Control-Allow-Methods": "POST, OPTIONS" };
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { normalizeSkus } from "../_shared/digitalSku.ts";
import { logOrderEvent } from "../_shared/orderEvents.ts";
import { isSettledStatus } from "../_shared/dlocal.ts";
import { randomToken } from "../_shared/downloadToken.ts";

const SITE = "https://www.ilinguerelax.com";


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

// Solo un pago LIQUIDADO habilita la entrega. AUTHORIZED / VERIFIED / PENDING
// significan "aún no acreditado" en efectivo y transferencia (ver _shared/dlocal.ts).

// deno-lint-ignore no-explicit-any
type Admin = any;

/** SKUs realmente asociados al pedido, nunca los que mande el navegador. */
async function skusForOrder(admin: Admin, orderNumber: string, email: string): Promise<string[]> {
  const out = new Set<string>();
  const push = (v: unknown) => {
    const s = String(v ?? "").trim().toLowerCase();
    if (s) out.add(s);
  };

  const { data: events } = await admin
    .from("order_events")
    .select("metadata")
    .eq("order_number", orderNumber)
    .limit(50);
  for (const e of events ?? []) {
    const skus = (e?.metadata as { skus?: unknown } | null)?.skus;
    if (Array.isArray(skus)) for (const s of skus) push(s);
  }

  const { data: sends } = await admin
    .from("digital_email_sends")
    .select("skus")
    .eq("order_id", orderNumber)
    .limit(20);
  for (const r of sends ?? []) for (const s of (Array.isArray(r?.skus) ? r.skus : [])) push(s);

  const { data: manual } = await admin
    .from("manual_payments")
    .select("items")
    .eq("order_number", orderNumber)
    .limit(5);
  for (const r of manual ?? []) {
    for (const it of (Array.isArray(r?.items) ? r.items : [])) {
      push((it as { id?: string; sku?: string })?.id ?? (it as { sku?: string })?.sku);
    }
  }

  // Último recurso: el envío digital registrado con el mismo correo del pedido.
  if (out.size === 0 && email) {
    const { data: byEmail } = await admin
      .from("digital_email_sends")
      .select("skus, order_id")
      .ilike("customer_email", email)
      .order("created_at", { ascending: false })
      .limit(5);
    for (const r of byEmail ?? []) {
      if (String(r?.order_id ?? "").toUpperCase() !== orderNumber) continue;
      for (const s of (Array.isArray(r?.skus) ? r.skus : [])) push(s);
    }
  }

  return [...out];
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

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: events } = await admin
      .from("order_events")
      .select("event, status, provider, reference, customer_email, created_at")
      .eq("order_number", orderNumber)
      .order("created_at", { ascending: true });

    const { data: manualRows } = await admin
      .from("manual_payments")
      .select("buyer_email, status")
      .eq("order_number", orderNumber)
      .limit(5);

    const owners = new Set<string>();
    for (const e of events ?? []) {
      const c = canonical(e.customer_email);
      if (c) owners.add(c);
    }
    for (const m of manualRows ?? []) {
      const c = canonical(m.buyer_email);
      if (c) owners.add(c);
    }

    if (owners.size === 0 || !owners.has(email)) {
      console.warn("[order-delivery] acceso denegado", { orderNumber, ip });
      return json({ found: false, paid: false, items: [] }, 200);
    }

    // ---- ¿Está pagado de verdad? ------------------------------------------
    let paid = (events ?? []).some(
      (e) => e.event === "payment_paid" || isSettledStatus(e.status),
    );
    paid = paid || (manualRows ?? []).some((m) =>
      ["verified", "completed", "paid", "approved"].includes(String(m.status ?? "").toLowerCase())
    );

    const provider = (events ?? []).map((e) => e.provider).filter(Boolean).pop() ?? null;

    // dLocal Go: re-confirmamos contra la API oficial antes de dar acceso.
    if (!paid && provider === "dlocalgo") {
      const paymentId = (events ?? []).map((e) => e.reference).filter(Boolean).pop();
      const apiKey = Deno.env.get("DLOCAL_GO_API_KEY");
      const secretKey = Deno.env.get("DLOCAL_GO_SECRET_KEY");
      if (paymentId && apiKey && secretKey) {
        try {
          const resp = await fetch(`${API_BASE}/payments/${encodeURIComponent(String(paymentId))}`, {
            headers: { Authorization: `Bearer ${apiKey}:${secretKey}` },
          });
          if (resp.ok) {
            const raw = await resp.json();
            const rawStatus = String(raw?.status ?? "").toUpperCase();
            if (isSettledStatus(rawStatus)) {
              paid = true;
              await logOrderEvent({
                orderNumber,
                event: "payment_paid",
                provider: "dlocalgo",
                status: rawStatus,
                reference: String(paymentId),
                detail: "Pago confirmado contra la API de dLocal Go al abrir la entrega",
                customerEmail: parsed.data.email,
              });
            }
          } else {
            console.warn("[order-delivery] dLocal respondió", resp.status);
          }
        } catch (e) {
          console.warn("[order-delivery] fetch dLocal falló:", e instanceof Error ? e.message : String(e));
        }
      }
    }

    if (!paid) return json({ found: true, paid: false, items: [] }, 200);

    // ---- Enlaces: producto + bonos + upsells del pedido --------------------
    const rawSkus = await skusForOrder(admin, orderNumber, email);
    if (!rawSkus.length) return json({ found: true, paid: true, items: [] }, 200);

    let skus = normalizeSkus(rawSkus);
    // Alias configurados en admin (digital_products.sku_aliases)
    try {
      const { data: aliasRows } = await admin
        .from("digital_products")
        .select("sku,sku_aliases")
        .overlaps("sku_aliases", [...new Set([...rawSkus, ...skus])]);
      const aliasMap = new Map<string, string>();
      for (const r of (aliasRows ?? []) as { sku: string; sku_aliases: string[] }[]) {
        for (const a of r.sku_aliases ?? []) aliasMap.set(String(a).toLowerCase(), r.sku);
      }
      if (aliasMap.size) skus = skus.map((s) => aliasMap.get(s.toLowerCase()) ?? s);
    } catch (_) { /* alias opcional */ }

    // Los enlaces de Drive NUNCA salen al navegador: devolvemos solo metadatos
    // y un token de descarga (/mi-descarga?t=…) que resuelve el archivo real
    // mediante redirecciones firmadas de corta duración.
    const uniqueSkus = [...new Set(skus)];
    const { data: products, error } = await admin
      .from("digital_products")
      .select("sku,name,cover_image_url,drive_url,bonus_name,bonus_drive_url,bonuses")
      .in("sku", uniqueSkus);
    if (error) throw error;

    type Row = {
      sku: string; name: string; cover_image_url: string | null;
      drive_url: string | null; bonus_name: string | null;
      bonus_drive_url: string | null; bonuses: unknown;
    };
    const rows = (products ?? []) as Row[];
    const items = rows.map((p) => {
      const extra = Array.isArray(p.bonuses)
        ? (p.bonuses as { drive_url?: string; url?: string }[]).filter((b) => b?.drive_url || b?.url).length
        : 0;
      return {
        sku: p.sku,
        name: p.name,
        cover_image_url: p.cover_image_url,
        available: Boolean(p.drive_url),
        bonus_count: extra + (p.bonus_drive_url ? 1 : 0),
      };
    });

    // Token de descarga por pedido (se reutiliza si ya existe).
    let downloadUrl: string | null = null;
    try {
      const { data: existing } = await admin
        .from("download_tokens")
        .select("token, skus, revoked")
        .eq("order_number", orderNumber)
        .eq("email", email)
        .maybeSingle();

      if (existing && !existing.revoked) {
        const merged = [...new Set([...(existing.skus ?? []), ...uniqueSkus])];
        if (merged.length !== (existing.skus ?? []).length) {
          await admin.from("download_tokens").update({ skus: merged }).eq("token", existing.token);
        }
        downloadUrl = `${SITE}/mi-descarga?t=${existing.token}`;
      } else if (!existing) {
        const token = randomToken();
        const { error: insErr } = await admin.from("download_tokens").insert({
          token, order_number: orderNumber, email, skus: uniqueSkus,
        });
        if (!insErr) downloadUrl = `${SITE}/mi-descarga?t=${token}`;
      }
    } catch (e) {
      console.warn("[order-delivery] token:", e instanceof Error ? e.message : String(e));
    }

    return json({ found: true, paid: true, items, downloadUrl });

  } catch (err) {
    console.error("order-delivery error:", err);
    return json({ error: "No pudimos recuperar tu entrega." }, 500);
  }
});
