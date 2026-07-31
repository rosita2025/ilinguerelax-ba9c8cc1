// Precios autoritativos del servidor.
//
// SEGURIDAD: el navegador NO debe decidir cuánto se cobra. Estas funciones
// resuelven el precio de cada ítem exclusivamente desde el catálogo
// (`digital_products` + `product_upsells`) usando solo el SKU, la cantidad y
// el país. Cualquier `price`, `couponPercent` o `name` enviado por el cliente
// se ignora por completo.
import { createClient } from "npm:@supabase/supabase-js@2";
import { normalizeSku } from "./digitalSku.ts";

export type RegionTier = "latam" | "global" | "tienda";

const LATAM = new Set([
  "AR", "BO", "BR", "CL", "CO", "CR", "DO", "EC", "SV",
  "GT", "HN", "MX", "PA", "PY", "PE", "PR", "UY",
]);
const TIENDA = new Set(["VE", "CU", "NI"]);

export function tierForCountry(country: string | null | undefined): RegionTier {
  const c = String(country || "").toUpperCase().slice(0, 2);
  if (TIENDA.has(c)) return "tienda";
  return LATAM.has(c) ? "latam" : "global";
}

/** Cupones válidos (espejo servidor de src/stores/checkoutStore.ts). */
const VALID_COUPONS: Record<string, number> = {
  NEW10: 10,
  PRUEBA20: 20,
  RELAX15: 15,
  TEST100: 100,
  GRATIS100: 100,
  DOLAR1: 90,
  PRUEBA1: 90,
};

/** Solo cupones de prueba internos pueden pasar del 30 %. */
const PUBLIC_COUPON_MAX = 30;

export function resolveCouponPercent(code: string | null | undefined): number {
  const upper = String(code || "").trim().toUpperCase();
  if (!upper) return 0;
  const pct = VALID_COUPONS[upper];
  if (typeof pct !== "number") return 0;
  return Math.min(pct, 100);
}

/** Precios promocionales de order-bumps conocidos (no superan el precio base). */
const STATIC_UPSELL_USD: Record<string, number> = {
  "upsell-1000-verbos": 5,
  "upsell-patrones-ingles": 5,
  "upsell-500-preguntas": 4,
};

const DEFAULT_UPSELL_DISCOUNT_PCT = 50;

export interface PricedItem {
  /** Id tal como lo envió el carrito (para entrega/metadata). */
  id: string;
  /** SKU real en digital_products. */
  sku: string;
  name: string;
  description?: string;
  image?: string;
  quantity: number;
  /** Precio unitario USD resuelto por el servidor (sin cupón). */
  unitUsd: number;
}

export interface ResolvedPricing {
  items: PricedItem[];
  couponPercent: number;
  couponCode: string | null;
  /** Total USD ya con cupón aplicado, redondeado a centavos. */
  totalUsd: number;
}

export class PricingError extends Error {}

function serviceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );
}

function pickTierPrice(row: Record<string, unknown>, tier: RegionTier): number {
  const global = Number(row.price_usd) || 0;
  const latam = row.price_usd_latam != null ? Number(row.price_usd_latam) : global;
  const tienda = row.price_usd_tienda != null ? Number(row.price_usd_tienda) : latam;
  const value = tier === "tienda" ? tienda : tier === "latam" ? latam : global;
  return Number.isFinite(value) && value > 0 ? value : global;
}

function safeImage(url: unknown): string | undefined {
  const raw = typeof url === "string" ? url.trim() : "";
  if (!/^https:\/\//i.test(raw)) return undefined;
  try {
    const host = new URL(raw).hostname.toLowerCase();
    const ok = host.endsWith("ilinguerelax.com") ||
      host.endsWith("supabase.co") ||
      host.endsWith("lovable.app");
    return ok ? raw.slice(0, 500) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Resuelve nombres y precios desde el catálogo del servidor.
 * `clientItems` solo aporta id y cantidad; el resto se descarta.
 */
export async function resolveServerPricing(opts: {
  items: Array<{ id: string; quantity: number }>;
  country?: string | null;
  couponCode?: string | null;
  allowTestCoupons?: boolean;
}): Promise<ResolvedPricing> {
  const tier = tierForCountry(opts.country);
  const supabase = serviceClient();

  const wanted = opts.items
    .map((i) => ({ id: String(i.id || "").trim(), quantity: Math.max(1, Math.min(50, Math.trunc(Number(i.quantity) || 1))) }))
    .filter((i) => i.id);
  if (!wanted.length) throw new PricingError("Carrito vacío");

  const skus = Array.from(new Set(wanted.map((i) => normalizeSku(i.id)).filter(Boolean))) as string[];

  const { data: rows, error } = await supabase
    .from("digital_products")
    .select("sku, name, description, cover_image_url, price_usd, price_usd_latam, price_usd_tienda, active, sku_aliases")
    .in("sku", skus);
  if (error) throw new PricingError("No se pudo leer el catálogo");

  const bySku = new Map<string, Record<string, unknown>>();
  for (const row of rows ?? []) {
    bySku.set(String((row as { sku: string }).sku), row as Record<string, unknown>);
  }

  // Descuentos máximos configurados por upsell (para order-bumps).
  const { data: upsellRows } = await supabase
    .from("product_upsells")
    .select("upsell_sku, discount_pct")
    .in("upsell_sku", skus);
  const maxDiscount = new Map<string, number>();
  for (const r of upsellRows ?? []) {
    const sku = String((r as { upsell_sku: string }).upsell_sku);
    const pct = Number((r as { discount_pct: number }).discount_pct) || 0;
    maxDiscount.set(sku, Math.max(maxDiscount.get(sku) ?? 0, Math.min(90, pct)));
  }

  const priced: PricedItem[] = [];
  for (const item of wanted) {
    const sku = normalizeSku(item.id);
    if (!sku) throw new PricingError(`Producto no válido: ${item.id}`);
    const row = bySku.get(sku);
    if (!row || row.active === false) {
      throw new PricingError(`Producto no disponible: ${item.id}`);
    }

    let unit = pickTierPrice(row, tier);

    if (item.id.toLowerCase().startsWith("upsell-")) {
      const pct = maxDiscount.get(sku) ?? DEFAULT_UPSELL_DISCOUNT_PCT;
      const discounted = unit * (1 - pct / 100);
      const staticPrice = STATIC_UPSELL_USD[item.id.toLowerCase()];
      const candidates = [discounted, ...(staticPrice ? [staticPrice] : [])];
      unit = Math.min(...candidates);
    }

    unit = Math.round(unit * 100) / 100;
    if (!(unit > 0)) throw new PricingError(`Precio no configurado: ${item.id}`);

    priced.push({
      id: item.id,
      sku,
      name: String(row.name || item.id).slice(0, 200),
      description: row.description ? String(row.description).slice(0, 500) : undefined,
      image: safeImage(row.cover_image_url),
      quantity: item.quantity,
      unitUsd: unit,
    });
  }

  let couponPercent = resolveCouponPercent(opts.couponCode);
  if (!opts.allowTestCoupons) couponPercent = Math.min(couponPercent, PUBLIC_COUPON_MAX);
  const couponCode = couponPercent > 0 ? String(opts.couponCode).trim().toUpperCase() : null;

  const totalCents = priced.reduce(
    (sum, i) => sum + Math.round(i.unitUsd * (1 - couponPercent / 100) * 100) * i.quantity,
    0,
  );

  return {
    items: priced,
    couponPercent,
    couponCode,
    totalUsd: Math.round(totalCents) / 100,
  };
}
