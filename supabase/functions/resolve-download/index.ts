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
      maxDownloads: row.max_downloads ?? 0,
      downloadsUsed: row.download_count ?? 0,
    };

    if (new Date(row.expires_at).getTime() < Date.now()) return dlJson({ status: "expired", ...base });
    if ((row.download_count ?? 0) >= (row.max_downloads ?? 0)) return dlJson({ status: "exhausted", ...base });

    const skus = [...new Set((row.skus ?? []).map((s: string) => String(s).toLowerCase()))];
    let items: Record<string, unknown>[] = [];
    let missingSkus: string[] = [];
    if (skus.length) {
      const { data: products } = await admin
        .from("digital_products")
        .select("sku,name,cover_image_url,is_upsell,drive_url,bonus_name,bonus_drive_url,bonus_access_key,bonuses")
        .in("sku", skus);
      items = (products ?? []).map((p: Record<string, unknown>) => ({
        sku: p.sku,
        name: p.name,
        cover: p.cover_image_url ?? null,
        isUpsell: Boolean(p.is_upsell),
        // Nunca se envía la URL real: solo si el archivo está disponible.
        available: Boolean(p.drive_url),
        bonuses: bonusList(p).map((b, i) => ({
          index: i,
          title: b.title ?? b.name ?? `Bono ${i + 1}`,
        })),
      }));
      const found = new Set((products ?? []).map((p: Record<string, unknown>) => String(p.sku).toLowerCase()));
      missingSkus = skus.filter((s: string) => !found.has(s));
    }

    await admin.from("download_tokens").update({ last_accessed_at: new Date().toISOString() }).eq("id", row.id);
    await admin.from("download_token_access").insert({
      token_id: row.id,
      action: "open",
      ip: req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null,
      user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
    });

    // Historial del pedido (todos sus tokens): descargas y reenvíos, sin IP ni user agent.
    const nameBySku = new Map(items.map((i) => [String(i.sku).toLowerCase(), String(i.name)]));
    const { data: orderTokens } = await admin
      .from("download_tokens")
      .select("id")
      .eq("order_number", row.order_number);
    const tokenIds = (orderTokens ?? []).map((t: { id: string }) => t.id);
    const { data: log } = await admin
      .from("download_token_access")
      .select("action, sku, created_at")
      .in("token_id", tokenIds.length ? tokenIds : [row.id])
      .in("action", ["download", "resend"])
      .order("created_at", { ascending: false })
      .limit(30);

    const history = (log ?? []).map((h: { action: string; sku: string | null; created_at: string }) => ({
      action: h.action,
      sku: h.sku,
      name: h.sku ? nameBySku.get(String(h.sku).toLowerCase()) ?? h.sku : null,
      at: h.created_at,
    }));

    return dlJson({
      status: "valid",
      ...base,
      items,
      missingSkus,
      history,
      counts: {
        total: items.length,
        main: items.filter((i) => !i.isUpsell).length,
        upsells: items.filter((i) => i.isUpsell).length,
        bonuses: items.reduce((n, i) => n + ((i.bonuses as unknown[])?.length ?? 0), 0),
      },
    });

  } catch (e) {
    console.error("[resolve-download]", e);
    return dlJson({ error: "Error interno" }, 500);
  }
});
