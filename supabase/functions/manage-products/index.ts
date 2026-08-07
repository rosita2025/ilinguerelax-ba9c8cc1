/**
 * Backend Product Management
 * 
 * Política de Entrega Digital:
 * Los enlaces de Drive guardados aquí NUNCA se exponen directamente al cliente ni a las pasarelas.
 * Al guardar, se normalizan automáticamente. La entrega utiliza exclusivamente el sistema de 
 * tokens seguros (/mi-descarga?t=TOKEN) para proteger el material intelectual.
 */
import { assertAdminCsrf } from "../_shared/adminCsrf.ts";

import { pingIndexNow, pingSitemap, productUrl } from "../_shared/indexnow.ts";
import { pingPinterestAndCms } from "../_shared/pinterestPing.ts";
import { resubmitSitemapsGSC, inspectUrlGSC } from "../_shared/gsc.ts";
import { notifyGoogleIndexing } from "../_shared/googleIndexing.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Utility for Google Drive URL extraction and normalization (Internal).
 */
export const extractDriveId = (url: string): { id: string; type: 'file' | 'folder' } | null => {
  if (!url) return null;
  const filePatterns = [
    /\/file\/d\/([a-zA-Z0-9_-]{25,})/,
    /\/d\/([a-zA-Z0-9_-]{25,})/,
    /id=([a-zA-Z0-9_-]{25,})/,
    /open\?id=([a-zA-Z0-9_-]{25,})/
  ];
  for (const pattern of filePatterns) {
    const match = url.match(pattern);
    if (match && match[1]) return { id: match[1], type: 'file' };
  }
  const folderPatterns = [
    /\/folders\/([a-zA-Z0-9_-]{25,})/,
    /id=([a-zA-Z0-9_-]{25,})/
  ];
  for (const pattern of folderPatterns) {
    const match = url.match(pattern);
    if (match && match[1] && url.includes('folders')) return { id: match[1], type: 'folder' };
  }
  return null;
};

export const normalizeDriveUrl = (url: string): string => {
  const extracted = extractDriveId(url);
  if (!extracted) return url;
  if (extracted.type === 'folder') return `https://drive.google.com/drive/folders/${extracted.id}`;
  return `https://drive.google.com/file/d/${extracted.id}/view`;
};


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface UpsellIn {
  upsell_sku: string;
  discount_pct?: number;
  sort_order?: number;
}
interface ProductIn {
  sku: string;
  name: string;
  description?: string | null;
  learner_language?: string;
  target_language?: string;
  price_usd: number;
  price_usd_latam?: number | null;
  price_usd_tienda?: number | null;
  price_pen?: number | null;
  drive_url?: string | null;
  access_key?: string | null;
  cover_image_url?: string | null;
  is_upsell?: boolean;
  is_physical?: boolean;
  active?: boolean;
  sort_order?: number;
  stripe_product_id?: string | null;
  stripe_price_id?: string | null;
  bonus_name?: string | null;
  bonus_drive_url?: string | null;
  bonus_access_key?: string | null;
  bonuses?: Array<{ name?: string; drive_url?: string; access_key?: string }> | null;
  hotmart_url?: string | null;
  hotmart_urls_by_country?: Record<string, string> | null;
  hotmart_prices_by_country?: Record<string, { amount: number; currency: string }> | null;
  store_enabled?: boolean;
  excluded_countries?: string[] | null;
  store_excluded_countries?: string[] | null;
  hotmart_excluded_countries?: string[] | null;
  local_prices?: Record<string, number> | null;
  upsells?: UpsellIn[];
  gallery_metadata?: Record<string, any> | null;
}

const SKU_RE = /^[a-z0-9][a-z0-9-]*$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const body = await req.json().catch(() => ({}));
    const { action, adminKey } = body as { action?: string; adminKey?: string };

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ⚠️ La entrega digital NO se sirve desde aquí. Antes existía una acción
    // `get_delivery` que aceptaba SKUs sueltos y devolvía los Google Drive y
    // claves de acceso sin comprobar ningún pago. Ahora vive en la función
    // `order-delivery`, que exige pedido + correo con pago confirmado.
    if (action === "get_delivery") {
      return json({ error: "Usa la función order-delivery (requiere pedido pagado)" }, 410);
    }


    const expected = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expected || adminKey !== expected) {
      return json({ error: "Unauthorized" }, 401);
    }

    if (action === "list") {
      const { data: products, error } = await admin
        .from("digital_products")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;

      const { data: upsells } = await admin
        .from("product_upsells")
        .select("*")
        .order("sort_order", { ascending: true });

      return json({ products: products ?? [], upsells: upsells ?? [] });
    }

    if (action === "upsert") {
      const p = body.product as ProductIn;
      console.log(`[manage-products] Upserting product: ${p?.sku}`, { 
        is_physical: p?.is_physical, 
        active: p?.active,
        bonus_titles_present: !!(p as any).bonus_titles 
      });

      const confirmDriveChange = (body as { confirmDriveChange?: boolean }).confirmDriveChange === true;
      if (!p?.sku || !SKU_RE.test(p.sku)) return json({ error: "SKU inválido (usa minúsculas, números y guiones)" }, 400);
      if (!p.name?.trim()) return json({ error: "Nombre requerido" }, 400);
      if (p.price_usd == null || Number.isNaN(Number(p.price_usd))) return json({ error: "Precio USD requerido" }, 400);

      // ⚠️ drive_url consistency guard: evita que un admin pegue por error el
      // enlace de OTRO producto y termine enviando el PDF equivocado.
      const newDrive = (p.drive_url ?? "").toString().trim();
      const { data: currentRow } = await admin
        .from("digital_products")
        .select("drive_url,sku_aliases")
        .eq("sku", p.sku)
        .maybeSingle();
      const currentDrive = ((currentRow?.drive_url as string | null) ?? "").trim();
      const driveChanged = newDrive !== currentDrive;
      
      // Confirmation ONLY if there was an existing drive link and it is being changed to a different NON-EMPTY link.
      // This avoids blocking new product creation or first-time URL setup.
      if (driveChanged && newDrive && currentDrive) {
        // 1) Formato: debe ser un enlace de Google Drive/Docs (dominio esperado)
        const looksLikeDrive = /^https?:\/\/(drive|docs)\.google\.com\//i.test(newDrive);
        if (!looksLikeDrive) {
          return json({ error: "drive_url inválido: debe ser un enlace de drive.google.com o docs.google.com" }, 400);
        }
        // 2) Unicidad: ningún otro producto puede tener exactamente el mismo enlace
        const { data: clashDrive } = await admin
          .from("digital_products")
          .select("sku,name")
          .eq("drive_url", newDrive)
          .neq("sku", p.sku)
          .limit(1);
        if (clashDrive && clashDrive.length) {
          const other = clashDrive[0] as { sku: string; name: string };
          return json({
            error: `Ese drive_url ya pertenece al producto "${other.name}" (${other.sku}). Un enlace no puede estar en dos productos: rompería el envío por SKU.`,
          }, 400);
        }
        // 3) Confirmación explícita del admin (el cliente debe pedirla escribiendo el SKU)
        if (!confirmDriveChange) {
          return json({
            error: "drive_url_change_requires_confirmation",
            requiresConfirmation: true,
            sku: p.sku,
            currentDrive: currentDrive || null,
            newDrive,
            aliases: (currentRow?.sku_aliases as string[] | null) ?? [],
          }, 409);
        }
      }

      const row = {
        sku: p.sku.trim().toLowerCase(), // Final safety trim/lower
        name: p.name.trim(),
        description: p.description ?? null,
        learner_language: p.learner_language || "es",
        target_language: p.target_language || "en",
        price_usd: Number(p.price_usd),
        price_usd_latam: p.price_usd_latam == null || (p.price_usd_latam as unknown as string) === "" ? null : Number(p.price_usd_latam),
        price_usd_tienda: p.price_usd_tienda == null || (p.price_usd_tienda as unknown as string) === "" ? null : Number(p.price_usd_tienda),
        price_pen: p.price_pen == null || (p.price_pen as unknown as string) === "" ? null : Number(p.price_pen),
        drive_url: p.drive_url ? normalizeDriveUrl(p.drive_url) : null,
        access_key: p.access_key ?? null,

        cover_image_url: p.cover_image_url ?? null,
        is_upsell: !!p.is_upsell,
        is_physical: !!p.is_physical,
        active: p.active ?? true,
        sort_order: p.sort_order ?? 0,

        stripe_product_id: p.stripe_product_id ?? null,
        stripe_price_id: p.stripe_price_id ?? null,
        bonus_name: p.bonus_name?.toString().trim() || null,
        bonus_drive_url: p.bonus_drive_url ? normalizeDriveUrl(p.bonus_drive_url.toString()) : null,
        bonus_access_key: p.bonus_access_key?.toString().trim() || null,

        bonuses: Array.isArray(p.bonuses)
          ? p.bonuses
              .map((b) => ({
                name: (b?.name ?? "").toString().trim(),
                drive_url: b?.drive_url ? normalizeDriveUrl(b.drive_url.toString()) : "",
                access_key: (b?.access_key ?? "").toString().trim(),
              }))
              .filter((b) => b.drive_url)
              .slice(0, 4)
          : [],
        hotmart_url: p.hotmart_url?.toString().trim() || null,
        store_enabled: p.store_enabled ?? true,
        excluded_countries: Array.isArray(p.excluded_countries)
          ? p.excluded_countries.map((c) => (c ?? "").toString().trim().toUpperCase()).filter((c) => /^[A-Z]{2}$/.test(c))
          : [],
        store_excluded_countries: Array.isArray(p.store_excluded_countries)
          ? p.store_excluded_countries.map((c) => (c ?? "").toString().trim().toUpperCase()).filter((c) => /^[A-Z]{2}$/.test(c))
          : [],
        hotmart_excluded_countries: Array.isArray(p.hotmart_excluded_countries)
          ? p.hotmart_excluded_countries.map((c) => (c ?? "").toString().trim().toUpperCase()).filter((c) => /^[A-Z]{2}$/.test(c))
          : [],
        sku_aliases: Array.isArray((p as unknown as { sku_aliases?: unknown[] }).sku_aliases)
          ? Array.from(new Set(
              ((p as unknown as { sku_aliases: unknown[] }).sku_aliases)
                .map((a) => String(a ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                .filter((a) => a && a !== p.sku)
            ))
          : [],
        local_prices: (() => {
          const raw = (p as unknown as { local_prices?: unknown }).local_prices;
          if (!raw || typeof raw !== "object") return {};
          const out: Record<string, number> = {};
          for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
            const cur = k.toUpperCase();
            if (!/^[A-Z]{3}$/.test(cur)) continue;
            const n = typeof v === "string" ? Number(v) : (v as number);
            if (typeof n === "number" && isFinite(n) && n > 0) out[cur] = n;
          }
          return out;
        })(),
        hotmart_urls_by_country: (() => {
          const raw = (p as unknown as { hotmart_urls_by_country?: unknown }).hotmart_urls_by_country;
          if (!raw || typeof raw !== "object") return {};
          const out: Record<string, string> = {};
          for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
            const cc = k.toUpperCase();
            if (!/^[A-Z]{2}$/.test(cc)) continue;
            const url = String(v ?? "").trim();
            if (/^https?:\/\//i.test(url)) out[cc] = url;
          }
          return out;
        })(),
        hotmart_prices_by_country: (() => {
          const raw = (p as unknown as { hotmart_prices_by_country?: unknown }).hotmart_prices_by_country;
          if (!raw || typeof raw !== "object") return {};
          const out: Record<string, { amount: number; currency: string }> = {};
          for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
            const cc = k.toUpperCase();
            if (!/^[A-Z]{2}$/.test(cc)) continue;
            const obj = v as { amount?: unknown; currency?: unknown } | null;
            if (!obj) continue;
            const amount = typeof obj.amount === "string" ? Number(obj.amount) : (obj.amount as number);
            const currency = String(obj.currency ?? "").trim().toUpperCase();
            if (typeof amount === "number" && isFinite(amount) && amount > 0 && /^[A-Z]{3}$/.test(currency)) {
              out[cc] = { amount, currency };
            }
          }
          return out;
        })(),
        gallery_images: Array.isArray(p.gallery_images)
          ? p.gallery_images
              .map(url => String(url ?? "").trim())
              .filter(url => /^https?:\/\//i.test(url))
              .slice(0, 5)
          : [],
      };

      // Duplicate-alias guard: if any alias is already used by a different product, reject.
      if (row.sku_aliases.length) {
        const { data: clash } = await admin
          .from("digital_products")
          .select("sku,sku_aliases")
          .overlaps("sku_aliases", row.sku_aliases)
          .neq("sku", p.sku);
        if (clash && clash.length) {
          const conflicts = (clash as { sku: string; sku_aliases: string[] }[])
            .flatMap((r) => r.sku_aliases.filter((a) => row.sku_aliases.includes(a)).map((a) => `${a} → ${r.sku}`));
          return json({ error: `Alias duplicado: ${conflicts.join(", ")}. Cada alias solo puede pertenecer a un producto.` }, 400);
        }
      }

      const { error: upErr } = await admin
        .from("digital_products")
        .upsert(row, { onConflict: "sku" });
      if (upErr) {
        console.error(`[manage-products] Database upsert error for ${p.sku}:`, upErr);
        return json({ error: "Database error", detail: upErr.message, code: upErr.code }, 500);
      }

      // Reemplazar upsells si vienen
      if (Array.isArray(p.upsells)) {
        await admin.from("product_upsells").delete().eq("product_sku", p.sku);
        const rows = p.upsells
          .filter((u) => u.upsell_sku && u.upsell_sku !== p.sku)
          .map((u, idx) => ({
            product_sku: p.sku,
            upsell_sku: u.upsell_sku,
            discount_pct: Math.max(0, Math.min(90, Number(u.discount_pct) || 0)),
            sort_order: u.sort_order ?? idx,
          }));
        if (rows.length) {
          const { error: uErr } = await admin.from("product_upsells").insert(rows);
          if (uErr) throw uErr;
        }
      }

      // Announce the new/updated URL to search engines.
      // We wrap this in a fire-and-forget block with a timeout to avoid delaying
      // the product save response or failing the whole request if a bot is slow.
      if (p.active !== false) {
        // Deno.serve allows the request handler to complete while background
        // tasks continue as long as they were started before the response.
        const url = productUrl(p.sku);
        const pings = async () => {
          try {
            console.log(`[manage-products] Starting SEO pings for ${p.sku}`);
            await Promise.allSettled([
              pingIndexNow([url]),
              pingPinterestAndCms({ url, type: "product" }),
              notifyGoogleIndexing([url], "URL_UPDATED"),
              pingSitemap(),
              resubmitSitemapsGSC(),
              inspectUrlGSC(url),
            ]);
            console.log(`[manage-products] SEO pings settled for ${p.sku}`);
          } catch (e) {
            console.error(`[manage-products] SEO pings failed for ${p.sku}`, e);
          }
        };
        
        // Execute background pings without awaiting. 
        // In Deno Deploy / Supabase Edge Functions, background tasks must be finished 
        // before the response is sent unless using specific platform APIs like EdgeRuntime.waitUntil.
        // To be safe and fast, we keep them async but ensure they don't block the return.
        pings().catch(err => console.error(`[manage-products] Uncaught background error:`, err));
      }
      return json({ success: true, sku: p.sku });

    }

    if (action === "rename") {
      // El SKU es inmutable: es la clave que usan Stripe, PayPal, Mercado Pago,
      // dLocal Go, Binance Pay, Yape/Plin, transferencias, los tokens de descarga
      // y los avisos a compradores. Renombrarlo rompe pagos y entregas ya emitidos.
      return json({ error: "El SKU no se puede cambiar. Está vinculado a Stripe, Mercado Pago, PayPal, Yape/Plin, transferencias, Binance Pay y dLocal Go. Usa los alias cortos del checkout." }, 400);
    }

    if (action === "__rename_disabled__") {

      const oldSku = (body.oldSku as string || "").trim();
      const newSku = (body.newSku as string || "").trim().toLowerCase();
      if (!oldSku || !newSku) return json({ error: "oldSku y newSku requeridos" }, 400);
      if (oldSku === newSku) return json({ success: true, sku: newSku });
      if (!SKU_RE.test(newSku)) return json({ error: "SKU nuevo inválido (usa minúsculas, números y guiones)" }, 400);

      const { data: existing } = await admin.from("digital_products").select("sku").eq("sku", newSku).maybeSingle();
      if (existing) return json({ error: "Ya existe un producto con ese SKU" }, 400);

      const { error: e1 } = await admin.from("digital_products").update({ sku: newSku }).eq("sku", oldSku);
      if (e1) throw e1;
      await admin.from("product_upsells").update({ product_sku: newSku }).eq("product_sku", oldSku);
      await admin.from("product_upsells").update({ upsell_sku: newSku }).eq("upsell_sku", oldSku);
      // SEO: Announce both old (now 404) and new URLs so search engines refresh.
      (async () => {
        const oldUrl = productUrl(oldSku);
        const newUrl = productUrl(newSku);
        try {
          await Promise.allSettled([
            pingIndexNow([oldUrl, newUrl]),
            pingPinterestAndCms({ url: newUrl, type: "product" }),
            notifyGoogleIndexing([newUrl], "URL_UPDATED"),
            notifyGoogleIndexing([oldUrl], "URL_DELETED"),
            pingSitemap(),
            resubmitSitemapsGSC(),
            inspectUrlGSC(newUrl),
          ]);
        } catch (e) {
          console.error(`[manage-products] SEO pings failed on rename ${oldSku} -> ${newSku}`, e);
        }
      })().catch(() => {});
      return json({ success: true, sku: newSku });
    }

    if (action === "delete") {
      const sku = body.sku as string;
      if (!sku) return json({ error: "SKU requerido" }, 400);
      const { error } = await admin.from("digital_products").delete().eq("sku", sku);
      if (error) throw error;
      // SEO: tell IndexNow so it drops the URL from indexes.
      (async () => {
        const url = productUrl(sku);
        try {
          await Promise.allSettled([
            pingIndexNow([url]),
            notifyGoogleIndexing([url], "URL_DELETED"),
            pingSitemap(),
            resubmitSitemapsGSC(),
          ]);
        } catch (e) {
          console.error(`[manage-products] SEO pings failed on delete ${sku}`, e);
        }
      })().catch(() => {});
      return json({ success: true });
    }

    if (action === "toggle") {
      const sku = body.sku as string;
      const active = !!body.active;
      if (!sku) return json({ error: "SKU requerido" }, 400);
      const { error } = await admin.from("digital_products").update({ active }).eq("sku", sku);
      if (error) throw error;
      // SEO: Activated → announce URL; deactivated → still ping so bots recrawl and see 404.
      (async () => {
        const url = productUrl(sku);
        try {
          await Promise.allSettled([
            pingIndexNow([url]),
            notifyGoogleIndexing([url], active ? "URL_UPDATED" : "URL_DELETED"),
            pingSitemap(),
            resubmitSitemapsGSC(),
            inspectUrlGSC(url),
          ]);
        } catch (e) {
          console.error(`[manage-products] SEO pings failed on toggle ${sku}`, e);
        }
      })().catch(() => {});
      return json({ success: true });
    }

    if (action === "history") {
      const b = body as { sku?: string; skus?: string[]; since?: string; until?: string };
      const skus = (b.skus && b.skus.length ? b.skus : (b.sku ? [b.sku] : []))
        .map((s) => String(s || "").trim()).filter(Boolean);
      if (!skus.length) return json({ error: "SKU requerido" }, 400);
      let q = admin
        .from("digital_product_changes")
        .select("id, sku, action, changed_fields, created_at")
        .in("sku", skus)
        .order("created_at", { ascending: false })
        .limit(200);
      if (b.since) q = q.gte("created_at", b.since);
      if (b.until) q = q.lte("created_at", b.until);
      const { data, error } = await q;
      if (error) throw error;
      return json({ changes: data ?? [] });
    }

    return json({ error: "Invalid action" }, 400);

  } catch (e) {
    console.error("[manage-products]", e);
    return json({ error: (e as Error).message }, 500);
  }
});
