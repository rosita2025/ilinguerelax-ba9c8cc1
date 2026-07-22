import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Bandera de qué familias de método de pago (las 4 que el checkout implementa
 * realmente) están habilitadas para la región del comprador. Se calcula a
 * partir de las tablas `checkout_regions` + `checkout_payment_methods` que
 * edita el admin en `/admin/checkout-methods`.
 *
 * Fallback: si no hay región configurada o falla la consulta, TODAS quedan
 * habilitadas para no romper el checkout existente.
 */
export type FamilyKey = "stripe" | "stripeAch" | "stripeCashApp" | "stripeKlarna" | "paypal" | "transfer" | "cash" | "yape" | "binance" | "clabe";

export interface CheckoutMethodsConfig {
  loaded: boolean;
  regionCode: string | null;
  /** Exact enabled method keys for the matched region (ex: stripe_card, stripe_oxxo). */
  enabledMethodKeys: string[];
  stripe: boolean;
  stripeAch: boolean;
  stripeCashApp: boolean;
  stripeKlarna: boolean;
  paypal: boolean;
  transfer: boolean;
  cash: boolean;
  yape: boolean;
  binance: boolean;
  clabe: boolean;
  /** Orden de las familias según el sort_order más bajo en la región activa. */
  familyOrder: FamilyKey[];
}

const DEFAULT_ORDER: FamilyKey[] = ["stripe", "stripeAch", "stripeCashApp", "stripeKlarna", "paypal", "transfer", "cash", "yape", "binance", "clabe"];

const DEFAULT_ALL_ON: Omit<CheckoutMethodsConfig, "regionCode" | "loaded" | "enabledMethodKeys" | "familyOrder"> = {
  stripe: true, stripeAch: false, stripeCashApp: false, stripeKlarna: false, paypal: true, transfer: true, cash: true, yape: true, binance: true, clabe: true,
};

const US_DEFAULT: Omit<CheckoutMethodsConfig, "regionCode" | "loaded" | "enabledMethodKeys" | "familyOrder"> = {
  stripe: true, stripeAch: true, stripeCashApp: true, stripeKlarna: true, paypal: true, transfer: false, cash: false, yape: false, binance: true, clabe: false,
};


interface RegionRow { code: string; country_codes: string[] | null; enabled: boolean; sort_order: number | null }
interface MethodRow { region_code: string; method_key: string; enabled: boolean; sort_order: number | null }

// Cache en memoria con TTL corto — evita re-consulta en cada montaje pero
// permite ver cambios del admin sin recargar la pestaña por completo.
const CACHE_TTL_MS = 3_000;
let cachePromise: Promise<{ regions: RegionRow[]; methods: MethodRow[] }> | null = null;
let cacheAt = 0;
const CACHE_VERSION_KEY = "ilr_checkout_methods_version";
const BROADCAST_NAME = "ilr_checkout_methods";
const SAME_TAB_EVENT = "ilr:checkout-methods-invalidated";

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  const w = window as unknown as { __ilrCheckoutMethodsBC?: BroadcastChannel };
  if (!w.__ilrCheckoutMethodsBC) {
    try { w.__ilrCheckoutMethodsBC = new BroadcastChannel(BROADCAST_NAME); } catch { return null; }
  }
  return w.__ilrCheckoutMethodsBC ?? null;
}

export function invalidateCheckoutMethodsCache() {
  cachePromise = null;
  cacheAt = 0;
  const stamp = String(Date.now());
  try { localStorage.setItem(CACHE_VERSION_KEY, stamp); } catch { /* noop */ }
  try { getBroadcastChannel()?.postMessage({ type: "invalidate", stamp }); } catch { /* noop */ }
  try { window.dispatchEvent(new CustomEvent(SAME_TAB_EVENT, { detail: stamp })); } catch { /* noop */ }
}

async function loadAll() {
  if (cachePromise && Date.now() - cacheAt < CACHE_TTL_MS) return cachePromise;
  cacheAt = Date.now();
  cachePromise = (async () => {
    const [{ data: regions }, { data: methods }] = await Promise.all([
      supabase.from("checkout_regions").select("code, country_codes, enabled, sort_order").eq("enabled", true),
      supabase.from("checkout_payment_methods").select("region_code, method_key, enabled, sort_order"),
    ]);
    return {
      regions: (regions ?? []) as RegionRow[],
      methods: (methods ?? []) as MethodRow[],
    };
  })().catch(() => ({ regions: [], methods: [] }));
  return cachePromise;
}

function keyToFamily(key: string): FamilyKey | null {
  const k = key.toLowerCase();
  if (k === "stripe_us_bank_account") return "stripeAch";
  if (k === "stripe_cashapp") return "stripeCashApp";
  if (k === "stripe_klarna") return "stripeKlarna";
  if (k.startsWith("stripe_")) return "stripe";
  if (k === "paypal") return "paypal";
  if (k === "yape_plin") return "yape";
  if (k === "binance_pay") return "binance";

  if (k === "mercadopago_transfer") return "transfer";
  if (k === "mercadopago_cash") return "cash";
  return null;
}

export function useCheckoutMethodsConfig(country: string): CheckoutMethodsConfig {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<CheckoutMethodsConfig>({
    loaded: false, regionCode: null, enabledMethodKeys: [], ...DEFAULT_ALL_ON, familyOrder: DEFAULT_ORDER,
  });

  useEffect(() => {
    const bump = () => {
      cachePromise = null;
      cacheAt = 0;
      setVersion((v) => v + 1);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === CACHE_VERSION_KEY) bump();
    };
    const onSameTab = () => bump();
    const onFocus = () => bump();
    const onVisibility = () => { if (document.visibilityState === "visible") bump(); };
    const bc = getBroadcastChannel();
    const onMessage = (ev: MessageEvent) => {
      if (ev?.data?.type === "invalidate") bump();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(SAME_TAB_EVENT, onSameTab as EventListener);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    bc?.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SAME_TAB_EVENT, onSameTab as EventListener);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      bc?.removeEventListener("message", onMessage);
    };
  }, []);



  useEffect(() => {
    let alive = true;
    (async () => {
      const { regions, methods } = await loadAll();
      const iso = (country || "").toUpperCase();
      let region = regions
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .find((r) => Array.isArray(r.country_codes) && r.country_codes.includes(iso));
      if (!region) {
        region = regions.find((r) => !r.country_codes || r.country_codes.length === 0)
          ?? regions.find((r) => r.code.toUpperCase() === "GLOBAL");
      }
      if (!region) {
        if (alive) setState({ loaded: true, regionCode: null, enabledMethodKeys: [], ...DEFAULT_ALL_ON, familyOrder: DEFAULT_ORDER });
        return;
      }
      const enabledFamilies = { stripe: false, stripeAch: false, stripeCashApp: false, stripeKlarna: false, paypal: false, transfer: false, cash: false, yape: false, binance: false };
      const familyMinOrder: Record<FamilyKey, number> = { stripe: Infinity, stripeAch: Infinity, stripeCashApp: Infinity, stripeKlarna: Infinity, paypal: Infinity, transfer: Infinity, cash: Infinity, yape: Infinity, binance: Infinity };

      const enabledMethodKeys: string[] = [];
      let configuredMethods = 0;
      for (const m of methods) {
        if (m.region_code !== region.code) continue;
        configuredMethods += 1;
        if (!m.enabled) continue;
        enabledMethodKeys.push(m.method_key.toLowerCase());
        const fam = keyToFamily(m.method_key);
        if (!fam) continue;
        enabledFamilies[fam] = true;
        const ord = m.sort_order ?? 999;
        if (ord < familyMinOrder[fam]) familyMinOrder[fam] = ord;
      }
      const families = configuredMethods > 0 ? enabledFamilies : (iso === "US" ? US_DEFAULT : DEFAULT_ALL_ON);
      const familyOrder = (Object.keys(familyMinOrder) as FamilyKey[])
        .sort((a, b) => (familyMinOrder[a] - familyMinOrder[b]) || (DEFAULT_ORDER.indexOf(a) - DEFAULT_ORDER.indexOf(b)));
      if (alive) setState({ loaded: true, regionCode: region.code, enabledMethodKeys, ...families, familyOrder });
    })();
    return () => { alive = false; };
  }, [country, version]);

  return state;
}

