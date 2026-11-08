// Meta Conversions API (server-side) helper.
// Sends Purchase (and other) events straight from webhooks so sales are
// attributed in Facebook Ads even when the buyer never returns to the site.

const FB_PIXEL_ID = "24959578143733255";
const FB_API_VERSION = "v21.0";

async function sha256(message: string): Promise<string> {
  const buf = new TextEncoder().encode(message);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface CapiPurchaseInput {
  /** Stable id shared with the browser pixel so Meta dedupes (e.g. order number). */
  eventId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  country?: string | null;
  value?: number | null;
  currency?: string | null;
  contentIds?: string[];
  contentName?: string | null;
  orderId?: string | null;
  eventSourceUrl?: string | null;
  eventName?: string;
}

/**
 * Busca la atribución de Meta Ads guardada para ese correo (fbc/fbp).
 * Devuelve null cuando la venta NO vino de un anuncio de Facebook/Instagram.
 */
async function lookupAttribution(email?: string | null): Promise<{ fbc: string | null; fbp: string | null } | null> {
  const clean = String(email || "").trim().toLowerCase();
  if (!clean) return null;
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return null;
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(url, key);
    const { data } = await supabase
      .from("meta_attribution")
      .select("fbc, fbp, expires_at")
      .eq("email", clean)
      .maybeSingle();
    if (!data) return null;
    if (data.expires_at && new Date(data.expires_at as string).getTime() < Date.now()) return null;
    return { fbc: (data.fbc as string) || null, fbp: (data.fbp as string) || null };
  } catch (e) {
    console.error("meta-capi attribution lookup failed", e);
    return null;
  }
}

/**
 * Última visita al checkout de ese correo: de ahí salen la IP y el navegador reales
 * del comprador (Meta los pide en eventos de sitio web y mejoran la coincidencia con el anuncio).
 */
async function lookupVisit(email?: string | null): Promise<{ ip: string | null; ua: string | null } | null> {
  const clean = String(email || "").trim().toLowerCase();
  if (!clean) return null;
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return null;
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(url, key);
    const { data } = await supabase
      .from("checkout_rate_hits")
      .select("ip, ua")
      .eq("email", clean)
      .order("created_at", { ascending: false })
      .limit(1);
    const row = (data as { ip?: string | null; ua?: string | null }[] | null)?.[0];
    if (!row) return null;
    return { ip: row.ip || null, ua: row.ua || null };
  } catch (e) {
    console.error("meta-capi visit lookup failed", e);
    return null;
  }
}

/**
 * Guarda en «Fallos de pago» (admin_payment_errors) por qué Meta no recibió una compra: sin token, rechazo de Meta o error de red.
 * Antes solo quedaba en los registros de la función y nadie veía que la campaña no contaba la venta.
 */
async function logCapiFailure(input: CapiPurchaseInput, message: string, detail: Record<string, unknown> = {}): Promise<void> {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return;
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(url, key);
    await supabase.from("admin_payment_errors").insert({
      provider: "meta_capi",
      error_message: message.slice(0, 500),
      error_kind: "meta_capi_error",
      country: input.country ? String(input.country).toUpperCase().slice(0, 2) : null,
      error_detail: { eventId: input.eventId, orderId: input.orderId ?? null, value: input.value ?? null, currency: input.currency ?? null, ...detail },
    });
  } catch (e) {
    console.error("meta-capi: no se pudo guardar el fallo", e instanceof Error ? e.message : String(e));
  }
}

/**
 * Fire-and-forget: never throws, never blocks the webhook's 200 response.
 * Envía la compra siempre que haya correo; usa fbc/fbp si existen para mejorar
 * la coincidencia con el anuncio.
 */
export async function sendPurchaseCapi(input: CapiPurchaseInput): Promise<void> {
  try {
    const accessToken = Deno.env.get("FB_CONVERSIONS_API_TOKEN");
    if (!accessToken) {
      console.log("meta-capi: no FB_CONVERSIONS_API_TOKEN, skipped");
      await logCapiFailure(input, "Falta el secreto FB_CONVERSIONS_API_TOKEN: la compra NO se envió a Meta");
      return;
    }

    // Antes se omitía la compra si no había fbc/fbp guardados (pasaba con dLocal:
    // el cliente paga minutos después, por otro dispositivo o sin pasar por la
    // página de gracias). Ahora se envía igual con el correo cifrado (SHA-256):
    // Meta decide si esa compra viene de un anuncio. Sin correo no hay con qué enviar.
    const attribution = await lookupAttribution(input.email);
    if (!attribution?.fbc && !attribution?.fbp) {
      if (!input.email) {
        console.log("meta-capi: sin correo ni atribución, evento omitido", input.eventId);
        return;
      }
      console.log("meta-capi: sin fbc/fbp, se envía solo con correo cifrado", input.eventId);
    }

    const visit = await lookupVisit(input.email);
    const user_data: Record<string, unknown> = {};
    if (visit?.ip) user_data.client_ip_address = visit.ip;
    if (visit?.ua) user_data.client_user_agent = visit.ua;
    if (attribution?.fbc) user_data.fbc = attribution.fbc;
    if (attribution?.fbp) user_data.fbp = attribution.fbp;
    if (input.email) user_data.em = [await sha256(String(input.email).toLowerCase().trim())];
    if (input.firstName) user_data.fn = [await sha256(String(input.firstName).toLowerCase().trim())];
    if (input.lastName) user_data.ln = [await sha256(String(input.lastName).toLowerCase().trim())];
    if (input.country) user_data.country = [await sha256(String(input.country).toLowerCase().trim())];


    const custom_data: Record<string, unknown> = {
      currency: (input.currency || "USD").toUpperCase(),
      content_type: "product",
    };
    if (typeof input.value === "number" && Number.isFinite(input.value)) custom_data.value = input.value;
    if (input.contentIds?.length) custom_data.content_ids = input.contentIds;
    if (input.contentName) custom_data.content_name = input.contentName;
    if (input.orderId) custom_data.order_id = input.orderId;

    const payload = {
      data: [
        {
          event_name: input.eventName || "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          event_id: input.eventId,
          event_source_url: input.eventSourceUrl || "https://ilinguerelax.com/checkouts/success",
          action_source: "website",
          user_data,
          custom_data,
        },
      ],
    };

    const res = await fetch(
      `https://graph.facebook.com/${FB_API_VERSION}/${FB_PIXEL_ID}/events?access_token=${accessToken}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("meta-capi error", JSON.stringify(json));
      const err = (json as { error?: { message?: string; code?: number; error_subcode?: number } }).error;
      await logCapiFailure(input, `Meta rechazó la compra (HTTP ${res.status}): ${err?.message ?? "sin detalle"}`, { status: res.status, code: err?.code ?? null, subcode: err?.error_subcode ?? null });
    } else {
      console.log("meta-capi sent", input.eventName || "Purchase", input.eventId, JSON.stringify(json));
    }
  } catch (e) {
    console.error("meta-capi exception", e instanceof Error ? e.message : String(e));
    await logCapiFailure(input, `Error de red al enviar la compra a Meta: ${e instanceof Error ? e.message : String(e)}`);
  }
}
