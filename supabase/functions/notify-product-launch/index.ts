// notify-product-launch
//
// Anuncia UN producto nuevo (por SKU) a 6 audiencias propias, una sola vez por
// persona. No es una lista comprada ni tráfico frío: son contactos que ya
// interactuaron con la tienda.
//
// Audiencias y PRIORIDAD (una persona recibe UN solo correo, con el contexto
// de la audiencia de mayor prioridad en la que aparezca):
//   1. buyers      -> compradores del checkout interno (tokens de descarga,
//                     entregas digitales, auditoría de entregas y pagos
//                     manuales verificados: Yape/Plin/transferencias)
//   2. hotmart     -> compradores vía Hotmart (hotmart_purchases)
//   3. reviewers   -> clientes que dejaron reseña aprobada (reviews)
//   4. waitlist    -> lista de espera "avísame cuando salga" (store_subscribers)
//   5. abandoned   -> carritos abandonados sin convertir (abandoned/persistent_carts)
//   6. newsletter  -> suscriptores del popup (email_contacts)
//
// Reglas: se excluyen correos suprimidos (rebote/queja/baja) y dominios de
// prueba; `product_launch_notices` con índice único (sku, launch_key, lower(email))
// impide duplicados aunque se pulse enviar dos veces.
import * as React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { TEMPLATES } from "../_shared/transactional-email-templates/registry.ts";
import { assertAdminCsrf, adminCorsHeaders, withAdminLogging, adminLog } from "../_shared/adminCsrf.ts";
import { sendInternalEmail } from "../_shared/sendInternalEmail.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
  });

const SITE = "https://ilinguerelax.com";
const SKU_RE = /^[a-z0-9][a-z0-9-]*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TEST_DOMAINS = new Set([
  "example.com", "test.com", "dlocal.com", "dlocaltest.com", "mailinator.com",
  "yopmail.com", "tempmail.com", "sandbox.com", "localhost",
]);

export const AUDIENCES = ["buyers", "hotmart", "reviewers", "waitlist", "abandoned", "newsletter"] as const;
type Audience = typeof AUDIENCES[number];

const AUDIENCE_LABEL: Record<Audience, string> = {
  buyers: "Compradores (checkout propio)",
  hotmart: "Compradores Hotmart",
  reviewers: "Clientes que dejaron reseña",
  waitlist: "Lista de espera (avísame)",
  abandoned: "Carritos abandonados",
  newsletter: "Newsletter (popup)",
};

const canonical = (v: unknown) => String(v ?? "").trim().toLowerCase();

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return "***";
  return `${user.slice(0, 2)}${"*".repeat(Math.max(1, user.length - 2))}@${domain}`;
}

function isRealEmail(email: string): boolean {
  if (!EMAIL_RE.test(email)) return false;
  const domain = email.split("@")[1] ?? "";
  if (TEST_DOMAINS.has(domain)) return false;
  if (/\.(test|invalid|local|example)$/i.test(domain)) return false;
  return true;
}

interface Recipient {
  email: string;
  name: string | null;
  audience: Audience;
}

// deno-lint-ignore no-explicit-any
type Admin = any;

async function fetchAudience(admin: Admin, audience: Audience): Promise<Array<{ email: string; name: string | null }>> {
  const out: Array<{ email: string; name: string | null }> = [];
  const push = (email: unknown, name: unknown) => {
    const e = canonical(email);
    if (isRealEmail(e)) out.push({ email: e, name: (String(name ?? "").trim() || null) });
  };

  if (audience === "buyers") {
    // Compradores reales del checkout propio: 4 fuentes (tokens de descarga,
    // entregas digitales enviadas, auditoría de entregas y pagos manuales
    // verificados: Yape/Plin/transferencias). El Map de collectRecipients
    // garantiza un solo correo por persona aunque aparezca en las 4.
    const { data: tok } = await admin
      .from("download_tokens")
      .select("email, created_at")
      .eq("revoked", false)
      .order("created_at", { ascending: false })
      .limit(20000);
    for (const r of tok ?? []) push(r.email, null);

    const { data: sends } = await admin
      .from("digital_email_sends")
      .select("customer_email, customer_name")
      .limit(20000);
    for (const r of sends ?? []) push(r.customer_email, r.customer_name);

    const { data: audit } = await admin
      .from("digital_delivery_audit")
      .select("customer_email, customer_name, status")
      .eq("status", "sent")
      .limit(20000);
    for (const r of audit ?? []) push(r.customer_email, r.customer_name);

    const { data: manual } = await admin
      .from("manual_payments")
      .select("buyer_email, buyer_name, status")
      .eq("status", "verified")
      .limit(20000);
    for (const r of manual ?? []) push(r.buyer_email, r.buyer_name);
  } else if (audience === "hotmart") {
    const { data } = await admin
      .from("hotmart_purchases")
      .select("email, status")
      .neq("status", "refunded")
      .limit(20000);
    for (const r of data ?? []) push(r.email, null);
  } else if (audience === "reviewers") {
    const { data } = await admin
      .from("reviews")
      .select("customer_email, customer_name, status")
      .eq("status", "approved")
      .limit(20000);
    for (const r of data ?? []) push(r.customer_email, r.customer_name);
  } else if (audience === "waitlist") {
    const { data } = await admin
      .from("store_subscribers")
      .select("email")
      .limit(20000);
    for (const r of data ?? []) push(r.email, null);
  } else if (audience === "abandoned") {
    const { data: ac } = await admin
      .from("abandoned_carts")
      .select("customer_email, customer_name, converted")
      .eq("converted", false)
      .limit(20000);
    for (const r of ac ?? []) push(r.customer_email, r.customer_name);
    const { data: pc } = await admin
      .from("persistent_carts")
      .select("email, buyer, converted")
      .eq("converted", false)
      .limit(20000);
    for (const r of pc ?? []) push(r.email, (r.buyer as { name?: string } | null)?.name);
  } else if (audience === "newsletter") {
    const { data } = await admin
      .from("email_contacts")
      .select("email, name")
      .limit(20000);
    for (const r of data ?? []) push(r.email, r.name);
  }

  return out;
}

/** Une las audiencias elegidas respetando la prioridad: un correo, una sola vez. */
async function collectRecipients(admin: Admin, selected: Audience[]): Promise<{
  recipients: Recipient[];
  perAudience: Array<{ audience: Audience; label: string; raw: number; unique: number }>;
}> {
  const byEmail = new Map<string, Recipient>();
  const perAudience: Array<{ audience: Audience; label: string; raw: number; unique: number }> = [];

  for (const audience of AUDIENCES) {
    if (!selected.includes(audience)) continue;
    const rows = await fetchAudience(admin, audience);
    const seen = new Set<string>();
    let unique = 0;
    for (const r of rows) {
      if (seen.has(r.email)) continue;
      seen.add(r.email);
      if (byEmail.has(r.email)) continue; // ya cubierto por una audiencia de mayor prioridad
      byEmail.set(r.email, { email: r.email, name: r.name, audience });
      unique++;
    }
    perAudience.push({ audience, label: AUDIENCE_LABEL[audience], raw: seen.size, unique });
  }

  // Fuera los correos suprimidos (rebote duro / queja / baja).
  const emails = [...byEmail.keys()];
  for (let i = 0; i < emails.length; i += 200) {
    const chunk = emails.slice(i, i + 200);
    const { data: sup } = await admin.from("suppressed_emails").select("email").in("email", chunk);
    for (const s of (sup ?? []) as Array<{ email: string }>) byEmail.delete(canonical(s.email));
  }

  return { recipients: [...byEmail.values()], perAudience };
}

function parseAudiences(input: unknown): Audience[] {
  const arr = Array.isArray(input) ? input : [];
  const picked = arr
    .map((a) => canonical(a))
    .filter((a): a is Audience => (AUDIENCES as readonly string[]).includes(a));
  return picked.length ? [...new Set(picked)] : [...AUDIENCES];
}

Deno.serve(withAdminLogging("notify-product-launch", async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: adminCorsHeaders });

  const blocked = await assertAdminCsrf(req);
  if (blocked) return blocked;

  const body = await req.json().catch(() => ({})) as {
    action?: string;
    adminKey?: string;
    sku?: string;
    launchKey?: string;
    audiences?: string[];
    pitch?: string;
    coupon?: string;
    sampleAudience?: string;
  };

  const expected = Deno.env.get("ADMIN_REVIEW_KEY");
  if (!expected || body.adminKey !== expected) return json({ error: "Unauthorized" }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // ---------- AUDIENCES: conteo único global, sin producto ----------
  if (body.action === "audiences") {
    const selected = parseAudiences(body.audiences);
    const { recipients, perAudience } = await collectRecipients(admin, selected);
    return json({
      total: recipients.length,
      perAudience,
      generatedAt: new Date().toISOString(),
    });
  }

  const sku = canonical(body.sku);
  if (!sku || !SKU_RE.test(sku)) return json({ error: "SKU inválido" }, 400);


  const { data: product } = await admin
    .from("digital_products")
    .select("sku, name, description, active, cover_image_url")
    .eq("sku", sku)
    .maybeSingle();
  if (!product) return json({ error: "Producto no encontrado" }, 404);

  const action = body.action ?? "preview";
  const launchKey = String(body.launchKey ?? "").trim().slice(0, 40);
  const audiences = parseAudiences(body.audiences);
  const productUrl = `${SITE}/products/${sku}`;
  const rawImage = String((product as { cover_image_url?: string | null }).cover_image_url ?? "").trim();
  const imageUrl = /^https:\/\//.test(rawImage) ? rawImage : undefined;

  const pitch = String(body.pitch ?? "").trim().slice(0, 400);
  const coupon = String(body.coupon ?? "").trim().slice(0, 24).toUpperCase();

  // ---------- PREVIEW: cuántas personas por audiencia ----------
  if (action === "preview") {
    const { recipients, perAudience } = await collectRecipients(admin, audiences);
    let alreadySent = 0;
    if (launchKey) {
      const { count } = await admin
        .from("product_launch_notices")
        .select("id", { count: "exact", head: true })
        .eq("sku", sku)
        .eq("launch_key", launchKey)
        .eq("status", "sent");
      alreadySent = count ?? 0;
    }
    const { data: history } = await admin
      .from("product_launch_notices")
      .select("launch_key, created_at")
      .eq("sku", sku)
      .order("created_at", { ascending: false })
      .limit(500);
    const keys = new Map<string, { launch_key: string; last: string; count: number }>();
    for (const h of (history ?? []) as Array<{ launch_key: string; created_at: string }>) {
      const cur = keys.get(h.launch_key);
      if (cur) cur.count += 1;
      else keys.set(h.launch_key, { launch_key: h.launch_key, last: h.created_at, count: 1 });
    }
    return json({
      product: product.name,
      active: product.active,
      productUrl,
      total: recipients.length,
      perAudience,
      alreadySent,
      pending: Math.max(0, recipients.length - alreadySent),
      history: [...keys.values()],
    });
  }

  // ---------- RENDER: HTML exacto que recibiría una persona ----------
  if (action === "render") {
    const { recipients } = await collectRecipients(admin, audiences);
    const wanted = canonical(body.sampleAudience);
    const sample = (wanted ? recipients.find((r) => r.audience === wanted) : recipients[0]) ?? null;

    const templateData = {
      customerName: sample?.name || "Hola",
      productName: product.name,
      productPitch: pitch || product.description || undefined,
      imageUrl,
      productUrl,
      coupon: coupon || undefined,
      audience: sample?.audience ?? (audiences[0] as string),
    };

    const entry = TEMPLATES["product-launch"];
    const html = await renderAsync(React.createElement(entry.component, templateData));
    const subject = typeof entry.subject === "function" ? entry.subject(templateData) : entry.subject;

    return json({
      isSample: !!sample,
      total: recipients.length,
      sampleEmail: sample ? maskEmail(sample.email) : null,
      sampleAudience: sample ? AUDIENCE_LABEL[sample.audience] : null,
      productUrl,
      subject,
      html,
    });
  }

  // ---------- SEND ----------
  if (action === "send") {
    if (!launchKey) return json({ error: "Falta la etiqueta del lanzamiento (ej. lanzamiento-1)" }, 400);
    if (!product.active) return json({ error: "El producto está inactivo: actívalo antes de anunciarlo" }, 400);

    const { recipients } = await collectRecipients(admin, audiences);

    // Los intentos fallidos anteriores sí pueden reintentarse; los ya enviados no.
    await admin
      .from("product_launch_notices")
      .delete()
      .eq("sku", sku)
      .eq("launch_key", launchKey)
      .in("status", ["failed", "sending"]);

    let sent = 0, skipped = 0, failed = 0;
    const errors: string[] = [];
    const byAudience: Record<string, number> = {};

    for (const r of recipients) {
      // Reserva atómica: si ya existe la fila, el índice único falla y saltamos.
      const { error: claimErr } = await admin.from("product_launch_notices").insert({
        sku,
        launch_key: launchKey,
        email: r.email,
        audience: r.audience,
        status: "sending",
        metadata: { imageUrl: imageUrl ?? null, coupon: coupon || null },
      });
      if (claimErr) { skipped++; continue; }

      const { error } = await sendInternalEmail({
        templateName: "product-launch",
        recipientEmail: r.email,
        idempotencyKey: `launch-${sku}-${launchKey}-${r.email}`,
        templateData: {
          customerName: r.name || "Hola",
          productName: product.name,
          productPitch: pitch || product.description || undefined,
          imageUrl,
          productUrl,
          coupon: coupon || undefined,
          audience: r.audience,
        },
      });

      if (error) {
        failed++;
        if (errors.length < 5) errors.push(`${maskEmail(r.email)}: ${error.message}`);
        await admin
          .from("product_launch_notices")
          .update({ status: "failed", error: error.message.slice(0, 400) })
          .eq("sku", sku).eq("launch_key", launchKey).eq("email", r.email);
      } else {
        sent++;
        byAudience[r.audience] = (byAudience[r.audience] ?? 0) + 1;
        await admin
          .from("product_launch_notices")
          .update({ status: "sent", error: null })
          .eq("sku", sku).eq("launch_key", launchKey).eq("email", r.email);
      }
    }

    // La lista de espera ya recibió su aviso: la marcamos para no repetir.
    if (audiences.includes("waitlist") && sent > 0) {
      await admin
        .from("store_subscribers")
        .update({ announcement_sent: true })
        .eq("announcement_sent", false);
    }

    adminLog("notify-product-launch", "info", "launch_sent", { sku, launchKey, sent, skipped, failed });

    return json({ sku, launchKey, total: recipients.length, sent, skipped, failed, byAudience, errors });
  }

  return json({ error: "Acción no soportada" }, 400);
}));
