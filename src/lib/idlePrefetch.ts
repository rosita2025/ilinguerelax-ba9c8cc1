import { getPatronesConnection, isPatronesConstrainedConnection } from "@/lib/patronesNetwork";

/**
 * Ejecuta una precarga (p. ej. el JS del checkout) SOLO cuando la página ya terminó de cargar y pasó un rato,
 * y nunca con datos limitados o conexión lenta: antes se lanzaba al primer momento libre y competía con la portada.
 * Devuelve la función que cancela.
 */
export function prefetchWhenCalm(fn: () => void, delayMs = 3000): () => void {
  if (typeof window === "undefined" || isPatronesConstrainedConnection(getPatronesConnection())) return () => {};
  let cancelled = false;
  let timer: number | undefined;
  const run = () => {
    if (cancelled) return;
    timer = window.setTimeout(() => { if (!cancelled) fn(); }, delayMs);
  };
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener("load", run);
    if (timer) window.clearTimeout(timer);
  };
}
