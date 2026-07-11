import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { resend } from "../_shared/brevo.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  customerEmail: string;
  customerName?: string;
  orderId?: string;
  skus: string[];
  idempotencyKey?: string;
  force?: boolean;
}

interface Bonus { name?: string | null; drive_url?: string | null; access_key?: string | null }
interface Product {
  sku: string;
  name: string | null;
  drive_url: string | null;
  access_key: string | null;
  bonus_name: string | null;
  bonus_drive_url: string | null;
  bonus_access_key: string | null;
  bonuses: Bonus[] | null;
  cover_image_url: string | null;
}

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!
  ));

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { customerEmail, customerName, orderId, skus, idempotencyKey, force }: Body = await req.json();
    if (!customerEmail || !Array.isArray(skus) || skus.length === 0) {
      return new Response(JSON.stringify({ error: "customerEmail and skus required" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Idempotency: same order+email+skus should send at most once unless force=true
    const idemKey = idempotencyKey
      || `digital:${(orderId || customerEmail).toLowerCase()}:${[...skus].sort().join(",")}`;

    if (!force) {
      const { data: existing } = await supabase
        .from("digital_email_sends")
        .select("id, created_at")
        .eq("idempotency_key", idemKey)
        .maybeSingle();
      if (existing) {
        console.log("send-digital-ilinguerelax: duplicate skipped", idemKey);
        return new Response(JSON.stringify({ success: true, duplicate: true, sentAt: existing.created_at }), {
          status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    const { data, error } = await supabase
      .from("digital_products")
      .select("sku,name,drive_url,access_key,bonus_name,bonus_drive_url,bonus_access_key,bonuses,cover_image_url")
      .in("sku", skus);
    if (error) throw error;

    const products = (data ?? []) as Product[];
    if (products.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "no products found" }), {
        status: 404, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const firstName = (customerName || "there").split(" ")[0];
    const orderRef = orderId ? esc(orderId) : "";

    const productBlocks = products.map((p) => {
      const bonusList: Bonus[] = [
        ...(p.bonus_drive_url ? [{ name: p.bonus_name || "Bonus", drive_url: p.bonus_drive_url, access_key: p.bonus_access_key }] : []),
        ...((p.bonuses ?? []).filter((b) => b && b.drive_url)),
      ];
      const mainBtn = p.drive_url
        ? `<a href="${esc(p.drive_url)}" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:14px;">⬇ Descargar / Ver en Drive</a>`
        : `<span style="color:#6b7280;font-size:13px;">Te enviaremos el enlace en unos minutos.</span>`;
      const keyLine = p.access_key
        ? `<div style="margin-top:10px;font-size:13px;color:#374151;"><strong>Clave de acceso:</strong> <code style="background:#f3f4f6;padding:3px 8px;border-radius:4px;font-family:monospace;">${esc(p.access_key)}</code></div>`
        : "";
      const bonusHtml = bonusList.length
        ? `<div style="margin-top:14px;padding-top:14px;border-top:1px dashed #e5e7eb;">
            <div style="font-size:12px;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">🎁 Bonos incluidos</div>
            ${bonusList.map((b, i) => `
              <div style="margin:6px 0;font-size:13px;color:#374151;">
                <strong>${esc(b.name || `Bonus ${i + 1}`)}:</strong>
                <a href="${esc(b.drive_url)}" style="color:#10b981;text-decoration:underline;">Descargar</a>
                ${b.access_key ? ` · Clave: <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-family:monospace;">${esc(b.access_key)}</code>` : ""}
              </div>`).join("")}
          </div>`
        : "";
      return `
        <div style="border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin:14px 0;background:#ffffff;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            ${p.cover_image_url ? `<img src="${esc(p.cover_image_url)}" alt="" width="56" height="56" style="border-radius:8px;object-fit:cover;">` : ""}
            <div style="font-size:16px;font-weight:700;color:#111827;">${esc(p.name || p.sku)}</div>
          </div>
          ${mainBtn}
          ${keyLine}
          ${bonusHtml}
        </div>`;
    }).join("");

    const hasMultiple = products.length > 1;
    const productWord = hasMultiple ? "productos" : "producto";
    const intro = hasMultiple
      ? `Gracias por confiar en iLingue Relax. Tu compra incluye <strong>${products.length} ${productWord}</strong> (producto principal + adicional). Abajo tienes el enlace de descarga de cada uno.`
      : `Gracias por confiar en iLingue Relax. Aquí tienes el enlace de descarga de tu producto.`;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Tahoma,sans-serif;margin:0;padding:0;background:#f4f4f5;">
  <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
    <div style="background:linear-gradient(135deg,#0ea5e9 0%,#10b981 100%);border-radius:16px 16px 0 0;padding:36px;text-align:center;">
      <div style="font-size:44px;line-height:1;">🎉</div>
      <h1 style="color:#fff;margin:12px 0 0;font-size:26px;">¡Gracias por su compra, ${esc(firstName)}!</h1>
      <p style="color:rgba(255,255,255,.9);margin:10px 0 0;font-size:14px;">Aquí están tus enlaces de descarga</p>
      ${orderRef ? `<p style="color:rgba(255,255,255,.85);margin:10px 0 0;font-size:12px;letter-spacing:1px;">Orden ${orderRef}</p>` : ""}
    </div>
    <div style="background:#fafafa;padding:24px;border-radius:0 0 16px 16px;box-shadow:0 4px 6px rgba(0,0,0,.08);">
      <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 12px;">${intro}</p>

      <div style="background:#eff6ff;border-left:4px solid #0ea5e9;border-radius:8px;padding:14px 18px;margin:0 0 18px;font-size:13px;color:#1e40af;line-height:1.6;">
        📖 <strong>Cómo descargar${hasMultiple ? " cada producto" : ""}:</strong>
        <ol style="margin:8px 0 0;padding-left:20px;">
          <li>Haz clic en el botón verde <strong>"Descargar / Ver en Drive"</strong> de cada producto.</li>
          <li>Se abrirá Google Drive → pulsa el ícono ⬇ arriba a la derecha para guardar el PDF.</li>
          <li>Si el producto pide una <strong>clave de acceso</strong>, cópiala del email.</li>
          ${hasMultiple ? `<li>Repite el paso 1 con el <strong>producto adicional (upsell)</strong> que aparece más abajo — cada uno tiene su propio enlace y clave.</li>` : ""}
        </ol>
      </div>

      ${productBlocks}

      <div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:8px;padding:14px 18px;margin:20px 0;font-size:13px;color:#78350f;">
        💡 <strong>Consejo:</strong> guarda los PDFs en tu teléfono o computadora para tenerlos siempre disponibles, incluso sin internet.
      </div>
      <div style="text-align:center;margin:20px 0 0;">
        <a href="https://wa.me/15752160934" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;">💬 ¿Problemas con la descarga? Escríbenos</a>
      </div>
      <p style="font-size:12px;color:#6b7280;text-align:center;margin:20px 0 0;">
        Guarda este email — contiene tus enlaces permanentes.
      </p>
    </div>
    <div style="text-align:center;padding:20px;color:#9ca3af;font-size:12px;">
      © ${new Date().getFullYear()} iLingue Relax
    </div>
  </div>
</body></html>`;

    const r = await resend.emails.send({
      from: "iLingue Relax <hola@ilinguerelax.com>",
      to: [customerEmail],
      subject: `🎉 Gracias por su compra ${orderRef ? `— ${orderRef}` : ""} · enlaces de descarga${hasMultiple ? " (incluye producto adicional)" : ""}`,
      html,
    });

    if (r.error) {
      console.error("send-digital-ilinguerelax failed", r.error);
      return new Response(JSON.stringify({ success: false, error: r.error }), {
        status: 502, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Record send for idempotency (upsert so force=true still deduplicates future retries)
    await supabase
      .from("digital_email_sends")
      .upsert({
        idempotency_key: idemKey,
        order_id: orderId || null,
        customer_email: customerEmail,
        skus,
        message_id: r.data?.messageId || r.data?.id || null,
        provider: r.data?.provider || null,
        status: "sent",
        last_event: "sent",
        last_event_at: new Date().toISOString(),
      }, { onConflict: "idempotency_key" });

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
