import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  /** «ebook», «libro»… → «Con tu {noun} vas a acceder a:» */
  noun?: string;
  /** Lo que de verdad incluye ESTA página (puede llevar <b>…</b>, solo texto nuestro). */
  items: string[];
  /** Precio y precio anterior tachado que YA muestra la página (sin «% OFF» ni escasez inventados). */
  priceLabel: string;
  originalLabel?: string;
  ready: boolean;
  onBuy: () => void;
  /** Etiqueta bajo el precio, p. ej. «Libro + 4 bonos gratis · Pago único». */
  pill: string;
  ctaText: string;
  onPrefetch?: () => void;
}

/**
 * «Oferta especial» de cierre, antes de las preguntas frecuentes (mismo formato que la de Patrones):
 * lista de lo que incluye, caja de «Precio de lanzamiento» con el precio real de la página y un botón.
 */
export const SpecialOfferCard = ({ noun = "libro", items, priceLabel, originalLabel, ready, onBuy, pill, ctaText, onPrefetch }: Props) => (
  <section className="py-6 md:py-8 bg-gradient-to-b from-primary/10 to-primary/5">
    <div className="container px-4 md:px-6">
      <div className="max-w-xl mx-auto rounded-3xl border-2 border-primary/30 bg-white p-6 text-center shadow-[0_0_0_8px_hsl(var(--primary)/0.12)] md:p-8">
        <div className="flex items-center justify-center gap-3 text-xs font-extrabold uppercase tracking-widest text-primary">
          <span className="h-px w-8 bg-primary" aria-hidden="true" /> Oferta especial <span className="h-px w-8 bg-primary" aria-hidden="true" />
        </div>
        <h2 className="mt-3 text-3xl font-extrabold uppercase leading-tight tracking-tight text-foreground md:text-4xl">
          Con tu {noun} <span className="text-primary">vas a acceder a:</span>
        </h2>
        <ul className="mt-6 space-y-3 text-left">
          {items.map((x) => (
            <li key={x} className="flex items-center gap-3 text-sm font-semibold text-foreground md:text-base">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"><Check className="h-4 w-4" strokeWidth={3} /></span>
              <span dangerouslySetInnerHTML={{ __html: x }} />
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-5">
          <div className="text-xs font-extrabold uppercase tracking-widest text-primary">Precio de lanzamiento</div>
          <div className="mt-1 text-5xl font-extrabold text-foreground">{ready ? priceLabel : "…"}</div>
          {ready && originalLabel && <div className="mt-1 text-sm text-muted-foreground">Precio anterior: <span className="line-through">{originalLabel}</span></div>}
          <span className="mt-3 inline-block rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-foreground sm:text-xs">{pill}</span>
        </div>

        <Button variant="hero" size="xl" onClick={onBuy} onPointerEnter={onPrefetch} onFocus={onPrefetch} onTouchStart={onPrefetch} disabled={!ready} className="mt-6 h-auto w-full max-w-full whitespace-normal px-4 py-4 text-sm leading-tight shadow-2xl sm:text-base">
          {ctaText}
          <ArrowRight className="w-4 h-4 ml-2 shrink-0" />
        </Button>
      </div>
    </div>
  </section>
);

export default SpecialOfferCard;
