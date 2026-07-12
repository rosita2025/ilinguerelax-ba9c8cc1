import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { resend } from "../_shared/brevo.ts";
import { BRAND, escapeHtml, renderBrandedEmail } from "../_shared/emailBrand.ts";
import { upsertBrevoContact } from "../_shared/brevoContact.ts";
import { normalizeSkus } from "../_shared/digitalSku.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  customerCountry?: string;
  orderId?: string;
  skus: string[];
  amount?: number;
  currency?: string;
  provider?: string;
  idempotencyKey?: string;
  force?: boolean;
}


interface Bonus { name?: string | null; drive_url?: string | null; access_key?: string | null }
interface Product {
  sku: string;
  name: string | null;
  price_usd: number | null;
  drive_url: string | null;
  access_key: string | null;
  bonus_name: string | null;
  bonus_drive_url: string | null;
  bonus_access_key: string | null;
  bonuses: Bonus[] | null;
  cover_image_url: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { customerEmail, customerName, customerPhone, customerCountry, orderId, skus, amount, currency, provider, idempotencyKey, force }: Body = await req.json();
    const normalizedSkus = normalizeSkus(Array.isArray(skus) ? skus : []);
    if (!customerEmail || normalizedSkus.length === 0) {
      return new Response(JSON.stringify({ error: "customerEmail and skus required" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const idemKey = idempotencyKey
      || `digital:${(orderId || customerEmail).toLowerCase()}:${[...normalizedSkus].sort().join(",")}`;

    if (!force) {
      const { data: existing } = await supabase
        .from("digital_email_sends")
        .select("id, created_at")
        .eq("idempotency_key", idemKey)
        .maybeSingle();
      if (existing) {
        return new Response(JSON.stringify({ success: true, duplicate: true, sentAt: existing.created_at }), {
          status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    const { data, error } = await supabase
      .from("digital_products")
      .select("sku,name,price_usd,drive_url,access_key,bonus_name,bonus_drive_url,bonus_access_key,bonuses,cover_image_url")
      .in("sku", normalizedSkus);
    if (error) throw error;

    const products = (data ?? []) as Product[];
    if (products.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "no products found" }), {
        status: 404, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const firstName = (customerName || "there").split(" ")[0];
    const orderRef = orderId ? String(orderId) : "";
    const hasMultiple = products.length > 1;

    const productBlocks = products.map((p) => {
      const bonusList: Bonus[] = [
        ...(p.bonus_drive_url ? [{ name: p.bonus_name || "Bonus", drive_url: p.bonus_drive_url, access_key: p.bonus_access_key }] : []),
        ...((p.bonuses ?? []).filter((b) => b && b.drive_url)),
      ];
      const priceLine = p.price_usd
        ? `<div style="font-size:12px;color:${BRAND.muted};margin-top:2px;">USD ${Number(p.price_usd).toFixed(2)}</div>`
        : "";
      const mainBtn = p.drive_url
        ? `<div style="margin-top:12px;"><a href="${escapeHtml(p.drive_url)}" style="display:inline-block;background:${BRAND.primary};color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;font-size:14px;">⬇ Descargar / Ver en Drive</a></div>`
        : `<div style="margin-top:10px;color:${BRAND.muted};font-size:13px;">Te enviaremos el enlace en unos minutos.</div>`;
      const keyLine = p.access_key
        ? `<div style="margin-top:10px;font-size:13px;color:#374151;"><strong>Clave de acceso:</strong> <code style="background:#f3f4f6;padding:3px 8px;border-radius:4px;font-family:monospace;">${escapeHtml(p.access_key)}</code></div>`
        : "";
      const bonusHtml = bonusList.length
        ? `<div style="margin-top:14px;padding-top:14px;border-top:1px dashed ${BRAND.border};">
            <div style="font-size:11px;font-weight:bold;color:#166534;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">🎁 Bonos incluidos</div>
            ${bonusList.map((b, i) => `
              <div style="margin:6px 0;font-size:13px;color:#374151;">
                <strong>${escapeHtml(b.name || `Bonus ${i + 1}`)}:</strong>
                <a href="${escapeHtml(b.drive_url)}" style="color:${BRAND.primary};text-decoration:underline;">Descargar</a>
                ${b.access_key ? ` · Clave: <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-family:monospace;">${escapeHtml(b.access_key)}</code>` : ""}
              </div>`).join("")}
          </div>`
        : `<div style="margin-top:12px;font-size:12px;color:${BRAND.muted};font-style:italic;">Sin bonos adicionales para este producto.</div>`;
      return `
        <div style="border:1px solid ${BRAND.border};border-radius:12px;padding:20px;margin:14px 0;background:${BRAND.bg};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            ${p.cover_image_url ? `<td width="72" valign="top" style="padding-right:12px;"><img src="${escapeHtml(p.cover_image_url)}" alt="" width="64" height="64" style="border-radius:8px;object-fit:cover;display:block;"></td>` : ""}
            <td valign="top">
              <div style="font-size:16px;font-weight:bold;color:${BRAND.text};">${escapeHtml(p.name || p.sku)}</div>
              ${priceLine}
            </td>
          </tr></table>
          ${mainBtn}
          ${keyLine}
          ${bonusHtml}
        </div>`;
    }).join("");

    const intro = hasMultiple
      ? `Tu compra incluye <strong>${products.length} productos</strong> (principal + adicional). Abajo tienes el enlace de descarga y la clave de cada uno.`
      : `Aquí tienes el enlace de descarga de tu producto.`;

    const stepsHtml = `<div style="background:#eff6ff;border-left:4px solid #0ea5e9;border-radius:8px;padding:14px 18px;margin:0 0 18px;font-size:13px;color:#1e40af;line-height:1.6;">
      📖 <strong>Cómo descargar${hasMultiple ? " cada producto" : ""}:</strong>
      <ol style="margin:8px 0 0;padding-left:20px;">
        <li>Haz clic en <strong>"Descargar / Ver en Drive"</strong> de cada producto.</li>
        <li>Se abrirá Google Drive → pulsa ⬇ arriba a la derecha para guardar el PDF.</li>
        <li>Si el producto pide una <strong>clave de acceso</strong>, cópiala del email.</li>
        ${hasMultiple ? `<li>Repite con el <strong>producto adicional</strong> — cada uno tiene su propio enlace y clave.</li>` : ""}
      </ol>
    </div>`;

    const tipHtml = `<div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:8px;padding:14px 18px;margin:20px 0;font-size:13px;color:#78350f;">
      💡 <strong>Consejo:</strong> guarda los PDFs en tu teléfono o computadora para tenerlos siempre disponibles, incluso sin internet.
    </div>`;

    const html = renderBrandedEmail({
      preheader: `Enlaces de descarga de tu compra ${orderRef}`,
      headline: `¡Gracias por tu compra, ${escapeHtml(firstName)}! 🎉`,
      orderNumber: orderRef || undefined,
      intro,
      bodyHtml: `${stepsHtml}${productBlocks}${tipHtml}`,
      lang: "es",
    });

    const r = await resend.emails.send({
      from: `iLingue Relax <${BRAND.supportEmail}>`,
      to: [customerEmail],
      reply_to: BRAND.supportEmail,
      subject: `Gracias por tu compra${orderRef ? ` — ${orderRef}` : ""} · enlaces de descarga${hasMultiple ? " (incluye producto adicional)" : ""}`,
      html,
    });

    if (r.error) {
      console.error("send-digital-ilinguerelax failed", r.error);
      return new Response(JSON.stringify({ success: false, error: r.error }), {
        status: 502, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    await supabase
      .from("digital_email_sends")
      .upsert({
        idempotency_key: idemKey,
        order_id: orderId || null,
        customer_email: customerEmail,
        skus: normalizedSkus,
        message_id: r.data?.messageId || r.data?.id || null,
        provider: provider || r.data?.provider || null,
        status: "sent",
        last_event: "sent",
        last_event_at: new Date().toISOString(),
      }, { onConflict: "idempotency_key" });

    // Sync buyer to Brevo "Clientes iLingue Relax" list. Runs after the email
    // to avoid blocking delivery if Brevo is slow; failures only log.
    try {
      await upsertBrevoContact({
        email: customerEmail,
        name: customerName,
        phone: customerPhone,
        country: customerCountry,
        productName: products.map((p) => p.name).filter(Boolean).join(" + "),
        skus: normalizedSkus,
        amount,
        currency,
        orderNumber: orderId,
        provider,
      });
    } catch (e) {
      console.error("[send-digital-ilinguerelax] brevo upsert failed", e);
    }


    return new Response(JSON.stringify({ success: true, sent: products.length, result: r }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("send-digital-ilinguerelax error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
