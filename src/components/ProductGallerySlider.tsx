import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Extra = { src: string; alt: string };

/**
 * Galería manual tipo Shopify: la primera diapositiva es la portada (se pasa ya armada para conservar su carga
 * prioritaria), el resto se carga al acercarse. Se desliza con el dedo (scroll-snap), con flechas, con los puntos
 * o con las miniaturas. Sin autoplay.
 */
export const ProductGallerySlider = ({ cover, extras, coverThumb, warm = false }: { cover: ReactNode; extras: Extra[]; coverThumb?: string; warm?: boolean }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  // Las imágenes extra pesan ~200 KB c/u: no se piden hasta que la portada ya cargó (`warm`) o el visitante toca la galería.
  const [touched, setTouched] = useState(false);
  const active = warm || touched;
  const total = 1 + extras.length;

  const goTo = useCallback((i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const n = Math.max(0, Math.min(total - 1, i));
    el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" });
  }, [total]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setIdx(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => { el.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(idx - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(idx + 1); }
  };

  const arrow = "absolute top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md ring-1 ring-black/10 transition hover:bg-white disabled:opacity-0 disabled:pointer-events-none";

  return (
    <div role="group" aria-roledescription="carrusel" aria-label="Imágenes del producto" onKeyDown={onKeyDown} onPointerDown={() => setTouched(true)} onTouchStart={() => setTouched(true)} onFocus={() => setTouched(true)}>
      <div className="relative">
        <div
          ref={trackRef}
          tabIndex={0}
          className="flex overflow-x-auto snap-x snap-mandatory rounded-2xl shadow-hero [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <div className="w-full shrink-0 snap-center" aria-label={`Imagen 1 de ${total}`}>{cover}</div>
          {extras.map((x, i) => (
            <div key={x.src} className="w-full shrink-0 snap-center aspect-[4/5] bg-card" aria-label={`Imagen ${i + 2} de ${total}`}>
              {active ? <img src={x.src} alt={x.alt} loading="lazy" decoding="async" draggable={false} className="h-full w-full object-contain" /> : null}
            </div>
          ))}
        </div>
        {total > 1 && (
          <>
            <button type="button" aria-label="Imagen anterior" className={`${arrow} left-2`} disabled={idx === 0} onClick={() => goTo(idx - 1)}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" aria-label="Imagen siguiente" className={`${arrow} right-2`} disabled={idx === total - 1} onClick={() => goTo(idx + 1)}>
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-2 right-2 z-10 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white tabular-nums">
              {idx + 1} / {total}
            </span>
          </>
        )}
      </div>
      {total > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {[coverThumb, ...extras.map((x) => (active ? x.src : undefined))].map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={i === 0 ? "Ver portada" : `Ver imagen ${i + 1}`}
              aria-current={i === idx}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-card transition-colors md:h-20 md:w-20 ${i === idx ? "border-primary" : "border-border opacity-70 hover:opacity-100"}`}
            >
              {src ? <img src={src} alt="" loading="lazy" decoding="async" draggable={false} className="h-full w-full object-cover" /> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
