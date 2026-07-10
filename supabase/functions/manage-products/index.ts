import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
  upsells?: UpsellIn[];
}

const SKU_RE = /^[a-z0-9][a-z0-9-]*$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { action, adminKey } = body as { action?: string; adminKey?: string };

    const expected = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expected || adminKey !== expected) {
      return json({ error: "Unauthorized" }, 401);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

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
      if (!p?.sku || !SKU_RE.test(p.sku)) return json({ error: "SKU inválido (usa minúsculas, números y guiones)" }, 400);
      if (!p.name?.trim()) return json({ error: "Nombre requerido" }, 400);
      if (p.price_usd == null || Number.isNaN(Number(p.price_usd))) return json({ error: "Precio USD requerido" }, 400);

      const row = {
        sku: p.sku,
        name: p.name.trim(),
        description: p.description ?? null,
        learner_language: p.learner_language || "es",
        target_language: p.target_language || "en",
        price_usd: Number(p.price_usd),
        price_pen: p.price_pen == null || p.price_pen === "" ? null : Number(p.price_pen),
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
      };

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

      return json({ success: true, sku: p.sku });
    }

    if (action === "delete") {
      const sku = body.sku as string;
      if (!sku) return json({ error: "SKU requerido" }, 400);
      const { error } = await admin.from("digital_products").delete().eq("sku", sku);
      if (error) throw error;
      return json({ success: true });
    }

    if (action === "toggle") {
      const sku = body.sku as string;
      const active = !!body.active;
      if (!sku) return json({ error: "SKU requerido" }, 400);
      const { error } = await admin.from("digital_products").update({ active }).eq("sku", sku);
      if (error) throw error;
      return json({ success: true });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (e) {
    console.error("[manage-products]", e);
    return json({ error: (e as Error).message }, 500);
  }
});
