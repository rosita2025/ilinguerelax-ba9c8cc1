// Upsell post-compra, genérico por producto y por método de pago.
//  · Fuente de compras: digital_email_sends (toda entrega digital, sea Stripe, dLocal Go,
//    Mercado Pago, Yape/Plin, transferencia/SPEI México, PayPal...) + compras de Hotmart
//    (funnel_events provider=hotmart, aprobadas y no reembolsadas) + getPurchasedSkus()
//    (manual_payments aprobados, funnel_events, carritos convertidos).
//  · Upsells de cada producto: los que el admin configuró en product_upsells (por SKU).
//  · Se ofrecen SOLO los que el cliente aún no tiene:
//      compró sin upsells  → ofrece todos
//      compró 2 de 3       → ofrece el que falta
//      compró todos        → no envía nada
//  · Días 1 y 3 después de la entrega. Un correo por cliente y día. Respeta supresiones.
import { createClient } from "npm:@supabase/supabase-js@2";
import { assertInternalCall, internalCors } from "../_shared/internalAuth.ts";
import { sendInternalEmail } from "../_shared/sendInternalEmail.ts";
import { getPurchasedSkus } from "../_shared/purchasedSkus.ts";
import { normalizeSku } from "../_shared/digitalSku.ts";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...internalCors, "Content-Type": "application/json" } });

const DAY_MS = 24 * 60 * 60 * 1000;
const DAYS = [1, 3] as const;
const MAX_AGE_MS = 6 * DAY_MS;
const GAP_MS = 20 * 60 * 60 * 1000;
const SITE = "https://www.ilinguerelax.com";

// Ids con los que hotmart-purchase-pixel guarda cada producto en funnel_events → SKU real del catálogo.
const HOTMART_SKU: Record<string, string> = {
  "product-5000": "5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa",
  "product-8000": "8-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa",
  "product-spanish-5000": "5-000-spanish-words-with-english-pronunciation-digital",
  "product-1000-verbos": "1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion",
  "product-500-preguntas": "500-preguntas-en-ingles-con-pronunciacion-para-hispanohablantes",
  "product-coreano-100-mapas": "100-mapas-mentales-para-aprender-coreano-hangul-c1",
  "patrones-especiales": "patrones-especiales-alfabeto-combinaciones-secretas-ingles",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: internalCors });
  const blocked = await assertInternalCall(req);
  if (blocked) return blocked;

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const dryRun = new URL(req.url).searchParams.get("dry_run") === "1";
  const result = { checked: 0, sent: 0, wouldSend: [] as unknown[], skippedFullBundle: 0, skippedNoUpsells: 0, skippedNotDue: 0, errors: 0 };

  try {
    // Catálogo: productos activos + upsells configurados por producto.
    const [{ data: prods }, { data: ups }] = await Promise.all([
      supabase.from("digital_products").select("sku, name, sku_aliases, active, learner_language").eq("active", true),
      supabase.from("product_upsells").select("product_sku, upsell_sku, sort_order").order("sort_order", { ascending: true }),
    ]);
    const prodBySku = new Map<string, { sku: string; name: string; aliases: string[]; lang: "es" | "en" | "it" }>();
    for (const p of prods ?? []) {
      // Idioma del público del producto: "en" = angloparlantes que aprenden español;
      // "it" = italianos que aprenden español; los demás mantienen español.
      const lang = String((p as { learner_language?: string | null }).learner_language ?? "").toLowerCase().startsWith("en") ? "en" : String((p as { learner_language?: string | null }).learner_language ?? "").toLowerCase().startsWith("it") ? "it" : "es";
      prodBySku.set(p.sku, { sku: p.sku, name: p.name, aliases: (p.sku_aliases ?? []) as string[], lang });
    }
    const upsellsOf = new Map<string, string[]>();
    for (const u of ups ?? []) {
      if (!prodBySku.has(u.upsell_sku)) continue; // inactivo o inexistente
      const list = upsellsOf.get(u.product_sku) ?? [];
      list.push(u.upsell_sku);
      upsellsOf.set(u.product_sku, list);
    }
    // alias → sku real, para reconocer lo ya comprado aunque venga con alias de carrito.
    const canon = (k: string) => {
      const n = normalizeSku(HOTMART_SKU[String(k).toLowerCase()] ?? k) ?? k;
      for (const p of prodBySku.values()) if (p.sku === n || p.aliases.includes(n) || p.aliases.includes(k)) return p.sku;
      return n;
    };

    const since = new Date(Date.now() - MAX_AGE_MS).toISOString();
    const { data: sends } = await supabase
      .from("digital_email_sends")
      .select("customer_email, customer_name, skus, status, order_id, created_at, provider")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(500);

    // Compras de Hotmart (las entrega Hotmart, no pasan por digital_email_sends):
    // Purchase aprobadas de los últimos días, sin reembolso ni contracargo.
    const { data: hm } = await supabase
      .from("funnel_events")
      .select("email, name, product_id, session_id, event_name, created_at")
      .eq("provider", "hotmart")
      .in("event_name", ["Purchase", "hotmart_refunded", "hotmart_chargeback"])
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(500);
    const reversed = new Set((hm ?? []).filter((r: any) => r.event_name !== "Purchase").map((r: any) => String(r.session_id)));

    // Todas las entregas/compras recientes en una sola lista, ordenadas por fecha.
    const purchases: { email: string; name: string | null; orderId: string | null; at: number; skus: string[] }[] = [];
    for (const s of sends ?? []) {
      if (s.status === "failed") continue;
      purchases.push({
        email: String(s.customer_email || "").trim().toLowerCase(),
        name: s.customer_name ?? null,
        orderId: s.order_id ?? null,
        at: new Date(s.created_at).getTime(),
        skus: (Array.isArray(s.skus) ? s.skus : []).map((k: string) => canon(k)),
      });
    }
    for (const r of hm ?? []) {
      if (r.event_name !== "Purchase" || reversed.has(String(r.session_id))) continue;
      purchases.push({
        email: String(r.email || "").trim().toLowerCase(),
        name: r.name ?? null,
        orderId: r.session_id ?? null,
        at: new Date(r.created_at).getTime(),
        skus: [canon(String(r.product_id || ""))],
      });
    }
    purchases.sort((x, y) => x.at - y.at);

    // Por cliente: primera compra reciente que incluya un producto con upsells configurados.
    const byEmail = new Map<string, { name: string | null; orderId: string | null; at: number; mainSku: string }>();
    for (const pu of purchases) {
      if (!pu.email || byEmail.has(pu.email)) continue;
      const mainSku = pu.skus.find((k: string) => upsellsOf.has(k));
      if (!mainSku) continue;
      byEmail.set(pu.email, { name: pu.name, orderId: pu.orderId, at: pu.at, mainSku });
    }

    for (const [email, info] of byEmail) {
      result.checked++;
      const age = Date.now() - info.at;
      const day = [...DAYS].reverse().find((d) => age >= d * DAY_MS);
      if (!day) { result.skippedNotDue++; continue; }

      const configured = upsellsOf.get(info.mainSku) ?? [];
      if (configured.length === 0) { result.skippedNoUpsells++; continue; }

      // Lo que ya tiene (todas las compras históricas, cualquier método de pago).
      const owned = new Set([...(await getPurchasedSkus(supabase, email))].map(canon));
      // Nunca ofrecer el mismo producto que originó el correo, ni nada que ya tenga.
      const pending = configured.filter((k) => k !== info.mainSku && !owned.has(k));
      if (pending.length === 0) { result.skippedFullBundle++; continue; }

      const { data: prev } = await supabase
        .from("postpurchase_upsell_sends")
        .select("day, sent_at")
        .eq("customer_email", email).eq("source_sku", info.mainSku);
      if ((prev ?? []).some((p: any) => p.day === day)) continue;
      const lastSent = Math.max(0, ...(prev ?? []).map((p: any) => (p.sent_at ? new Date(p.sent_at).getTime() : 0)));
      if (lastSent && Date.now() - lastSent < GAP_MS) continue;

      const offers = pending.map((k) => ({
        name: prodBySku.get(k)!.name,
        url: `${SITE}/products/${k}?utm_source=email&utm_medium=postpurchase&utm_campaign=upsell-d${day}`,
      }));

      if (dryRun) {
        result.wouldSend.push({ email, day, main: info.mainSku, lang: prodBySku.get(info.mainSku)?.lang ?? "es", offers: pending });
        continue;
      }

      const { error: claimErr } = await supabase.from("postpurchase_upsell_sends").insert({
        customer_email: email, source_sku: info.mainSku, offered_skus: pending, day, source_order_id: info.orderId,
      });
      if (claimErr) continue;

      const { error } = await sendInternalEmail({
        templateName: "postpurchase-upsell",
        recipientEmail: email,
        idempotencyKey: `postpurchase-upsell-${email}-${info.mainSku}-d${day}`,
        templateData: {
          customerName: (info.name || "").split(" ")[0] || "",
          sourceName: prodBySku.get(info.mainSku)?.name ?? "",
          lang: prodBySku.get(info.mainSku)?.lang ?? "es",
          offers, day,
        },
      });

      if (error) {
        result.errors++;
        console.error(`[postpurchase-upsell] falló ${email} d${day}:`, error.message);
        // Liberamos la reserva para que el siguiente ciclo (3 h) lo reintente.
        await supabase.from("postpurchase_upsell_sends").delete()
          .eq("customer_email", email).eq("source_sku", info.mainSku).eq("day", day);
        continue;
      }
      result.sent++;
      await supabase.from("postpurchase_upsell_sends")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("customer_email", email).eq("source_sku", info.mainSku).eq("day", day);
    }
    return json({ ok: true, dryRun, ...result });
  } catch (e) {
    console.error("[postpurchase-upsell]", e);
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
