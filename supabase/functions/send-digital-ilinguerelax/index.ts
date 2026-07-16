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
  lang?: string;
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
  learner_language: string | null;
  target_language: string | null;
}

// ---------- i18n ----------
type Lang = "es" | "en" | "fr" | "pt";
const SUPPORTED: Lang[] = ["es", "en", "fr", "pt"];

const FALLBACK_COUNTRY_LANG: Record<string, Lang> = {
  ES: "es", MX: "es", AR: "es", CL: "es", CO: "es", PE: "es", VE: "es", UY: "es",
  BO: "es", EC: "es", PY: "es", CR: "es", PA: "es", DO: "es", GT: "es", HN: "es",
  NI: "es", SV: "es", CU: "es", PR: "es",
  US: "en", CA: "en", GB: "en", AU: "en", NZ: "en", IE: "en", IN: "en", ZA: "en",
  PH: "en", SG: "en",
  FR: "fr", BE: "fr", CH: "fr", LU: "fr", MC: "fr", SN: "fr", CI: "fr", CM: "fr",
  BR: "pt", PT: "pt", AO: "pt", MZ: "pt",
};

const T: Record<Lang, {
  subject: (ref: string, multi: boolean) => string;
  headline: (name: string) => string;
  introSingle: string;
  introMulti: (n: number) => string;
  preheader: (ref: string) => string;
  stepsTitle: (multi: boolean) => string;
  step1: string; step2: string; step3: string; step4: string;
  downloadBtn: string;
  keyLabel: string;
  bonusesTitle: string;
  bonusFallback: (n: number) => string;
  noBonuses: string;
  categoryLabel: string;
  pending: string;
  tip: string;
}> = {
  es: {
    subject: (ref, multi) => `Gracias por tu compra${ref ? ` — ${ref}` : ""} · enlaces de descarga${multi ? " (incluye producto adicional)" : ""}`,
    headline: (n) => `¡Gracias por tu compra, ${n}! 🎉`,
    introSingle: `Aquí tienes el enlace de descarga de tu producto.`,
    introMulti: (n) => `Tu compra incluye <strong>${n} productos</strong> (principal + adicional). Abajo tienes el enlace de descarga y la clave de cada uno.`,
    preheader: (ref) => `Enlaces de descarga de tu compra ${ref}`,
    stepsTitle: (m) => `📖 <strong>Cómo descargar${m ? " cada producto" : ""}:</strong>`,
    step1: `Haz clic en <strong>"Descargar / Ver en Drive"</strong> de cada producto.`,
    step2: `Se abrirá Google Drive → pulsa ⬇ arriba a la derecha para guardar el PDF.`,
    step3: `Si el producto pide una <strong>clave de acceso</strong>, cópiala del email.`,
    step4: `Repite con el <strong>producto adicional</strong> — cada uno tiene su propio enlace y clave.`,
    downloadBtn: `⬇ Descargar / Ver en Drive`,
    keyLabel: `Clave de acceso`,
    bonusesTitle: `🎁 Bonos incluidos`,
    bonusFallback: (n) => `Bono #${n}`,
    noBonuses: `Sin bonos adicionales para este producto.`,
    categoryLabel: `Categoría`,
    pending: `Te enviaremos el enlace en unos minutos.`,
    tip: `💡 <strong>Consejo:</strong> guarda los PDFs en tu teléfono o computadora para tenerlos siempre disponibles, incluso sin internet.`,
  },
  en: {
    subject: (ref, multi) => `Thanks for your purchase${ref ? ` — ${ref}` : ""} · download links${multi ? " (includes bonus product)" : ""}`,
    headline: (n) => `Thanks for your purchase, ${n}! 🎉`,
    introSingle: `Here is the download link for your product.`,
    introMulti: (n) => `Your order includes <strong>${n} products</strong> (main + extra). Below are the download link and access key for each.`,
    preheader: (ref) => `Download links for your order ${ref}`,
    stepsTitle: (m) => `📖 <strong>How to download${m ? " each product" : ""}:</strong>`,
    step1: `Click <strong>"Download / Open in Drive"</strong> on each product.`,
    step2: `Google Drive opens → tap ⬇ at the top right to save the PDF.`,
    step3: `If the product asks for an <strong>access key</strong>, copy it from this email.`,
    step4: `Repeat for the <strong>extra product</strong> — each one has its own link and key.`,
    downloadBtn: `⬇ Download / Open in Drive`,
    keyLabel: `Access key`,
    bonusesTitle: `🎁 Bonuses included`,
    bonusFallback: (n) => `Bonus #${n}`,
    noBonuses: `No extra bonuses for this product.`,
    categoryLabel: `Category`,
    pending: `We'll send you the link within a few minutes.`,
    tip: `💡 <strong>Tip:</strong> save the PDFs to your phone or computer so you can use them anytime, even offline.`,
  },
  fr: {
    subject: (ref, multi) => `Merci pour votre achat${ref ? ` — ${ref}` : ""} · liens de téléchargement${multi ? " (produit bonus inclus)" : ""}`,
    headline: (n) => `Merci pour votre achat, ${n} ! 🎉`,
    introSingle: `Voici le lien de téléchargement de votre produit.`,
    introMulti: (n) => `Votre commande inclut <strong>${n} produits</strong> (principal + bonus). Vous trouverez ci-dessous le lien et la clé de chacun.`,
    preheader: (ref) => `Liens de téléchargement de votre commande ${ref}`,
    stepsTitle: (m) => `📖 <strong>Comment télécharger${m ? " chaque produit" : ""} :</strong>`,
    step1: `Cliquez sur <strong>« Télécharger / Ouvrir dans Drive »</strong> pour chaque produit.`,
    step2: `Google Drive s'ouvre → appuyez sur ⬇ en haut à droite pour enregistrer le PDF.`,
    step3: `Si le produit demande une <strong>clé d'accès</strong>, copiez-la depuis cet e-mail.`,
    step4: `Répétez pour le <strong>produit supplémentaire</strong> — chacun a son propre lien et clé.`,
    downloadBtn: `⬇ Télécharger / Ouvrir dans Drive`,
    keyLabel: `Clé d'accès`,
    bonusesTitle: `🎁 Bonus inclus`,
    bonusFallback: (n) => `Bonus n°${n}`,
    noBonuses: `Aucun bonus supplémentaire pour ce produit.`,
    categoryLabel: `Catégorie`,
    pending: `Nous vous enverrons le lien dans quelques minutes.`,
    tip: `💡 <strong>Astuce :</strong> enregistrez les PDF sur votre téléphone ou ordinateur pour les avoir toujours à portée de main, même hors ligne.`,
  },
  pt: {
    subject: (ref, multi) => `Obrigado pela sua compra${ref ? ` — ${ref}` : ""} · links de download${multi ? " (inclui produto bônus)" : ""}`,
    headline: (n) => `Obrigado pela sua compra, ${n}! 🎉`,
    introSingle: `Aqui está o link de download do seu produto.`,
    introMulti: (n) => `Seu pedido inclui <strong>${n} produtos</strong> (principal + extra). Abaixo você encontra o link e a chave de cada um.`,
    preheader: (ref) => `Links de download do seu pedido ${ref}`,
    stepsTitle: (m) => `📖 <strong>Como baixar${m ? " cada produto" : ""}:</strong>`,
    step1: `Clique em <strong>"Baixar / Abrir no Drive"</strong> em cada produto.`,
    step2: `O Google Drive vai abrir → toque em ⬇ no canto superior direito para salvar o PDF.`,
    step3: `Se o produto pedir uma <strong>chave de acesso</strong>, copie-a deste e-mail.`,
    step4: `Repita com o <strong>produto adicional</strong> — cada um tem seu próprio link e chave.`,
    downloadBtn: `⬇ Baixar / Abrir no Drive`,
    keyLabel: `Chave de acesso`,
    bonusesTitle: `🎁 Bônus incluídos`,
    bonusFallback: (n) => `Bônus #${n}`,
    noBonuses: `Sem bônus adicionais para este produto.`,
    categoryLabel: `Categoria`,
    pending: `Enviaremos o link em alguns minutos.`,
    tip: `💡 <strong>Dica:</strong> salve os PDFs no seu telefone ou computador para tê-los sempre à mão, mesmo sem internet.`,
  },
};

const LANG_NAME: Record<Lang, Record<string, string>> = {
  es: { es: "Español", en: "Inglés", fr: "Francés", pt: "Portugués", ko: "Coreano", it: "Italiano", de: "Alemán", ja: "Japonés", zh: "Chino" },
  en: { es: "Spanish", en: "English", fr: "French", pt: "Portuguese", ko: "Korean", it: "Italian", de: "German", ja: "Japanese", zh: "Chinese" },
  fr: { es: "Espagnol", en: "Anglais", fr: "Français", pt: "Portugais", ko: "Coréen", it: "Italien", de: "Allemand", ja: "Japonais", zh: "Chinois" },
  pt: { es: "Espanhol", en: "Inglês", fr: "Francês", pt: "Português", ko: "Coreano", it: "Italiano", de: "Alemão", ja: "Japonês", zh: "Chinês" },
};

function langName(code: string | null, lang: Lang): string {
  if (!code) return "";
  const c = code.toLowerCase().slice(0, 2);
  return LANG_NAME[lang][c] || code;
}

async function detectLangFromIP(ip: string): Promise<{ country?: string; lang?: Lang }> {
  try {
    const r = await fetch(`https://ipapi.co/${ip}/json/`, { headers: { "user-agent": "ilinguerelax/1.0" } });
    if (!r.ok) return {};
    const j = await r.json();
    const country = (j?.country_code || j?.country || "").toString().toUpperCase();
    return { country, lang: FALLBACK_COUNTRY_LANG[country] };
  } catch { return {}; }
}

async function resolveLang(
  supabase: ReturnType<typeof createClient>,
  bodyLang: string | undefined,
  country: string | undefined,
  ip: string | undefined,
): Promise<{ lang: Lang; country?: string }> {
  const norm = (v?: string): Lang | undefined => {
    const c = (v || "").toLowerCase().slice(0, 2);
    return SUPPORTED.includes(c as Lang) ? (c as Lang) : undefined;
  };
  const explicit = norm(bodyLang);
  if (explicit) return { lang: explicit, country };

  let cc = (country || "").toUpperCase();
  if (!cc && ip) {
    const geo = await detectLangFromIP(ip);
    if (geo.country) cc = geo.country;
  }
  if (cc) {
    try {
      const { data } = await supabase
        .from("country_language_map")
        .select("language")
        .eq("country_code", cc)
        .maybeSingle();
      const dbLang = norm(data?.language as string | undefined);
      if (dbLang) return { lang: dbLang, country: cc };
    } catch { /* ignore */ }
    const fb = FALLBACK_COUNTRY_LANG[cc];
    if (fb) return { lang: fb, country: cc };
  }
  return { lang: "es", country: cc || undefined };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const source = req.headers.get("x-delivery-source") || "send-digital-ilinguerelax";
  async function writeAudit(row: Record<string, unknown>) {
    try { await supabase.from("digital_delivery_audit").insert({ source, ...row }); }
    catch (e) { console.error("[audit] insert failed", e); }
  }

  try {
    const body: Body = await req.json();
    const { customerEmail, customerName, customerPhone, customerCountry, orderId, skus, amount, currency, provider, idempotencyKey, force } = body;
    const requestedSkus = Array.isArray(skus) ? skus.map((s) => String(s || "")).filter(Boolean) : [];
    let normalizedSkus = normalizeSkus(requestedSkus);
    // DB alias resolution: if any requested/normalized SKU is actually a short alias
    // configured in digital_products.sku_aliases, swap it for the canonical SKU.
    // This lets admins register aliases from /admin/productos/:sku without touching code.
    try {
      const candidates = Array.from(new Set([...requestedSkus, ...normalizedSkus].map((s) => s.toLowerCase())));
      if (candidates.length) {
        const { data: aliasRows } = await supabase
          .from("digital_products")
          .select("sku,sku_aliases")
          .overlaps("sku_aliases", candidates);
        if (aliasRows?.length) {
          const aliasMap = new Map<string, string>();
          for (const r of aliasRows as { sku: string; sku_aliases: string[] }[]) {
            for (const a of r.sku_aliases || []) aliasMap.set(a.toLowerCase(), r.sku);
          }
          if (aliasMap.size) {
            const expanded = new Set<string>();
            for (const s of normalizedSkus) expanded.add(aliasMap.get(s.toLowerCase()) || s);
            // Also translate raw requested SKUs that normalizeSkus left untouched.
            for (const s of requestedSkus) {
              const hit = aliasMap.get(s.toLowerCase());
              if (hit) expanded.add(hit);
            }
            normalizedSkus = Array.from(expanded);
          }
        }
      }
    } catch (e) {
      console.warn("[digital-sku] alias lookup failed", e);
    }
    if (!customerEmail || normalizedSkus.length === 0) {
      await writeAudit({
        customer_email: customerEmail || "unknown", customer_name: customerName || null,
        order_id: orderId || null, requested_skus: requestedSkus, normalized_skus: normalizedSkus,
        resolved_skus: [], missing_skus: normalizedSkus, items: [],
        status: "error", error: "customerEmail and skus required", provider: provider || null,
      });
      return new Response(JSON.stringify({ error: "customerEmail and skus required" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const idemKey = idempotencyKey
      || `digital:${(orderId || customerEmail).toLowerCase()}:${[...normalizedSkus].sort().join(",")}`;

    if (!force) {
      const { data: existing } = await supabase
        .from("digital_email_sends")
        .select("id, created_at")
        .eq("idempotency_key", idemKey)
        .maybeSingle();
      if (existing) {
        await writeAudit({
          customer_email: customerEmail, customer_name: customerName || null,
          order_id: orderId || null, idempotency_key: idemKey,
          requested_skus: requestedSkus, normalized_skus: normalizedSkus,
          resolved_skus: [], missing_skus: [], items: [],
          status: "duplicate", provider: provider || null,
        });
        return new Response(JSON.stringify({ success: true, duplicate: true, sentAt: existing.created_at }), {
          status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    const { data, error } = await supabase
      .from("digital_products")
      .select("sku,name,price_usd,drive_url,access_key,bonus_name,bonus_drive_url,bonus_access_key,bonuses,cover_image_url,learner_language,target_language")
      .in("sku", normalizedSkus);
    if (error) throw error;

    const products = (data ?? []) as Product[];
    const resolvedSkus = products.map((p) => p.sku);
    const missingSkus = normalizedSkus.filter((s) => !resolvedSkus.includes(s));
    if (products.length === 0) {
      await writeAudit({
        customer_email: customerEmail, customer_name: customerName || null,
        order_id: orderId || null, idempotency_key: idemKey,
        requested_skus: requestedSkus, normalized_skus: normalizedSkus,
        resolved_skus: [], missing_skus: missingSkus,
        items: missingSkus.map((s) => ({ sku: s, reason: "not_found_in_digital_products" })),
        status: "no_products", error: "no products found", provider: provider || null,
      });
      return new Response(JSON.stringify({ success: false, error: "no products found", missingSkus }), {
        status: 404, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Detect language from body → country → IP
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim()
      || req.headers.get("cf-connecting-ip") || "";
    const { lang, country: resolvedCountry } = await resolveLang(
      supabase, body.lang, customerCountry, ip || undefined,
    );
    const t = T[lang];

    const firstName = (customerName || (lang === "es" ? "amig@" : lang === "fr" ? "ami(e)" : lang === "pt" ? "amig@" : "there")).split(" ")[0];
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
      const catParts: string[] = [];
      if (p.learner_language) catParts.push(langName(p.learner_language, lang));
      if (p.target_language) catParts.push(langName(p.target_language, lang));
      const catLine = catParts.length
        ? `<div style="display:inline-block;margin-top:6px;font-size:11px;font-weight:600;color:${BRAND.primaryDark};background:#ecfdf5;border:1px solid #a7f3d0;border-radius:999px;padding:2px 10px;letter-spacing:.3px;">${escapeHtml(t.categoryLabel)}: ${escapeHtml(catParts.join(" → "))}</div>`
        : "";
      const mainBtn = p.drive_url
        ? `<div style="margin-top:12px;"><a href="${escapeHtml(p.drive_url)}" style="display:inline-block;background:${BRAND.primary};color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;font-size:14px;">${escapeHtml(t.downloadBtn)}</a></div>`
        : `<div style="margin-top:10px;color:${BRAND.muted};font-size:13px;">${escapeHtml(t.pending)}</div>`;
      const keyLine = p.access_key
        ? `<div style="margin-top:10px;font-size:13px;color:#374151;"><strong>${escapeHtml(t.keyLabel)}:</strong> <code style="background:#f3f4f6;padding:3px 8px;border-radius:4px;font-family:monospace;">${escapeHtml(p.access_key)}</code></div>`
        : "";
      const bonusHtml = bonusList.length
        ? `<div style="margin-top:14px;padding-top:14px;border-top:1px dashed ${BRAND.border};">
            <div style="font-size:11px;font-weight:bold;color:#166534;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">${t.bonusesTitle}</div>
            ${bonusList.map((b, i) => `
              <div style="margin:6px 0;font-size:13px;color:#374151;">
                <strong>${escapeHtml(b.name || `Bonus ${i + 1}`)}:</strong>
                <a href="${escapeHtml(b.drive_url)}" style="color:${BRAND.primary};text-decoration:underline;">${escapeHtml(t.downloadBtn.replace(/^⬇\s*/, ""))}</a>
                ${b.access_key ? ` · ${escapeHtml(t.keyLabel)}: <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-family:monospace;">${escapeHtml(b.access_key)}</code>` : ""}
              </div>`).join("")}
          </div>`
        : `<div style="margin-top:12px;font-size:12px;color:${BRAND.muted};font-style:italic;">${escapeHtml(t.noBonuses)}</div>`;
      return `
        <div style="border:1px solid ${BRAND.border};border-radius:12px;padding:20px;margin:14px 0;background:${BRAND.bg};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            ${p.cover_image_url ? `<td width="72" valign="top" style="padding-right:12px;"><img src="${escapeHtml(p.cover_image_url)}" alt="" width="64" height="64" style="border-radius:8px;object-fit:cover;display:block;"></td>` : ""}
            <td valign="top">
              <div style="font-size:16px;font-weight:bold;color:${BRAND.text};">${escapeHtml(p.name || p.sku)}</div>
              ${priceLine}
              ${catLine}
            </td>
          </tr></table>
          ${mainBtn}
          ${keyLine}
          ${bonusHtml}
        </div>`;
    }).join("");

    const intro = hasMultiple ? t.introMulti(products.length) : t.introSingle;

    const stepsHtml = `<div style="background:#eff6ff;border-left:4px solid #0ea5e9;border-radius:8px;padding:14px 18px;margin:0 0 18px;font-size:13px;color:#1e40af;line-height:1.6;">
      ${t.stepsTitle(hasMultiple)}
      <ol style="margin:8px 0 0;padding-left:20px;">
        <li>${t.step1}</li>
        <li>${t.step2}</li>
        <li>${t.step3}</li>
        ${hasMultiple ? `<li>${t.step4}</li>` : ""}
      </ol>
    </div>`;

    const tipHtml = `<div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:8px;padding:14px 18px;margin:20px 0;font-size:13px;color:#78350f;">
      ${t.tip}
    </div>`;

    const html = renderBrandedEmail({
      preheader: t.preheader(orderRef),
      headline: t.headline(escapeHtml(firstName)),
      orderNumber: orderRef || undefined,
      intro,
      bodyHtml: `${stepsHtml}${productBlocks}${tipHtml}`,
      lang,
    });

    const r = await resend.emails.send({
      from: `iLingue Relax <${BRAND.supportEmail}>`,
      to: [customerEmail],
      reply_to: BRAND.supportEmail,
      subject: t.subject(orderRef, hasMultiple),
      html,
    });

    const itemsAudit = products.map((p) => {
      const bonuses: Bonus[] = [
        ...(p.bonus_drive_url ? [{ name: p.bonus_name || "Bonus", drive_url: p.bonus_drive_url, access_key: p.bonus_access_key }] : []),
        ...((p.bonuses ?? []).filter((b) => b && b.drive_url)),
      ];
      return {
        sku: p.sku,
        name: p.name,
        drive_url: p.drive_url,
        drive_missing_reason: p.drive_url ? null : "no_drive_url_configured",
        access_key_present: !!p.access_key,
        bonuses: bonuses.map((b) => ({ name: b.name, drive_url: b.drive_url, has_key: !!b.access_key })),
        bonus_count: bonuses.length,
      };
    });
    const auditBase = {
      customer_email: customerEmail, customer_name: customerName || null,
      order_id: orderId || null, idempotency_key: idemKey,
      requested_skus: requestedSkus, normalized_skus: normalizedSkus,
      resolved_skus: resolvedSkus, missing_skus: missingSkus,
      items: itemsAudit, provider: provider || null, lang, country: customerCountry || resolvedCountry || null,
    };

    if (r.error) {
      console.error("send-digital-ilinguerelax failed", r.error);
      await writeAudit({ ...auditBase, status: "error", error: JSON.stringify(r.error) });
      return new Response(JSON.stringify({ success: false, error: r.error }), {
        status: 502, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const messageId = r.data?.messageId || r.data?.id || null;
    await supabase
      .from("digital_email_sends")
      .upsert({
        idempotency_key: idemKey,
        order_id: orderId || null,
        customer_email: customerEmail,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        customer_country: customerCountry || resolvedCountry || null,
        amount: typeof amount === "number" ? amount : (amount ? Number(amount) : null),
        currency: currency || null,
        skus: normalizedSkus,
        message_id: messageId,
        provider: provider || r.data?.provider || null,
        status: "sent",
        last_event: "sent",
        last_event_at: new Date().toISOString(),
      }, { onConflict: "idempotency_key" });

    await writeAudit({
      ...auditBase,
      status: missingSkus.length > 0 ? "partial" : "sent",
      message_id: messageId,
    });


    // Sync buyer to Brevo "Clientes iLingue Relax" list. Runs after the email
    // to avoid blocking delivery if Brevo is slow; failures only log.
    try {
      const categories = Array.from(new Set(
        products.flatMap((p) => [p.learner_language, p.target_language].filter(Boolean) as string[])
      ));
      await upsertBrevoContact({
        email: customerEmail,
        name: customerName,
        phone: customerPhone,
        country: customerCountry || resolvedCountry,
        productName: products.map((p) => p.name).filter(Boolean).join(" + "),
        skus: normalizedSkus,
        amount,
        currency,
        orderNumber: orderId,
        provider,
        // best-effort extra attrs — brevoContact will ignore unknown keys
        ...(categories.length ? { categories, language: lang } as Record<string, unknown> : { language: lang } as Record<string, unknown>),
      } as Parameters<typeof upsertBrevoContact>[0]);
    } catch (e) {
      console.error("[send-digital-ilinguerelax] brevo upsert failed", e);
    }

    return new Response(JSON.stringify({ success: true, sent: products.length, lang, country: resolvedCountry, result: r }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("send-digital-ilinguerelax error:", msg);
    await writeAudit({
      customer_email: "unknown", requested_skus: [], normalized_skus: [], resolved_skus: [], missing_skus: [],
      items: [], status: "error", error: msg,
    });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
