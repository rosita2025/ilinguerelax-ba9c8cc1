import { assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { upsertBrevoContact } from "../_shared/brevoContact.ts";
import { markAbandonedCartConverted, sendThankYouEmail } from "../_shared/thankYouEmail.ts";
import { normalizeSku } from "../_shared/digitalSku.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type BonusRow = { name?: string | null; drive_url?: string | null; access_key?: string | null };

type ProductRow = {
  sku: string;
  name: string;
  drive_url: string | null;
  access_key: string | null;
  bonuses: BonusRow[] | null;
  bonus_name: string | null;
  bonus_drive_url: string | null;
  bonus_access_key: string | null;
};

// Resuelve materiales digitales leyendo la tabla `digital_products`.
// Estrategia segura: SKU exacto primero; nombre solo como fallback estricto.
async function resolveMaterials(
  admin: any,
  items: Array<{ name?: string; sku?: string }> = []
) {
  if (!items.length) return { materials: [], missing: [] };
  const { data: products } = await admin
    .from("digital_products")
    .select("sku, name, drive_url, access_key, bonuses, bonus_name, bonus_drive_url, bonus_access_key, sku_aliases")
    .eq("active", true);
  if (!products) return { materials: [], missing: items.map((i) => i?.sku || i?.name || "producto sin identificar") };
  const rows = products as (ProductRow & { sku_aliases?: string[] | null })[];

  // Normaliza para comparar nombres sin puntuación/acentos y con espacios
  // colapsados. Antes fallaba con "Patrones Especiales, Alfabeto…" porque la
  // coma rompía el match por prefijo ("patrones especiales " vs "patrones especiales,").
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const out: Array<{ productName: string; downloadUrl: string; accessKey?: string }> = [];
  const missing: string[] = [];
  const seen = new Set<string>();

  for (const it of items) {
    const rawSku = (it?.sku || "").toString().toLowerCase();
    const skuHint = (normalizeSku(rawSku) || rawSku).toLowerCase();
    const nameHint = norm(it?.name || "");
    if (!skuHint && !nameHint) continue;

    // 1) SKU exacto
    let hit = skuHint
      ? rows.find((p) => p.sku.toLowerCase() === skuHint)
      : undefined;

    // 2) SKU dentro de sku_aliases
    if (!hit && skuHint) {
      hit = rows.find((p) => (p.sku_aliases || []).some((a) => (a || "").toLowerCase() === skuHint));
    }

    // 3) Nombre normalizado: prefijo de 3 palabras (>=8 chars) sin puntuación.
    if (!hit && nameHint) {
      hit = rows.find((p) => {
        const prodNorm = norm(p.name);
        const prefix = prodNorm.split(" ").slice(0, 3).join(" ");
        return prefix.length >= 8 && nameHint.startsWith(prefix);
      });
    }


    if (!hit || !hit.drive_url) {
      missing.push(skuHint || nameHint || "producto sin identificar");
      continue;
    }

    if (!seen.has(hit.sku)) {
      seen.add(hit.sku);
      out.push({
        productName: hit.name,
        downloadUrl: hit.drive_url,
        accessKey: hit.access_key ?? undefined,
      });
      // Bonos múltiples desde el array `bonuses`; fallback a columnas legacy.
      const bonusList: BonusRow[] = Array.isArray(hit.bonuses) && hit.bonuses.length
        ? hit.bonuses
        : (hit.bonus_drive_url ? [{ name: hit.bonus_name, drive_url: hit.bonus_drive_url, access_key: hit.bonus_access_key }] : []);
      bonusList.forEach((b, idx) => {
        if (!b?.drive_url) return;
        out.push({
          productName: b.name?.trim() || `🎁 Bono ${idx + 1} — ${hit.name}`,
          downloadUrl: b.drive_url,
          accessKey: b.access_key || undefined,
        });
      });
    }
  }
  return { materials: out, missing };
}

async function sendTemplate(admin: any, templateName: string, recipientEmail: string, idempotencyKey: string, templateData: Record<string, unknown>) {
  try {
    const { error } = await admin.functions.invoke("send-transactional-email", {
      body: { templateName, recipientEmail, idempotencyKey, templateData },
    });
    if (error) console.error(`[manual-payments] ${templateName} failed`, error);
  } catch (e) {
    console.error(`[manual-payments] ${templateName} exception`, e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const { action, orderId, adminKey, notes, buyerEmail, buyerName, buyerPhone, buyerCountry } = await req.json();

    const expectedKey = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expectedKey || adminKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "list") {
      const { data, error } = await admin
        .from("manual_payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return new Response(JSON.stringify({ orders: data ?? [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify" && orderId) {
      // Cargar la orden completa para tener los datos del comprador y productos
      const { data: order, error: readErr } = await admin
        .from("manual_payments")
        .select("*")
        .eq("id", orderId)
        .single();
      if (readErr || !order) throw readErr ?? new Error("Order not found");

      const items = Array.isArray(order.items) ? order.items : [];
      const productNames = items.map((i: any) => i?.name).filter(Boolean).join(" + ") || "Tu pedido ILINGUE RELAX";
      const { materials, missing } = await resolveMaterials(admin, items);
      if (materials.length === 0 || missing.length > 0) {
        return new Response(JSON.stringify({
          success: false,
          error: "MATERIAL_NOT_CONFIGURED",
          message: "Falta configurar el enlace Drive del producto comprado. No se envió correo digital automático.",
          missing,
        }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Marcar como verificada solo cuando los materiales están resueltos.
      const { error: updErr } = await admin
        .from("manual_payments")
        .update({
          status: "verified",
          verified_at: new Date().toISOString(),
          verified_by: "admin",
          notes: notes ?? order.notes ?? null,
        })
        .eq("id", orderId);
      if (updErr) throw updErr;

      // Disparar emails y sincronizaciones en paralelo, sin bloquear la respuesta
      // (EdgeRuntime.waitUntil los mantiene vivos tras el 200). Antes tardaba
      // 3-5s porque se ejecutaban en secuencia con await.
      // Enviamos "Gracias por tu compra" (con precio y productos) + entrega
      // digital de materiales. El "Recibimos tu pedido" ya se envió al crear
      // el pedido, así que el cliente recibe 3 correos: pendiente → gracias
      // → materiales.
      const bg = Promise.allSettled([
        sendThankYouEmail({
          customerEmail: order.buyer_email,
          customerName: order.buyer_name,
          customerPhone: order.buyer_phone,
          customerCountry: order.buyer_country,
          productName: productNames,
          skus: items.map((i: any) => i?.sku).filter(Boolean),
          amount: Number(order.amount_local ?? order.amount_usd),
          currency: order.currency_local || "USD",
          provider: order.method || "yape_plin",
          orderNumber: order.order_number,
          idempotencyKey: `manual-thankyou-${order.order_number}`,
        }),
        sendTemplate(admin, "material-delivery", order.buyer_email, `manual-material-${order.order_number}`, {
          customerName: order.buyer_name,
          orderNumber: order.order_number,
          materials,
        }),
        upsertBrevoContact({
          email: order.buyer_email,
          name: order.buyer_name,
          phone: order.buyer_phone,
          country: order.buyer_country,
          productName: productNames,
          skus: items.map((i: any) => i?.sku).filter(Boolean),
          amount: Number(order.amount_local ?? order.amount_usd),
          currency: order.currency_local || "USD",
          orderNumber: order.order_number,
          provider: order.method || "yape_plin",
        }),
        markAbandonedCartConverted(order.buyer_email),
      ]);
      // @ts-expect-error EdgeRuntime is available in Supabase Deno runtime
      if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) EdgeRuntime.waitUntil(bg);

      return new Response(JSON.stringify({ success: true, materialsSent: materials.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    if (action === "reject" && orderId) {
      const { error } = await admin
        .from("manual_payments")
        .update({ status: "rejected", notes: notes ?? null })
        .eq("id", orderId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reset" && orderId) {
      const { error } = await admin
        .from("manual_payments")
        .update({ status: "pending", verified_at: null, verified_by: null })
        .eq("id", orderId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_buyer" && orderId) {
      const patch: Record<string, unknown> = {};
      if (typeof buyerEmail === "string") {
        const em = buyerEmail.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
          return new Response(JSON.stringify({ error: "invalid_email" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        patch.buyer_email = em;
      }
      if (typeof buyerName === "string") patch.buyer_name = buyerName.trim();
      if (typeof buyerPhone === "string") patch.buyer_phone = buyerPhone.trim() || null;
      if (typeof buyerCountry === "string") patch.buyer_country = buyerCountry.trim() || null;
      if (Object.keys(patch).length === 0) {
        return new Response(JSON.stringify({ error: "no_changes" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await admin.from("manual_payments").update(patch).eq("id", orderId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[manage-manual-payments]", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
