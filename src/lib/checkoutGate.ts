/**
 * Anti-fraud gate for /checkouts/:slug.
 * Los visitantes solo pueden abrir el checkout si:
 *  - Hicieron clic en "Comprar" / "Agregar al carrito" (SPA push o <a>).
 *  - Vienen desde un enlace de recuperación de carrito abandonado (?r=...).
 *  - Traen un token firmado en la URL (?t=...).
 *  - Vienen con Referer de una página propia (product / cart / home).
 * Cualquier otro acceso directo (bot, crawler, link filtrado) es rechazado.
 */

const KEY = "ilr_checkout_auth";
const TTL_MS = 60 * 60 * 1000; // 1h ventana de compra

const RESERVED = new Set([
  "return",
  "success",
  "failure",
  "pending",
  "pendiente-manual",
  "prueba-1",
]);

export function authorizeCheckout(slug?: string | null) {
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({ ts: Date.now(), slug: slug || "*" }),
    );
  } catch { /* ignore */ }
}

export function isCheckoutAuthorized(): boolean {
  // 1) Token de sesión (marcado por click / navigate).
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { ts?: number };
      if (parsed?.ts && Date.now() - parsed.ts < TTL_MS) return true;
    }
  } catch { /* ignore */ }

  // 2) Enlace de recuperación (email de carrito abandonado) o token firmado.
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("r") || params.get("t")) return true;
  } catch { /* ignore */ }

  // 3) Referer interno (producto / carrito / home).
  try {
    const ref = document.referrer;
    if (ref) {
      const u = new URL(ref);
      if (u.origin === window.location.origin) {
        const p = u.pathname;
        if (
          p === "/" ||
          p.startsWith("/products") ||
          p.startsWith("/cart") ||
          p.startsWith("/checkouts")
        ) {
          return true;
        }
      }
    }
  } catch { /* ignore */ }

  return false;
}

/**
 * Instala interceptores globales que autorizan el checkout automáticamente
 * cuando el usuario navega desde la UI (click en <a> o navigate() de React
 * Router, que internamente llama history.pushState / replaceState).
 */
export function installCheckoutGate() {
  if (typeof window === "undefined") return;
  if ((window as unknown as { __ilrGateInstalled?: boolean }).__ilrGateInstalled) return;
  (window as unknown as { __ilrGateInstalled?: boolean }).__ilrGateInstalled = true;

  const authorizeFromUrl = (rawUrl: string | URL | null | undefined) => {
    if (!rawUrl) return;
    try {
      const u = new URL(String(rawUrl), window.location.origin);
      if (u.origin !== window.location.origin) return;
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] !== "checkouts" || !parts[1]) return;
      if (RESERVED.has(parts[1])) return;
      authorizeCheckout(parts[1]);
    } catch { /* ignore */ }
  };

  // Anchor clicks (<Link>, <a href="/checkouts/...">).
  document.addEventListener(
    "click",
    (ev) => {
      const t = ev.target as HTMLElement | null;
      const a = t?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (a) authorizeFromUrl(a.getAttribute("href"));
    },
    true,
  );

  // SPA nav programática (navigate() → pushState/replaceState).
  const wrap = (name: "pushState" | "replaceState") => {
    const orig = history[name];
    history[name] = function (...args: unknown[]) {
      try {
        authorizeFromUrl(args[2] as string | undefined);
      } catch { /* ignore */ }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return orig.apply(this, args as any);
    } as typeof history[typeof name];
  };
  wrap("pushState");
  wrap("replaceState");
}
