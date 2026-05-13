import { useRef, useState, useCallback, useEffect } from "react";
import { MoveHorizontal } from "lucide-react";

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt?: string;
  afterAlt?: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export const BeforeAfterSlider = ({
  beforeSrc,
  afterSrc,
  beforeAlt = "Antes",
  afterAlt = "Después",
  beforeLabel = "ANTES",
  afterLabel = "DESPUÉS",
}: BeforeAfterSliderProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);

  const setFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      setFromClientX(e.clientX);
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [setFromClientX]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[3/4] md:aspect-[4/3] overflow-hidden rounded-2xl border border-border shadow-card bg-card select-none touch-none"
      onPointerDown={(e) => { dragging.current = true; setFromClientX(e.clientX); }}
    >
      {/* After (full) */}
      <img src={afterSrc} alt={afterAlt} className="absolute inset-0 w-full h-full object-contain bg-white pointer-events-none" draggable={false} />
      {/* Before (clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={beforeSrc} alt={beforeAlt} className="absolute inset-0 w-full h-full object-contain bg-white pointer-events-none" draggable={false} />
      </div>

      {/* Labels */}
      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 text-white text-xs font-bold tracking-wide">{beforeLabel}</span>
      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold tracking-wide">{afterLabel}</span>

      {/* Divider line */}
      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.2)] pointer-events-none" style={{ left: `${pos}%`, transform: "translateX(-50%)" }} />
      {/* Handle */}
      <button
        type="button"
        aria-label="Arrastra para comparar"
        className="absolute top-1/2 w-11 h-11 -mt-5 -ml-5 rounded-full bg-white shadow-hero border border-border flex items-center justify-center cursor-ew-resize hover:scale-110 transition-transform"
        style={{ left: `${pos}%` }}
        onPointerDown={(e) => { e.stopPropagation(); dragging.current = true; }}
      >
        <MoveHorizontal className="w-5 h-5 text-foreground" />
      </button>
    </div>
  );
};

export default BeforeAfterSlider;