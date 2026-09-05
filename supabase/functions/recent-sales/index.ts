import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const TEST_PREFIXES = ["TEST", "PRUEBA", "LANG", "NAMES", "BONO"];

const PROVIDER_BY_PREFIX: Record<string, string> = {
  ST: "stripe",
  DL: "dlocalgo",
  MP: "mercadopago",
  MX: "mercadopago",
  YP: "hotmart",
  BN: "binance",
  MANUAL: "manual",
};

function shortName(raw?: string | null): string | null {
  if (!raw) return null;
  const parts = String(raw).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  const first = parts[0];
  if (first.includes("@")) return null;
  const initial = parts[1] ? ` ${parts[1][0].toUpperCase()}.` : "";
  return `${first}${initial}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const since = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();

    const [digital, manual, shopify, products] = await Promise.all([
      supabase
        .from("digital_email_sends")
        .select("order_id,customer_name,customer_country,skus,created_at,status")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("manual_payments")
        .select("order_number,buyer_name,buyer_country,items,created_at,status")
        .eq("status", "approved")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("shopify_sales")
        .select("customer_name,country,product_name,product_key,order_created_at")
        .gte("order_created_at", since)
        .order("order_created_at", { ascending: false })
        .limit(100),
      supabase.from("digital_products").select("sku,name,sku_aliases"),
    ]);

    const nameBySku = new Map<string, string>();
    for (const p of products.data ?? []) {
      nameBySku.set(p.sku, p.name);
      for (const alias of (p.sku_aliases ?? []) as string[]) nameBySku.set(alias, p.name);
    }
    const canonicalBySku = new Map<string, string>();
    for (const p of products.data ?? []) {
      canonicalBySku.set(p.sku, p.sku);
      for (const alias of (p.sku_aliases ?? []) as string[]) canonicalBySku.set(alias, p.sku);
    }

    type Sale = {
      name: string;
      country: string | null;
      sku: string | null;
      productName: string;
      provider: string;
      soldAt: string;
    };
    const sales: Sale[] = [];

    for (const row of digital.data ?? []) {
      const orderId = String(row.order_id ?? "");
      const prefix = orderId.split("-")[1]?.toUpperCase() ?? "";
      if (!orderId || TEST_PREFIXES.includes(prefix)) continue;
      const provider = PROVIDER_BY_PREFIX[prefix];
      if (!provider) continue;
      const status = String(row.status ?? "sent");
      if (!["sent", "delivered", "opened", "clicked"].includes(status)) continue;
      const name = shortName(row.customer_name);
      const rawSku = (row.skus ?? [])[0];
      if (!name || !rawSku) continue;
      sales.push({
        name,
        country: row.customer_country ?? null,
        sku: canonicalBySku.get(rawSku) ?? rawSku,
        productName: nameBySku.get(rawSku) ?? rawSku,
        provider,
        soldAt: row.created_at,
      });
    }

    for (const row of manual.data ?? []) {
      const name = shortName(row.buyer_name);
      const item = Array.isArray(row.items) ? (row.items[0] as any) : null;
      const rawSku = item?.sku ?? null;
      if (!name) continue;
      sales.push({
        name,
        country: row.buyer_country ?? null,
        sku: rawSku ? canonicalBySku.get(rawSku) ?? rawSku : null,
        productName: (rawSku && nameBySku.get(rawSku)) || item?.name || "iLingue Relax",
        provider: "manual",
        soldAt: row.created_at,
      });
    }

    for (const row of shopify.data ?? []) {
      const name = shortName(row.customer_name);
      if (!name) continue;
      sales.push({
        name,
        country: row.country ?? null,
        sku: row.product_key ?? null,
        productName: row.product_name ?? "iLingue Relax",
        provider: "shopify",
        soldAt: row.order_created_at,
      });
    }

    sales.sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime());

    return new Response(JSON.stringify({ sales: sales.slice(0, 60) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
      status: 200,
    });
  } catch (e) {
    console.error("recent-sales error", e);
    return new Response(JSON.stringify({ sales: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
