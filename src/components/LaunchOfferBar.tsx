import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

type Lang = "es" | "en" | "it";

const T: Record<Lang, { brand: string; launch: string; once: string; noSubs: string; instant: string }> = {
  es: { brand: "iLingue Relax · marca educativa", launch: "Precio de lanzamiento", once: "Pago único", noSubs: "Sin suscripciones", instant: "Acceso inmediato" },
  en: { brand: "iLingue Relax · educational brand", launch: "Launch price", once: "One-time payment", noSubs: "No subscriptions", instant: "Instant access" },
  it: { brand: "iLingue Relax · marchio educativo", launch: "Prezzo di lancio", once: "Pagamento unico", noSubs: "Nessun abbonamento", instant: "Accesso immediato" },
};

const parseNum = (s?: string) => {
  if (!s) return NaN;
  const cleaned = s.replace(/[^\d.,-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  return parseFloat(cleaned);
};

interface Props {
  /** Precio que muestra la página (ya en la moneda del visitante). */
  price: string;
  /** Precio anterior tachado que muestra la página, si lo hay. */
  originalPrice?: string;
  lang?: Lang;
  /** Libro físico: no se promete «acceso inmediato». */
  isPhysical?: boolean;
}

/**
 * Cinta superior con movimiento para TODAS las páginas de producto (se monta desde StickyBuyBar).
 * Solo repite lo que la página ya muestra: el precio y el precio anterior tachado (sin un «% OFF» propio).
 * Sin precio anterior, no muestra tachado.
 * Se inserta al inicio del <body> con un espaciador y una barra fija (el <body> tiene overflow oculto, así
 * que `sticky` no funciona), para que no tape el menú.
 */
export const LaunchOfferBar = ({ price, originalPrice, lang = "es", isPhysical = false }: Props) => {
  const [host, setHost] = useState<HTMLElement | null>(null);

  // useLayoutEffect: el espacio de 36 px existe antes del primer pintado y no desplaza la página (CLS).
  useLayoutEffect(() => {
    const el = document.createElement("div");
    el.setAttribute("data-ilr-launch-bar", "");
    el.style.height = "36px";
    el.style.position = "relative";
    document.body.prepend(el);
    setHost(el);
    return () => {
      el.remove();
    };
  }, []);

  if (!host) return null;
  // Sin cifra (p. ej. «Cargando precio…») la cinta sale sin el precio (el alto es fijo, no mueve nada); el precio entra cuando es real.
  const hasPrice = /\d/.test(price);
  const t = T[lang] ?? T.es;
  const p = parseNum(price);
  const o = parseNum(originalPrice);
  const pct = hasPrice && isFinite(p) && isFinite(o) && o > p ? Math.round((1 - p / o) * 100) : 0;

  const items = (
    <>
      <span>{t.brand}</span>
      <span className="opacity-60" aria-hidden="true">✦</span>
      {hasPrice && (
        <>
          <span className="inline-flex items-center gap-2">
            {t.launch}: <b>{price}</b>
            {originalPrice && pct > 0 && <s className="font-medium opacity-75">{originalPrice}</s>}
          </span>
          <span className="opacity-60" aria-hidden="true">✦</span>
        </>
      )}
      <span>{t.once}</span>
      <span className="opacity-60" aria-hidden="true">✦</span>
      <span>{t.noSubs}</span>
      {!isPhysical && (
        <>
          <span className="opacity-60" aria-hidden="true">✦</span>
          <span>{t.instant}</span>
        </>
      )}
      <span className="opacity-60" aria-hidden="true">✦</span>
    </>
  );

  return createPortal(
    <div
      role="note"
      aria-label={t.launch}
      className="fixed inset-x-0 top-0 z-[55] h-9 overflow-hidden bg-primary text-primary-foreground shadow-md"
    >
      <div className="flex h-full w-max items-center gap-6 whitespace-nowrap text-xs font-bold uppercase tracking-wider motion-safe:animate-ilr-marquee sm:text-[13px]">
        <div className="flex items-center gap-6 pr-6">{items}</div>
        <div className="flex items-center gap-6 pr-6" aria-hidden="true">{items}</div>
      </div>
    </div>,
    host,
  );
};
