// Crea (o reutiliza) el token de descarga de un pedido. SOLO uso interno:
// se invoca con la service-role key desde otras funciones (entrega digital).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { dlCors, dlJson, canonicalEmail, randomToken } from "../_shared/downloadToken.ts";

const SITE = "https://www.ilinguerelax.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: dlCors });
  if (req.method !== "POST") return dlJson({ error: "Method not allowed" }, 405);

  // Solo llamadas internas con service-role.
  const auth = req.headers.get("authorization") ?? "";
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!service || !auth.includes(service)) return dlJson({ error: "Forbidden" }, 403);

  try {
    const body = await req.json().catch(() => ({}));
    const orderNumber = String(body?.orderId ?? "").trim().toUpperCase();
    const email = canonicalEmail(body?.email);
    const skus = (Array.isArray(body?.skus) ? body.skus : [])
      .map((s: unknown) => String(s ?? "").trim().toLowerCase())
      .filter(Boolean);

    if (!/^[A-Z0-9\-_]{4,80}$/.test(orderNumber) || !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) {
      return dlJson({ error: "Datos inválidos" }, 400);
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, service);

    const { data: existing } = await admin
      .from("download_tokens")
      .select("token, skus, revoked")
      .eq("order_number", orderNumber)
      .eq("email", email)
      .maybeSingle();

    if (existing && !existing.revoked) {
      const merged = [...new Set([...(existing.skus ?? []), ...skus])];
      if (merged.length !== (existing.skus ?? []).length) {
        await admin.from("download_tokens").update({ skus: merged }).eq("token", existing.token);
      }
      return dlJson({ token: existing.token, url: `${SITE}/mi-descarga?t=${existing.token}` });
    }

    const token = randomToken();
    const { error } = await admin.from("download_tokens").insert({
      token, order_number: orderNumber, email, skus,
    });
    if (error) throw error;

    return dlJson({ token, url: `${SITE}/mi-descarga?t=${token}` });
  } catch (e) {
    console.error("[create-download-token]", e);
    return dlJson({ error: "Error interno" }, 500);
  }
});
