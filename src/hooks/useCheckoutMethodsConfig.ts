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
export interface CheckoutMethodsConfig {
  loaded: boolean;
  regionCode: string | null;
  stripe: boolean;
  paypal: boolean;
  transfer: boolean;
  cash: boolean;
  yape: boolean;
}

const DEFAULT_ALL_ON: Omit<CheckoutMethodsConfig, "regionCode" | "loaded"> = {
  stripe: true, paypal: true, transfer: true, cash: true, yape: true,
};

interface RegionRow { code: string; country_codes: string[] | null; enabled: boolean; sort_order: number | null }
interface MethodRow { region_code: string; method_key: string; enabled: boolean }

// Cache en memoria — las regiones cambian poquísimo, así evitamos re-consulta
// en cada montaje de <PaymentMethodsGroup />.
let cachePromise: Promise<{ regions: RegionRow[]; methods: MethodRow[] }> | null = null;

async function loadAll() {
  if (!cachePromise) {
    cachePromise = (async () => {
      const [{ data: regions }, { data: methods }] = await Promise.all([
        supabase.from("checkout_regions").select("code, country_codes, enabled, sort_order").eq("enabled", true),
        supabase.from("checkout_payment_methods").select("region_code, method_key, enabled").eq("enabled", true),
      ]);
      return {
        regions: (regions ?? []) as RegionRow[],
        methods: (methods ?? []) as MethodRow[],
      };
    })().catch(() => ({ regions: [], methods: [] }));
  }
  return cachePromise;
}

function keyToFamily(key: string): keyof typeof DEFAULT_ALL_ON | null {
  const k = key.toLowerCase();
  if (k.startsWith("stripe_")) return "stripe";
  if (k === "paypal" || k.includes("paypal")) return "paypal";
  if (k.includes("yape") || k.includes("plin")) return "yape";
  if (k.includes("transfer") || k.includes("ach") || k.includes("bank")) return "transfer";
  if (k.includes("cash") || k.includes("efectivo") || k.includes("oxxo") || k.includes("boleto") || k.includes("konbini")) return "cash";
  return null;
}

export function useCheckoutMethodsConfig(country: string): CheckoutMethodsConfig {
  const [state, setState] = useState<CheckoutMethodsConfig>({
    loaded: false, regionCode: null, ...DEFAULT_ALL_ON,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      const { regions, methods } = await loadAll();
      const iso = (country || "").toUpperCase();
      // Match: región cuyos country_codes contienen el país; si ninguno matchea,
      // fallback a una región con country_codes vacío (comodín) — por convención
      // ese es "GLOBAL".
      let region = regions
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .find((r) => Array.isArray(r.country_codes) && r.country_codes.includes(iso));
      if (!region) {
        region = regions.find((r) => !r.country_codes || r.country_codes.length === 0)
          ?? regions.find((r) => r.code.toUpperCase() === "GLOBAL");
      }
      if (!region) {
        // No hay ninguna región configurada — deja todo habilitado (compat).
        if (alive) setState({ loaded: true, regionCode: null, ...DEFAULT_ALL_ON });
        return;
      }
      const enabledFamilies = { stripe: false, paypal: false, transfer: false, cash: false, yape: false };
      for (const m of methods) {
        if (m.region_code !== region.code) continue;
        const fam = keyToFamily(m.method_key);
        if (fam) enabledFamilies[fam] = true;
      }
      // Si la región existe pero no tiene métodos cargados, no bloquees el checkout.
      const anyEnabled = Object.values(enabledFamilies).some(Boolean);
      const families = anyEnabled ? enabledFamilies : DEFAULT_ALL_ON;
      if (alive) setState({ loaded: true, regionCode: region.code, ...families });
    })();
    return () => { alive = false; };
  }, [country]);

  return state;
}
