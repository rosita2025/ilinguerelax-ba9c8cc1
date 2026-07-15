/**
 * Consistent client identifier shared between GA4 and internal funnel events.
 *
 * GA4 stores its client id in the `_ga` cookie with the format
 *   `GA1.1.<clientId>.<timestamp>`
 * We reuse `<clientId>.<timestamp>` as the canonical id so the same browser is
 * attributed identically on both sides, reducing metric discrepancies between
 * GA4 Realtime and our own `funnel_events` table.
 *
 * If the `_ga` cookie is missing (adblock, first paint before gtag hydrates,
 * Safari ITP), we generate a stable id in localStorage AND push it back into
 * gtag via `gtag('config', ..., { client_id })` so GA4 adopts the same value
 * once it initialises.
 */

const LS_KEY = "ilr_client_id";
const GA4_MEASUREMENT_ID = "G-0RJ3QZNYKJ";

const readGaCookie = (): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)_ga=([^;]+)/);
  if (!match) return null;
  // Value: GA1.1.<clientId>.<timestamp>
  const parts = decodeURIComponent(match[1]).split(".");
  if (parts.length >= 4) return `${parts[2]}.${parts[3]}`;
  return null;
};

const generateFallback = (): string => {
  const rand = Math.floor(Math.random() * 1e10).toString();
  const ts = Math.floor(Date.now() / 1000).toString();
  return `${rand}.${ts}`;
};

const pushToGtag = (clientId: string) => {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (typeof w.gtag !== "function") return;
  try {
    w.gtag("config", GA4_MEASUREMENT_ID, { client_id: clientId, send_page_view: false });
  } catch {
    /* noop */
  }
};

let cached: string | null = null;

export const getClientId = (): string => {
  if (cached) return cached;
  if (typeof window === "undefined") return "ssr";

  // Prefer GA4's own cookie so both systems truly share the id.
  const fromCookie = readGaCookie();
  if (fromCookie) {
    cached = fromCookie;
    try {
      localStorage.setItem(LS_KEY, fromCookie);
    } catch {
      /* noop */
    }
    return fromCookie;
  }

  // Fallback: reuse a locally stored id or mint a new one, then hand it to GA4.
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(LS_KEY);
  } catch {
    stored = null;
  }
  const id = stored && stored.length > 4 ? stored : generateFallback();
  if (!stored) {
    try {
      localStorage.setItem(LS_KEY, id);
    } catch {
      /* noop */
    }
  }
  cached = id;
  pushToGtag(id);
  return id;
};

/**
 * Called once at app start to reconcile with GA4 as soon as the tag hydrates.
 * After a short delay we re-read the `_ga` cookie; if GA4 minted its own id we
 * adopt it, otherwise we ensure GA4 uses ours.
 */
export const initClientIdSync = () => {
  if (typeof window === "undefined") return;
  const settle = () => {
    const fromCookie = readGaCookie();
    if (fromCookie && fromCookie !== cached) {
      cached = fromCookie;
      try {
        localStorage.setItem(LS_KEY, fromCookie);
      } catch {
        /* noop */
      }
      return;
    }
    if (cached) pushToGtag(cached);
  };
  // GA4 typically writes `_ga` within the first second after load.
  setTimeout(settle, 1500);
  setTimeout(settle, 5000);
};
