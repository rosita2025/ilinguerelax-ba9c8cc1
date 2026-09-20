import { useEffect, useState } from "react";
import { Clock, Copy, Check } from "lucide-react";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";

const COUPON_CODE = "NEW10";
const DURATION_SECONDS = 15 * 60; // 15 minutos
const STORAGE_KEY_PREFIX = "urgency-timer-start-";

interface Props {
  productSlug: string;
  language?: string;
}

const COPY: Record<string, { label: string; reserved: string; expired: string }> = {
  es: {
    label: "10% OFF con el código",
    reserved: "reservado por",
    expired: "Oferta expirada — recarga la página para ver el precio actual",
  },
  en: {
    label: "10% OFF with code",
    reserved: "reserved for",
    expired: "Offer expired — reload the page to see the current price",
  },
};

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Barra FIJA (no sticky) arriba de todo, por encima del header/menú, con
 * cuenta regresiva real para el cupón NEW10. Es honesta a propósito: no
 * dice "se acaba el stock" (eso sería manipulador, el producto es digital
 * e ilimitado) — dice que el DESCUENTO está reservado por tiempo limitado,
 * que sí es cierto: el temporizador es real y no se reinicia si recargas
 * la página (usa localStorage con la hora de inicio real de esta visita).
 */
export function UrgencyTimerBar({ productSlug, language = "es" }: Props) {
  const applyCoupon = useCheckoutPruebaStore((s) => s.applyCoupon);
  const storageKey = `${STORAGE_KEY_PREFIX}${productSlug}`;
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let startedAt = Number(localStorage.getItem(storageKey));
    if (!startedAt) {
      startedAt = Date.now();
      localStorage.setItem(storageKey, String(startedAt));
    }

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, DURATION_SECONDS - elapsed);
      setSecondsLeft(remaining);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [storageKey]);

  if (secondsLeft === null) return null;

  const t = COPY[language] || COPY.es;
  const expired = secondsLeft <= 0;

  const handleCopy = async () => {
    applyCoupon(COUPON_CODE);
    try {
      await navigator.clipboard.writeText(COUPON_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100]">
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 bg-accent text-accent-foreground px-2 sm:px-3 py-1.5 text-[11px] leading-5 sm:text-sm whitespace-nowrap shadow-md">
        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" aria-hidden="true" />
        {expired ? (
          <span className="font-medium text-center leading-snug">{t.expired}</span>
        ) : (
          <span className="flex items-center justify-center gap-1.5 sm:gap-2 leading-snug min-w-0">
            <span className="font-semibold whitespace-nowrap">{t.label}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-lg border border-accent-foreground/40 bg-accent-foreground/15 hover:bg-accent-foreground/25 px-2 py-0.5 font-black uppercase tracking-wider transition-colors"
              aria-label={`${COUPON_CODE} — copiar cupón`}
            >
              {COUPON_CODE}
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <span className="opacity-90 whitespace-nowrap hidden min-[420px]:inline">{t.reserved}</span>
            <span className="inline-flex items-center gap-1 rounded-lg border border-accent-foreground/40 bg-accent-foreground/15 px-2 py-0.5 font-black tabular-nums whitespace-nowrap">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              {formatTime(secondsLeft)}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
