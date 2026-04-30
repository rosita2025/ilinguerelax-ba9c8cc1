import { useEffect, useState } from "react";

/**
 * Lightweight A/B testing hook.
 * - Assigns a variant deterministically per browser (localStorage)
 * - Fires a single exposure event to Meta Pixel + GA + dataLayer
 * - SSR-safe: returns null until hydrated to avoid layout flash
 */
export function useAbTest<T extends string>(
  experimentId: string,
  variants: readonly T[],
  weights?: readonly number[]
): T | null {
  const [variant, setVariant] = useState<T | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || variants.length === 0) return;
    const storageKey = `ab_${experimentId}`;
    let assigned = window.localStorage.getItem(storageKey) as T | null;

    if (!assigned || !variants.includes(assigned)) {
      // Weighted random assignment (defaults to equal split)
      const w = weights && weights.length === variants.length ? weights : variants.map(() => 1);
      const total = w.reduce((a, b) => a + b, 0);
      let r = Math.random() * total;
      assigned = variants[0];
      for (let i = 0; i < variants.length; i++) {
        r -= w[i];
        if (r <= 0) {
          assigned = variants[i];
          break;
        }
      }
      window.localStorage.setItem(storageKey, assigned);
    }

    setVariant(assigned);

    // Fire exposure event once per session per experiment
    const sessionKey = `ab_exposed_${experimentId}_${assigned}`;
    if (!window.sessionStorage.getItem(sessionKey)) {
      window.sessionStorage.setItem(sessionKey, "1");
      const payload = { experiment_id: experimentId, variant: assigned };
      try {
        // Meta Pixel
        (window as any).fbq?.("trackCustom", "ABTestExposure", payload);
        // GA4 / GTM
        (window as any).gtag?.("event", "ab_test_exposure", payload);
        (window as any).dataLayer?.push({ event: "ab_test_exposure", ...payload });
      } catch {
        /* no-op */
      }
    }
  }, [experimentId, variants, weights]);

  return variant;
}