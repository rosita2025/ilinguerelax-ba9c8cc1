import { useEffect, useState } from "react";
import { Clock, Check } from "lucide-react";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";

const COUPON_CODE = "NEW10";
const DURATION_SECONDS = 10 * 60; // 10:00
const KEY_PREFIX = "checkout-offer-start-";

type Copy = { label: string; reserved: string; apply: string; applied: string };

// Un texto por idioma del checkout (el idioma sigue la categoría del producto).
const COPY: Record<string, Copy> = {
  es: { label: "10% OFF con el código", reserved: "reservado por", apply: "Aplicar", applied: "Cupón aplicado" },
  en: { label: "10% OFF with code", reserved: "reserved for", apply: "Apply", applied: "Coupon applied" },
  fr: { label: "-10 % avec le code", reserved: "réservé pendant", apply: "Appliquer", applied: "Coupon appliqué" },
  pt: { label: "10% OFF com o código", reserved: "reservado por", apply: "Aplicar", applied: "Cupom aplicado" },
  it: { label: "10% di sconto con il codice", reserved: "riservato per", apply: "Applica", applied: "Coupon applicato" },
};

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

interface Props {
  productSlug: string;
  language: string;
}

/**
 * Cuenta regresiva de 10:00 para el cupón NEW10 dentro del checkout.
 * Es honesta: dice que el descuento está "reservado por" ese tiempo (no que se
 * agota el producto) y NO se reinicia al recargar: la hora de inicio se guarda
 * por producto en el navegador. Al llegar a 0 la barra desaparece.
 */
export function CheckoutOfferCountdown({ productSlug, language }: Props) {
  const coupon = useCheckoutPruebaStore((s) => s.coupon);
  const applyCoupon = useCheckoutPruebaStore((s) => s.applyCoupon);
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const key = `${KEY_PREFIX}${productSlug}`;
    let startedAt = 0;
    try { startedAt = Number(localStorage.getItem(key)) || 0; } catch { /* sin almacenamiento */ }
    if (!startedAt) {
      startedAt = Date.now();
      try { localStorage.setItem(key, String(startedAt)); } catch { /* sin almacenamiento */ }
    }
    const tick = () => setLeft(Math.max(0, DURATION_SECONDS - Math.floor((Date.now() - startedAt) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [productSlug]);

  if (left === null || left <= 0) return null;
  const t = COPY[language] || COPY.es;
  const isApplied = coupon === COUPON_CODE;

  return (
    <div
      className="flex items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"
      role="timer"
      aria-live="off"
    >
      <div className="flex min-w-0 items-center gap-2 text-[12px] leading-tight sm:text-sm">
        <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0">
          <span className="font-semibold">{t.label}</span>{" "}
          <span className="rounded-md bg-amber-200/70 px-1.5 py-0.5 font-black uppercase tracking-wider dark:bg-amber-800/60">{COUPON_CODE}</span>{" "}
          <span className="opacity-80">{t.reserved}</span>{" "}
          <span className="font-black tabular-nums">{fmt(left)}</span>
        </span>
      </div>
      {isApplied ? (
        <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-emerald-700 dark:text-emerald-300">
          <Check className="h-4 w-4" aria-hidden="true" /> {t.applied}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => applyCoupon(COUPON_CODE)}
          className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-amber-600 sm:text-sm"
        >
          {t.apply}
        </button>
      )}
    </div>
  );
}
