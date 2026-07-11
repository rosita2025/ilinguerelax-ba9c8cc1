// Client-side helper that attaches an `x-admin-csrf` token to every admin
// edge-function call. Paired with `_shared/adminCsrf.ts` on the server, this
// prevents cross-site request forgery attempts against the admin panel:
// - The token is generated per browser session, stored in sessionStorage
//   (never in a cookie, so no automatic cross-site attachment).
// - The custom header forces a CORS preflight, which the server rejects for
//   any non-allowlisted origin.
import { supabase } from "@/integrations/supabase/client";

const CSRF_KEY = "ilr_admin_csrf";

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

function generateToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

type InvokeOptions = Parameters<typeof supabase.functions.invoke>[1] & {
  headers?: Record<string, string>;
};

/**
 * Drop-in replacement for `supabase.functions.invoke` that attaches the admin
 * CSRF header. Use this for every admin panel call.
 */
export function adminInvoke<T = unknown>(fn: string, options: InvokeOptions = {}) {
  const headers = {
    ...(options.headers || {}),
    "x-admin-csrf": getAdminCsrfToken(),
  };
  return supabase.functions.invoke<T>(fn, { ...options, headers });
}
