import { useEffect, useState } from "react";
import { X, Mail, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STORAGE_KEY = "ilr_newsletter_popup_v2";
const COOKIE_KEY = "ilr_newsletter_popup";
const DELAY_MS = 15000; // 15s
// Configurable TTLs (days)
const DISMISS_TTL_DAYS = 7;      // "cerrar" → no vuelve por 7 días
const SUBSCRIBED_TTL_DAYS = 365; // ya suscrito → no vuelve por 1 año

type PopupState = { status: "dismissed" | "subscribed"; until: number };

function readState(): PopupState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PopupState;
      if (parsed?.until && parsed.until > Date.now()) return parsed;
      if (parsed?.until && parsed.until <= Date.now()) localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]+)`));
    if (m) {
      const parsed = JSON.parse(decodeURIComponent(m[1])) as PopupState;
      if (parsed?.until && parsed.until > Date.now()) return parsed;
    }
  } catch {}
  return null;
}

function writeState(status: "dismissed" | "subscribed", ttlDays: number) {
  const until = Date.now() + ttlDays * 24 * 60 * 60 * 1000;
  const payload: PopupState = { status, until };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch {}
  try {
    const expires = new Date(until).toUTCString();
    document.cookie = `${COOKIE_KEY}=${encodeURIComponent(JSON.stringify(payload))}; expires=${expires}; path=/; SameSite=Lax`;
  } catch {}
}

export const EmailSubscribePopup = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const COUPON = "NEW10";

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (readState()) return;
    // Skip on admin/checkout/success/thank-you pages
    const p = window.location.pathname.toLowerCase();
    const BLOCKED = ["/admin", "/checkout", "/checkouts", "/pago", "/pagos", "/pay", "/success", "/gracias", "/thank", "/descarga", "/order"];
    if (BLOCKED.some((b) => p.startsWith(b)) || p.includes("success") || p.includes("checkout")) return;

    const t = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setOpen(false);
    writeState("dismissed", DISMISS_TTL_DAYS);
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
      let language: string | undefined;
      let country: string | undefined;
      try {
        language = localStorage.getItem("ilingue_language") || undefined;
        country = localStorage.getItem("ilr_country") || undefined;
      } catch {}
      const { error } = await supabase.functions.invoke("subscribe-newsletter", {
        body: { email: email.trim(), name: name.trim() || undefined, source: "popup", language, country },
      });
      if (error) throw error;
      try { writeState("subscribed", SUBSCRIBED_TTL_DAYS); } catch {}
      // Guardar datos del suscriptor para autocompletar el checkout
      try {
        localStorage.setItem(
          "ilr_buyer",
          JSON.stringify({ email: email.trim().toLowerCase(), name: name.trim() || "", coupon: COUPON, ts: Date.now() }),
        );
        window.dispatchEvent(new CustomEvent("ilr:buyer-updated"));
      } catch {}
      setSuccess(true);
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

        {success ? (
          <div className="p-6 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
              <Gift className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">¡Listo! 🎉</h3>
            <p className="text-sm text-muted-foreground">
              Tu cupón del <strong>10% de descuento</strong>:
            </p>
            <div className="flex items-center justify-center gap-2">
              <code className="px-4 py-2.5 rounded-lg bg-primary/10 border-2 border-dashed border-primary text-primary font-bold text-lg tracking-widest">
                {COUPON}
              </code>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard?.writeText(COUPON);
                  toast.success("Cupón copiado");
                }}
              >
                Copiar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Úsalo al finalizar tu compra en el checkout.
            </p>
            <Button onClick={() => setOpen(false)} className="w-full">
              Empezar a comprar
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 pb-4 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-3">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                10% de descuento 🎁
              </h3>
              <p className="text-sm text-muted-foreground mt-1.5">
                Suscríbete y recibe un <strong>cupón del 10%</strong> para tu primera compra en ILINGUE RELAX.
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
                {loading ? "Enviando..." : "Obtener mi 10% de descuento"}
              </Button>
              <button
                type="button"
                onClick={dismiss}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                No, gracias
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
