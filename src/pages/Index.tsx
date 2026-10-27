import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { LazyMount } from "@/components/LazyImg";
import { useSpanishRelaxPixelPageView } from "@/hooks/useMetaPixel";

// Partner logos
import logoAmazon from "@/assets/logo-amazon.png";
import logoEtsy from "@/assets/logo-etsy.png";
import logoHotmart from "@/assets/logo-hotmart.svg";
import logoShopify from "@/assets/logo-shopify.png";
import logoKindle from "@/assets/logo-kindle.png";

const partnerLogos = [
  { src: logoAmazon, alt: "Amazon partner store", height: "h-8 md:h-12" },
  { src: logoEtsy, alt: "Etsy partner store", height: "h-8 md:h-12" },
  { src: logoShopify, alt: "Shopify partner store", height: "h-8 md:h-12" },
  { src: logoHotmart, alt: "Hotmart platform partner", height: "h-6 md:h-10" },
  { src: logoKindle, alt: "Amazon Kindle store", height: "h-6 md:h-10" },
];


// Secciones bajo el pliegue: se descargan y montan solo al acercarse a la pantalla,
// para que lo de arriba (Navbar + Hero) pinte rápido.
const TrackingSearchBar = lazy(() => import("@/components/TrackingSearchBar").then((m) => ({ default: m.TrackingSearchBar })));
const Languages = lazy(() => import("@/components/Languages").then((m) => ({ default: m.Languages })));
const HowItWorks = lazy(() => import("@/components/HowItWorks").then((m) => ({ default: m.HowItWorks })));
const AllProductsReviews = lazy(() => import("@/components/AllProductsReviews").then((m) => ({ default: m.AllProductsReviews })));
const InstagramFeed = lazy(() => import("@/components/InstagramFeed").then((m) => ({ default: m.InstagramFeed })));
const AboutMe = lazy(() => import("@/components/AboutMe").then((m) => ({ default: m.AboutMe })));
const Contact = lazy(() => import("@/components/Contact").then((m) => ({ default: m.Contact })));
const Footer = lazy(() => import("@/components/Footer").then((m) => ({ default: m.Footer })));
const WhatsAppButton = lazy(() => import("@/components/WhatsAppButton").then((m) => ({ default: m.WhatsAppButton })));

const Deferred = ({ id, minHeight, rootMargin = "300px", children }: { id?: string; minHeight: number; rootMargin?: string; children: ReactNode }) => (
  <div id={id}>
    <LazyMount minHeight={minHeight} rootMargin={rootMargin}>
      <Suspense fallback={<div style={{ minHeight }} />}>{children}</Suspense>
    </LazyMount>
  </div>
);

const IdleMount = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(() => setReady(true), { timeout: 4000 });
    else setTimeout(() => setReady(true), 2500);
  }, []);
  return ready ? <Suspense fallback={null}>{children}</Suspense> : null;
};

const Index = () => {
  // Spanish Relax Pixel - PageView only
  useSpanishRelaxPixelPageView();

  return (
    <main className="min-h-screen">
      <SEO
        title="Aprende Idiomas con Pronunciación"
        description="Libro digital de inglés con 5,000+ palabras, pronunciación adaptada para hispanohablantes y fonética UK/USA. Método sin estrés, descarga inmediata. ¡Empieza hoy!"
        canonicalUrl="https://ilinguerelax.com/"
        keywords="aprender inglés, pronunciación inglés hispanohablantes, vocabulario inglés, fonética inglés UK USA, libro digital inglés, curso inglés online, inglés sin estrés, inglés fácil"
      />
      <Navbar />
      <Hero />
      
      {/* Logo Ticker */}
      <section className="py-6 bg-foreground">
        <div className="overflow-hidden">
          <div className="flex animate-ticker" style={{ width: 'max-content' }}>
            {[...Array(4)].map((_, setIndex) => (
              <div key={setIndex} className="flex items-center shrink-0 gap-16 md:gap-24 px-8 md:px-12">
                {partnerLogos.map((logo, index) => (
                  <img
                    key={`${setIndex}-${index}`}
                    src={logo.src}
                    alt={logo.alt}
                    loading="lazy"
                    className={`${logo.height} w-auto object-contain shrink-0 brightness-0 invert opacity-80`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
      

      
      <section className="py-24 px-4 relative overflow-hidden bg-[#0a0a0a]">
        <div className="absolute inset-0 bg-primary/5 -skew-y-3 transform origin-top-left" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-8">Rastreo de Pedidos</h2>
          <Deferred minHeight={80} rootMargin="300px"><TrackingSearchBar /></Deferred>
        </div>
      </section>

      <Deferred minHeight={500}><Languages /></Deferred>
      <Deferred minHeight={500}><HowItWorks /></Deferred>
      <Deferred minHeight={500}><AllProductsReviews /></Deferred>
      <Deferred minHeight={400}><InstagramFeed /></Deferred>
      <Deferred id="sobre-mi" minHeight={500}><AboutMe /></Deferred>
      <Deferred id="contacto" minHeight={600}><Contact /></Deferred>
      <Deferred minHeight={300}><Footer /></Deferred>
      <IdleMount><WhatsAppButton /></IdleMount>
</main>
  );
};

export default Index;
