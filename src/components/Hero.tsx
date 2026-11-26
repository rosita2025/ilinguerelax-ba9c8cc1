import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination, Navigation } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// Imágenes LIVIANAS (WebP de 640 y 1000 px, ~27–87 KB). Antes eran dos PNG de ~2,5 MB cada uno desde el CDN y, además, con «?v=<hora>» en la URL,
// que obligaba a bajarlos de nuevo en CADA carga. Ahora la URL es fija (se guarda en caché), la primera se pide con prioridad alta y la segunda
// solo después de que cargó la página (y nunca con ahorro de datos o conexión 2G).
const SIZES = "(min-width: 1024px) 896px, 100vw";
const img = (n: 1 | 2) => ({
  src: `/images/hero/app-preview-${n}-1000.webp`,
  srcSet: `/images/hero/app-preview-${n}-640.webp 640w, /images/hero/app-preview-${n}-1000.webp 1000w`,
});

const useSecondSlide = () => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? "")) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const go = () => { t = setTimeout(() => setReady(true), 2500); };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => { if (t) clearTimeout(t); window.removeEventListener("load", go); };
  }, []);
  return ready;
};

export const Hero = () => {
  const second = useSecondSlide();
  return (
    <section className="relative w-full bg-background py-4 sm:py-6 md:py-8 lg:py-12">
      <div className="container mx-auto px-0 sm:px-4 lg:max-w-4xl">
        <div className="relative w-full sm:rounded-2xl bg-black/5 hero-swiper-container lg:shadow-hero">
          <Swiper
            key={second ? "dos" : "uno"}
            modules={[Autoplay, EffectFade, Pagination, Navigation]}
            effect={'fade'}
            autoHeight={true}
            autoplay={second ? { delay: 5000, disableOnInteraction: false } : false}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            navigation={second}
            loop={second}
            className="w-full"
          >
            <SwiperSlide key="slide-1" className="flex items-center justify-center bg-black/5">
              <div className="w-full relative flex items-center justify-center">
                <img
                  {...img(1)}
                  sizes={SIZES}
                  width={1280}
                  height={1280}
                  alt="iLingue Relax App Preview 1"
                  className="w-full h-auto object-contain block mx-auto rounded-2xl"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />
              </div>
            </SwiperSlide>
            {second && (
              <SwiperSlide key="slide-2" className="flex items-center justify-center bg-black/5">
                <div className="w-full relative flex items-center justify-center">
                  <img
                    {...img(2)}
                    sizes={SIZES}
                    width={1254}
                    height={1254}
                    alt="iLingue Relax App Preview 2"
                    className="w-full h-auto object-contain block mx-auto rounded-2xl"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </SwiperSlide>
            )}
          </Swiper>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .hero-swiper-container .swiper-button-next,
        .hero-swiper-container .swiper-button-prev {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(8px);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: white;
          transition: all 0.3s ease;
          z-index: 20;
        }
        .hero-swiper-container .swiper-button-next:after,
        .hero-swiper-container .swiper-button-prev:after {
          font-size: 14px;
          font-weight: bold;
        }
        .hero-swiper-container .swiper-button-next { right: 12px; }
        .hero-swiper-container .swiper-button-prev { left: 12px; }
        
        .hero-swiper-container .swiper-button-next:hover,
        .hero-swiper-container .swiper-button-prev:hover {
          background: rgba(255, 255, 255, 0.4);
          transform: translateY(-50%) scale(1.1);
        }

        @media (min-width: 640px) {
          .hero-swiper-container .swiper-button-next,
          .hero-swiper-container .swiper-button-prev {
            width: 44px;
            height: 44px;
          }
          .hero-swiper-container .swiper-button-next:after,
          .hero-swiper-container .swiper-button-prev:after {
            font-size: 18px;
          }
        }

        @media (min-width: 1024px) {
          .hero-swiper-container .swiper-button-next { right: 16px; }
          .hero-swiper-container .swiper-button-prev { left: 16px; }
        }
      `}} />

      {/* Subtle bottom gradient to blend with next section */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
    </section>
  );
};