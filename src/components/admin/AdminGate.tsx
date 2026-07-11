import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAdminCsrfToken, resetAdminCsrfToken } from "@/lib/adminInvoke";
import { toast } from "sonner";

const STORAGE_KEY = "ilr_admin_key";
const ATTEMPTS_KEY = "ilr_admin_attempts";
const LOCK_KEY = "ilr_admin_lock_until";
const MAX_ATTEMPTS = 5;
const LOCK_MS = 5 * 60 * 1000; // 5 min

// Install once: any call to a Supabase Edge Function gets the admin CSRF header.
// Server (`_shared/adminCsrf.ts`) validates the token + Origin allowlist.
let fetchPatched = false;
function installAdminCsrfInterceptor() {
  if (fetchPatched || typeof window === "undefined") return;
  fetchPatched = true;
  const orig = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
    try {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url && url.includes("/functions/v1/")) {
        const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
        if (!headers.has("x-admin-csrf")) headers.set("x-admin-csrf", getAdminCsrfToken());
        return orig(input, { ...init, headers });
      }
    } catch { /* noop */ }
    return orig(input, init);
  };
}

type Ctx = { adminKey: string; logout: () => void };
const AdminCtx = createContext<Ctx | null>(null);

export const useAdminKey = () => {
  const ctx = useContext(AdminCtx);
  if (!ctx) throw new Error("useAdminKey must be used within AdminGate");
  return ctx;
};

export const AdminGate = ({ children }: { children: ReactNode }) => {
  // Ensure the CSRF header is attached to every functions call even before login,
  // so the login check itself is protected.
  installAdminCsrfInterceptor();
  getAdminCsrfToken();

  const [adminKey, setAdminKey] = useState<string>(() => {
    try { return sessionStorage.getItem(STORAGE_KEY) || ""; } catch { return ""; }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
    resetAdminCsrfToken();
    setAdminKey("");
    navigate("/admin", { replace: true });
  };

  // Validate stored key on mount (in case it was rotated)
  useEffect(() => {
    if (!adminKey) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.functions.invoke("manage-reviews", {
        body: { action: "list", adminKey },
      });
      if (cancelled) return;
      if (error || (data as { error?: string } | null)?.error) {
        try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
        setAdminKey("");
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getLockRemaining = () => {
    try {
      const until = Number(localStorage.getItem(LOCK_KEY) || 0);
      return until > Date.now() ? Math.ceil((until - Date.now()) / 1000) : 0;
    } catch { return 0; }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input) return;
    const remaining = getLockRemaining();
    if (remaining > 0) {
      toast.error(`Bloqueado. Intenta en ${Math.ceil(remaining / 60)} min`);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-reviews", {
        body: { action: "list", adminKey: input },
      });
      if (error || (data as { error?: string } | null)?.error) {
        let attempts = 0;
        try { attempts = Number(localStorage.getItem(ATTEMPTS_KEY) || 0) + 1; } catch { /* noop */ }
        try { localStorage.setItem(ATTEMPTS_KEY, String(attempts)); } catch { /* noop */ }
        if (attempts >= MAX_ATTEMPTS) {
          try {
            localStorage.setItem(LOCK_KEY, String(Date.now() + LOCK_MS));
            localStorage.setItem(ATTEMPTS_KEY, "0");
          } catch { /* noop */ }
          toast.error("Demasiados intentos. Bloqueado 5 minutos.");
        } else {
          toast.error(`Clave incorrecta (${MAX_ATTEMPTS - attempts} intentos restantes)`);
        }
        return;
      }
      try {
        localStorage.removeItem(ATTEMPTS_KEY);
        localStorage.removeItem(LOCK_KEY);
        sessionStorage.setItem(STORAGE_KEY, input);
      } catch { /* noop */ }
      setAdminKey(input);
      setInput("");
      toast.success("Acceso concedido");
      if (location.pathname === "/admin") return; // stay on hub
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const NoIndex = () => (
    <Helmet>
      <title>Panel privado · iLingue Relax</title>
      <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
      <meta name="googlebot" content="noindex, nofollow" />
      <meta name="bingbot" content="noindex, nofollow" />
      <meta name="referrer" content="no-referrer" />
    </Helmet>
  );

  if (!adminKey) {
    const lockRemaining = getLockRemaining();
    return (
      <>
        <NoIndex />
        <div className="min-h-dvh flex items-center justify-center bg-background p-4">
          <Card className="p-8 max-w-sm w-full space-y-4">
            <div className="text-center">
              <Lock className="w-10 h-10 text-primary mx-auto mb-3" />
              <h1 className="text-xl font-bold">Panel privado</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Acceso restringido. Solo personal autorizado.
              </p>
            </div>
            {lockRemaining > 0 && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Acceso bloqueado por seguridad. Intenta de nuevo en {Math.ceil(lockRemaining / 60)} min.</span>
              </div>
            )}
            <form onSubmit={submit} className="space-y-3" autoComplete="off">
              <Input
                type="password"
                autoFocus
                placeholder="Clave admin"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                disabled={lockRemaining > 0}
              />
              <Button type="submit" className="w-full" disabled={loading || !input || lockRemaining > 0}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
              </Button>
            </form>
          </Card>
        </div>
      </>
    );
  }

  return (
    <AdminCtx.Provider value={{ adminKey, logout }}>
      <NoIndex />
      {children}
    </AdminCtx.Provider>
  );
};

export default AdminGate;
