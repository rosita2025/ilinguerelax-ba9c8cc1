import { lazy, type ComponentType } from "react";

/**
 * Wraps React.lazy with automatic recovery for stale chunk hashes.
 *
 * Problem: after a redeploy, users with an old index.html cached in the browser
 * try to fetch `/assets/Checkout-<oldHash>.js`. That file no longer exists and
 * the SPA fallback returns index.html, which the browser tries to parse as JS
 * and throws "Unexpected token '<'" → white screen (React error boundary
 * unmounts the tree).
 *
 * Fix: catch the import failure and hard-reload once (guarded by sessionStorage
 * so we never loop). The reload pulls the fresh index.html with the new
 * chunk hashes and the page renders normally.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    const RELOAD_KEY = "ilr:chunk-reloaded";
    try {
      const mod = await factory();
      // Successful load → clear the flag so future stale-chunk errors can reload again.
      try { window.sessionStorage.removeItem(RELOAD_KEY); } catch { /* ignore */ }
      return mod;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isChunkError =
        /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|Unexpected token '<'/i.test(
          message,
        );
      if (!isChunkError) throw err;

      let alreadyReloaded = false;
      try { alreadyReloaded = window.sessionStorage.getItem(RELOAD_KEY) === "1"; } catch { /* ignore */ }

      if (!alreadyReloaded) {
        try { window.sessionStorage.setItem(RELOAD_KEY, "1"); } catch { /* ignore */ }
        window.location.reload();
        // Return a stub while the browser reloads so React doesn't crash mid-render.
        return { default: (() => null) as unknown as T };
      }
      throw err;
    }
  });
}
