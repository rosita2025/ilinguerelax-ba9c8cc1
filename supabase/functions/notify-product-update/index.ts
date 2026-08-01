// notify-product-update
//
// Avisa por correo, UNA SOLA VEZ, a los compradores de UN producto concreto
// (por SKU) de que su material se actualizó. No es marketing: es una
// notificación sobre un producto que esa persona ya compró.
//
// Reglas clave:
//  - Solo compradores de ese SKU (nunca la lista completa de clientes).
//  - Se reutiliza SU MISMO enlace privado /mi-descarga?t=<token>. No se emite
//    un token nuevo ni se exponen enlaces de Drive.
//  - `product_version_notices` con índice único (sku, notice_key, lower(email))
//    garantiza un correo por comprador y por aviso aunque se pulse dos veces.
//  - Se excluyen correos suprimidos (rebotes/quejas) y dominios de prueba.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { assertAdminCsrf, adminCorsHeaders, withAdminLogging, adminLog } from "../_shared/adminCsrf.ts";
import { sendInternalEmail } from "../_shared/sendInternalEmail.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
  });

const SITE = "https://ilinguerelax.com";
const SKU_RE = /^[a-z0-9][a-z0-9-]*$/;
const TEST_DOMAINS = new Set([
  "example.com", "test.com", "dlocal.com", "dlocaltest.com", "mailinator.com",
  "yopmail.com", "tempmail.com", "sandbox.com", "localhost",
]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const canonical = (v: unknown) => String(v ?? "").trim().toLowerCase();

function isRealEmail(email: string): boolean {
  if (!EMAIL_RE.test(email)) return false;
  const domain = email.split("@")[1] ?? "";
  if (TEST_DOMAINS.has(domain)) return false;
  if (/\.(test|invalid|local|example)$/i.test(domain)) return false;
  return true;
}

interface Recipient {
  email: string;
  token: string;
  orderNumber: string;
}

// deno-lint-ignore no-explicit-any
async function collectRecipients(admin: any, sku: string): Promise<Recipient[]> {
  const { data, error } = await admin
    .from("download_tokens")
    .select("token, email, order_number, skus, revoked, created_at")
    .contains("skus", [sku])
    .eq("revoked", false)
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw error;

  // Un correo por persona: nos quedamos con su token más reciente.
  const byEmail = new Map<string, Recipient>();
  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    const email = canonical(row.email);
    if (!isRealEmail(email)) continue;
    if (byEmail.has(email)) continue;
    byEmail.set(email, {
      email,
      token: String(row.token),
      orderNumber: String(row.order_number ?? ""),
    });
  }

  if (byEmail.size === 0) return [];

  // Fuera los correos suprimidos (rebote duro / queja / baja).
  const emails = [...byEmail.keys()];
  for (let i = 0; i < emails.length; i += 200) {
    const chunk = emails.slice(i, i + 200);
    const { data: sup } = await admin
      .from("suppressed_emails")
      .select("email")
      .in("email", chunk);
    for (const s of (sup ?? []) as Array<{ email: string }>) {
      byEmail.delete(canonical(s.email));
    }
  }

  return [...byEmail.values()];
}

Deno.serve(withAdminLogging("notify-product-update", async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: adminCorsHeaders });

  const blocked = await assertAdminCsrf(req);
  if (blocked) return blocked;

  const body = await req.json().catch(() => ({})) as {
    action?: string;
    adminKey?: string;
    sku?: string;
    noticeKey?: string;
    changes?: string[];
    bonusNote?: string;
  };

  const expected = Deno.env.get("ADMIN_REVIEW_KEY");
  if (!expected || body.adminKey !== expected) return json({ error: "Unauthorized" }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const sku = canonical(body.sku);
  if (!sku || !SKU_RE.test(sku)) return json({ error: "SKU inválido" }, 400);

  const { data: product } = await admin
    .from("digital_products")
    .select("sku, name")
    .eq("sku", sku)
    .maybeSingle();
  if (!product) return json({ error: "Producto no encontrado" }, 404);

  const action = body.action ?? "preview";
  const noticeKey = String(body.noticeKey ?? "").trim().slice(0, 40);

  // ---------- PREVIEW: cuántos compradores de ESTE producto ----------
  if (action === "preview") {
    const recipients = await collectRecipients(admin, sku);
    let alreadySent = 0;
    if (noticeKey) {
      const { count } = await admin
        .from("product_version_notices")
        .select("id", { count: "exact", head: true })
        .eq("sku", sku)
        .eq("notice_key", noticeKey)
        .eq("status", "sent");
      alreadySent = count ?? 0;
    }
    const { data: history } = await admin
      .from("product_version_notices")
      .select("notice_key, created_at")
      .eq("sku", sku)
      .order("created_at", { ascending: false })
      .limit(200);
    const keys = new Map<string, { notice_key: string; last: string; count: number }>();
    for (const h of (history ?? []) as Array<{ notice_key: string; created_at: string }>) {
      const cur = keys.get(h.notice_key);
      if (cur) cur.count += 1;
      else keys.set(h.notice_key, { notice_key: h.notice_key, last: h.created_at, count: 1 });
    }
    return json({
      product: product.name,
      buyers: recipients.length,
      alreadySent,
      pending: Math.max(0, recipients.length - alreadySent),
      history: [...keys.values()],
    });
  }

  // ---------- SEND ----------
  // ---------- RENDER: previsualizar el correo real de UN comprador ----------
  // Devuelve el HTML exacto que recibiría un comprador de este SKU, con SU
  // enlace privado /mi-descarga?t=<token> y las novedades escritas. No envía nada.
  if (action === "render") {
    const changes = (body.changes ?? [])
      .map((c) => String(c ?? "").trim())
      .filter(Boolean)
      .slice(0, 12)
      .map((c) => c.slice(0, 200));
    const bonusNote = String(body.bonusNote ?? "").trim().slice(0, 300);

    const recipients = await collectRecipients(admin, sku);
    const wanted = canonical(body.sampleEmail);
    const sample = (wanted ? recipients.find((r) => r.email === wanted) : recipients[0]) ?? null;

    const downloadUrl = sample
      ? `${SITE}/mi-descarga?t=${sample.token}`
      : `${SITE}/mi-descarga?t=TOKEN_PRIVADO_DEL_COMPRADOR`;

    const templateData = {
      productName: product.name,
      versionLabel: noticeKey || "v1.7",
      changes: changes.length ? changes : ["(aún no escribiste novedades)"],
      bonusNote: bonusNote || undefined,
      downloadUrl,
    };

    const entry = TEMPLATES["product-version-update"];
    const html = await renderAsync(React.createElement(entry.component, templateData));
    const subject = typeof entry.subject === "function" ? entry.subject(templateData) : entry.subject;

    return json({
      isSample: !!sample,
      buyers: recipients.length,
      sampleEmail: sample ? maskEmail(sample.email) : null,
      orderNumber: sample?.orderNumber || null,
      downloadUrl,
      subject,
      html,
    });
  }

  if (action === "send") {

    if (!noticeKey) return json({ error: "Falta la etiqueta del aviso (ej. v1.7)" }, 400);
    const changes = (body.changes ?? [])
      .map((c) => String(c ?? "").trim())
      .filter(Boolean)
      .slice(0, 12)
      .map((c) => c.slice(0, 200));
    if (changes.length === 0) return json({ error: "Escribe al menos una novedad" }, 400);
    const bonusNote = String(body.bonusNote ?? "").trim().slice(0, 300);

    const recipients = await collectRecipients(admin, sku);

    // Los intentos fallidos anteriores sí pueden reintentarse; los ya enviados no.
    await admin
      .from("product_version_notices")
      .delete()
      .eq("sku", sku)
      .eq("notice_key", noticeKey)
      .in("status", ["failed", "sending"]);

    let sent = 0, skipped = 0, failed = 0;
    const errors: string[] = [];

    for (const r of recipients) {
      // Reserva atómica: si ya existe la fila, el índice único falla y saltamos.
      const { error: claimErr } = await admin
        .from("product_version_notices")
        .insert({
          sku,
          notice_key: noticeKey,
          email: r.email,
          order_number: r.orderNumber || null,
          status: "sending",
          metadata: { changes, bonusNote: bonusNote || null },
        });
      if (claimErr) { skipped++; continue; }

      const { error } = await sendInternalEmail({
        templateName: "product-version-update",
        recipientEmail: r.email,
        idempotencyKey: `update-${sku}-${noticeKey}-${r.email}`,
        templateData: {
          productName: product.name,
          versionLabel: noticeKey,
          changes,
          bonusNote: bonusNote || undefined,
          downloadUrl: `${SITE}/mi-descarga?t=${r.token}`,
        },
      });

      if (error) {
        failed++;
        if (errors.length < 5) errors.push(`${r.email}: ${error.message}`);
        await admin
          .from("product_version_notices")
          .update({ status: "failed", error: error.message.slice(0, 400) })
          .eq("sku", sku).eq("notice_key", noticeKey).eq("email", r.email);
      } else {
        sent++;
        await admin
          .from("product_version_notices")
          .update({ status: "sent", error: null })
          .eq("sku", sku).eq("notice_key", noticeKey).eq("email", r.email);
      }
    }

    adminLog("notify-product-update", "info", "notice.done", { sku, noticeKey, sent, skipped, failed });
    return json({ ok: true, buyers: recipients.length, sent, skipped, failed, errors });
  }

  return json({ error: "Acción no soportada" }, 400);
}));
