// Portada del admin: versión liviana + recuerdo de la última portada vista.
// Todo es solo de lectura/visual: no toca precios, pagos ni el catálogo.

const PUBLIC_PATH = "/storage/v1/object/public/";
const RENDER_PATH = "/storage/v1/render/image/public/";
const OFF_KEY = "ilr_img_transform_off";

function transformOff(): boolean {
  try { return localStorage.getItem(OFF_KEY) === "1"; } catch { return false; }
}

/** Marca que el servidor no transforma imágenes, para no volver a intentarlo. */
export function disableImageTransform() {
  try { localStorage.setItem(OFF_KEY, "1"); } catch { /* ignore */ }
}

/**
 * Devuelve la URL de una imagen de Supabase Storage redimensionada (WebP ligero).
 * Cualquier otra URL, o si el servidor no soporta transformación, se devuelve igual.
 */
export function lightCoverUrl(url: string | null, width = 800, quality = 75): string | null {
  if (!url || !url.includes(PUBLIC_PATH) || transformOff()) return url;
  const base = url.split("?")[0].replace(PUBLIC_PATH, RENDER_PATH);
  return `${base}?width=${width}&quality=${quality}&resize=contain`;
}

const key = (sku: string) => `ilr_cover_${sku}`;

/** Última portada vista de este producto (la imagen empieza a bajar sin esperar a la base de datos). */
export function readCachedCover(sku: string): string | null {
  try { return localStorage.getItem(key(sku)); } catch { return null; }
}

export function writeCachedCover(sku: string, url: string | null) {
  try {
    if (url) localStorage.setItem(key(sku), url);
    else localStorage.removeItem(key(sku));
  } catch { /* ignore */ }
}
