import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resend } from "../_shared/brevo.ts";
import {
  BRAND,
  escapeHtml,
  formatLocalFromUsd,
  renderBrandedEmail,
} from "../_shared/emailBrand.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Day 1, Day 7, Day 15, Day 30
const DAY = 24 * 60 * 60 * 1000;
const EMAIL_SCHEDULE = [
  { index: 0, delayMs: 0 },
  { index: 1, delayMs: 6 * DAY },
  { index: 2, delayMs: 8 * DAY },
  { index: 3, delayMs: 15 * DAY },
];
const MAX_EMAILS = EMAIL_SCHEDULE.length;

const SITE_URL = BRAND.siteUrl;
const COUPON_CODE = "NEW10";

// Legacy product_type → SKU fallback map (older carts stored a type, newer ones store the actual SKU)
const PRODUCT_TYPE_TO_SKU: Record<string, string> = {
  english: "5-000-spanish-words-with-english-pronunciation-digital",
  english_5000: "5-000-spanish-words-with-english-pronunciation-digital",
  spanish: "5-000-spanish-words-with-english-pronunciation-digital",
  verbs: "1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion",
  questions: "500-preguntas-en-ingles-con-pronunciacion-para-hispanohablantes",
  coreano: "100-mapas-mentales-para-aprender-coreano-hangul-c1",
  patrones: "patrones-especiales",
};

interface DbProduct {
  sku: string;
  name: string;
  price_usd: number | null;
  cover_image_url: string | null;
}

// Resolve product dynamically for ANY sku stored in abandoned_carts.
// Order: exact sku → legacy alias → fuzzy ilike fallback.
async function fetchProduct(supabase: ReturnType<typeof createClient>, productType: string): Promise<DbProduct | null> {
  const candidates = Array.from(new Set(
    [productType, PRODUCT_TYPE_TO_SKU[productType]].filter(Boolean) as string[]
  ));
  for (const sku of candidates) {
    const { data } = await supabase
      .from("digital_products")
      .select("sku,name,price_usd,cover_image_url")
      .eq("sku", sku)
      .maybeSingle();
    if (data) return data as DbProduct;
  }
  const { data: fuzzy } = await supabase
    .from("digital_products")
    .select("sku,name,price_usd,cover_image_url")
    .ilike("sku", `%${productType}%`)
    .limit(1)
    .maybeSingle();
  return (fuzzy as DbProduct | null) ?? null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = new Date().toISOString();
    const { data: pendingCarts, error } = await supabase
      .from("abandoned_carts")
      .select("*")
      .eq("is_completed", false)
      .eq("converted", false)
      .lte("next_email_at", now)
      .order("next_email_at", { ascending: true })
      .limit(50);

    if (error) throw error;
    if (!pendingCarts || pendingCarts.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    let errors = 0;

    for (const cart of pendingCarts) {
      try {
        const emailIndex = cart.emails_sent;
        if (emailIndex >= MAX_EMAILS) {
          await supabase.from("abandoned_carts").update({ is_completed: true }).eq("id", cart.id);
          continue;
        }
        const { data: fresh } = await supabase
          .from("abandoned_carts")
          .select("converted, is_completed")
          .eq("id", cart.id)
          .maybeSingle();
        if (fresh?.converted || fresh?.is_completed) continue;

        const product = await fetchProduct(supabase, cart.product_type);
        const sku = product?.sku ?? PRODUCT_TYPE_TO_SKU[cart.product_type] ?? cart.product_type;
        const productUrl = `${SITE_URL}/products/${sku}`;
        const productName = product?.name ?? "tu curso iLingue Relax";
        const priceUsd = Number(product?.price_usd ?? 0);
        const localPrice = priceUsd > 0
          ? formatLocalFromUsd(priceUsd, { language: cart.language })
          : "";

        const content = buildContent({
          index: emailIndex,
          firstName: (cart.customer_name || "").split(" ")[0] || "Hola",
          lang: cart.language || "es",
          productName,
          productUrl,
          coverImage: product?.cover_image_url ?? null,
          localPrice,
        });

        const emailResponse = await resend.emails.send({
          from: `iLingue Relax <${BRAND.supportEmail}>`,
          to: [cart.customer_email],
          subject: content.subject,
          html: content.html,
        });
        console.log(`Cart email ${emailIndex + 1}/${MAX_EMAILS} → ${cart.customer_email}`, emailResponse);

        const nextEmailIndex = emailIndex + 1;
        const isLastEmail = nextEmailIndex >= MAX_EMAILS;
        const updateData: Record<string, unknown> = {
          emails_sent: nextEmailIndex,
          last_email_sent_at: now,
          is_completed: isLastEmail,
        };
        if (!isLastEmail) {
          updateData.next_email_at = new Date(Date.now() + (EMAIL_SCHEDULE[nextEmailIndex]?.delayMs || 0)).toISOString();
        }
        await supabase.from("abandoned_carts").update(updateData).eq("id", cart.id);
        processed++;
      } catch (e) {
        console.error(`Cart ${cart.id} error`, e);
        errors++;
      }
    }

    return new Response(JSON.stringify({ processed, errors, total: pendingCarts.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Process error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

interface ContentArgs {
  index: number;
  firstName: string;
  lang: string;
  productName: string;
  productUrl: string;
  coverImage: string | null;
  localPrice: string;
}

function couponBlock(lang: string): string {
  const label = lang === "en"
    ? "Use this coupon at checkout for an extra 10% off:"
    : "Usa este cupón al pagar y obtén un 10% de descuento extra:";
  return `<div style="background:#fff7ed;border:2px dashed ${BRAND.accent};border-radius:12px;padding:16px 20px;margin:20px 0;text-align:center;">
    <div style="font-size:13px;color:#9a3412;margin-bottom:6px;">${label}</div>
    <div style="font-size:26px;font-weight:900;letter-spacing:4px;color:${BRAND.accent};">${COUPON_CODE}</div>
  </div>`;
}

function productCard(name: string, cover: string | null, localPrice: string, lang: string): string {
  const priceLabel = lang === "en" ? "Price" : "Precio";
  return `<div style="border:1px solid ${BRAND.border};border-radius:12px;padding:16px;margin:16px 0;background:${BRAND.soft};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      ${cover ? `<td width="72" valign="top" style="padding-right:12px;"><img src="${escapeHtml(cover)}" alt="" width="64" height="64" style="border-radius:8px;object-fit:cover;display:block;"></td>` : ""}
      <td valign="top">
        <div style="font-size:15px;font-weight:bold;color:${BRAND.text};line-height:1.35;">${escapeHtml(name)}</div>
        ${localPrice ? `<div style="margin-top:6px;font-size:14px;color:${BRAND.primary};font-weight:bold;">${priceLabel}: ${localPrice}</div>` : ""}
      </td>
    </tr></table>
  </div>`;
}

function buildContent(a: ContentArgs): { subject: string; html: string } {
  const isEs = a.lang !== "en";
  const priceInline = a.localPrice ? ` (${a.localPrice})` : "";
  const card = productCard(a.productName, a.coverImage, a.localPrice, a.lang);
  const cta = isEs ? "Completar mi compra →" : "Complete my purchase →";

  const templates = isEs ? [
    {
      subject: `Tu carrito te espera — ${a.productName}`,
      headline: "¡Tu material te está esperando!",
      intro: `Hola ${escapeHtml(a.firstName)}, notamos que estabas por llevar <strong>${escapeHtml(a.productName)}</strong>${priceInline} y no completaste la compra.`,
      body: `${card}<p style="font-size:14px;color:#4b5563;line-height:1.6;">Tu selección sigue disponible. Aprende a tu ritmo, con descarga inmediata en PDF.</p>${couponBlock(a.lang)}`,
      footerNote: "Este cupón puede caducar pronto.",
    },
    {
      subject: `${escapeHtml(a.firstName)}, sigue pendiente tu ${a.productName}`,
      headline: "Por qué miles ya aprenden con nosotros",
      intro: `Ayer viste <strong>${escapeHtml(a.productName)}</strong>${priceInline}. Aquí lo que incluye:`,
      body: `<ul style="color:#4b5563;line-height:1.9;font-size:14px;padding-left:20px;">
        <li>✅ Contenido con pronunciación adaptada</li>
        <li>✅ Bonos gratis incluidos</li>
        <li>✅ Descarga inmediata en PDF</li>
        <li>✅ Actualizaciones de por vida</li>
      </ul>${card}${couponBlock(a.lang)}`,
      footerNote: "Más de 1,200 estudiantes ya confían en el método Relax.",
    },
    {
      subject: `⏰ Última semana con descuento — ${a.productName}`,
      headline: "El tiempo corre",
      intro: `Han pasado varios días desde que viste <strong>${escapeHtml(a.productName)}</strong>${priceInline}. El descuento es por tiempo limitado.`,
      body: `${card}<p style="font-size:14px;color:#4b5563;line-height:1.6;">Solo necesitas 10-15 minutos al día para avanzar. Sin estrés, a tu ritmo.</p>${couponBlock(a.lang)}`,
      footerNote: "Recuerda: incluye bonos gratis.",
    },
    {
      subject: `Un último recordatorio — ${a.productName}`,
      headline: "Un último mensaje para ti",
      intro: `Ha pasado un mes desde que viste <strong>${escapeHtml(a.productName)}</strong>. Este será nuestro último correo — te dejamos un cupón por si algún día decides dar el paso.`,
      body: `${card}${couponBlock(a.lang)}<p style="font-size:14px;color:#4b5563;line-height:1.6;">Cuando estés listo, estaremos aquí para ayudarte. 💜</p>`,
      footerNote: "Este es nuestro último correo sobre este pedido.",
    },
  ] : [
    {
      subject: `Your cart is waiting — ${a.productName}`,
      headline: "Your material is waiting!",
      intro: `Hi ${escapeHtml(a.firstName)}, you were about to get <strong>${escapeHtml(a.productName)}</strong>${priceInline} but didn't finish.`,
      body: `${card}<p style="font-size:14px;color:#4b5563;line-height:1.6;">Learn at your own pace, instant PDF download.</p>${couponBlock(a.lang)}`,
      footerNote: "This coupon may expire soon.",
    },
    {
      subject: `${escapeHtml(a.firstName)}, ${a.productName} is still waiting`,
      headline: "Why thousands already learn with us",
      intro: `Yesterday you checked out <strong>${escapeHtml(a.productName)}</strong>${priceInline}. Here's what's included:`,
      body: `<ul style="color:#4b5563;line-height:1.9;font-size:14px;padding-left:20px;">
        <li>✅ Adapted pronunciation</li>
        <li>✅ Free bonuses included</li>
        <li>✅ Instant PDF download</li>
        <li>✅ Lifetime updates</li>
      </ul>${card}${couponBlock(a.lang)}`,
      footerNote: "Over 1,200 students trust the Relax method.",
    },
    {
      subject: `⏰ Last chance — ${a.productName}`,
      headline: "Time is running out",
      intro: `It's been a few days since you saw <strong>${escapeHtml(a.productName)}</strong>${priceInline}. The discount is limited.`,
      body: `${card}${couponBlock(a.lang)}`,
      footerNote: "Includes free bonuses.",
    },
    {
      subject: `One last reminder — ${a.productName}`,
      headline: "One last message",
      intro: `It's been a month since you saw <strong>${escapeHtml(a.productName)}</strong>. This is our last email — here's a coupon in case you decide to take the step.`,
      body: `${card}${couponBlock(a.lang)}`,
      footerNote: "This is our final email about this order.",
    },
  ];

  const t = templates[a.index] ?? templates[0];
  return {
    subject: t.subject,
    html: renderBrandedEmail({
      preheader: t.intro.replace(/<[^>]+>/g, "").slice(0, 140),
      headline: t.headline,
      intro: t.intro,
      bodyHtml: t.body,
      ctaText: cta,
      ctaUrl: a.productUrl,
      secondaryNote: t.footerNote,
      lang: a.lang,
    }),
  };
}
