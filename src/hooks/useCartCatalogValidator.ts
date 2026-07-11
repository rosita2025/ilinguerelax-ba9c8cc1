import { useEffect } from "react";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { CHECKOUT_CATALOG } from "@/config/checkoutCatalog";
import { supabase } from "@/integrations/supabase/client";

/**
 * On mount, builds the allow-list of valid cart line IDs from:
 *   - static CHECKOUT_CATALOG (product ids + upsell ids + admin skus)
 *   - live `digital_products.sku` from admin
 * Then purges any cart line whose id is unknown (fantasma / SKU legado / cache
 * envenenado por bots / cambios de catálogo). Runs once per page load.
 */
export function useCartCatalogValidator() {
  const pruneUnknown = useCheckoutPruebaStore((s) => s.pruneUnknown);

  useEffect(() => {
    let cancelled = false;

    const staticIds = new Set<string>();
    Object.values(CHECKOUT_CATALOG).forEach((item) => {
      staticIds.add(item.id);
      if (item.adminSku) staticIds.add(item.adminSku);
      item.upsells?.forEach((u) => staticIds.add(u.id));
    });

    // First pass: prune anything not in the static catalog immediately so bad
    // items disappear even if the network call fails or is slow.
    // BUT only if the admin fetch fails — otherwise we'd nuke valid dynamic SKUs.
    // So we defer pruning until we have the admin allow-list.

    (async () => {
      const valid = new Set(staticIds);
      try {
        const { data } = await supabase
          .from("digital_products")
          .select("sku")
          .eq("active", true);
        if (cancelled) return;
        (data ?? []).forEach((r: { sku: string }) => valid.add(r.sku));
      } catch {
        // If the fetch fails, only the static allow-list is used.
      }
      if (cancelled) return;
      pruneUnknown(valid);
    })();

    return () => {
      cancelled = true;
    };
  }, [pruneUnknown]);
}
