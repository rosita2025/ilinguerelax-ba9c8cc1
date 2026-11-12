import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type SupportShot = { src: string; width: number; height: number; flag: string; country: string; caption: string; alt: string };

/**
 * Capturas reales de WhatsApp de atención posventa. Slider MANUAL (scroll-snap: dedo, flechas o puntos), sin autoplay.
 * Carga rápida: imágenes webp livianas con ancho/alto fijos, la primera con prioridad normal y el resto perezosas.
 */
export const SupportProofSlider = ({ shots }: { shots: SupportShot[] }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);

  const goTo = useCallback((i: number) => {
    const el = trackRef.current;
    const slide = el?.children[Math.max(0, Math.min(shots.length - 1, i))] as HTMLElement | undefined;
    if (el && slide) el.scrollTo({ left: slide.offsetLeft - (el.clientWidth - slide.clientWidth) / 2, behavior: "smooth" });
  }, [shots.length]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const mid = el.scrollLeft + el.clientWidth / 2;
        let best = 0, bestD = Infinity;
        Array.from(el.children).forEach((c, i) => {
          const s = c as HTMLElement;
          const d = Math.abs(s.offsetLeft + s.clientWidth / 2 - mid);
          if (d < bestD) { bestD = d; best = i; }
        });
        if (el.scrollLeft <= 2) best = 0;
        else if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) best = shots.length - 1;
        setIdx(best);
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => { el.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [shots.length]);

  const arrow = "absolute top-1/2 -translate-y-1/2 z-10 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/10 hover:bg-white disabled:opacity-0 disabled:pointer-events-none";

  return (
    <div role="group" aria-roledescription="carrusel" aria-label="Capturas reales de atención al cliente">
      <div className="relative">
        <div ref={trackRef} className="flex items-start gap-4 overflow-x-auto snap-x snap-mandatory px-[8%] md:px-0 md:justify-start pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {shots.map((s, i) => (
            <figure key={s.src} className="w-[84%] sm:w-[46%] md:w-[31%] shrink-0 snap-center overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <img
                src={s.src}
                alt={s.alt}
                width={s.width}
                height={s.height}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
                className="block h-auto w-full select-none"
              />
              <figcaption className="flex items-start gap-2 border-t border-border p-3 text-left">
                <span className="text-xl leading-none" aria-hidden="true">{s.flag}</span>
                <span className="text-sm text-foreground"><strong>{s.country}</strong> · {s.caption}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <button type="button" aria-label="Anterior" className={`${arrow} -left-3`} disabled={idx === 0} onClick={() => goTo(idx - 1)}><ChevronLeft className="h-5 w-5" /></button>
        <button type="button" aria-label="Siguiente" className={`${arrow} -right-3`} disabled={idx === shots.length - 1} onClick={() => goTo(idx + 1)}><ChevronRight className="h-5 w-5" /></button>
      </div>
      <div className="mt-3 flex justify-center gap-1.5">
        {shots.map((s, i) => (
          <button key={s.src} type="button" aria-label={`Ver captura ${i + 1}`} aria-current={i === idx} onClick={() => goTo(i)} className={`h-2 rounded-full transition-all ${i === idx ? "w-6 bg-primary" : "w-2 bg-border"}`} />
        ))}
      </div>
    </div>
  );
};
