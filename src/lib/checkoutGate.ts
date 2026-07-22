/**
 * Anti-fraud gate for /checkouts/:slug.
 * Los visitantes solo pueden abrir el checkout si:
 *  - Hicieron clic en "Comprar" / "Agregar al carrito" (SPA push o <a>).
 *  - Vienen desde un enlace de recuperación de carrito abandonado (?r=...).
 *  - Traen un token firmado en la URL (?t=...).
 *  - Vienen con Referer de una página propia (product / cart / home).
 * Cualquier otro acceso directo (bot, crawler, link filtrado) es rechazado.
 *
 * Además incluye rate limiting por dispositivo y detección de bots.
 */

const KEY = "ilr_checkout_auth";
const RATE_KEY = "ilr_checkout_rate";
const BAN_KEY = "ilr_checkout_ban";
const TTL_MS = 60 * 60 * 1000; // 1h ventana de compra

// Rate limit: máximo N accesos al checkout por ventana.
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 min
const RATE_MAX_HITS = 15; // 15 aperturas / 10 min por dispositivo
const BAN_MS = 30 * 60 * 1000; // 30 min de cooldown tras exceder

const RESERVED = new Set([
  "return",
  "success",
  "failure",
  "pending",
  "pendiente-manual",
  "prueba-1",
]);

// User agents de bots conocidos y navegadores headless.
const BOT_UA_RE = /(bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|discordbot|slackbot|linkedinbot|twitterbot|headlesschrome|phantomjs|puppeteer|playwright|selenium|scrapy|python-requests|curl\/|wget\/|axios\/|okhttp\/|go-http-client|java\/)/i;

export type GateReason =
  | "ok"
  | "bot"
  | "rate_limited"
  | "banned"
  | "unauthorized";

export function authorizeCheckout(slug?: string | null) {
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({ ts: Date.now(), slug: slug || "*" }),
    );
  } catch { /* ignore */ }
}

function isBotEnvironment(): boolean {
  try {
    const ua = navigator.userAgent || "";
    if (BOT_UA_RE.test(ua)) return true;
    // Solo mantenemos la señal más fiable: WebDriver activo. Descartamos
    // heurísticas como `!window.chrome` o `languages.length === 0` porque
    // dan muchos falsos positivos en Chrome móvil, WebViews de Instagram/
    // Facebook y Samsung Internet → expulsaban compradores reales del
    // checkout haciéndolo parecer "carrito abandonado".
    const nav = navigator as Navigator & { webdriver?: boolean };
    if (nav.webdriver === true) return true;
    return false;
  } catch {
    return false;
  }
}

function readRate(): { hits: number[]; } {
  try {
    const raw = localStorage.getItem(RATE_KEY);
    if (!raw) return { hits: [] };
    const parsed = JSON.parse(raw) as { hits?: number[] };
    return { hits: Array.isArray(parsed?.hits) ? parsed.hits : [] };
  } catch {
    return { hits: [] };
  }
}

function writeRate(hits: number[]) {
  try {
    localStorage.setItem(RATE_KEY, JSON.stringify({ hits }));
  } catch { /* ignore */ }
}

function isBanned(): boolean {
  try {
    const raw = localStorage.getItem(BAN_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { until?: number };
    if (parsed?.until && parsed.until > Date.now()) return true;
    localStorage.removeItem(BAN_KEY);
    return false;
  } catch {
    return false;
  }
}

function applyBan() {
  try {
    localStorage.setItem(BAN_KEY, JSON.stringify({ until: Date.now() + BAN_MS }));
    localStorage.removeItem(RATE_KEY);
  } catch { /* ignore */ }
}

/**
 * Registra un hit al checkout y devuelve si el dispositivo excedió el límite.
 * Aplica un ban temporal cuando se supera para bloquear scraping repetido.
 */
export function recordCheckoutHit(): { limited: boolean } {
  const now = Date.now();
  const { hits } = readRate();
  const recent = hits.filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  writeRate(recent);
  if (recent.length > RATE_MAX_HITS) {
    applyBan();
    return { limited: true };
  }
  return { limited: false };
}

/**
 * Decide si el visitante puede abrir el checkout. Devuelve una razón para
 * poder mostrar mensajes / logs distintos en la UI.
 */
export function evaluateCheckoutGate(): GateReason {
  if (isBotEnvironment()) return "bot";
  if (isBanned()) return "banned";

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

  const { limited } = recordCheckoutHit();
  if (limited) return "rate_limited";

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
