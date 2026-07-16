// Sends abandoned-cart reminder emails at day 1 / 7 / 15 / 30.
// - Reads abandoned records from `brevo_sync_logs`
// - Deduplicates via `cart_reminder_sends` (unique email+sku+step)
// - Hotmart records → Hotmart checkout link (from ABANDONED_CART_URL / product row)
// - Tienda records → internal /checkouts/... recovery link
//
// Triggered by pg_cron every hour or manually by admin.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { adminCorsHeaders, assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { sendEmail } from "../_shared/brevo.ts";

const corsHeaders = adminCorsHeaders;
const STEPS = [1, 7, 15, 30] as const;
type Step = typeof STEPS[number];

const SUBJECTS_ES: Record<Step, string> = {
  1: "⏰ Tu carrito te está esperando — recupéralo hoy",
  7: "¿Aún interesado? Tu carrito sigue disponible",
  15: "Última semana para recuperar tu carrito con descuento",
  30: "Última llamada: tu carrito expira pronto (-10% con NEW10)",
};

function buildHtml(opts: {
  name?: string;
  productName?: string;
  ctaUrl: string;
  origin: "hotmart" | "tienda";
  step: Step;
  coupon?: string;
}): string {
  const greeting = opts.name ? `Hola ${opts.name}` : "Hola";
  const product = opts.productName || "tu producto";
  const ctaLabel = opts.origin === "hotmart" ? "Retomar compra en Hotmart" : "Recuperar mi carrito";
  const platformNote = opts.origin === "hotmart"
    ? "Retomarás la compra desde donde la dejaste en Hotmart (pago 100% seguro)."
    : "Retomarás el checkout en nuestra tienda con los productos que dejaste.";
  const stepMsg: Record<Step, string> = {
    1: "Vimos que ayer dejaste tu compra sin finalizar. Te la reservamos para que la retomes fácilmente.",
    7: "Ha pasado una semana desde que iniciaste tu compra. Tu carrito sigue guardado.",
    15: "Vamos a liberar tu carrito pronto. Aprovecha ahora — te dejamos el enlace directo.",
    30: `Es la última llamada: tu carrito expira pronto. ${opts.coupon ? `Usa el código <strong>${opts.coupon}</strong> y obtén 10% de descuento.` : "Aprovecha antes que se libere el stock."}`,
  };

  return `<!DOCTYPE html>
<html lang="es"><body style="margin:0;padding:0;background:#f6f7fb;font-family:'Plus Jakarta Sans',Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,.08)">
        <tr><td style="padding:28px 28px 8px">
          <div style="display:inline-block;padding:4px 10px;border-radius:999px;background:${opts.origin === "hotmart" ? "#fff7ed" : "#f0fdfa"};color:${opts.origin === "hotmart" ? "#c2410c" : "#0f766e"};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em">
            ${opts.origin === "hotmart" ? "Hotmart" : "Tienda iLingue Relax"} · Día ${opts.step}
          </div>
          <h1 style="margin:12px 0 4px;font-size:22px;line-height:1.3">${greeting} 👋</h1>
          <p style="margin:0 0 12px;color:#475569">${stepMsg[opts.step]}</p>
        </td></tr>
        <tr><td style="padding:8px 28px 4px">
          <div style="border:1px solid #e2e8f0;border-radius:12px;padding:16px">
            <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.05em">Producto en tu carrito</div>
            <div style="font-size:16px;font-weight:600;margin-top:4px">${product}</div>
            <div style="font-size:12px;color:#94a3b8;margin-top:6px">${platformNote}</div>
          </div>
        </td></tr>
        <tr><td align="center" style="padding:20px 28px 8px">
          <a href="${opts.ctaUrl}" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:12px;font-size:15px">${ctaLabel} →</a>
        </td></tr>
        ${opts.coupon ? `<tr><td align="center" style="padding:4px 28px 16px">
          <div style="display:inline-block;padding:8px 14px;border:1px dashed #f97316;border-radius:8px;background:#fff7ed;color:#c2410c;font-weight:600;font-size:14px">Código: ${opts.coupon}</div>
        </td></tr>` : ""}
        <tr><td style="padding:8px 28px 24px;font-size:12px;color:#94a3b8;text-align:center">
          Si ya completaste tu compra, ignora este mensaje.<br/>
          iLingue Relax · hola@ilinguerelax.com
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function computeWindow(step: Step) {
  // Look at records created between (step days ago -12h) and (step days ago +12h)
  const target = Date.now() - step * 86400000;
  const from = new Date(target - 12 * 3600000).toISOString();
  const to = new Date(target + 12 * 3600000).toISOString();
  return { from, to };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Allow either service-role (cron) OR admin CSRF+key
  const auth = req.headers.get("authorization") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const isCron = serviceKey && auth === `Bearer ${serviceKey}`;

  if (!isCron) {
    const csrfBlock = await assertAdminCsrf(req);
    if (csrfBlock) return csrfBlock;
  }

  try {
    let adminKey: string | undefined;
    let dryRun = false;
    let onlySteps: Step[] = [...STEPS];
    if (req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      adminKey = b.adminKey;
      dryRun = !!b.dryRun;
      if (Array.isArray(b.steps) && b.steps.length) {
        onlySteps = b.steps.filter((s: number): s is Step => STEPS.includes(s as Step));
      }
    }

    if (!isCron) {
      const expected = Deno.env.get("ADMIN_REVIEW_KEY");
      if (!expected || adminKey !== expected) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const results: Record<string, { candidates: number; sent: number; skipped: number; errors: number }> = {};

    for (const step of onlySteps) {
      const { from, to } = computeWindow(step);
      const { data: rows, error } = await admin
        .from("brevo_sync_logs")
        .select("id, created_at, event_type, origin, email, product_name, product_sku, attributes")
        .in("event_type", ["hotmart_abandoned", "tienda_abandoned"])
        .eq("status", "success")
        .gte("created_at", from)
        .lte("created_at", to)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;

      const stat = { candidates: (rows ?? []).length, sent: 0, skipped: 0, errors: 0 };
      results[`day${step}`] = stat;

      // Deduplicate: keep latest row per (email, sku)
      const seen = new Map<string, typeof rows[number]>();
      for (const r of rows ?? []) {
        const key = `${(r.email || "").toLowerCase()}::${r.product_sku || ""}`;
        if (!seen.has(key)) seen.set(key, r);
      }

      for (const r of seen.values()) {
        const email = (r.email || "").trim().toLowerCase();
        const sku = r.product_sku || "";
        if (!email || !sku) { stat.skipped++; continue; }
        const attrs = (r.attributes || {}) as Record<string, unknown>;
        const origin: "hotmart" | "tienda" = r.origin === "hotmart" || r.event_type === "hotmart_abandoned" ? "hotmart" : "tienda";

        // Build recovery URL
        let ctaUrl = String(attrs.ABANDONED_CART_URL || attrs.PRODUCT_URL || "").trim();
        if (!ctaUrl) {
          if (origin === "hotmart") {
            ctaUrl = `https://pay.hotmart.com/${sku}`;
          } else {
            ctaUrl = `https://ilinguerelax.com/checkouts/${encodeURIComponent(sku)}?recover=${encodeURIComponent(email)}`;
          }
        } else if (origin === "tienda" && !/[?&]recover=/.test(ctaUrl)) {
          ctaUrl += (ctaUrl.includes("?") ? "&" : "?") + `recover=${encodeURIComponent(email)}`;
        }

        // Check if already sent
        const { data: existing } = await admin
          .from("cart_reminder_sends")
          .select("id")
          .eq("email", email).eq("product_sku", sku).eq("step", step)
          .maybeSingle();
        if (existing) { stat.skipped++; continue; }

        if (dryRun) { stat.sent++; continue; }

        const name = (attrs.NOMBRE as string | undefined)
          || (r.attributes as any)?.first_name
          || undefined;
        const coupon = (attrs.ABANDONED_COUPON as string | undefined) || (step === 30 ? "NEW10" : undefined);

        const html = buildHtml({
          name,
          productName: r.product_name || undefined,
          ctaUrl,
          origin,
          step,
          coupon,
        });

        const sendRes = await sendEmail({
          to: email,
          subject: SUBJECTS_ES[step],
          html,
          replyTo: "hola@ilinguerelax.com",
        });

        if (sendRes.error) {
          stat.errors++;
          await admin.from("cart_reminder_sends").insert({
            email, product_sku: sku, origin, step,
            cart_url: ctaUrl, status: "failed",
            error: sendRes.error.message?.slice(0, 500) || null,
          });
        } else {
          stat.sent++;
          await admin.from("cart_reminder_sends").insert({
            email, product_sku: sku, origin, step,
            cart_url: ctaUrl, status: "sent",
          });
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, dryRun, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
