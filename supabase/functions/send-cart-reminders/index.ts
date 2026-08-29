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
import { getPurchasedSkus } from "../_shared/purchasedSkus.ts";
import { getPurchasedEmails } from "../_shared/purchasedEmails.ts";

const corsHeaders = adminCorsHeaders;
// Steps are measured in MINUTES. 30 min, 1440 min (1 día), 7200 min (5 días).
const STEPS = [30, 1440, 7200, 21600, 43200] as const; // Added 15 days and 30 days steps
type Step = typeof STEPS[number];

const SUBJECTS_ES: Record<Step, string> = {
  30: "👀 ¿Olvidaste algo? Tu carrito sigue esperándote",
  1440: "⏰ Tu carrito te está esperando — recupéralo hoy",
  7200: "Última llamada: tu carrito expira pronto (-10% con NEW10)",
  21600: "🎁 Tenemos un regalo para ti (Finaliza tu pedido)",
  43200: "👋 ¿Sigues ahí? Tu carrito extraña su nuevo hogar",
};

interface ProductItem {
  name: string;
  ctaUrl: string;
  origin: "hotmart" | "tienda";
}

function buildHtml(opts: {
  name?: string;
  products: ProductItem[];
  step: Step;
  coupon?: string;
  primaryCta?: string;
}): string {
  const greeting = opts.name ? `Hola ${opts.name}` : "Hola";
  const stepMsg: Record<Step, string> = {
    30: "Notamos que hace unos minutos comenzaste tu compra y no la terminaste. Tus productos siguen reservados — retómalos en 1 clic.",
    1440: "Ayer dejaste tu compra sin finalizar. Te la reservamos para que la retomes fácilmente.",
    7200: `Es la última llamada: tu carrito expira pronto. ${opts.coupon ? `Usa el código <strong>${opts.coupon}</strong> y obtén 10% de descuento.` : "Aprovecha antes que se libere el stock."}`,
    21600: "Han pasado unos días desde que mostraste interés. Queremos que alcances tus metas de idiomas, por eso te guardamos este carrito.",
    43200: "Esta es nuestra última comunicación sobre este carrito. Si aún quieres aprender con nosotros, este es el momento.",
  };

  const productsHtml = opts.products.map((p) => `
      <div style="border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;margin-bottom:10px">
        <div style="font-size:15px;font-weight:600;color:#0f172a">${p.name}</div>
      </div>`).join("");

  const plural = opts.products.length > 1;
  const bigCta = opts.primaryCta
    ? `<div style="text-align:center;margin:18px 0 6px">
         <a href="${opts.primaryCta}" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:12px;font-size:16px">
           ${plural ? "Retomar todos mis productos →" : "Retomar mi carrito →"}
         </a>
       </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="es"><body style="margin:0;padding:0;background:#f6f7fb;font-family:'Plus Jakarta Sans',Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,.08)">
        <tr><td style="padding:28px 28px 8px">
          <h1 style="margin:0 0 8px;font-size:22px;line-height:1.3">${greeting} 👋</h1>
          <p style="margin:0 0 16px;color:#475569">${stepMsg[opts.step]}</p>
        </td></tr>
        <tr><td style="padding:0 28px 4px">
          <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">${plural ? `${opts.products.length} productos en tu carrito` : "Producto en tu carrito"}</div>
          ${productsHtml}
          ${bigCta}
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

function computeWindow(stepMinutes: Step) {
  // Look at records created around (now - stepMinutes). Tight window for the
  // 30-min step (matches ±15 min so the every-15-min cron covers it), wider
  // ±12h window for daily steps so they catch rows created earlier that day.
  const target = Date.now() - stepMinutes * 60000;
  const halfWindow = stepMinutes < 60 ? 15 * 60000 : 12 * 3600000;
  const from = new Date(target - halfWindow).toISOString();
  const to = new Date(target + halfWindow).toISOString();
  return { from, to };
}

function hasServiceRole(authHeader: string): boolean {
  if (!authHeader.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7).trim();
  // New-format Supabase secret keys are trusted (only postgres/vault can hold them)
  if (token.startsWith("sb_secret_") || token.startsWith("sbp_")) return true;
  // Legacy JWT: decode payload without signature verification (trust boundary
  // is the vault + inbound header from postgres cron)
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const pad = (s: string) => s + "===".slice((s.length + 3) % 4);
    const payload = JSON.parse(atob(pad(parts[1].replace(/-/g, "+").replace(/_/g, "/"))));
    return payload?.role === "service_role";
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Allow service-role/shared-secret cron calls, otherwise require admin guards.
  const auth = req.headers.get("authorization") || "";
  const cronSecret = req.headers.get("x-cron-secret") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const sharedSecret = Deno.env.get("CRON_SHARED_SECRET") || "";
  const isCron = Boolean(
    (serviceKey && auth === `Bearer ${serviceKey}`) ||
    (sharedSecret && cronSecret === sharedSecret) ||
    hasServiceRole(auth),
  );

  if (!isCron) {
    const csrfBlock = await assertAdminCsrf(req);
    if (csrfBlock) return csrfBlock;
  }

  try {
    let adminKey: string | undefined;
    let dryRun = false;
    let onlySteps: Step[] = [...STEPS];
    let action: "run" | "get_config" | "set_config" = "run";
    let configPatch: { send_hour?: number; timezone?: string; paused?: boolean; enabled_steps?: number[] } | undefined;
    if (req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      adminKey = b.adminKey;
      dryRun = !!b.dryRun;
      if (b.action === "get_config" || b.action === "set_config") action = b.action;
      if (b.config) configPatch = b.config;
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

    // Load config (single-row id=1)
    const { data: cfgRow } = await admin
      .from("cart_reminder_config")
      .select("send_hour, timezone, enabled_steps, paused, updated_at")
      .eq("id", 1)
      .maybeSingle();
    const cfg = cfgRow || { send_hour: 10, timezone: "America/Lima", enabled_steps: [30, 1440, 7200], paused: false, updated_at: null };

    // Handle config endpoints (admin-only)
    if (action === "get_config") {
      return new Response(JSON.stringify({ ok: true, config: cfg }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (action === "set_config") {
      const patch: Record<string, unknown> = {};
      if (typeof configPatch?.send_hour === "number" && configPatch.send_hour >= 0 && configPatch.send_hour <= 23) {
        patch.send_hour = Math.floor(configPatch.send_hour);
      }
      if (typeof configPatch?.timezone === "string" && configPatch.timezone.trim()) {
        // Validate the IANA TZ
        try { new Intl.DateTimeFormat("en-US", { timeZone: configPatch.timezone }).format(new Date()); patch.timezone = configPatch.timezone.trim(); }
        catch { return new Response(JSON.stringify({ error: "Invalid timezone" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
      }
      if (typeof configPatch?.paused === "boolean") patch.paused = configPatch.paused;
      if (Array.isArray(configPatch?.enabled_steps)) {
        patch.enabled_steps = configPatch!.enabled_steps.filter((n) => STEPS.includes(n as Step));
      }
      const { data: updated, error: upErr } = await admin
        .from("cart_reminder_config")
        .upsert({ id: 1, ...patch })
        .select()
        .single();
      if (upErr) throw upErr;
      return new Response(JSON.stringify({ ok: true, config: updated }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cron: skip if paused. Daily steps (>=1440 min = 1 día) also gate on
    // send_hour; the 30-min step fires every 15 min so recovery is fast.
    let allowDailySteps = true;
    if (isCron) {
      if (cfg.paused) {
        return new Response(JSON.stringify({ ok: true, skipped: "paused" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      let currentHour = new Date().getUTCHours();
      try {
        const parts = new Intl.DateTimeFormat("en-US", {
          hour: "2-digit", hour12: false, timeZone: cfg.timezone,
        }).formatToParts(new Date());
        const h = parts.find((p) => p.type === "hour")?.value;
        if (h != null) currentHour = parseInt(h, 10) % 24;
      } catch { /* fallback to UTC */ }
      allowDailySteps = currentHour === cfg.send_hour;
    }

    // Honor enabled_steps from config (intersect with request)
    if (Array.isArray(cfg.enabled_steps) && cfg.enabled_steps.length) {
      onlySteps = onlySteps.filter((s) => cfg.enabled_steps.includes(s));
    }
    // Daily steps (>=1440 min) are skipped in cron when not at send_hour
    if (isCron && !allowDailySteps) {
      onlySteps = onlySteps.filter((s) => s < 1440);
      if (onlySteps.length === 0) {
        return new Response(JSON.stringify({ ok: true, skipped: `daily steps wait for hour ${cfg.send_hour} (${cfg.timezone})` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }


    const results: Record<string, { candidates: number; sent: number; skipped: number; errors: number }> = {};

    const SITE = "https://ilinguerelax.com";

    for (const step of onlySteps) {
      const { from, to } = computeWindow(step);
      // Query persistent_carts (one row per email = ALL abandoned SKUs) instead
      // of brevo_sync_logs (one row per SKU). This guarantees ONE email per
      // (email, step) listing every product the buyer accumulated across
      // sessions/devices — not 2 or 3 separate emails per product.
      const { data: rows, error } = await admin
        .from("persistent_carts")
        .select("email, items, buyer, language, cart_token, last_activity, converted")
        .eq("converted", false)
        .gte("last_activity", from)
        .lte("last_activity", to)
        .order("last_activity", { ascending: false })
        .limit(500);
      if (error) throw error;

      const stat = { candidates: (rows ?? []).length, sent: 0, skipped: 0, errors: 0 };
      results[`day${step}`] = stat;

      for (const cart of rows ?? []) {
        const email = (cart.email || "").trim().toLowerCase();
        const rawItems = Array.isArray(cart.items) ? (cart.items as Array<{ id?: string; q?: number }>) : [];
        if (!email || rawItems.length === 0) { stat.skipped++; continue; }

        // Regla dura: si el correo YA COMPRÓ (cualquier producto/pasarela), no
        // recibe nunca correos de carrito abandonado — antes seguían llegando y
        // los clientes los marcaban como spam.
        const buyers = await getPurchasedEmails(admin, [email]);
        if (buyers.has(email)) {
          await admin.from("persistent_carts").update({ converted: true }).eq("email", email);
          stat.skipped++;
          continue;
        }

        // Filter out SKUs the buyer already purchased (manual/hotmart/digital sends).
        // This is the fix for "cliente compró 1,000 palabras y aun así recibió
        // recordatorio de 1,000 palabras". If nothing remains, mark cart converted.
        const purchased = await getPurchasedSkus(admin, email);
        const items = rawItems.filter((it) => it?.id && !purchased.has(String(it.id).toLowerCase()));
        if (items.length === 0) {
          await admin.from("persistent_carts").update({ converted: true }).eq("email", email);
          stat.skipped++;
          continue;
        }

        // OPT-OUT / SUPPRESSION: respetar baja de marketing y bounces.
        // Bloquea envío si el email está en suppressed_emails (unsubscribe,
        // bounce, complaint) o marcado como opt-out en email_contacts.
        const { data: suppressed } = await admin
          .from("suppressed_emails")
          .select("reason")
          .eq("email", email)
          .limit(1)
          .maybeSingle();
        if (suppressed) { stat.skipped++; continue; }

        const { data: contact } = await admin
          .from("email_contacts")
          .select("metadata")
          .eq("email", email)
          .limit(1)
          .maybeSingle();
        const meta = (contact?.metadata || {}) as Record<string, unknown>;
        if (meta.unsubscribed === true || meta.marketing_opt_in === false) {
          stat.skipped++; continue;
        }

        // FRECUENCIA: máximo 1 email de carrito abandonado por ventana.
        // Ventanas: 30 min → 1 en últimas 25 min; 1 día → 1 en últimas 20 h;
        // 5 días → 1 en últimos 4 días. Además, throttle global de 24h
        // entre correos de recuperación aunque se disparen distintos steps.
        const windowMs: Record<Step, number> = {
          30: 25 * 60 * 1000,
          1440: 20 * 3600 * 1000,
          7200: 4 * 24 * 3600 * 1000,
          21600: 10 * 24 * 3600 * 1000,
          43200: 10 * 24 * 3600 * 1000,
        };
        // NOTA: la tabla usa `sent_at` (no `created_at`); usar la columna
        // equivocada hacía que estos filtros fallaran y se desactivara el
        // control de frecuencia (riesgo de correos repetidos).
        const sinceWindow = new Date(Date.now() - windowMs[step]).toISOString();
        const { count: windowCount } = await admin
          .from("cart_reminder_sends")
          .select("id", { count: "exact", head: true })
          .eq("email", email)
          .eq("step", step)
          .eq("status", "sent")
          .gte("sent_at", sinceWindow);
        if ((windowCount ?? 0) > 0) { stat.skipped++; continue; }

        const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const { count: recentCount } = await admin
          .from("cart_reminder_sends")
          .select("id", { count: "exact", head: true })
          .eq("email", email)
          .eq("status", "sent")
          .gte("sent_at", since24h);
        if ((recentCount ?? 0) > 0) { stat.skipped++; continue; }

        // ATOMIC CLAIM: sentinel row per (email, step) using the existing
        // UNIQUE(email, product_sku, step) constraint. If another cron already
        // claimed this (email, step), the upsert is a no-op and we skip.
        const { data: claimed } = await admin
          .from("cart_reminder_sends")
          .upsert([{
            email,
            product_sku: "__CART__",
            origin: "tienda",
            step,
            status: "pending",
          }], { onConflict: "email,product_sku,step", ignoreDuplicates: true })
          .select("id");
        if (!claimed || claimed.length === 0) { stat.skipped++; continue; }

        // Resolve product names for a nicer email body.
        const skus = items.map((it) => String(it.id)).filter(Boolean).slice(0, 20);
        const { data: products } = await admin
          .from("digital_products")
          .select("sku, name, hotmart_url")
          .in("sku", skus);
        const bySku = new Map<string, { name: string; hotmart_url?: string | null }>();
        for (const p of products ?? []) {
          bySku.set(p.sku, { name: p.name, hotmart_url: (p as { hotmart_url?: string | null }).hotmart_url });
        }

        const cartToken = cart.cart_token as string | undefined;
        const recoverUrl = cartToken
          ? `${SITE}/recuperar-carrito?t=${encodeURIComponent(cartToken)}`
          : `${SITE}/checkouts/${encodeURIComponent(skus[0] || "")}?recover=${encodeURIComponent(email)}`;

        const products_list: ProductItem[] = skus.map((sku) => {
          const info = bySku.get(sku);
          const hotmart = info?.hotmart_url || "";
          return {
            name: info?.name || sku,
            // Single recovery link for ALL products; per-product Hotmart still available for legacy.
            ctaUrl: hotmart || recoverUrl,
            origin: hotmart ? "hotmart" : "tienda",
          };
        });

        if (dryRun) { stat.sent++; continue; }

        const buyer = (cart.buyer || {}) as { name?: string };
        const name = buyer.name || undefined;
        const coupon = step === 7200 ? "NEW10" : undefined;

        const html = buildHtml({ name, products: products_list, step, coupon, primaryCta: recoverUrl });

        const sendRes = await sendEmail({
          to: email,
          subject: SUBJECTS_ES[step],
          html,
          replyTo: "hola@ilinguerelax.com",
        });

        await admin
          .from("cart_reminder_sends")
          .update({
            status: sendRes.error ? "failed" : "sent",
            error: sendRes.error ? (sendRes.error.message?.slice(0, 500) || null) : null,
            cart_url: recoverUrl,
          })
          .eq("email", email).eq("step", step).eq("product_sku", "__CART__");

        if (sendRes.error) stat.errors++; else stat.sent++;
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
