import reel1 from "@/assets/maglia-relax/reel-1.mp4.asset.json";
import reel2 from "@/assets/maglia-relax/reel-2.mp4.asset.json";
import reel3 from "@/assets/maglia-relax/reel-3.mp4.asset.json";
import poster1 from "@/assets/maglia-relax/reel-1.jpg.asset.json";
import poster2 from "@/assets/maglia-relax/reel-2.jpg.asset.json";
import poster3 from "@/assets/maglia-relax/reel-3.jpg.asset.json";
import presentation from "@/assets/maglia-relax/presentation.png.asset.json";

export const PRESENTATION_IMAGE = presentation.url;

/**
 * Datos editables de la landing del curso "Maglia Relax".
 * Aquí Rosa (o Lovable) cambia cosas sin tocar el diseño.
 *
 * REGLAS:
 *  - Reseñas: SOLO de personas reales que de verdad vieron el curso.
 *  - Videos (reels): SOLO videos propios de Rosa.
 *  - No inventar ratings ni números.
 */

// ── Interruptores ─────────────────────────────────────────────────────────────
/** ¿El producto incluye una guía en PDF además de los videos? */
export const INCLUDES_PDF = false;
/** ¿Vas a agregar videos nuevos con el tiempo? Solo pon true si lo vas a cumplir. */
export const ADDS_NEW_LESSONS = false;

// ── Reseñas REALES ────────────────────────────────────────────────────────────
// Vacío = no se muestra ninguna reseña, ni estrellas, ni "4.8/5".
// Ejemplo:
//   { name: "Giulia", city: "Torino", stars: 5, text: "Finalmente ho capito...", freeAccess: true }
// `freeAccess: true` agrega "Ha ricevuto l'accesso gratuito al corso" (transparencia
// obligatoria si la persona recibió el curso gratis).
export interface RealReview {
  name: string;
  city?: string;
  /** 1 a 5 */
  stars: number;
  text: string;
  freeAccess?: boolean;
}
export const REAL_REVIEWS: RealReview[] = [];

export const getRealReviewStats = () => {
  const count = REAL_REVIEWS.length;
  const average =
    count > 0 ? REAL_REVIEWS.reduce((sum, r) => sum + Math.min(5, Math.max(1, r.stars)), 0) / count : 0;
  return { count, average };
};

/**
 * Frases cortas para rotar en la barra pegajosa. Salen AUTOMÁTICAMENTE de REAL_REVIEWS
 * (solo reseñas de 4 o 5 estrellas), recortadas a ~90 caracteres. Vacío si no hay reseñas.
 */
export const getStickyTestimonials = (): string[] =>
  REAL_REVIEWS.filter((r) => r.stars >= 4).map((r) => {
    const who = r.city ? `${r.name}, ${r.city}` : r.name;
    const clean = r.text.replace(/\s+/g, " ").trim();
    const short = clean.length > 90 ? `${clean.slice(0, 90).replace(/\s+\S*$/, "")}…` : clean;
    return `${who}: ${short}`;
  });

// ── Videos (reels) de Rosa ────────────────────────────────────────────────────
// Vacío = la sección no aparece. Máximo 3.
// `src`: link directo a un .mp4 (vertical 9:16) o link de YouTube.
// `poster`: imagen de portada opcional.
// Ejemplo:
//   { src: "https://.../reel-1.mp4", poster: "https://.../reel-1.jpg" }
export interface ReelVideo {
  src: string;
  poster?: string;
}
export const REELS: ReelVideo[] = [
  { src: reel1.url, poster: poster1.url },
  { src: reel2.url, poster: poster2.url },
  { src: reel3.url, poster: poster3.url },
];
