import fastCover from "../assets/patrones-new/patrones-cover-light.webp.asset.json";
import mobileCover from "../assets/patrones-new/patrones-cover-mobile.webp.asset.json";

// This identifies the snapshot only; a different admin cover always takes precedence.
export const PATRONES_COVER_SOURCE = "https://opyitzdvvurdyyyzkwwv.supabase.co/storage/v1/object/public/product-images/patrones-especiales-alfabeto-combinaciones-secretas-ingles/1789945794300-1sxv9.webp";
export const PATRONES_FAST_COVER_URL = fastCover.url;
export const PATRONES_MOBILE_COVER_URL = mobileCover.url;
export const PATRONES_COVER_SRCSET = `${mobileCover.url} 480w, ${fastCover.url} 800w`;
export const PATRONES_COVER_SIZES = "(max-width: 767px) calc(100vw - 32px), 560px";
export const PATRONES_PRODUCT_SLUG = "patrones-especiales-alfabeto-combinaciones-secretas-ingles";