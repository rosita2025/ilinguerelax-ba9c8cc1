import { useState, useEffect, useRef } from "react";
import cliente1 from "@/assets/cliente-real-1.webp";
import cliente1Mobile from "@/assets/cliente-real-1-mobile.webp";
import cliente2 from "@/assets/cliente-real-2.webp";
import cliente2Mobile from "@/assets/cliente-real-2-mobile.webp";
import cliente3 from "@/assets/cliente-real-3.webp";
import cliente3Mobile from "@/assets/cliente-real-3-mobile.webp";
import cliente4 from "@/assets/cliente-real-4.webp";
import cliente4Mobile from "@/assets/cliente-real-4-mobile.webp";
import cliente5 from "@/assets/cliente-real-5.webp";
import cliente5Mobile from "@/assets/cliente-real-5-mobile.webp";
import cliente6 from "@/assets/cliente-real-6.webp";
import cliente6Mobile from "@/assets/cliente-real-6-mobile.webp";
import cliente7 from "@/assets/cliente-real-7.webp";
import cliente7Mobile from "@/assets/cliente-real-7-mobile.webp";
import cliente8 from "@/assets/cliente-real-8.webp";
import cliente8Mobile from "@/assets/cliente-real-8-mobile.webp";
import cliente9 from "@/assets/cliente-real-9.webp";
import cliente9Mobile from "@/assets/cliente-real-9-mobile.webp";
import cliente10 from "@/assets/cliente-real-10.webp";
import cliente10Mobile from "@/assets/cliente-real-10-mobile.webp";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Star } from "lucide-react";

const images = [
  { desktop: cliente1, mobile: cliente1Mobile },
  { desktop: cliente2, mobile: cliente2Mobile },
  { desktop: cliente3, mobile: cliente3Mobile },
  { desktop: cliente4, mobile: cliente4Mobile },
  { desktop: cliente5, mobile: cliente5Mobile },
  { desktop: cliente6, mobile: cliente6Mobile },
  { desktop: cliente7, mobile: cliente7Mobile },
  { desktop: cliente8, mobile: cliente8Mobile },
  { desktop: cliente9, mobile: cliente9Mobile },
  { desktop: cliente10, mobile: cliente10Mobile },
];

const scheduleIdle = (cb: () => void) => {
  if (typeof window === "undefined") return () => {};
  const idleWindow = window as Window & {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  if (idleWindow.requestIdleCallback) {
    const id = idleWindow.requestIdleCallback(() => cb(), { timeout: 1200 });
    return () => idleWindow.cancelIdleCallback?.(id);
  }
  const id = globalThis.setTimeout(cb, 250);
  return () => globalThis.clearTimeout(id);
};

export const CustomerReviewsCarousel = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  // Lazy mount: only initialize carousel/auto-rotate after section enters viewport
  useEffect(() => {
    if (!sectionRef.current || visible) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!api || !visible) return;
    const update = () => {
      const idx = api.selectedScrollSnap();
      setCurrent(idx);
    };
    update();
    api.on("select", update);
    const interval = setInterval(() => api.scrollNext(), 4000);
    return () => clearInterval(interval);
  }, [api, visible]);

  useEffect(() => {
    if (!visible) return;
    const cancel = scheduleIdle(() => {
      [current + 1, current + 2].forEach((index) => {
        const image = images[index % images.length];
        [image.mobile, image.desktop].forEach((src) => {
          const img = new Image();
          img.decoding = "async";
          img.src = src;
        });
      });
    });

    return cancel;
  }, [current, visible]);

  return (
    <section ref={sectionRef} className="py-6 md:py-8">
      <div className="container px-4 md:px-6">
        <div className="max-w-2xl mx-auto text-center mb-4">
          <div className="inline-flex items-center gap-1.5 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <h3 className="text-xl md:text-2xl font-black text-foreground">
            Reseñas reales de clientes
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Capturas verificadas de compradores
          </p>
        </div>

        <div className="max-w-xs sm:max-w-sm mx-auto">
          <Carousel setApi={setApi} opts={{ loop: true }} className="relative">
            <CarouselContent>
              {images.map((src, i) => (
                <CarouselItem key={i}>
                  <div className="rounded-2xl overflow-hidden border border-border shadow-lg bg-muted aspect-[3/4]">
                    <img
                      src={src.desktop}
                      srcSet={`${src.mobile} 420w, ${src.desktop} 882w`}
                      sizes="(max-width: 640px) 320px, 380px"
                      alt={`Reseña real de cliente ${i + 1}`}
                      className="w-full h-full object-contain"
                      loading={i === 0 ? "eager" : "lazy"}
                      decoding="async"
                      fetchPriority={i === 0 ? "high" : "low"}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-1 md:-left-4" />
            <CarouselNext className="right-1 md:-right-4" />
          </Carousel>

          <div className="flex justify-center gap-1.5 mt-3">
            {images.map((_, i) => (
              <button
                key={i}
                aria-label={`Ir a reseña ${i + 1}`}
                onClick={() => api?.scrollTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  current === i ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomerReviewsCarousel;