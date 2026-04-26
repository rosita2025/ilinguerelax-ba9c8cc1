import { useState, useEffect, useRef } from "react";
import cliente1 from "@/assets/cliente-real-1.webp";
import cliente2 from "@/assets/cliente-real-2.webp";
import cliente3 from "@/assets/cliente-real-3.webp";
import cliente4 from "@/assets/cliente-real-4.webp";
import cliente5 from "@/assets/cliente-real-5.webp";
import cliente6 from "@/assets/cliente-real-6.webp";
import cliente7 from "@/assets/cliente-real-7.webp";
import cliente8 from "@/assets/cliente-real-8.webp";
import cliente9 from "@/assets/cliente-real-9.webp";
import cliente10 from "@/assets/cliente-real-10.webp";
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
  cliente1,
  cliente2,
  cliente3,
  cliente4,
  cliente5,
  cliente6,
  cliente7,
  cliente8,
  cliente9,
  cliente10,
];

export const CustomerReviewsCarousel = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState<Set<number>>(new Set([0]));
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
      // Preload current + neighbors
      setLoaded((prev) => {
        const next = new Set(prev);
        next.add(idx);
        next.add((idx + 1) % images.length);
        next.add((idx - 1 + images.length) % images.length);
        return next;
      });
    };
    update();
    api.on("select", update);
    const interval = setInterval(() => api.scrollNext(), 4000);
    return () => clearInterval(interval);
  }, [api, visible]);

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
                    {loaded.has(i) ? (
                      <img
                        src={src}
                        alt={`Reseña real de cliente ${i + 1}`}
                        className="w-full h-full object-contain"
                        loading={i === 0 ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={i === 0 ? "high" : "low"}
                      />
                    ) : (
                      <div className="w-full h-full animate-pulse bg-muted" />
                    )}
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