import { useEffect, useState } from "react";
import { X, Mail, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STORAGE_KEY = "ilr_newsletter_popup_v1";
const DELAY_MS = 15000; // 15s

export const EmailSubscribePopup = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "subscribed" || saved === "dismissed") return;
    } catch {}
    // Skip on admin/checkout/success pages
    const p = window.location.pathname;
    if (p.startsWith("/admin") || p.startsWith("/checkout") || p.includes("success")) return;

    const t = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setOpen(false);
    try { localStorage.setItem(STORAGE_KEY, "dismissed"); } catch {}
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      toast.error("Debes aceptar recibir emails");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Email inválido");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("subscribe-newsletter", {
        body: { email: email.trim(), name: name.trim() || undefined, source: "popup" },
      });
      if (error) throw error;
      toast.success("¡Gracias! Te hemos suscrito ✨");
      try { localStorage.setItem(STORAGE_KEY, "subscribed"); } catch {}
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("No se pudo suscribir. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
        <button
          onClick={dismiss}
          aria-label="Cerrar"
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 pb-4 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-3">
            <Gift className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground">
            Recibe recursos gratis 🎁
          </h3>
          <p className="text-sm text-muted-foreground mt-1.5">
            Suscríbete y recibe consejos, ofertas exclusivas y descuentos en tus productos favoritos.
          </p>
        </div>

        <form onSubmit={submit} className="p-6 pt-4 space-y-3">
          <Input
            type="text"
            placeholder="Tu nombre (opcional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            disabled={loading}
          />
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="pl-9"
            />
          </div>

          <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 accent-primary"
              disabled={loading}
            />
            <span>
              Acepto recibir emails de <strong>ILINGUE RELAX</strong> con ofertas y contenido educativo. Puedo darme de baja cuando quiera.
            </span>
          </label>

          <Button
            type="submit"
            disabled={loading || !accepted}
            className="w-full"
          >
            {loading ? "Enviando..." : "Suscribirme gratis"}
          </Button>
          <button
            type="button"
            onClick={dismiss}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            No, gracias
          </button>
        </form>
      </div>
    </div>
  );
};
