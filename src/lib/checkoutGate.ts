/**
 * Gate de /checkouts/:slug — SOLO OBSERVACIONAL.
 * No se bloquea a nadie: ni por IP, país, referer, user-agent ni frecuencia.
 * Se mantiene una "ventana de compra" en sessionStorage solo para analítica
 * y para rellenar datos del flujo.
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

export type GateReason = "ok";


export function authorizeCheckout(slug?: string | null) {
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({ ts: Date.now(), slug: slug || "*" }),
    );
  } catch { /* ignore */ }
}

/**
 * Decide si el visitante puede abrir el checkout.
 * Política actual: NUNCA se bloquea (ni por IP, país, UA o webdriver).
 * Cualquier señal sospechosa se registra solo para analítica.
 */
export function evaluateCheckoutGate(): GateReason {


  // Autorización explícita (click / navigate / referer / token).
  let authorized = false;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { ts?: number };
      if (parsed?.ts && Date.now() - parsed.ts < TTL_MS) authorized = true;
    }
  } catch { /* ignore */ }

  if (!authorized) {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("r") || params.get("t")) authorized = true;
    } catch { /* ignore */ }
  }

  if (!authorized) {
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
            authorized = true;
          }
        }
      }
    } catch { /* ignore */ }
  }

  // No bloqueamos por "unauthorized": muchos compradores legítimos llegan
  // sin referer (email, WhatsApp, tab nueva, referrer-policy estricta) y
  // los expulsábamos silenciosamente → parecía "abandono de carrito".
  // El rate-limit por IP en el servidor (checkout-gate-check) sigue activo.
  if (!authorized) {
    // Autorizamos on-the-fly para que el resto del flujo funcione igual.
    try { sessionStorage.setItem(KEY, JSON.stringify({ ts: Date.now(), slug: "*" })); } catch { /* ignore */ }
  }

  return "ok";
}

// Compatibilidad con el llamador anterior.
export function isCheckoutAuthorized(): boolean {
  return evaluateCheckoutGate() === "ok";
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

  document.addEventListener(
    "click",
    (ev) => {
      const t = ev.target as HTMLElement | null;
      const a = t?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (a) authorizeFromUrl(a.getAttribute("href"));
    },
    true,
  );

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
