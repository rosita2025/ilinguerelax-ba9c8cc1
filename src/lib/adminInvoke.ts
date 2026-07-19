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

export function getAdmin2FAToken(): string | null {
  // Prefer persistent (trusted-device) token, fall back to session.
  const persisted = readFromStore(localStorage);
  if (persisted) return persisted.token;
  const session = readFromStore(sessionStorage);
  return session ? session.token : null;
}

export function setAdmin2FAToken(token: string, expiresAt: number, persist = false) {
  try {
    // Clear both to avoid stale mismatches.
    sessionStorage.removeItem(TWOFA_TOKEN_KEY);
    sessionStorage.removeItem(TWOFA_EXP_KEY);
    localStorage.removeItem(TWOFA_TOKEN_KEY);
    localStorage.removeItem(TWOFA_EXP_KEY);
    localStorage.removeItem(TWOFA_PERSIST_KEY);
    const store = persist ? localStorage : sessionStorage;
    store.setItem(TWOFA_TOKEN_KEY, token);
    store.setItem(TWOFA_EXP_KEY, String(expiresAt));
    if (persist) localStorage.setItem(TWOFA_PERSIST_KEY, "1");
  } catch { /* noop */ }
}

export function resetAdmin2FAToken() {
  try {
    sessionStorage.removeItem(TWOFA_TOKEN_KEY);
    sessionStorage.removeItem(TWOFA_EXP_KEY);
    localStorage.removeItem(TWOFA_TOKEN_KEY);
    localStorage.removeItem(TWOFA_EXP_KEY);
    localStorage.removeItem(TWOFA_PERSIST_KEY);
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

export function adminInvoke<T = unknown>(fn: string, options: InvokeOptions = {}) {
  const twofa = getAdmin2FAToken();
  const headers: Record<string, string> = {
    ...(options.headers || {}),
    "x-admin-csrf": getAdminCsrfToken(),
  };
  if (twofa) headers["x-admin-2fa"] = twofa;
  return supabase.functions.invoke<T>(fn, { ...options, headers });
}
