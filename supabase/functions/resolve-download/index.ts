// Resuelve el token de /mi-descarga: devuelve el estado (válido, caducado,
// agotado, inválido) y los productos/bonos del pedido SIN exponer nunca el
// enlace real de Drive (ese solo lo entrega get-download-link, firmado y 15 min).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { dlCors, dlJson, TOKEN_RE, maskEmail, bonusList } from "../_shared/downloadToken.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: dlCors });
  if (req.method !== "POST") return dlJson({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const token = String(body?.token ?? "").trim();
    if (!TOKEN_RE.test(token)) return dlJson({ status: "invalid" });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: row } = await admin
      .from("download_tokens")
      .select("id, order_number, email, skus, expires_at, max_downloads, download_count, revoked")
      .eq("token", token)
      .maybeSingle();

    if (!row || row.revoked) return dlJson({ status: "invalid" });

    const base = {
      orderNumber: row.order_number,
      emailMasked: maskEmail(row.email),
      expiresAt: row.expires_at,
      downloadsLeft: Math.max(0, (row.max_downloads ?? 0) - (row.download_count ?? 0)),
    };

    if (new Date(row.expires_at).getTime() < Date.now()) return dlJson({ status: "expired", ...base });
    if ((row.download_count ?? 0) >= (row.max_downloads ?? 0)) return dlJson({ status: "exhausted", ...base });

    const skus = [...new Set((row.skus ?? []).map((s: string) => String(s).toLowerCase()))];
    let items: unknown[] = [];
    if (skus.length) {
      const { data: products } = await admin
        .from("digital_products")
        .select("sku,name,cover_image_url,is_upsell,bonus_name,bonus_drive_url,bonus_access_key,bonuses")
        .in("sku", skus);
      items = (products ?? []).map((p: Record<string, unknown>) => ({
        sku: p.sku,
        name: p.name,
        cover: p.cover_image_url ?? null,
        isUpsell: Boolean(p.is_upsell),
        bonuses: bonusList(p).map((b, i) => ({ index: i, title: b.title ?? b.name ?? `Bono ${i + 1}` })),
      }));
    }

    await admin.from("download_tokens").update({ last_accessed_at: new Date().toISOString() }).eq("id", row.id);
    await admin.from("download_token_access").insert({
      token_id: row.id,
      action: "open",
      ip: req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null,
      user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
    });

    return dlJson({ status: "valid", ...base, items });
  } catch (e) {
    console.error("[resolve-download]", e);
    return dlJson({ error: "Error interno" }, 500);
  }
});
