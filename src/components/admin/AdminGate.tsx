import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, ShieldAlert, MailCheck, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getAdminCsrfToken,
  resetAdminCsrfToken,
  getAdmin2FAToken,
  setAdmin2FAToken,
  resetAdmin2FAToken,
} from "@/lib/adminInvoke";
import { toast } from "sonner";

const STORAGE_KEY = "ilr_admin_key";
const PERSIST_KEY = "ilr_admin_persist"; // "1" when trusted device
const ATTEMPTS_KEY = "ilr_admin_attempts";
const LOCK_KEY = "ilr_admin_lock_until";
const OTP_ATTEMPTS_KEY = "ilr_admin_otp_attempts";
const MAX_ATTEMPTS = 5;
const MAX_OTP_ATTEMPTS = 5;
const LOCK_MS = 5 * 60 * 1000;

function isStandalonePWA(): boolean {
  try {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone === true
    );
  } catch { return false; }
}

function readAdminKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY) || "";
  } catch { return ""; }
}
function writeAdminKey(key: string, persist: boolean) {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PERSIST_KEY);
    const store = persist ? localStorage : sessionStorage;
    store.setItem(STORAGE_KEY, key);
    if (persist) localStorage.setItem(PERSIST_KEY, "1");
  } catch { /* noop */ }
}
function clearAdminKey() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PERSIST_KEY);
  } catch { /* noop */ }
}

// Install once: any call to /functions/v1/* gets CSRF + 2FA headers.
let fetchPatched = false;
function installAdminHeaderInterceptor() {
  if (fetchPatched || typeof window === "undefined") return;
  fetchPatched = true;
  const orig = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
    try {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url && url.includes("/functions/v1/")) {
        const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
        if (!headers.has("x-admin-csrf")) headers.set("x-admin-csrf", getAdminCsrfToken());
        const twofa = getAdmin2FAToken();
        if (twofa && !headers.has("x-admin-2fa")) headers.set("x-admin-2fa", twofa);
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

type Stage = "password" | "otp";

export const AdminGate = ({ children }: { children: ReactNode }) => {
  installAdminHeaderInterceptor();
  getAdminCsrfToken();

  const [adminKey, setAdminKey] = useState<string>(() => {
    try {
      const key = sessionStorage.getItem(STORAGE_KEY) || "";
      // Only consider logged-in if we also have a valid 2FA token.
      return key && getAdmin2FAToken() ? key : "";
    } catch { return ""; }
  });
  const [stage, setStage] = useState<Stage>("password");
  const [pendingKey, setPendingKey] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [input, setInput] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
    resetAdminCsrfToken();
    resetAdmin2FAToken();
    setAdminKey("");
    setStage("password");
    setPendingKey("");
    setChallengeId("");
    navigate("/admin", { replace: true });
  };

  // Validate stored session on mount — if 2FA expired or key rotated, boot back.
  useEffect(() => {
    if (!adminKey) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.functions.invoke("manage-reviews", {
        body: { action: "list", adminKey },
      });
      if (cancelled) return;
      const err = (data as { error?: string; code?: string } | null);
      if (error || err?.error) {
        try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
        resetAdmin2FAToken();
        setAdminKey("");
        if (err?.code === "TWO_FA_REQUIRED") {
          toast.info("Sesión 2FA expirada. Verifica de nuevo.");
        }
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

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input) return;
    const remaining = getLockRemaining();
    if (remaining > 0) {
      toast.error(`Bloqueado. Intenta en ${Math.ceil(remaining / 60)} min`);
      return;
    }
    setLoading(true);
    try {
      // admin-2fa "request" both validates the admin key and emails the OTP.
      const { data, error } = await supabase.functions.invoke("admin-2fa", {
        body: { action: "request", adminKey: input },
      });
      const payload = data as { challengeId?: string; sentTo?: string; error?: string } | null;
      if (error || payload?.error || !payload?.challengeId) {
        let attempts = 0;
        try { attempts = Number(localStorage.getItem(ATTEMPTS_KEY) || 0) + 1; } catch { /* noop */ }
        try { localStorage.setItem(ATTEMPTS_KEY, String(attempts)); } catch { /* noop */ }
        if (attempts >= MAX_ATTEMPTS) {
          try {
            localStorage.setItem(LOCK_KEY, String(Date.now() + LOCK_MS));
            localStorage.setItem(ATTEMPTS_KEY, "0");
          } catch { /* noop */ }
          toast.error("Demasiados intentos. Bloqueado 5 minutos.");
        } else if (payload?.error === "email_failed") {
          toast.error("No se pudo enviar el código. Revisa la config de correo.");
        } else {
          toast.error(`Clave incorrecta (${MAX_ATTEMPTS - attempts} intentos restantes)`);
        }
        return;
      }
      try { localStorage.removeItem(ATTEMPTS_KEY); localStorage.removeItem(LOCK_KEY); } catch { /* noop */ }
      setPendingKey(input);
      setChallengeId(payload.challengeId);
      setSentTo(payload.sentTo || "");
      setInput("");
      setOtp("");
      setStage("otp");
      try { sessionStorage.setItem(OTP_ATTEMPTS_KEY, "0"); } catch { /* noop */ }
      toast.success(`Código enviado a ${payload.sentTo || "tu correo"}`);
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      toast.error("Ingresa el código de 6 dígitos");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-2fa", {
        body: { action: "verify", challengeId, code: otp },
      });
      const payload = data as { token?: string; expiresAt?: number; error?: string } | null;
      if (error || payload?.error || !payload?.token || !payload?.expiresAt) {
        let attempts = 0;
        try { attempts = Number(sessionStorage.getItem(OTP_ATTEMPTS_KEY) || 0) + 1; } catch { /* noop */ }
        try { sessionStorage.setItem(OTP_ATTEMPTS_KEY, String(attempts)); } catch { /* noop */ }
        if (attempts >= MAX_OTP_ATTEMPTS || payload?.error === "challenge_expired") {
          toast.error("Código inválido o expirado. Vuelve a iniciar sesión.");
          setStage("password");
          setChallengeId("");
          setPendingKey("");
        } else {
          toast.error(`Código inválido (${MAX_OTP_ATTEMPTS - attempts} intentos restantes)`);
        }
        return;
      }
      setAdmin2FAToken(payload.token, payload.expiresAt);
      try { sessionStorage.setItem(STORAGE_KEY, pendingKey); } catch { /* noop */ }
      setAdminKey(pendingKey);
      setPendingKey("");
      setChallengeId("");
      setOtp("");
      toast.success("Acceso concedido");
      if (location.pathname === "/admin") return;
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!pendingKey || loading) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-2fa", {
        body: { action: "request", adminKey: pendingKey },
      });
      const payload = data as { challengeId?: string; sentTo?: string; error?: string } | null;
      if (error || payload?.error || !payload?.challengeId) {
        toast.error("No se pudo reenviar el código");
        return;
      }
      setChallengeId(payload.challengeId);
      setSentTo(payload.sentTo || sentTo);
      toast.success("Código reenviado");
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
              {stage === "password" ? (
                <Lock className="w-10 h-10 text-primary mx-auto mb-3" />
              ) : (
                <MailCheck className="w-10 h-10 text-primary mx-auto mb-3" />
              )}
              <h1 className="text-xl font-bold">
                {stage === "password" ? "Panel privado" : "Verificación 2FA"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {stage === "password"
                  ? "Acceso restringido. Solo personal autorizado."
                  : `Enviamos un código de 6 dígitos a ${sentTo || "tu correo"}. Vence en 5 min.`}
              </p>
            </div>

            {stage === "password" && lockRemaining > 0 && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Acceso bloqueado por seguridad. Intenta de nuevo en {Math.ceil(lockRemaining / 60)} min.</span>
              </div>
            )}

            {stage === "password" ? (
              <form onSubmit={submitPassword} className="space-y-3" autoComplete="off">
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
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continuar"}
                </Button>
              </form>
            ) : (
              <form onSubmit={submitOtp} className="space-y-3" autoComplete="off">
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoFocus
                    placeholder="Código de 6 dígitos"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="pl-9 tracking-[0.5em] text-center font-mono"
                    autoComplete="one-time-code"
                    spellCheck={false}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verificar y entrar"}
                </Button>
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => { setStage("password"); setOtp(""); setChallengeId(""); setPendingKey(""); }}
                    className="text-muted-foreground hover:text-foreground underline underline-offset-2"
                  >
                    ← Volver
                  </button>
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={loading}
                    className="text-primary hover:underline underline-offset-2 disabled:opacity-50"
                  >
                    Reenviar código
                  </button>
                </div>
              </form>
            )}
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
