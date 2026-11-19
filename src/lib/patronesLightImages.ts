import p1 from "../assets/patrones-new/patrones-20-30.webp.asset.json";
import p2 from "../assets/patrones-new/patrones-letras-mudas.webp.asset.json";
import p3 from "../assets/patrones-new/patrones-sufijos.webp.asset.json";
import p4 from "../assets/patrones-new/patrones-contracciones.webp.asset.json";
import b1 from "../assets/patrones-new/bono-1000-palabras.webp.asset.json";
import b2 from "../assets/patrones-new/bono-gramatica.webp.asset.json";
import b3 from "../assets/patrones-new/bono-examen.webp.asset.json";
import p1l from "../assets/patrones-new/patrones-20-30-600.webp.asset.json";
import p2l from "../assets/patrones-new/patrones-letras-mudas-600.webp.asset.json";
import p3l from "../assets/patrones-new/patrones-sufijos-600.webp.asset.json";
import p4l from "../assets/patrones-new/patrones-contracciones-600.webp.asset.json";
import b1l from "../assets/patrones-new/bono-1000-palabras-600.webp.asset.json";
import b2l from "../assets/patrones-new/bono-gramatica-600.webp.asset.json";
import b3l from "../assets/patrones-new/bono-examen-600.webp.asset.json";

/**
 * Copias de 600 px (≈ 40 KB; las originales pesan ~200 KB las páginas y ~90 KB los bonos) de las imágenes de vista previa y bonos de Patrones.
 * `srcSet` deja que el celular baje la liviana y la computadora (o pantallas de mucha densidad) la original. Se usa en la página del producto
 * y en la de vista previa para que las dos queden iguales. Una imagen que no esté aquí se sirve tal cual.
 */
const LIGHT: Record<string, { light: string; w: number }> = {
  [p1.url]: { light: p1l.url, w: 900 },
  [p2.url]: { light: p2l.url, w: 900 },
  [p3.url]: { light: p3l.url, w: 900 },
  [p4.url]: { light: p4l.url, w: 900 },
  [b1.url]: { light: b1l.url, w: 1254 },
  [b2.url]: { light: b2l.url, w: 1254 },
  [b3.url]: { light: b3l.url, w: 1254 },
};

/** Atributos `srcSet` + `sizes` para un <img> (vacío si la imagen no tiene copia liviana). */
export function lightSet(src: string, sizes: string): { srcSet?: string; sizes?: string } {
  const l = LIGHT[src];
  return l ? { srcSet: `${l.light} 600w, ${src} ${l.w}w`, sizes } : {};
}

/** Versión liviana para miniaturas pequeñas. */
export function lightThumb(src: string): string {
  return LIGHT[src]?.light ?? src;
}
