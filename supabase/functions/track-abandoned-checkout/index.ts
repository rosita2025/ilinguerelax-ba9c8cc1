import { createClient } from "npm:@supabase/supabase-js@2";
import { pushAbandonedCartToBrevo } from "../_shared/brevoAbandonedCart.ts";
import { normalizeSku } from "../_shared/digitalSku.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(raw: unknown) {
  const email = String(raw || "").trim().toLowerCase();
  return email.endsWith("@gmail") ? `${email}.com` : email;
}

// Fallback estático (usado si la tabla country_language_map no responde).
const FALLBACK_COUNTRY_TO_LANG: Record<string, string> = {
  PE:"es",MX:"es",AR:"es",CL:"es",CO:"es",VE:"es",EC:"es",BO:"es",PY:"es",UY:"es",
  CR:"es",GT:"es",HN:"es",NI:"es",PA:"es",SV:"es",DO:"es",CU:"es",PR:"es",ES:"es",
  US:"en",GB:"en",CA:"en",AU:"en",NZ:"en",IE:"en",ZA:"en",IN:"en",SG:"en",PH:"en",
  FR:"fr",BE:"fr",CH:"fr",LU:"fr",MC:"fr",SN:"fr",CI:"fr",MA:"fr",TN:"fr",DZ:"fr",
  BR:"pt",PT:"pt",AO:"pt",MZ:"pt",
};

// Cache en memoria del mapa configurable (10 min).
let mapCache: { at: number; data: Record<string, string> } | null = null;
type CountryMapClient = {
  from: (table: "country_language_map") => {
    select: (columns: string) => PromiseLike<{ data: Array<{ country_code: string; language: string }> | null; error: unknown }>;
  };
};

async function loadCountryLangMap(sb: unknown): Promise<Record<string,string>> {
  if (mapCache && Date.now() - mapCache.at < 10 * 60 * 1000) return mapCache.data;
  try {
    const { data, error } = await (sb as CountryMapClient).from("country_language_map").select("country_code, language");
    if (error || !data) throw error;
    const map: Record<string, string> = {};
    for (const row of data as Array<{ country_code: string; language: string }>) {
      map[row.country_code.toUpperCase()] = row.language.toLowerCase();
    }
    mapCache = { at: Date.now(), data: map };
    return map;
  } catch (e) {
    console.warn("[country-lang-map] fallback:", e instanceof Error ? e.message : String(e));
    return FALLBACK_COUNTRY_TO_LANG;
  }
}

function detectFromTld(email: string): string {
  const tldMap: Record<string, string> = {
    ".br":"pt",".pt":"pt",".fr":"fr",".be":"fr",".ca":"en",".us":"en",
    ".uk":"en",".au":"en",".ie":"en",".in":"en",
    ".mx":"es",".ar":"es",".cl":"es",".co":"es",".pe":"es",".es":"es",
  };
  for (const suf of Object.keys(tldMap)) if (email.endsWith(suf)) return tldMap[suf];
  return "es";
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body.email);
    const name = String(body.name || "Cliente").trim() || "Cliente";
    const phone = String(body.phone || "").trim();
    const rawProductType = String(body.product_type || body.slug || "checkout").slice(0, 180);
    const productType = normalizeSku(rawProductType) || rawProductType;
    const country = String(body.country || "").trim().toUpperCase().slice(0, 2);
    const paymentMethod = String(body.payment_method || "not_selected").trim().toLowerCase().slice(0, 40);
    const triggerReason = String(body.trigger_reason || "unknown").trim().toLowerCase().slice(0, 40);
    const cart = Array.isArray(body.cart)
      ? (body.cart as Array<{ id?: string; q?: number }>)
          .filter((c) => c && typeof c.id === "string")
          .slice(0, 20)
          .map((c) => {
            const rawId = String(c.id).slice(0, 180);
            return { id: normalizeSku(rawId) || rawId, q: Math.max(1, Math.min(20, Number(c.q) || 1)) };
          })
      : [];

    if (!EMAIL_RE.test(email)) {
      return new Response(JSON.stringify({ error: "invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Resolver idioma: body.language > tabla country_language_map > TLD > "es"
    let language: string;
    if (body.language) {
      language = String(body.language).toLowerCase();
    } else {
      const langMap = await loadCountryLangMap(supabase);
      language = langMap[country] || detectFromTld(email);
    }

    // Upsert-like: reset existing open cart or create new
    const { data: existing } = await supabase
      .from("abandoned_carts")
      .select("id")
      .eq("customer_email", email)
      .eq("is_completed", false)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("abandoned_carts")
        .update({
          customer_name: name,
          product_type: productType,
          language,
          next_email_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("abandoned_carts").insert({
        customer_name: name,
        customer_email: email,
        product_type: productType,
        language,
        next_email_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // Central contacts
    let brevoSynced = false;
    try {
      await supabase.from("email_contacts").upsert({
        email,
        name,
        source: "abandoned_cart",
        language,
        product_type: productType,
        metadata: {
          phone,
          payment_method: paymentMethod,
          updated_from: "track-abandoned-checkout",
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: "email,source" });
    } catch (_) { /* dedupe conflict ignored */ }

    // Push to Brevo — the Brevo Automation workflow sends Day 1/7/15/30 emails.
    try {
      // Dedupe: si ya sincronizamos este email+SKU con Brevo en los últimos 30 min,
      // saltamos para evitar 4-5 registros seguidos del mismo cliente editando el form.
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: recent } = await supabase
        .from("brevo_sync_logs")
        .select("id")
        .eq("email", email)
        .eq("product_sku", productType)
        .eq("event_type", "tienda_abandoned")
        .eq("status", "success")
        .gte("created_at", thirtyMinAgo)
        .limit(1)
        .maybeSingle();

      if (recent) {
        console.log(`[dedupe] skipping Brevo push (recent sync <30min) for ${email} / ${productType}`);
      } else {
        const { data: product } = await supabase
          .from("digital_products")
          .select("name, price_usd, sku")
          .eq("sku", productType)
          .maybeSingle();
        const site = "https://ilinguerelax.com";
        const recoverPayload = {
          v: 1,
          b: { n: name, e: email, p: phone },
          c: cart,
        };
        const recoverB64 = btoa(unescape(encodeURIComponent(JSON.stringify(recoverPayload))))
          .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        const checkoutSku = (product as { sku?: string } | null)?.sku || productType;
        const baseUrl = `${site}/checkouts/${checkoutSku}`;
        const url = `${baseUrl}?r=${recoverB64}&lang=${language}`;
        const countryReason = !country
          ? (body.country_source === "ip" ? "ip_lookup_failed" : "ip_unavailable")
          : (/^[A-Z]{2}$/.test(country) ? undefined : "invalid_format");
        brevoSynced = await pushAbandonedCartToBrevo({
          email,
          name,
          phone,
          productSku: productType,
          productName: (product as { name?: string } | null)?.name,
          productUrl: url,
          priceUsd: (product as { price_usd?: number } | null)?.price_usd ?? undefined,
          couponCode: "NEW10",
          couponPercent: 10,
          language,
          country,
          countryReason,
          source: "checkout",
          paymentMethod,
          triggerReason,
        });
      }
    } catch (e) {
      console.warn("brevo push failed:", e instanceof Error ? e.message : String(e));
    }


    return new Response(JSON.stringify({ ok: true, brevoSynced }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("track-abandoned-checkout error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
