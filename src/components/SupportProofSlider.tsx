import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

export type SupportShot = { src: string; full: string; width: number; height: number; flag: string; country: string; caption: string; alt: string };

/**
 * Capturas reales de WhatsApp de atención posventa. Slider MANUAL (scroll-snap: dedo, flechas o puntos), sin autoplay.
 * Tarjetas de ALTO FIJO (la captura se ve entera, sin recortar) para que la sección sea corta; al tocar se abre la captura
 * grande para leerla. Carga rápida: webp de 480 px en las tarjetas (perezosas) y la grande solo al tocar.
 */
export const SupportProofSlider = ({ shots }: { shots: SupportShot[] }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState<number | null>(null);

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

  // Zoom: bloquea el scroll de la página, Escape cierra, flechas cambian de captura.
  useEffect(() => {
    if (zoom === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(null);
      if (e.key === "ArrowLeft") setZoom((z) => (z === null ? z : Math.max(0, z - 1)));
      if (e.key === "ArrowRight") setZoom((z) => (z === null ? z : Math.min(shots.length - 1, z + 1)));
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [zoom, shots.length]);

  const arrow = "absolute top-[40%] -translate-y-1/2 z-10 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/10 hover:bg-white disabled:opacity-0 disabled:pointer-events-none";

  return (
    <div role="group" aria-roledescription="carrusel" aria-label="Capturas reales de atención al cliente">
      <div className="relative">
        <div ref={trackRef} className="flex items-start gap-3 overflow-x-auto snap-x snap-mandatory px-[10%] md:px-0 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {shots.map((s, i) => (
            <figure key={s.src} className="w-[78%] sm:w-[46%] md:w-[31%] shrink-0 snap-center overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <button type="button" onClick={() => setZoom(i)} aria-label={`Ampliar captura de ${s.country}`} className="group relative block h-[300px] w-full bg-muted md:h-[340px]">
                <img
                  src={s.src}
                  alt={s.alt}
                  width={s.width}
                  height={s.height}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  draggable={false}
                  className="h-full w-full select-none object-contain"
                />
                <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-semibold text-white">
                  <ZoomIn className="h-3 w-3" /> Ampliar
                </span>
              </button>
              <figcaption className="flex items-start gap-2 border-t border-border p-3 text-left">
                <span className="text-lg leading-none" aria-hidden="true">{s.flag}</span>
                <span className="text-[13px] leading-snug text-foreground"><strong>{s.country}</strong> · {s.caption}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <button type="button" aria-label="Anterior" className={`${arrow} -left-3`} disabled={idx === 0} onClick={() => goTo(idx - 1)}><ChevronLeft className="h-5 w-5" /></button>
        <button type="button" aria-label="Siguiente" className={`${arrow} -right-3`} disabled={idx === shots.length - 1} onClick={() => goTo(idx + 1)}><ChevronRight className="h-5 w-5" /></button>
      </div>
      <div className="mt-2 flex justify-center gap-1.5">
        {shots.map((s, i) => (
          <button key={s.src} type="button" aria-label={`Ver captura ${i + 1}`} aria-current={i === idx} onClick={() => goTo(i)} className={`h-2 rounded-full transition-all ${i === idx ? "w-6 bg-primary" : "w-2 bg-border"}`} />
        ))}
      </div>

      {zoom !== null && (
        <div role="dialog" aria-modal="true" aria-label="Captura ampliada" className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-3" onClick={() => setZoom(null)}>
          <button type="button" aria-label="Cerrar" className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black" onClick={() => setZoom(null)}><X className="h-5 w-5" /></button>
          <div className="max-h-full overflow-y-auto rounded-xl" onClick={(e) => e.stopPropagation()}>
            <img src={shots[zoom].full} alt={shots[zoom].alt} draggable={false} className="mx-auto block h-auto w-full max-w-[460px] select-none" />
          </div>
        </div>
      )}
    </div>
  );
};
