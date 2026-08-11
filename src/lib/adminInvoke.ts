// Client-side helpers for the admin panel:
// - `x-admin-csrf`: per-session random token, forces CORS preflight, paired
//   with the server-side Origin allowlist in `_shared/adminCsrf.ts`.
// - `x-admin-2fa`: HMAC-signed session token issued by `admin-2fa` after
//   the operator completes an email OTP challenge. Default 12h; up to 7d if
//   the operator ticks "Confiar en este dispositivo" (persisted in localStorage).
import { supabase } from "@/integrations/supabase/client";

const CSRF_KEY = "ilr_admin_csrf";
const TWOFA_TOKEN_KEY = "ilr_admin_2fa";
const TWOFA_EXP_KEY = "ilr_admin_2fa_exp";
const TWOFA_PERSIST_KEY = "ilr_admin_2fa_persist"; // "1" when stored in localStorage
const COOKIE_TOKEN = "ilr_admin_2fa";
const COOKIE_EXP = "ilr_admin_2fa_exp";

function isSecureCtx(): boolean {
  try { return typeof location !== "undefined" && location.protocol === "https:"; } catch { return false; }
}

function setCookie(name: string, value: string, expiresAtMs: number) {
  try {
    const maxAge = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
    const secure = isSecureCtx() ? "; Secure" : "";
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  } catch { /* noop */ }
}

function getCookie(name: string): string | null {
  try {
    const prefix = `${name}=`;
    const parts = document.cookie ? document.cookie.split("; ") : [];
    for (const p of parts) {
      if (p.startsWith(prefix)) return decodeURIComponent(p.slice(prefix.length));
    }
    return null;
  } catch { return null; }
}

function deleteCookie(name: string) {
  try {
    const secure = isSecureCtx() ? "; Secure" : "";
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  } catch { /* noop */ }
}

export function getAdminCsrfToken(): string {
  try {
    let token = sessionStorage.getItem(CSRF_KEY);
    if (!token || token.length < 24) {
      token = generateToken();
      sessionStorage.setItem(CSRF_KEY, token);
    }
    return token;
  } catch {
    return generateToken();
  }
}

export function resetAdminCsrfToken() {
  try { sessionStorage.removeItem(CSRF_KEY); } catch { /* noop */ }
}

function readFromStore(store: Storage): { token: string; exp: number } | null {
  try {
    const token = store.getItem(TWOFA_TOKEN_KEY);
    const exp = Number(store.getItem(TWOFA_EXP_KEY) || 0);
    if (!token || !exp || exp < Date.now()) return null;
    return { token, exp };
  } catch { return null; }
}

function readFromCookies(): { token: string; exp: number } | null {
  const token = getCookie(COOKIE_TOKEN);
  const exp = Number(getCookie(COOKIE_EXP) || 0);
  if (!token || !exp || exp < Date.now()) return null;
  return { token, exp };
}

// Rehydrate localStorage from cookies if the storage was cleared (iOS Safari,
// private mode eviction, browser cache wipes) but the cookie survived.
function rehydrateFromCookies(): { token: string; exp: number } | null {
  const cookie = readFromCookies();
  if (!cookie) return null;
  try {
    localStorage.setItem(TWOFA_TOKEN_KEY, cookie.token);
    localStorage.setItem(TWOFA_EXP_KEY, String(cookie.exp));
    localStorage.setItem(TWOFA_PERSIST_KEY, "1");
  } catch { /* noop */ }
  return cookie;
}

export function getAdmin2FAToken(): string | null {
  // Prefer persistent (trusted-device) token, fall back to session, then cookies.
  const persisted = readFromStore(localStorage);
  if (persisted) return persisted.token;
  const cookie = rehydrateFromCookies();
  if (cookie) return cookie.token;
  const session = readFromStore(sessionStorage);
  return session ? session.token : null;
}

export type Admin2FASessionInfo = {
  active: boolean;
  persistent: boolean; // true = "Confiar 7 días"
  expiresAt: number | null;
};

export function getAdmin2FASessionInfo(): Admin2FASessionInfo {
  const persisted = readFromStore(localStorage) || rehydrateFromCookies();
  if (persisted) return { active: true, persistent: true, expiresAt: persisted.exp };
  const session = readFromStore(sessionStorage);
  if (session) return { active: true, persistent: false, expiresAt: session.exp };
  return { active: false, persistent: false, expiresAt: null };
}

export function setAdmin2FAToken(token: string, expiresAt: number, persist = false) {
  try {
    // Clear both to avoid stale mismatches.
    sessionStorage.removeItem(TWOFA_TOKEN_KEY);
    sessionStorage.removeItem(TWOFA_EXP_KEY);
    localStorage.removeItem(TWOFA_TOKEN_KEY);
    localStorage.removeItem(TWOFA_EXP_KEY);
    localStorage.removeItem(TWOFA_PERSIST_KEY);
    deleteCookie(COOKIE_TOKEN);
    deleteCookie(COOKIE_EXP);
    const store = persist ? localStorage : sessionStorage;
    store.setItem(TWOFA_TOKEN_KEY, token);
    store.setItem(TWOFA_EXP_KEY, String(expiresAt));
    if (persist) {
      localStorage.setItem(TWOFA_PERSIST_KEY, "1");
      // Mirror into cookies so the trust survives localStorage eviction and
      // fresh browser sessions where storage APIs are cleared but cookies are kept.
      setCookie(COOKIE_TOKEN, token, expiresAt);
      setCookie(COOKIE_EXP, String(expiresAt), expiresAt);
    }
  } catch { /* noop */ }
}

export function resetAdmin2FAToken() {
  try {
    sessionStorage.removeItem(TWOFA_TOKEN_KEY);
    sessionStorage.removeItem(TWOFA_EXP_KEY);
    localStorage.removeItem(TWOFA_TOKEN_KEY);
    localStorage.removeItem(TWOFA_EXP_KEY);
    localStorage.removeItem(TWOFA_PERSIST_KEY);
    deleteCookie(COOKIE_TOKEN);
    deleteCookie(COOKIE_EXP);
  } catch { /* noop */ }
}

function generateToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}


type InvokeOptions = Parameters<typeof supabase.functions.invoke>[1] & {
  headers?: Record<string, string>;
};

export async function adminInvoke<T = unknown>(fn: string, options: InvokeOptions = {}) {
  const twofa = getAdmin2FAToken();
  const headers: Record<string, string> = {
    ...(options.headers || {}),
    "x-admin-csrf": getAdminCsrfToken(),
  };
  if (twofa) headers["x-admin-2fa"] = twofa;

  const res = await supabase.functions.invoke<T>(fn, { ...options, headers });
  if (!res.error) return res;

  // supabase-js swallows the response body on non-2xx ("Edge Function returned
  // a non-2xx status code"). Read it so the admin sees the real reason
  // ("No autorizado", "2FA required", "Pedido no encontrado"…).
  let detail: any = null;
  try {
    const ctx: any = (res.error as any)?.context;
    if (ctx) {
      // Use cloned response to avoid "body already used" errors
      const response = typeof ctx.clone === "function" ? ctx.clone() : ctx;
      if (typeof response.json === "function") {
        detail = await response.json().catch(() => null);
      } else if (typeof response.text === "function") {
        const text = await response.text().catch(() => "");
        try {
          detail = JSON.parse(text);
        } catch {
          detail = { error: text };
        }
      }
    }
  } catch (e) {
    console.warn("[adminInvoke] Failed to extract error detail:", e);
  }

  // Handle both JSON error field and status code based logic
  const is2faError = detail?.code === "TWO_FA_REQUIRED" || 
                    detail?.error === "2FA required" || 
                    (res.error as any)?.status === 401;

  if (is2faError) {
    console.log("[adminInvoke] 2FA required or session expired. Resetting token.");
    resetAdmin2FAToken();
  }

  // Prioritize the structured error message from the Edge Function
  const message = detail?.error || 
                  detail?.detail || 
                  (detail?.message && typeof detail.message === "string" ? detail.message : null) || 
                  res.error.message;
                  
  return { 
    data: (detail as T) ?? null, 
    error: { ...res.error, message, status: (res.error as any)?.status } as typeof res.error 
  };
}

