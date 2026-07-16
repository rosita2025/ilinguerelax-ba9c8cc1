import { assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { pingIndexNow, pingSitemap, productUrl } from "../_shared/indexnow.ts";
import { resubmitSitemapsGSC, inspectUrlGSC } from "../_shared/gsc.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  active?: boolean;
  sort_order?: number;
  stripe_product_id?: string | null;
  stripe_price_id?: string | null;
  bonus_name?: string | null;
  bonus_drive_url?: string | null;
  bonus_access_key?: string | null;
  bonuses?: Array<{ name?: string; drive_url?: string; access_key?: string }> | null;
  hotmart_url?: string | null;
  store_enabled?: boolean;
  excluded_countries?: string[] | null;
  store_excluded_countries?: string[] | null;
  hotmart_excluded_countries?: string[] | null;
  upsells?: UpsellIn[];
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

    // Public action: returns delivery info (drive_url + bonuses) for known SKUs.
    // Used by /checkout/success after a real payment reference is present.
    if (action === "get_delivery") {
      const skus = Array.isArray((body as { skus?: unknown }).skus)
        ? ((body as { skus: string[] }).skus).filter(Boolean).slice(0, 20)
        : [];
      if (!skus.length) return json({ items: [] });
      const { data, error } = await admin
        .from("digital_products")
        .select("sku,name,drive_url,access_key,bonus_name,bonus_drive_url,bonus_access_key,bonuses,cover_image_url")
        .in("sku", skus);
      if (error) throw error;
      return json({ items: data ?? [] });
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
      if (driveChanged && newDrive) {
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
        sku: p.sku,
        name: p.name.trim(),
        description: p.description ?? null,
        learner_language: p.learner_language || "es",
        target_language: p.target_language || "en",
        price_usd: Number(p.price_usd),
        price_usd_latam: p.price_usd_latam == null || (p.price_usd_latam as unknown as string) === "" ? null : Number(p.price_usd_latam),
        price_usd_tienda: p.price_usd_tienda == null || (p.price_usd_tienda as unknown as string) === "" ? null : Number(p.price_usd_tienda),
        price_pen: p.price_pen == null || (p.price_pen as unknown as string) === "" ? null : Number(p.price_pen),
        drive_url: p.drive_url ?? null,
        access_key: p.access_key ?? null,
        cover_image_url: p.cover_image_url ?? null,
        is_upsell: !!p.is_upsell,
        active: p.active ?? true,
        sort_order: p.sort_order ?? 0,
        stripe_product_id: p.stripe_product_id ?? null,
        stripe_price_id: p.stripe_price_id ?? null,
        bonus_name: p.bonus_name?.toString().trim() || null,
        bonus_drive_url: p.bonus_drive_url?.toString().trim() || null,
        bonus_access_key: p.bonus_access_key?.toString().trim() || null,
        bonuses: Array.isArray(p.bonuses)
          ? p.bonuses
              .map((b) => ({
                name: (b?.name ?? "").toString().trim(),
                drive_url: (b?.drive_url ?? "").toString().trim(),
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
      if (upErr) throw upErr;

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

      // Fire-and-forget SEO propagation: announces the new/updated URL to
      // Bing/Yandex/Seznam (IndexNow) and pings sitemap for Google.
      if (p.active !== false) {
        await pingIndexNow([productUrl(p.sku)]);
        pingSitemap().catch(() => {});
        resubmitSitemapsGSC().catch(() => {});
        inspectUrlGSC(productUrl(p.sku)).catch(() => {});
      }
      return json({ success: true, sku: p.sku });
    }

    if (action === "rename") {
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
      // Announce both old (now 404) and new URLs so search engines refresh.
      await pingIndexNow([productUrl(oldSku), productUrl(newSku)]);
      pingSitemap().catch(() => {});
      resubmitSitemapsGSC().catch(() => {});
      inspectUrlGSC(productUrl(newSku)).catch(() => {});
      return json({ success: true, sku: newSku });
    }

    if (action === "delete") {
      const sku = body.sku as string;
      if (!sku) return json({ error: "SKU requerido" }, 400);
      const { error } = await admin.from("digital_products").delete().eq("sku", sku);
      if (error) throw error;
      // Product removed — tell IndexNow so it drops the URL from indexes.
      await pingIndexNow([productUrl(sku)]);
      pingSitemap().catch(() => {});
      resubmitSitemapsGSC().catch(() => {});
      return json({ success: true });
    }

    if (action === "toggle") {
      const sku = body.sku as string;
      const active = !!body.active;
      if (!sku) return json({ error: "SKU requerido" }, 400);
      const { error } = await admin.from("digital_products").update({ active }).eq("sku", sku);
      if (error) throw error;
      // Activated → announce URL; deactivated → still ping so bots recrawl and see 404.
      await pingIndexNow([productUrl(sku)]);
      pingSitemap().catch(() => {});
      resubmitSitemapsGSC().catch(() => {});
      inspectUrlGSC(productUrl(sku)).catch(() => {});
      return json({ success: true });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (e) {
    console.error("[manage-products]", e);
    return json({ error: (e as Error).message }, 500);
  }
});
