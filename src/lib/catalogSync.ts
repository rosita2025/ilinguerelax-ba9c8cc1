// Resilient catalog update subscriber.
// Falls back gracefully when BroadcastChannel or storage events fail,
// and always re-fetches when the tab becomes visible again (incl. bfcache).

export type CatalogUpdatePayload = { type?: string; sku?: string; version?: number };

type Options = {
  sku?: string;
  onUpdate: () => void;
  /** Poll interval as last-resort fallback (ms). 0 to disable. */
  pollMs?: number;
};

const CHANNEL = "ilr-catalog";
const STORAGE_KEY = "ilr-catalog-updated";

function safe(fn: () => void) {
  try { fn(); } catch (e) { console.warn("[catalogSync]", e); }
}

export function subscribeCatalogUpdates({ sku, onUpdate, pollMs = 0 }: Options): () => void {
  let disposed = false;
  const trigger = (reason: string) => {
    if (disposed) return;
    try { onUpdate(); } catch (e) { console.warn("[catalogSync] onUpdate failed", reason, e); }
  };

  // 1) BroadcastChannel with reconnect on error.
  let bc: BroadcastChannel | null = null;
  let bcRetry = 0;
  const setupBC = () => {
    if (disposed) return;
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    try {
      bc = new BroadcastChannel(CHANNEL);
      bc.onmessage = (ev) => {
        const data = ev?.data as CatalogUpdatePayload | undefined;
        if (!data) return;
        if (data.type && data.type !== "product-updated") return;
        if (sku && data.sku && data.sku !== sku) return;
        trigger("broadcast");
      };
      bc.onmessageerror = () => {
        console.warn("[catalogSync] BroadcastChannel messageerror — refetching");
        trigger("bc-messageerror");
      };
    } catch (e) {
      console.warn("[catalogSync] BroadcastChannel setup failed", e);
      bc = null;
      if (bcRetry++ < 3) setTimeout(setupBC, 500 * bcRetry);
    }
  };
  setupBC();

  // 2) localStorage `storage` event (cross-tab) with try/catch.
  const onStorage = (e: StorageEvent) => {
    try {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      const [changedSku] = e.newValue.split(":");
      if (sku && changedSku && changedSku !== sku) return;
      trigger("storage");
    } catch (err) {
      console.warn("[catalogSync] storage handler error", err);
      trigger("storage-error");
    }
  };

  // 3) Tab becomes visible / focused / restored from bfcache → always refetch.
  const onVis = () => { if (document.visibilityState === "visible") trigger("visibility"); };
  const onFocus = () => trigger("focus");
  const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) trigger("pageshow-bfcache"); };
  const onOnline = () => trigger("online");

  safe(() => window.addEventListener("storage", onStorage));
  safe(() => document.addEventListener("visibilitychange", onVis));
  safe(() => window.addEventListener("focus", onFocus));
  safe(() => window.addEventListener("pageshow", onPageShow));
  safe(() => window.addEventListener("online", onOnline));

  // 4) Optional polling as absolute last resort.
  let pollId: ReturnType<typeof setInterval> | null = null;
  if (pollMs > 0) {
    pollId = setInterval(() => {
      if (document.visibilityState === "visible") trigger("poll");
    }, pollMs);
  }

  return () => {
    disposed = true;
    safe(() => window.removeEventListener("storage", onStorage));
    safe(() => document.removeEventListener("visibilitychange", onVis));
    safe(() => window.removeEventListener("focus", onFocus));
    safe(() => window.removeEventListener("pageshow", onPageShow));
    safe(() => window.removeEventListener("online", onOnline));
    if (pollId) clearInterval(pollId);
    try { bc?.close(); } catch { /* noop */ }
    bc = null;
  };
}

/** Publisher: broadcast a catalog change with graceful degradation. */
export function publishCatalogUpdate(sku: string, version: number = Date.now()) {
  try {
    localStorage.setItem(STORAGE_KEY, `${sku}:${version}`);
  } catch (e) {
    console.warn("[catalogSync] localStorage.setItem failed", e);
  }
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(CHANNEL);
      bc.postMessage({ type: "product-updated", sku, version });
    } catch (e) {
      console.warn("[catalogSync] BroadcastChannel post failed", e);
    } finally {
      try { bc?.close(); } catch { /* noop */ }
    }
  }
}
