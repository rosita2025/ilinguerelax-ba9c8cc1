import { useEffect, useState } from "react";
import { Flame } from "lucide-react";

/** Fin de la oferta: domingo 30 de nov a las 23:59 (hora de Lima, UTC-5). */
export const BLACK_FRIDAY_END = Date.parse("2026-12-01T04:59:59Z");

const pad = (n: number) => String(n).padStart(2, "0");

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/**
 * Cinta «BLACK FRIDAY · 40% OFF» con cuenta regresiva. Solo presentación: no muestra montos ni cambia el cobro.
 * Desaparece sola al terminar la oferta.
 */
export const BlackFridayStrip = ({ endsAt = BLACK_FRIDAY_END }: { endsAt?: number }) => {
  const [left, setLeft] = useState(() => endsAt - Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setLeft(endsAt - Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [endsAt]);
  if (left <= 0) return null;
  const { d, h, m, s } = parts(left);
  const cell = (v: number | string, label: string) => (
    <span className="flex flex-col items-center leading-none">
      <span className="min-w-[2.1rem] rounded-md bg-white/15 px-1.5 py-1 text-base md:text-lg font-black tabular-nums">{typeof v === "number" ? pad(v) : v}</span>
      <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide opacity-80">{label}</span>
    </span>
  );
  return (
    <div role="region" aria-label="Oferta Black Friday" className="bg-gradient-to-r from-black via-zinc-900 to-black text-white">
      <div className="container px-4 py-2.5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-yellow-400 shrink-0" aria-hidden="true" />
          <span className="text-sm md:text-base font-extrabold tracking-wide">
            BLACK FRIDAY · <span className="rounded bg-yellow-400 px-1.5 py-0.5 text-black">40% OFF</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs md:text-sm font-semibold uppercase tracking-wide opacity-90">Termina la oferta en</span>
          <div className="flex items-start gap-1.5">
            {cell(d, "días")}
            {cell(h, "hrs")}
            {cell(m, "min")}
            {cell(s, "seg")}
          </div>
        </div>
      </div>
    </div>
  );
};
