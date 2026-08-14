import { createClient } from "npm:@supabase/supabase-js@2";
import { pushAbandonedCartToBrevo } from "../_shared/brevoAbandonedCart.ts";
import { normalizeSku } from "../_shared/digitalSku.ts";
import { getPurchasedSkus } from "../_shared/purchasedSkus.ts";
import { guardEmail } from "../_shared/emailGuard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// TLD de al menos 2 letras: evita guardar correos a medio escribir
// (ej. "cliente@gmail.c") que luego nunca reciben el recordatorio.
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i;


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
    let email = normalizeEmail(body.email);
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Lista negra / blanca configurable: corrige typos y bloquea correos
    // desechables o falsos ANTES de tocar Brevo (ahorra consumo de envíos).
    const guard = await guardEmail(supabase, email);
    if (!guard.ok || !EMAIL_RE.test(guard.email)) {
      console.warn("[track-abandoned-checkout] correo rechazado:", guard.email, guard.reason);
      return new Response(JSON.stringify({ error: "invalid email", reason: guard.reason ?? "format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    email = guard.email;


    // Ignorar si ya compró recientemente (evita spam de abandonos tras compra exitosa)
    const recentPurchased = await getPurchasedSkus(supabase, email);
    const ownedSkus = [...recentPurchased].map(s => s.toLowerCase());
    
    // Check if the main product or ANY item in the cart is already owned
    const cartHasOwned = cart.some(it => ownedSkus.includes(it.id.toLowerCase()));
    const productOwned = productType && ownedSkus.includes(productType.toLowerCase());

    if (productOwned || cartHasOwned) {
      console.log(`[track-abandoned-checkout] skipping for ${email} - already owned product/cart items`);
      // Also mark any existing cart as converted to stop drips
      await supabase.from("persistent_carts").update({ converted: true }).ilike("email", email);
      
      return new Response(JSON.stringify({ ok: true, skipped: "already_purchased" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolver idioma: body.language > tabla country_language_map > TLD > "es"
    let language: string;
    if (body.language) {
      language = String(body.language).toLowerCase();
    } else {
      const langMap = await loadCountryLangMap(supabase);
      language = langMap[country] || detectFromTld(email);
    }

    // Upsert-like: reutiliza el carrito abierto del cliente en vez de crear uno
    // nuevo cada vez. Antes usaba .maybeSingle(), que falla cuando ya hay más de
    // una fila abierta del mismo correo y terminaba insertando duplicados.
    const { data: existingRows } = await supabase
      .from("persistent_carts")
      .select("cart_token")
      .eq("email", email)
      .limit(1);
    const existing = existingRows?.[0] ?? null;

    // We use persistent_carts as the authoritative source for abandoned checkouts now.
    // The previous abandoned_carts table is gone.

    // Persistent cart per email: accumulates ALL SKUs the buyer added across
    // sessions/devices so reminder emails and recovery links reflect the
    // full cart, not just the last product. Purchased SKUs are excluded so
    // buyers never see abandoned-cart reminders for products they already own.
    let cartToken: string | null = null;
    try {
      const purchased = await getPurchasedSkus(supabase, email);
      const { data: existingCart } = await supabase
        .from("persistent_carts")
        .select("items")
        .eq("email", email)
        .maybeSingle();
      const merged = new Map<string, { id: string; q: number }>();
      const prev = Array.isArray(existingCart?.items) ? (existingCart!.items as Array<{ id?: unknown; q?: unknown }>) : [];
      for (const it of prev) {
        if (it?.id) merged.set(String(it.id), { id: String(it.id), q: Math.max(1, Number(it.q) || 1) });
      }
      for (const it of cart) {
        merged.set(it.id, { id: it.id, q: Math.max(merged.get(it.id)?.q ?? 0, Number(it.q) || 1) });
      }
      // Include the current product in case the client didn't send a cart[] yet
      if (productType && !merged.has(productType)) merged.set(productType, { id: productType, q: 1 });

      // Strip already-purchased SKUs (case-insensitive).
      for (const key of [...merged.keys()]) {
        if (purchased.has(key.toLowerCase())) merged.delete(key);
      }

      const remaining = [...merged.values()].slice(0, 30);
      const { data: cartRow } = await supabase
        .from("persistent_carts")
        .upsert({
          email,
          items: remaining,
          buyer: { name, phone },
          country: country || null,
          language,
          last_activity: new Date().toISOString(),
          converted: remaining.length === 0,
        }, { onConflict: "email" })
        .select("cart_token")
        .single();
      cartToken = cartRow?.cart_token ?? null;
    } catch (e) {
      console.warn("persistent_carts upsert failed:", e instanceof Error ? e.message : String(e));
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
      // Dedupe GLOBAL por email: 1 sola sincronización a Brevo cada 24h
      // (sin importar el SKU). Antes empujábamos por producto → Brevo mandaba
      // 2-3 emails al día si el cliente veía 2-3 productos distintos.
      // Ahora nuestro cron interno (send-cart-reminders) consolida todos los
      // productos en 1 solo email; Brevo actúa sólo como backup.
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recent } = await supabase
        .from("brevo_sync_logs")
        .select("id")
        .eq("email", email)
        .eq("event_type", "tienda_abandoned")
        .eq("status", "success")
        .gte("created_at", dayAgo)
        .limit(1)
        .maybeSingle();

      const purchased = await getPurchasedSkus(supabase, email);
      const alreadyOwned = purchased.has(String(productType).toLowerCase());
      if (recent) {
        console.log(`[dedupe] skipping Brevo push (already pushed <24h) for ${email}`);
      } else if (alreadyOwned) {
        console.log(`[skip] ${email} already purchased ${productType} — no Brevo abandoned push`);
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


    return new Response(JSON.stringify({ ok: true, brevoSynced, cartToken }), {
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
