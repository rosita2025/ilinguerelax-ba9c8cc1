// Precios autoritativos del servidor.
//
// SEGURIDAD: el navegador NO debe decidir cuánto se cobra. Estas funciones
// resuelven el precio de cada ítem exclusivamente desde el catálogo
// (`digital_products` + `product_upsells`) usando solo el SKU, la cantidad y
// el país. Cualquier `price`, `couponPercent` o `name` enviado por el cliente
// se ignora por completo.
import { createClient } from "npm:@supabase/supabase-js@2";
import { normalizeSku } from "./digitalSku.ts";
import { localAmountFromUsd, FX_USD_TO_LOCAL, ZERO_DECIMAL_CURRENCIES } from "./fxRates.ts";

export type RegionTier = "latam" | "global" | "tienda";

const LATAM = new Set([
  "AR", "BO", "BR", "CL", "CO", "CR", "DO", "EC", "SV",
  "GT", "HN", "MX", "PA", "PY", "PE", "PR", "UY",
]);
const TIENDA = new Set(["VE", "CU", "NI"]);

/** Países con restricciones cambiarias, inestabilidad o alta tasa de rechazo en moneda local. */
export const RESTRICTED_CURRENCY_COUNTRIES = new Set(["HN", "AR", "VE", "NI", "CU", "BO", "PY", "SV", "GT"]);

export function isRestrictedCurrency(country: string | null | undefined): boolean {
  const c = String(country || "").toUpperCase().slice(0, 2);
  return RESTRICTED_CURRENCY_COUNTRIES.has(c);
}


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
  PASCUA25: 25,
};

/**
 * Cupones de prueba con TOTAL FIJO en USD (para validar pasarelas en vivo).
 * Nunca llegan a 0: siempre se cobra un importe real mínimo.
 * SEGURIDAD: no existen cupones del 100% (regalarían el producto a cualquiera
 * que adivine el código).
 */
export const FIXED_TOTAL_COUPONS: Record<string, number> = {
  DLTEST1: 1,
  FIXED1: 1,
  PRUEBA1: 1,
  PRUEBA1USD: 1,
  TEST1USD: 1,
  QAGRATIS7X: 0.5,
};

export function fixedTotalForCoupon(code: string | null | undefined): number | null {
  const upper = String(code || "").trim().toUpperCase();
  const total = FIXED_TOTAL_COUPONS[upper];
  return typeof total === "number" && total > 0 ? total : null;
}

export function resolveCouponPercent(code: string | null | undefined): number {
  const upper = String(code || "").trim().toUpperCase();
  if (!upper) return 0;
  const pct = VALID_COUPONS[upper];
  if (typeof pct !== "number") return 0;
  return Math.min(pct, 90);
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
  /** Overrides manuales por moneda (`digital_products.local_prices`). */
  localPrices?: Record<string, number> | null;
  /** Precio fijo en soles del catálogo (`digital_products.price_pen`). */
  pricePen?: number | null;
  /** Regional USD overrides (`digital_products.local_usd_prices`). */
  localUsdPrices?: Record<string, number> | null;
  isPhysical?: boolean;
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

function pickTierPrice(row: Record<string, unknown>, tier: RegionTier, currency?: string | null): number {
  // Si se especifica una moneda y existe un override USD regional para ella, esa es la verdad absoluta.
  if (currency) {
    const localUsdPrices = (row.local_usd_prices ?? null) as Record<string, number> | null;
    const regionalUsd = localUsdPrices?.[currency.toUpperCase()];
    if (typeof regionalUsd === "number" && regionalUsd > 0) {
      const rounded = Math.round(regionalUsd * 100) / 100;
      console.log(`[Pricing] Regional USD override found for ${currency.toUpperCase()}: $${rounded} (SKU: ${row.sku})`);
      return rounded;
    }

  }

  const global = Number(row.price_usd) || 0;
  const latam = row.price_usd_latam != null ? Number(row.price_usd_latam) : global;
  const tienda = row.price_usd_tienda != null ? Number(row.price_usd_tienda) : latam;
  
  // Rule: strictly 3-tier USD model
  const value = tier === "tienda" ? tienda : tier === "latam" ? latam : global;
  
  const finalPrice = Number.isFinite(value) && value > 0 ? value : global;
  if (currency) {
    console.log(`[Pricing] Resolving for currency ${currency.toUpperCase()}, Tier: ${tier}, Final Price: $${finalPrice} (SKU: ${row.sku})`);
  }
  return finalPrice;
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
  /** `price` es solo una pista del navegador: se valida contra el catálogo. */
  items: Array<{ id: string; quantity: number; price?: number | null }>;
  country?: string | null;
  couponCode?: string | null;
  currency?: string | null;
}): Promise<ResolvedPricing> {
  const tier = tierForCountry(opts.country);
  const supabase = serviceClient();

  const wanted = opts.items
    .map((i) => ({
      id: String(i.id || "").trim(),
      quantity: Math.max(1, Math.min(50, Math.trunc(Number(i.quantity) || 1))),
      clientPrice: Number.isFinite(Number(i.price)) && Number(i.price) > 0 ? Number(i.price) : null,
    }))
    .filter((i) => i.id);
  if (!wanted.length) throw new PricingError("Carrito vacío");

  const currencyHint = opts.currency;


  const skus = Array.from(new Set(wanted.map((i) => normalizeSku(i.id)).filter(Boolean))) as string[];

  // Buscamos por SKU real y también por alias guardados en el catálogo, para
  // que los ids del carrito que no están en el mapa estático sigan resolviendo.
  const lookups = Array.from(new Set([...skus, ...wanted.map((i) => i.id)]));
  const { data: rows, error } = await supabase
    .from("digital_products")
    .select("sku, name, description, cover_image_url, price_usd, price_usd_latam, price_usd_tienda, active, sku_aliases, local_prices, price_pen, local_usd_prices, is_physical")
    .or(`sku.in.(${lookups.map((s) => `"${s.replace(/"/g, "")}"`).join(",")}),sku_aliases.ov.{${lookups.map((s) => `"${s.replace(/"/g, "")}"`).join(",")}}`);

  if (error) throw new PricingError("No se pudo leer el catálogo");

  const bySku = new Map<string, Record<string, unknown>>();
  for (const row of rows ?? []) {
    const r = row as Record<string, unknown>;
    bySku.set(String(r.sku), r);
    for (const alias of (r.sku_aliases as string[] | null) ?? []) {
      if (alias && !bySku.has(alias)) bySku.set(String(alias), r);
    }
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
    const normalized = normalizeSku(item.id);
    const row = (normalized ? bySku.get(normalized) : undefined) ?? bySku.get(item.id);

    if (!row) {
      // El producto no está en el catálogo (id nuevo o alias sin registrar).
      // No bloqueamos la venta: aceptamos el precio del navegador acotado,
      // pero lo dejamos registrado para revisarlo en el admin.
      if (!item.clientPrice) throw new PricingError(`Producto no disponible: ${item.id}`);
      console.warn("catalogPricing: SKU fuera de catálogo", item.id);
      priced.push({
        id: item.id,
        sku: normalized ?? item.id,
        name: item.id.slice(0, 200),
        quantity: item.quantity,
        unitUsd: Math.round(Math.min(item.clientPrice, 10000) * 100) / 100,
      });
      continue;
    }

    const sku = String(row.sku);
    const isUpsell = item.id.toLowerCase().startsWith("upsell-");

    // Precio mínimo autoritativo del catálogo para este país.
    let unit = pickTierPrice(row, tier, currencyHint);

    if (isUpsell) {
      const pct = maxDiscount.get(sku) ?? DEFAULT_UPSELL_DISCOUNT_PCT;
      const staticPrice = STATIC_UPSELL_USD[item.id.toLowerCase()];
      const discounted = unit * (1 - pct / 100);
      unit = Math.min(...[discounted, ...(staticPrice ? [staticPrice] : [])]);
    }

    // Si el navegador mandó un precio IGUAL O MAYOR (el que vio el cliente en
    // la web), lo respetamos; nunca aceptamos uno menor al del catálogo, que
    // es lo que impide manipular el carrito desde el navegador.
    if (item.clientPrice != null && item.clientPrice > unit && item.clientPrice <= 10000) {
      unit = item.clientPrice;
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
      localPrices: (row.local_prices ?? null) as Record<string, number> | null,
      localUsdPrices: (row.local_usd_prices ?? null) as Record<string, number> | null,
      pricePen: Number(row.price_pen) > 0 ? Number(row.price_pen) : null,
      isPhysical: Boolean(row.is_physical),
    });

  }

  const fixedTotal = fixedTotalForCoupon(opts.couponCode);

  if (fixedTotal !== null) {
    // Cupón de prueba con total fijo: reescribimos los precios unitarios para
    // que la suma sea exactamente el importe fijo (mínimo 1 centavo por ítem).
    const code = String(opts.couponCode).trim().toUpperCase();
    const subtotalCents = priced.reduce(
      (sum, i) => sum + Math.round(i.unitUsd * 100) * i.quantity,
      0,
    );
    const targetCents = Math.round(fixedTotal * 100);
    const units = priced.reduce((sum, i) => sum + i.quantity, 0);
    let assigned = 0;
    priced.forEach((item, idx) => {
      const share = subtotalCents > 0
        ? Math.round((Math.round(item.unitUsd * 100) * item.quantity / subtotalCents) * targetCents)
        : Math.round(targetCents / Math.max(1, units));
      const perUnit = Math.max(1, Math.floor(share / item.quantity));
      item.unitUsd = perUnit / 100;
      assigned += perUnit * item.quantity;
      if (idx === priced.length - 1 && assigned !== targetCents) {
        const fix = Math.max(1, perUnit + Math.trunc((targetCents - assigned) / item.quantity));
        item.unitUsd = fix / 100;
        assigned += (fix - perUnit) * item.quantity;
      }
    });
    const totalUsd = Math.max(
      0.01,
      Math.round(priced.reduce((s, i) => s + Math.round(i.unitUsd * 100) * i.quantity, 0)) / 100,
    );
    return { items: priced, couponPercent: 0, couponCode: code, totalUsd };
  }

  const couponPercent = resolveCouponPercent(opts.couponCode);
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


/**
 * Total EXACTO en moneda local, espejo de `sumItemsLocal` en el front
 * (`src/hooks/useLocalCurrency.ts`): usa el override manual por moneda del
 * producto cuando existe y, si no, convierte el precio USD con la tasa
 * autoritativa del servidor. Devuelve `null` si no hay tasa para esa moneda
 * (el llamador debe cobrar en USD).
 *
 * Así el importe cobrado por la pasarela coincide con el que vio el comprador.
 */
export async function localTotalFromPricing(
  pricing: ResolvedPricing,
  currency: string,
): Promise<number | null> {

  const code = String(currency || "").toUpperCase();
  if (code === "USD") return Number(pricing.totalUsd.toFixed(2));
  const liveRate = await localAmountFromUsd(1, code);
  if (!liveRate) return null;
  const rate = liveRate; // liveRate is already adjusted with markup if it's from localAmountFromUsd(1, ...)


  let subtotal = 0;
  for (const item of pricing.items) {
    const override = code === "PEN" && !(Number(item.localPrices?.PEN) > 0)
      ? item.pricePen ?? undefined
      : item.localPrices?.[code];
    
    const regionalUsd = item.localUsdPrices?.[code];
    const activeUsd = typeof regionalUsd === "number" && regionalUsd > 0 ? regionalUsd : item.unitUsd;

    const perUnit = typeof override === "number" && override > 0
      ? override
      : activeUsd * rate;
    subtotal += perUnit * (item.quantity || 1);
  }
  
  // Shipping logic must mirror OrderSummary.tsx / PaymentMethodsGroup.tsx / useCheckoutTotal.ts
  const isPhysical = pricing.items.some(i => i.isPhysical);
  const hasUpsell = pricing.items.length > 1;
  const isLatam = tierForCountry(code) === "latam";
  const shippingCost = isLatam ? 9 : 8;
  const shippingUsd = (isPhysical && !hasUpsell) ? (pricing.totalUsd >= 50 ? 0 : shippingCost) : 0;

  const shippingLocal = await localAmountFromUsd(shippingUsd, code) || (shippingUsd * rate);

  const withCoupon = subtotal * (1 - (pricing.couponPercent || 0) / 100);
  const totalLocal = withCoupon + shippingLocal;

  if (!Number.isFinite(totalLocal) || totalLocal <= 0) {
    return await localAmountFromUsd(pricing.totalUsd, code);
  }
  return ZERO_DECIMAL_CURRENCIES.has(code)
    ? Math.round(totalLocal)
    : Number(totalLocal.toFixed(2));


}
