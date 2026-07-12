import { useEffect, useState } from "react";
import { getSubdomainRegion, type RegionConfig } from "@/lib/subdomainRegion";

/**
 * Returns the active RegionConfig for the current subdomain, or null when
 * running on the root domain / a non-production host. Stable across renders.
 */
export function useSubdomainRegion(): RegionConfig | null {
  const [region, setRegion] = useState<RegionConfig | null>(() => getSubdomainRegion());

  // Re-read on hydration to cover SSR-like initial paints.
  useEffect(() => {
    setRegion(getSubdomainRegion());
  }, []);

  return region;
}
