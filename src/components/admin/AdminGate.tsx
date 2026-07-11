import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STORAGE_KEY = "ilr_admin_key";
const ATTEMPTS_KEY = "ilr_admin_attempts";
const LOCK_KEY = "ilr_admin_lock_until";
const MAX_ATTEMPTS = 5;
const LOCK_MS = 5 * 60 * 1000; // 5 min

type Ctx = { adminKey: string; logout: () => void };
const AdminCtx = createContext<Ctx | null>(null);

export const useAdminKey = () => {
  const ctx = useContext(AdminCtx);
  if (!ctx) throw new Error("useAdminKey must be used within AdminGate");
  return ctx;
};

export const AdminGate = ({ children }: { children: ReactNode }) => {
  const [adminKey, setAdminKey] = useState<string>(() => {
    try { return sessionStorage.getItem(STORAGE_KEY) || ""; } catch { return ""; }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-reviews", {
        body: { action: "list", adminKey: input },
      });
      if (error || (data as { error?: string } | null)?.error) {
        toast.error("Clave incorrecta");
        return;
      }
      try { sessionStorage.setItem(STORAGE_KEY, input); } catch { /* noop */ }
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

  if (!adminKey) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background p-4">
        <Card className="p-8 max-w-sm w-full space-y-4">
          <div className="text-center">
            <Lock className="w-10 h-10 text-primary mx-auto mb-3" />
            <h1 className="text-xl font-bold">Panel de administración</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ingresa la clave una sola vez para acceder a todos los paneles.
            </p>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <Input
              type="password"
              autoFocus
              placeholder="Clave admin"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={loading || !input}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <AdminCtx.Provider value={{ adminKey, logout }}>
      {children}
    </AdminCtx.Provider>
  );
};

export default AdminGate;
