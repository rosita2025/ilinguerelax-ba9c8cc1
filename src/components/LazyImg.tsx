import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";

/**
 * Imagen que empieza a descargarse solo cuando está a ~300 px de aparecer en pantalla.
 * El `loading="lazy"` nativo del navegador adelanta mucho la descarga (más aún en conexiones lentas),
 * y las imágenes pesadas de más abajo terminaban compitiendo con la carga inicial de la página.
 */
type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "loading"> & {
  src: string;
  alt: string;
  /** Distancia a la pantalla desde la que empieza a descargar. */
  rootMargin?: string;
  /** Clases del contenedor (por ejemplo "absolute inset-0"). */
  wrapperClassName?: string;
  /** Alto reservado mientras la imagen no ha bajado (evita saltos de diseño). */
  minHeight?: number;
};

export function LazyImg({ src, alt, rootMargin = "300px", wrapperClassName = "block", minHeight, onLoad, onError, ...rest }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [show, setShow] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  // Mientras baja (o si el CDN falla una vez) se ve un fondo suave en vez de un hueco en blanco;
  // si falla, reintenta hasta 2 veces con una pequeña espera.
  const handleError: ImgHTMLAttributes<HTMLImageElement>["onError"] = (e) => {
    onError?.(e);
    if (attempt < 2) setTimeout(() => setAttempt((n) => n + 1), 1200 * (attempt + 1));
  };
  const finalSrc = attempt > 0 ? `${src}${src.includes("?") ? "&" : "?"}r=${attempt}` : src;

  return (
    <span
      ref={ref}
      className={`${wrapperClassName} ${show && !loaded ? "bg-muted/60 animate-pulse" : ""}`}
      style={!show && minHeight ? { minHeight } : undefined}
    >
      {show && (
        <img
          key={attempt}
          src={finalSrc}
          alt={alt}
          decoding="async"
          {...rest}
          onLoad={(e) => { setLoaded(true); onLoad?.(e); }}
          onError={handleError}
        />
      )}
    </span>
  );
}

/** Monta su contenido (videos, carruseles) solo cuando está cerca de aparecer en pantalla. */
export function LazyMount({ children, minHeight = 300, rootMargin = "300px" }: { children: React.ReactNode; minHeight?: number; rootMargin?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setShow(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShow(true); io.disconnect(); } }, { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return <div ref={ref} style={show ? undefined : { minHeight }}>{show ? children : null}</div>;
}
