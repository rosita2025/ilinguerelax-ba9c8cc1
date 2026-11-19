import { prefetchCheckoutProduct } from "@/lib/checkoutProductCache";
import { lazy, Suspense, useMemo, useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { useHotmartPixel, trackHotmartEvent } from "@/hooks/useMetaPixel";
import { SEO } from "@/components/SEO";
import { ProductGallerySlider } from "@/components/ProductGallerySlider";
import type { SupportShot } from "@/components/SupportProofSlider";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import { Button } from "@/components/ui/button";
import { Star, Check, BookOpen, ArrowRight, ShoppingCart, Smartphone, Lightbulb, CreditCard, Sparkles, Shield, Eye, Music2, Download, Lock, X, ZoomIn } from "lucide-react";
import { DigitalProductNotice } from "@/components/DigitalProductNotice";
import { PaymentLogos } from "@/components/checkout/PaymentLogos";
import { motion } from "framer-motion";
import { useAdminPricing } from "@/hooks/useAdminPricing";
import { useCountryTierRouting } from "@/hooks/useCountryTierRouting";
import { useRegionTier } from "@/hooks/useRegionTier";
import { detectCurrency, formatPrice, formatCurrencyAmount, exchangeRates, type Currency } from "@/i18n";
import { useLocalOverrides } from "@/lib/livePrices";
import { CheckoutLanguageProvider, useI18n } from "@/i18n/I18nContext";
import { PATRONES_COVER_SOURCE as FAST_COVER_SOURCE, PATRONES_FAST_COVER_URL, PATRONES_MOBILE_COVER_URL, PATRONES_COVER_SRCSET, PATRONES_COVER_SIZES } from "@/lib/patronesCover";
import { getPatronesConnection, isPatronesConstrainedConnection } from "@/lib/patronesNetwork";
import { PATRONES_HERO } from "@/lib/patronesHero";

// Below-the-fold modules download only when their sections approach the viewport.

// Secciones de más abajo: su código se descarga solo al acercarse (antes iban en la descarga inicial y retrasaban el primer dibujo).
const Footer = lazy(() => import("@/components/Footer").then((m) => ({ default: m.Footer })));
const FAQ = lazy(() => import("@/components/FAQ").then((m) => ({ default: m.FAQ })));
const FounderCommunity = lazy(() => import("@/components/FounderCommunity").then((m) => ({ default: m.FounderCommunity })));
const SupportProofSlider = lazy(() => import("@/components/SupportProofSlider").then((m) => ({ default: m.SupportProofSlider })));
const SalesNotification = lazy(() => import("@/components/SalesNotification"));
// El aviso de ventas recientes es lo último en cargar: espera a que la página esté lista.
const useAfterLoad = (ms: number) => {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const go = () => { const t = window.setTimeout(() => setOn(true), ms); return () => window.clearTimeout(t); };
    if (document.readyState === "complete") return go();
    let clear: (() => void) | undefined;
    const h = () => { clear = go(); };
    window.addEventListener("load", h, { once: true });
    return () => { window.removeEventListener("load", h); clear?.(); };
  }, [ms]);
  return on;
};

// Menú de arriba: solo en computadora (≥ 1024 px). Se descarga SOLO ahí: en celular ni se pide ni se pinta.
const DesktopNavbar = lazy(() => import("@/components/Navbar").then((m) => ({ default: m.Navbar })));
const useIsDesktop = () => {
  const q = "(min-width: 1024px)";
  const [on, setOn] = useState(() => typeof window !== "undefined" && window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const f = () => setOn(m.matches);
    f();
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return on;
};

const TIENDA_CHECKOUT_PATH = "/checkouts/patrones-ingles";
// ÚNICA regla final para Patrones:
// Perú → tienda interna PEN. VE/CU/NI → tienda interna USD. Global → tienda interna USD.
// Solo LATAM permitido (sin PE/VE/CU/NI) usa Hotmart LATAM.
const TIENDA_USD_COUNTRIES = new Set(["VE", "CU", "NI"]);


const productImage = "/images/product-patrones-especiales.webp";

import patronesPreview1 from "@/assets/patrones-new/patrones-20-30.webp.asset.json";
import patronesPreview2 from "@/assets/patrones-new/patrones-letras-mudas.webp.asset.json";
import patronesPreview3 from "@/assets/patrones-new/patrones-sufijos.webp.asset.json";
import patronesPreview4 from "@/assets/patrones-new/patrones-contracciones.webp.asset.json";
import bono1000 from "@/assets/patrones-new/bono-1000-palabras.webp.asset.json";
import bonoGramaticaImg from "@/assets/patrones-new/bono-gramatica.webp.asset.json";
import bonoExamenImg from "@/assets/patrones-new/bono-examen.webp.asset.json";
import resenaMx1 from "@/assets/resena-mx1.webp.asset.json";
import resenaMx2 from "@/assets/resena-mx2.webp.asset.json";
import resenaMx3 from "@/assets/resena-mx3.webp.asset.json";
import resenaMx4 from "@/assets/resena-mx4.webp.asset.json";
import { PinterestSave } from "@/components/PinterestSave";
import { LazyImg, LazyMount } from "@/components/LazyImg";
import patronesComparativaAsset from "@/assets/patrones-new/patrones-comparativa.webp.asset.json";
import { lightCoverUrl, disableImageTransform, readCachedCover, writeCachedCover } from "@/lib/coverImage";

const previews = [
  { src: patronesPreview1.url, alt: "20 patrones nuevos de pronunciación en inglés", caption: "20 patrones nuevos" },
  { src: patronesPreview2.url, alt: "Letras mudas en inglés con reglas y ejemplos", caption: "Letras mudas" },
  { src: patronesPreview3.url, alt: "Sufijos y prefijos en inglés con pronunciación adaptada", caption: "Sufijos y prefijos" },
  { src: patronesPreview4.url, alt: "Contracciones y habla rápida en inglés", caption: "Contracciones y habla rápida" },
];

// Capturas REALES de WhatsApp de atención posventa (datos privados tapados a mano por el dueño; sin editar ni IA). Más en public/soporte-patrones.
const shot = (name: string, h: number, flag: string, country: string, caption: string, alt: string): SupportShot => ({
  src: `/soporte-patrones/${name}.webp`, full: `/soporte-patrones/${name}-full.webp`, width: 480, height: h, flag, country, caption, alt,
});
const supportShots: SupportShot[] = [
  shot("mexico-dlocal", 896, "🇲🇽", "México", "Pago con dLocal confirmado: material enviado a su correo.", "Captura real de WhatsApp: cliente de México pagó con dLocal y recibe el material en su correo"),
  shot("usa-icloud", 886, "🇺🇸", "EE. UU.", "Correo de iCloud en spam: se reenvía a su Gmail.", "Captura real de WhatsApp: cliente de EE. UU. recibe el material en otro correo porque iCloud lo manda a spam"),
  shot("peru-yape", 907, "🇵🇪", "Perú", "Pago manual con Yape: revisado y enviado al correo.", "Captura real de WhatsApp: cliente de Perú confirma su pago por Yape y recibe el material"),
  shot("mexico-material", 886, "🇲🇽", "México", "Ebook + 3 bonos enviados por WhatsApp.", "Captura real de WhatsApp: cliente de México recibe el ebook y los 3 bonos y agradece"),
  shot("espana-spotify", 985, "🇪🇸", "España", "Bono de 1,000 palabras con su audio en Spotify.", "Captura real de WhatsApp: cliente de España recibe el enlace del audio de 1,000 palabras"),
  shot("espana-actualizacion", 896, "🇪🇸", "España", "Material actualizado (versión 1.5) para quien ya compró.", "Captura real de WhatsApp: cliente de España recibe la actualización de su pedido"),
];

const bonusCards = [
  { src: bono1000.url, alt: "1,000 palabras en inglés con pronunciación para hispanohablantes", tag: "Bono 1 · Gratis", title: "1,000 palabras en inglés con pronunciación en español", text: "Vocabulario por temas (A1 a B2) con fonética UK/US adaptada.", extra: "Audio en Spotify: Podcast iLingue Relax" },
  { src: bonoGramaticaImg.url, alt: "Estructuras Gramaticales de inglés A1 a A2: verbos en presente DO/DOES con pronunciación en español", tag: "Bono 2 · Gratis", title: "Estructuras gramaticales desde cero hasta A2", text: "Verbos, afirmativos, negativos, preguntas y pronunciación adaptada.", extra: "" },
  { src: bonoExamenImg.url, alt: "Examen completo de Patrones Especiales: 98 preguntas con hoja de respuestas incluida", tag: "Bono 3 · Gratis", title: "Examen completo: 98 preguntas", text: "Confirma que dominas los patrones, con hoja de respuestas.", extra: "" },
];

const photoReviews = [
  { src: resenaMx1.url, flag: "🇲🇽", country: "México", alt: "Reseña real por WhatsApp desde México sobre Patrones Especiales" },
  { src: resenaMx2.url, flag: "🇲🇽", country: "México", alt: "Testimonio de cliente mexicano sobre el ebook" },
  { src: resenaMx3.url, flag: "🇲🇽", country: "México", alt: "Cliente de México comparte su experiencia" },
  { src: resenaMx4.url, flag: "🇵🇪", country: "Perú", alt: "Reseña real por WhatsApp desde Perú sobre la pronunciación" },
];

const ReviewSlider = () => {
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  // Fotos ya montadas: la actual y la siguiente (y la que sale), para que nunca se vea una caja vacía al deslizar.
  const [seen, setSeen] = useState<Set<number>>(() => new Set());

  // Nada se descarga ni se mueve hasta que el carrusel está cerca de la pantalla.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    setSeen((prev) => {
      const next = new Set(prev);
      next.add(idx);
      next.add((idx + 1) % photoReviews.length);
      return next;
    });
  }, [visible, idx]);

  useEffect(() => {
    if (!visible || zoom !== null) return; // pausa el slider mientras el zoom está abierto
    const t = setInterval(() => setIdx((i) => (i + 1) % photoReviews.length), 3500);
    return () => clearInterval(t);
  }, [visible, zoom]);

  // Bloquea el scroll de la página y cierra con Escape mientras el zoom está abierto
  useEffect(() => {
    if (zoom === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setZoom(null); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [zoom]);

  const protect = {
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    onDragStart: (e: React.DragEvent) => e.preventDefault(),
    draggable: false,
  } as const;

  return (
    <div ref={rootRef} className="mx-auto max-w-sm">
      <div className="relative overflow-hidden rounded-xl border border-border shadow-card bg-card">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${idx * 100}%)` }}>
          {photoReviews.map((r, i) => (
            <figure key={`${r.src}-${i}`} className="relative w-full shrink-0">
              <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-background/90 text-foreground text-[11px] font-bold border border-border">
                {r.flag} {r.country}
              </div>
              <button
                type="button"
                aria-label={`Ampliar reseña de ${r.country}`}
                onClick={() => setZoom(i)}
                className="block w-full aspect-square cursor-zoom-in"
              >
                {seen.has(i) && <LazyImg src={r.src} alt={r.alt} eager width={1024} height={1024} wrapperClassName="block aspect-square" className="w-full h-auto block select-none" {...protect} />}
              </button>
              <div className="pointer-events-none absolute bottom-2 right-2 z-10 rounded-full bg-background/90 border border-border p-1.5">
                <ZoomIn className="h-3.5 w-3.5 text-foreground" />
              </div>
            </figure>
          ))}
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-2">
        {photoReviews.map((_, i) => (
          <button key={i} type="button" aria-label={`Ver reseña ${i + 1}`} onClick={() => setIdx(i)}
            className={`h-2 rounded-full transition-all ${i === idx ? "w-6 bg-primary" : "w-2 bg-muted-foreground/40"}`} />
        ))}
      </div>

      {zoom !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Reseña ampliada"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setZoom(null)}
        >
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setZoom(null)}
            className="absolute top-4 right-4 z-10 rounded-full bg-white/10 border border-white/20 p-2 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute top-4 left-4 z-10 px-2 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold">
            {photoReviews[zoom].flag} {photoReviews[zoom].country}
          </div>
          <img
            src={photoReviews[zoom].src}
            alt={photoReviews[zoom].alt}
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full object-contain select-none"
            style={{ touchAction: "pinch-zoom", WebkitTouchCallout: "none", userSelect: "none" }}
            {...protect}
          />
        </div>
      )}
    </div>
  );
};

const writtenReviews = (_priceLabel: string) => [
  {
    name: "Carlos R.",
    country: "Colombia",
    text: "Compré por curiosidad por el precio y me sorprendió la calidad. El alfabeto con sonidos reales y las letras mudas están explicadas clarísimo.",
    rating: 5,
  },
  {
    name: "Ana L.",
    country: "España",
    text: "Llevaba años confundiéndome con la pronunciación. Este ebook con las combinaciones secretas me dio la confianza que necesitaba para hablar.",
    rating: 5,
  },
  {
    name: "Luis M.",
    country: "Perú",
    text: "Los mini retos son geniales. No es teoría aburrida, es práctico y directo. Lo leí en una tarde y ya noto la diferencia al escuchar inglés.",
    rating: 5,
  },
  {
    name: "Diana S.",
    country: "Chile",
    text: "Me encantó que incluya contracciones y habla rápida. Por fin entiendo lo que dicen en las películas sin subtítulos. Muy recomendado.",
    rating: 5,
  },
  {
    name: "Jorge H.",
    country: "Argentina",
    text: "Dudaba por el precio bajo, pero la vista previa me convenció. El PDF está bien editado, sin errores, y el método realmente funciona.",
    rating: 5,
  },
];

const TestimonialSlider = ({ priceLabel }: { priceLabel: string }) => {
  const reviews = useMemo(() => writtenReviews(priceLabel), [priceLabel]);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % reviews.length), 3500);
    return () => clearInterval(t);
  }, [reviews.length]);
  return (
    <div className="mx-auto max-w-2xl">
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {reviews.map((r, i) => (
            <figure key={`${r.name}-${i}`} className="w-full shrink-0 px-1">
              <div className="bg-card rounded-2xl border border-border shadow-card p-5 flex flex-col h-full">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(r.rating)].map((_, s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-foreground/90 text-sm leading-relaxed mb-4 flex-grow">"{r.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.country}</p>
                  </div>
                </div>
              </div>
            </figure>
          ))}
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-2">
        {reviews.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Ver opinión ${i + 1}`}
            onClick={() => setIdx(i)}
            className={`h-2 rounded-full transition-all ${i === idx ? "w-6 bg-primary" : "w-2 bg-muted-foreground/40"}`}
          />
        ))}
      </div>
    </div>
  );
};


const PatronesContent = () => {
  const isDesktop = useIsDesktop();
  const showSales = useAfterLoad(4000);
  const { t, currency, countryCode } = useI18n();
  const navigate = useNavigate();
  const addItem = useCheckoutPruebaStore((s) => s.addItem);
  
  const [heroLoaded, setHeroLoaded] = useState(false);
  // Galería: las imágenes extra se piden 2,5 s después de que cargó la portada (nunca en conexiones lentas) o al tocarla.
  const [galleryWarm, setGalleryWarm] = useState(false);
  const constrainedNetwork = isPatronesConstrainedConnection(getPatronesConnection());
  const mediaMargin = constrainedNetwork ? "0px" : "300px";
  // Vista previa y bonos: empiezan a bajar ~600 px ANTES de llegar (300 px en conexión lenta), no al abrir la página: así no compiten con la portada pero ya están listas al verlas y así ya están listas al verlas.
  const previewMargin = constrainedNetwork ? "300px" : "600px";
  const checkoutPrefetched = useRef(false);
  const prefetchCheckout = () => {
    if (isPatronesConstrainedConnection(getPatronesConnection())) return;
    if (checkoutPrefetched.current) return;
    checkoutPrefetched.current = true;
    void import("@/pages/Checkout");
    void prefetchCheckoutProduct("patrones-especiales-alfabeto-combinaciones-secretas-ingles");
  };

  useEffect(() => {
    if (!heroLoaded || isPatronesConstrainedConnection(getPatronesConnection())) return;
    const id = window.setTimeout(() => setGalleryWarm(true), 2500);
    return () => window.clearTimeout(id);
  }, [heroLoaded]);

  // Do not download payment code while the first image is still loading.
  useEffect(() => {
    if (!heroLoaded) return;
    if (isPatronesConstrainedConnection(getPatronesConnection())) return;
    const timeoutId = window.setTimeout(prefetchCheckout, 3000);
    return () => window.clearTimeout(timeoutId);
  }, [heroLoaded]);
  const ADMIN_SKU = "patrones-especiales-alfabeto-combinaciones-secretas-ingles";
  const pricingAdmin = useAdminPricing(ADMIN_SKU);
  const tier = useCountryTierRouting(ADMIN_SKU, {
    tiendaPath: TIENDA_CHECKOUT_PATH,
  });

  const { isPeru, priceUsd: PRICE_USD, priceGlobalUsd: GLOBAL_USD, priceLatamUsd: LATAM_USD, priceTiendaUsd: TIENDA_USD, pricePen, country } = tier;
  const pricingReady = tier.loaded;
  const displayCurrency = tier.currencyCode as Currency;
  const priceLabel = tier.priceLabel;
  const originalLabel = tier.originalLabel;


  

  // First visits start the current cover immediately, independently of pricing.
  // A different admin cover still takes precedence when catalog data arrives.
  const cachedCover = useMemo(() => readCachedCover(ADMIN_SKU), []);
  useEffect(() => {
    if (pricingAdmin.loaded) writeCachedCover(ADMIN_SKU, pricingAdmin.coverImageUrl);
  }, [pricingAdmin.loaded, pricingAdmin.coverImageUrl]);
  const heroImage = pricingAdmin.loaded
    ? (pricingAdmin.coverImageUrl ?? productImage)
    : (cachedCover ?? FAST_COVER_SOURCE);
  const [heroFailed, setHeroFailed] = useState(false);
  const snapshotCover = heroImage === FAST_COVER_SOURCE && !heroFailed;
  const heroLight = heroFailed ? heroImage : snapshotCover ? (constrainedNetwork ? PATRONES_MOBILE_COVER_URL : PATRONES_FAST_COVER_URL) : lightCoverUrl(heroImage);
  const heroImageAbsolute = heroImage
    ? (heroImage.startsWith("http") ? heroImage : `https://ilinguerelax.com${heroImage}`)
    : `https://ilinguerelax.com${productImage}`;
  const cartImage = heroImage ?? productImage;
  // Vistas adicionales del admin (galería). La portada (índice 0) sigue usando la carga rápida.
  const extraViews = useMemo(
    () => (pricingAdmin.galleryImages ?? []).filter((u): u is string => typeof u === "string" && u.trim().length > 0 && u !== pricingAdmin.coverImageUrl),
    [pricingAdmin.galleryImages, pricingAdmin.coverImageUrl],
  );
  // Galería manual: portada + vistas del admin; si el admin no cargó ninguna, las páginas reales del PDF.
  const galleryExtras = useMemo(
    () => (extraViews.length > 0
      ? extraViews.map((src, i) => ({ src, alt: `Patrones Especiales - vista adicional ${i + 1}` }))
      : previews.map((p) => ({ src: p.src, alt: p.alt }))),
    [extraViews],
  );
  
  const pixelParams = useMemo(() => ({
    content_name: "Patrones Especiales, Alfabeto y Combinaciones Secretas en Inglés",
    content_category: "Digital Book",
    content_ids: [ADMIN_SKU],
    content_type: "product",
    value: PRICE_USD,
    currency: "USD",
  }), [PRICE_USD]);
  useHotmartPixel(pixelParams);

  const goToTienda = () => {
    if (!pricingReady) return;
    // El botón "LO QUIERO" y esta barra ya disparan AddToCart del pixel, así
    // que aquí se llama addItem() directo para no contar dos veces.

    addItem({
      id: "patrones-ingles",
      name: "Patrones Especiales, Alfabeto y Combinaciones Secretas en Inglés (PDF)",
      price: PRICE_USD,
      regionPrices: {
        latam: LATAM_USD,
        global: GLOBAL_USD,
        tienda: TIENDA_USD
      },
      pricePen: pricingAdmin.pricePen ?? undefined,
      localUsdPrices: pricingAdmin.localUsdPrices ?? undefined,
      image: cartImage,
      description: "Alfabeto y combinaciones secretas de sonidos en inglés",
      quantity: 1,
    });
    navigate(TIENDA_CHECKOUT_PATH);
  };

  // Protección contra doble-toque (ver mismo fix en ProductDynamic.tsx).
  const buyClickedRef = useRef(false);
  const handleBuy = () => {
    if (!pricingReady) return;
    if (buyClickedRef.current) return;
    buyClickedRef.current = true;
    // AddToCart aquí — InitiateCheckout lo dispara Checkout.tsx al cargar
    // /checkouts/:slug (una sola vez con guard initiatedRef).
    trackHotmartEvent("AddToCart", {
      content_name: "Patrones Especiales, Alfabeto y Combinaciones Secretas en Inglés",
      content_category: "Digital Book",
      content_ids: [ADMIN_SKU],
      content_type: "product",
      value: PRICE_USD,
      currency: "USD",
      num_items: 1,
    });
    goToTienda();
  };


  const productReviews = [
    {
      author: "María G.",
      rating: 5,
      text: "Por fin entiendo por qué el inglés se pronuncia diferente a como se escribe. Los patrones especiales me abrieron los ojos. Vale muchísimo más de lo que cuesta.",
      date: "2026-04-10",
    },
    {
      author: "Carlos R.",
      rating: 5,
      text: "Compré por curiosidad por el precio y me sorprendió la calidad. El alfabeto con sonidos reales y las letras mudas están explicadas clarísimo.",
      date: "2026-04-12",
    },
    {
      author: "Ana L.",
      rating: 5,
      text: "Llevaba años confundiéndome con la pronunciación. Este ebook con las combinaciones secretas me dio la confianza que necesitaba para hablar.",
      date: "2026-04-15",
    },
    {
      author: "Luis M.",
      rating: 5,
      text: "Los mini retos son geniales. No es teoría aburrida, es práctico y directo. Lo leí en una tarde y ya noto la diferencia al escuchar inglés.",
      date: "2026-04-18",
    },
    {
      author: "Diana S.",
      rating: 5,
      text: "Me encantó que incluya contracciones y habla rápida. Por fin entiendo lo que dicen en las películas sin subtítulos. Muy recomendado.",
      date: "2026-04-20",
    },
    {
      author: "Jorge H.",
      rating: 5,
      text: "Dudaba por el precio bajo, pero la vista previa me convenció. El PDF está bien editado, sin errores, y el método realmente funciona.",
      date: "2026-04-22",
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title={pricingAdmin.name ?? "Patrones y Pronunciación en Inglés PDF · A1 a C1"}
        description={pricingAdmin.description ?? "Domina la pronunciación en inglés: patrones secretos, letras mudas, combinaciones especiales y ejercicios prácticos. Ebook PDF para hispanohablantes."}
        canonicalUrl="https://ilinguerelax.com/products/patrones-especiales-alfabeto-combinaciones-secretas-ingles"
        image={pricingAdmin.coverImageUrl ?? "https://ilinguerelax.com/images/product-patrones-especiales.webp"}
        type="product"
        price={PRICE_USD.toString()}
        originalPrice={(PRICE_USD * 2.5).toString()}
        rating={pricingAdmin.rating?.toString() ?? "4.9"}
        reviewCount={pricingAdmin.reviewCount?.toString() ?? "6"}
        sku={ADMIN_SKU}
        keywords="pronunciación en inglés, patrones de pronunciación inglés, letras mudas en inglés, combinaciones de letras inglés, alfabeto en inglés con pronunciación, cómo pronunciar en inglés, mejorar pronunciación inglés, fonética inglés para hispanohablantes, ebook pronunciación inglés pdf, contracciones en inglés"
        reviews={productReviews}
        faqItems={[
          { question: `¿Por qué cuesta solo ${tier.priceLabel}?`, answer: "Queremos que el método llegue a más personas. El PDF es de calidad profesional, sin errores ortográficos. Puedes verificarlo con la vista previa real más arriba." },
          { question: "¿Qué incluye este ebook?", answer: "Patrones especiales de pronunciación, alfabeto inglés letra por letra, combinaciones secretas, letras mudas, contracciones y mini retos prácticos con respuestas." },
          { question: "¿Es digital o físico?", answer: "Es 100% digital (PDF). Recibes la descarga inmediata después del pago. Puedes leerlo en móvil, tablet, computadora o imprimirlo." },
          { question: "¿Cómo realizo el pago?", answer: "Eliges tu método de pago en el checkout seguro, según tu país." },
        ]}
      />


      {/* Menú de arriba: SOLO en computadora (a pedido de la dueña); en celular y tableta se oculta para que la portada suba. */}
      {isDesktop && <Suspense fallback={<div className="h-[72px]" aria-hidden="true" />}><DesktopNavbar /></Suspense>}

      {/* Hero */}

      <section className="pt-3 pb-3 md:pt-6 md:pb-6">
        {!pricingAdmin.active && (
          <div className="container px-4 md:px-6 mb-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3 text-amber-800">
              <Lock className="w-5 h-5 shrink-0" />
              <div className="text-sm">
                <span className="font-bold">Vista previa de Borrador:</span> Este producto está oculto para los clientes. Solo tú puedes verlo porque eres administrador.
              </div>
            </div>
          </div>
        )}
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="relative">
                <ProductGallerySlider
                  warm={galleryWarm}
                  coverThumb={snapshotCover ? PATRONES_MOBILE_COVER_URL : (heroLight ?? heroImage ?? undefined)}
                  extras={galleryExtras}
                  cover={
                    heroImage ? (
                  <img
                    src={heroLight ?? heroImage}
                    srcSet={snapshotCover && !constrainedNetwork ? PATRONES_COVER_SRCSET : undefined}
                    sizes={snapshotCover && !constrainedNetwork ? PATRONES_COVER_SIZES : undefined}
                    onError={() => {
                      // Si el servidor no soporta imágenes livianas, usa la original.
                      if (heroLight && heroLight !== heroImage) { disableImageTransform(); setHeroFailed(true); }
                    }}
                    alt="Patrones Especiales, Alfabeto y Combinaciones Secretas en Inglés"
                    className="w-full h-auto"
                    width={1000}
                    height={1250}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    onLoad={() => setHeroLoaded(true)}
                  />
                    ) : (
                      <div className="w-full aspect-[4/5] bg-muted animate-pulse" />
                    )
                  }
                />
                <PinterestSave 
                  overlay 
                  media={heroImageAbsolute}
                  url="https://ilinguerelax.com/products/patrones-de-estructuras-gramaticales-especiales-ingles-con-pronunciacion"
                  description="Domina patrones especiales y estructuras gramaticales en inglés con pronunciación adaptada."
                />
              </div>
            </div>

            <div>
              <p className="text-lg md:text-xl font-bold text-foreground mb-2">
                {PATRONES_HERO.headline}
              </p>
              <p className="text-base text-muted-foreground mb-4">
                {PATRONES_HERO.subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-4">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <span className="font-bold text-sm sm:text-base text-foreground">
                  {pricingAdmin.rating != null ? pricingAdmin.rating.toFixed(1) : "4.9"}/5
                </span>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  ({pricingAdmin.reviewCount ?? 6} {t.product.verifiedReviews})
                </span>
              </div>

              <div className="mb-5 rounded-2xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-400/15 to-amber-400/15 p-4 shadow-lg">
                <p className="text-foreground font-extrabold text-base md:text-lg text-center mb-2">
                  {PATRONES_HERO.bonusTitle}
                </p>
                <ul className="space-y-1 text-sm text-foreground">
                  {PATRONES_HERO.bonusItems.map((x) => (
                    <li key={x} className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />{x}</li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground mt-2 text-center">{PATRONES_HERO.bonusNote}</p>
              </div>

              <div className="mb-4 flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-border/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pagos Seguros:</span>
                <PaymentLogos />
              </div>




              <a href="#vista-previa" className="mb-2 flex items-center justify-center gap-2 rounded-xl border-2 border-primary/30 bg-primary/5 px-4 py-3 text-sm font-bold text-primary hover:bg-primary/10 transition-colors">
                <Eye className="w-4 h-4" /> Ver vista previa del PDF
              </a>





            </div>
          </div>
        </div>
      </section>

      {/* Dolores */}
      <section className="py-3 md:py-5">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-bold text-center text-foreground mb-3">
              ¿Te pasa esto cuando <span className="text-gradient">hablas inglés</span>?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
              {[
                "Lees una palabra y no sabes cómo suena: se escribe de una forma y se pronuncia de otra.",
                "Te da vergüenza hablar porque sientes que vas a pronunciar mal.",
                "No entiendes a los nativos: hablan rápido y se \"comen\" las palabras.",
                "Las letras mudas y las combinaciones raras (gh, ough, tion) te confunden siempre.",
              ].map((x) => (
                <div key={x} className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 p-2.5 md:p-4">
                  <span className="text-base leading-none mt-0.5">❌</span>
                  <p className="text-foreground text-sm md:text-base leading-snug">{x}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-foreground font-bold text-base md:text-lg mt-4">
              No es falta de talento. <span className="text-gradient">Es que nadie te enseñó los patrones.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Comparativa: Patrones Especiales vs apps y academias */}
      <section className="py-3 md:py-4">
        <div className="container px-4 md:px-6">
          <div className="max-w-2xl mx-auto">
            <img
              src={patronesComparativaAsset.url}
              alt="Comparativa: Patrones Especiales frente a apps de inglés y academias"
              width={900}
              height={900}
              loading="lazy"
              decoding="async"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              className="w-full h-auto rounded-2xl shadow-card select-none"
            />
          </div>
        </div>
      </section>

      {/* Vista previa real */}
       <section id="vista-previa" className="py-6 md:py-8 scroll-mt-24">
        <div className="container px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
                <Eye className="w-4 h-4" /> Vista previa real del PDF
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-foreground">
                Mira por dentro <span className="text-gradient">antes de comprar</span>
              </h2>
            </div>

            

             <div className="grid grid-cols-2 gap-2 md:gap-4">
              {previews.map((p, i) => (
                <figure key={p.src} className="relative rounded-2xl overflow-hidden border border-border shadow-card bg-card">
                  <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold">
                    Página {i + 1}
                  </div>
                   <div className="relative aspect-square bg-card overflow-hidden">
                    <LazyImg
                      src={p.src}
                      rootMargin={previewMargin}
                      alt={p.alt}
                      wrapperClassName="absolute inset-0 block"
                      width={900}
                      height={1254}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <figcaption className="p-2 text-xs md:text-sm font-semibold text-foreground text-center leading-tight">
                    {p.caption}
                  </figcaption>
                </figure>
              ))}
            </div>

            {/* Los 3 bonos en UN solo bloque compacto (antes eran 3 bloques grandes que repetían título, insignia y «El PDF completo se entrega…») */}
            <div className="mt-5">
              <div className="text-center mb-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/15 text-accent text-sm font-bold mb-3">
                  <Sparkles className="w-4 h-4" /> 3 bonos incluidos GRATIS
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                  Practica más con <span className="text-gradient">tus 3 bonos</span>
                </h3>
              </div>
              <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
                {bonusCards.map((c) => (
                  <figure key={c.tag} className="w-[78%] shrink-0 snap-start overflow-hidden rounded-2xl border border-accent/30 bg-card shadow-card sm:w-[55%] md:w-auto">
                    <div className="relative aspect-square overflow-hidden bg-card">
                      <LazyImg src={c.src} rootMargin={previewMargin} alt={c.alt} wrapperClassName="absolute inset-0 block" width={1254} height={1254} className="h-full w-full object-contain" onContextMenu={(e) => e.preventDefault()} />
                    </div>
                    <figcaption className="p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-primary">{c.tag}</p>
                      <h4 className="mt-0.5 text-base font-extrabold leading-snug text-foreground">{c.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{c.text}</p>
                      {c.extra && <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-foreground"><Music2 className="h-4 w-4 shrink-0 text-[#1DB954]" aria-hidden="true" /> {c.extra}</p>}
                    </figcaption>
                  </figure>
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground mt-3">Vistas previas reales. El PDF completo se entrega tras la compra.</p>
            </div>

            {/* Único botón a mitad de página (antes estaba en «Todo lo que incluye», que repetía el ebook y los bonos) */}
            <div className="mt-6 flex justify-center">
              <Button variant="hero" size="xl" onClick={handleBuy} onPointerEnter={prefetchCheckout} onFocus={prefetchCheckout} onTouchStart={prefetchCheckout} disabled={!pricingReady} className="w-full sm:w-auto max-w-full px-6 py-5 shadow-2xl">
                <ShoppingCart className="w-5 h-5 mr-2 shrink-0" />
                {pricingReady ? `LO QUIERO • ${priceLabel}` : "LO QUIERO"}
                <ArrowRight className="w-5 h-5 ml-2 shrink-0" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Reseñas (una sola sección: WhatsApp reales + opiniones escritas) */}
      <section className="py-6 md:py-8 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
                <Check className="w-3.5 h-3.5" /> Compras verificadas · WhatsApp 🇲🇽 🇵🇪
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Reseñas <span className="text-primary">reales</span> de clientes
              </h2>
            </div>
            <ReviewSlider />
            <div className="mt-8">
              <TestimonialSlider priceLabel={priceLabel} />
            </div>
          </div>
        </div>
      </section>

      {/* Atención posventa (no son reseñas): capturas reales, agradecidos por su confianza */}
      <section className="py-4 md:py-6">
        <div className="container px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
                🇲🇽 🇺🇸 🇵🇪 🇪🇸 Atención real después de la compra
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Gracias por <span className="text-primary">su confianza</span>
              </h2>
            </div>
            <LazyMount minHeight={400} rootMargin={mediaMargin}>
              <Suspense fallback={null}><SupportProofSlider shots={supportShots} /></Suspense>
            </LazyMount>
            <p className="text-center text-xs text-muted-foreground mt-4">Capturas reales de WhatsApp, sin editar. Toca una para ampliarla.</p>
          </div>
        </div>
      </section>

      {/* Quién soy (Crady) + comunidad (Facebook, Instagram) + Google: confianza antes del cierre */}
      <LazyMount minHeight={520} rootMargin={mediaMargin}><Suspense fallback={null}><FounderCommunity /></Suspense></LazyMount>

      {/* Cierre: «Oferta especial» (mismo formato que el ejemplo). Solo precios reales de la página; sin «% OFF» ni escasez inventados. */}
      <section className="py-6 md:py-8 bg-gradient-to-b from-primary/10 to-primary/5">
        <div className="container px-4 md:px-6">
          <div className="max-w-xl mx-auto rounded-3xl border-2 border-primary/30 bg-white p-6 text-center shadow-[0_0_0_8px_hsl(var(--primary)/0.12)] md:p-8">
            <div className="flex items-center justify-center gap-3 text-xs font-extrabold uppercase tracking-widest text-primary">
              <span className="h-px w-8 bg-primary" aria-hidden="true" /> Oferta especial <span className="h-px w-8 bg-primary" aria-hidden="true" />
            </div>
            <h2 className="mt-3 text-3xl font-extrabold uppercase leading-tight tracking-tight text-foreground md:text-4xl">
              Con tu ebook <span className="text-primary">vas a acceder a:</span>
            </h2>
            <ul className="mt-6 space-y-3 text-left">
              {[
                "Ebook PDF «Patrones Especiales»",
                "Bono 1: 1,000 palabras con pronunciación y audios <b>gratis</b>",
                "Bono 2: Estructuras gramaticales desde cero <b>gratis</b>",
                "Bono 3: Examen de 98 preguntas con respuestas <b>gratis</b>",
                "Actualizaciones del material <b>gratis</b>",
              ].map((x) => (
                <li key={x} className="flex items-center gap-3 text-sm font-semibold text-foreground md:text-base">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"><Check className="h-4 w-4" strokeWidth={3} /></span>
                  <span dangerouslySetInnerHTML={{ __html: x }} />
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-5">
              <div className="text-xs font-extrabold uppercase tracking-widest text-primary">Precio de lanzamiento</div>
              <div className="mt-1 text-5xl font-extrabold text-foreground">{pricingReady ? priceLabel : "…"}</div>
              {pricingReady && originalLabel && <div className="mt-1 text-sm text-muted-foreground">Precio anterior: <span className="line-through">{originalLabel}</span></div>}
              <span className="mt-3 inline-block rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-foreground sm:text-xs">Ebook + 3 bonos gratis · Pago único</span>
            </div>

            <Button variant="hero" size="xl" onClick={handleBuy} onPointerEnter={prefetchCheckout} onFocus={prefetchCheckout} onTouchStart={prefetchCheckout} disabled={!pricingReady} className="mt-6 h-auto w-full max-w-full whitespace-normal px-4 py-4 text-sm leading-tight shadow-2xl sm:text-base">
              QUIERO MI EBOOK Y MIS BONOS
              <ArrowRight className="w-4 h-4 ml-2 shrink-0" />
            </Button>
          </div>
        </div>
      </section>

      <LazyMount minHeight={640} rootMargin={mediaMargin}><Suspense fallback={null}>
      <FAQ
        items={[
          { question: "¿Qué son los Patrones Especiales?", answer: "Es un ebook en PDF que te enseña a leer y pronunciar en inglés reconociendo los patrones de letras y combinaciones que se repiten en muchas palabras: letras mudas, combinaciones secretas, contracciones y habla rápida. Está hecho para hispanohablantes.", icon: BookOpen },
          { question: "¿Es una clase o es digital?", answer: "No es una clase en vivo ni un curso con horarios: es un material 100% digital (PDF) que estudias a tu ritmo, cuando quieras, en móvil, tablet o computadora.", icon: Smartphone },
          { question: "¿Qué recibo exactamente al comprar?", answer: "El ebook Patrones Especiales + 3 bonos GRATIS: 1,000 palabras con pronunciación y audios, Estructuras Gramaticales de cero a A2 y un Examen de 98 preguntas con respuestas. Todo en PDF.", icon: Sparkles },
          { question: "¿Es un material de calidad?", answer: "Sí. Es un material de iLingue Relax, con explicaciones paso a paso y sin errores ortográficos. Puedes comprobarlo antes de comprar en la vista previa real de 4 páginas, y tienes garantía de 7 días.", icon: Check },
          { question: "¿Quién es iLingue Relax?", answer: "iLingue Relax es nuestra marca de materiales para aprender idiomas sin estrés, con pronunciación pensada para hispanohablantes. Atendemos a nuestros clientes por WhatsApp, también después de la compra.", icon: Lightbulb },
          { question: "¿Cómo recibo el material?", answer: "Inmediatamente después de pagar recibes un correo con tu enlace de descarga. Si no lo ves, revisa Spam o Promociones o escríbenos por WhatsApp y te ayudamos al momento.", icon: Download },
          { question: "¿Qué pasa si pago por Yape, transferencia u OXXO?", answer: "Los pagos manuales o en efectivo pueden tardar un poco en confirmarse; apenas se confirman te enviamos el material. Si ya pagaste y no llega, escríbenos por WhatsApp con tu comprobante.", icon: CreditCard },
          { question: "¿Recibiré actualizaciones del material?", answer: "Cuando actualizamos el material, enviamos la nueva versión a quienes ya compraron.", icon: Eye },
          { question: "¿Es seguro pagar aquí?", answer: "Sí. El pago se procesa en un checkout seguro y tienes garantía de 7 días.", icon: Shield },
          { question: "¿Sirve si soy principiante?", answer: "Sí. Está explicado paso a paso para hispanohablantes, con ejemplos claros y mini retos con respuestas.", icon: BookOpen },
        ]}
        title="Preguntas Frecuentes"
        subtitle="Resolvemos tus dudas"
        compact
      />
      </Suspense></LazyMount>

      <LazyMount minHeight={320} rootMargin={mediaMargin}><Suspense fallback={null}><Footer /></Suspense></LazyMount>

      <StickyBuyBar
        sku={ADMIN_SKU}
        goesToInternalCheckout={true}
        price={priceLabel}
        originalPrice={originalLabel}
        currencyCode={displayCurrency}
        usdValue={PRICE_USD}
        flag={tier.loaded ? (currency === "USD" ? "🇺🇸" : currency === "EUR" ? "🇪🇺" : currency === "GBP" ? "🇬🇧" : currency === "AUD" ? "🇦🇺" : currency === "CAD" ? "🇨🇦" : "🌎") : undefined}
        productName={pricingAdmin.name ?? "Patrones Especiales en Inglés"}
        rating={pricingAdmin.rating != null ? pricingAdmin.rating : 4.9}
        reviewCount={pricingAdmin.reviewCount != null ? pricingAdmin.reviewCount : 6}
        showReviews={true}
        onBuyClick={handleBuy}
        ctaText={pricingReady ? `QUIERO COMPRAR • ${priceLabel}` : "QUIERO COMPRAR"}
        isLoading={!pricingReady}
        localUsdPrices={pricingAdmin.localUsdPrices}
      />

      <div className="h-20 md:h-16" />

      {showSales && <Suspense fallback={null}><SalesNotification productKey="patrones" productImage={heroLight ?? heroImage ?? undefined} /></Suspense>}
    </main>
  );
};

// Patrones enseña inglés a hispanohablantes, también cuando compran desde EE. UU.
// El idioma solo se limita a esta página; el país y la moneda permanecen intactos.
const ProductPatronesEspeciales = () => (
  <CheckoutLanguageProvider language="es">
    <PatronesContent />
  </CheckoutLanguageProvider>
);

export default ProductPatronesEspeciales;