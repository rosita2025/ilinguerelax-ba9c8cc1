import { useEffect, useRef, useState } from "react";
import { Star, Play, Volume2, VolumeX } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";

type Slide = {
  id: string;
  src: string;
  poster: string;
  title: string;
  caption: string;
  quote: string;
};

const slides: Slide[] = [
  {
    id: "guy",
    src: "/videos/testimonial-girl.mp4",
    poster: "/videos/testimonial-girl.jpg",
    title: "Speak Fluently",
    caption: "A real game changer for your Spanish. Get the results you've been waiting for.",
    quote: "Finally speaking fluently without the stress of grammar.",
  },
];

export const InfluencerVideoCarousel = ({ onCta }: { onCta?: () => void }) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [muted, setMuted] = useState(true);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    if (!api) return;
    const update = () => setCurrent(api.selectedScrollSnap());
    update();
    api.on("select", update);
    const interval = setInterval(() => api.scrollNext(), 7000);
    return () => clearInterval(interval);
  }, [api]);

  // Pause non-active videos
  useEffect(() => {
    const currentSlide = slides[current];
    if (!currentSlide) return;
    Object.entries(videoRefs.current).forEach(([id, v]) => {
      if (!v) return;
      if (currentSlide.id === id) {
        v.muted = muted;
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [current, muted]);

  return (
    <section className="py-8 md:py-10">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wide mb-2">
            <Play className="w-3 h-3 fill-primary" /> As seen on TikTok & Instagram
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-foreground">
            See Why 500+ Students Love Spanish Relax
          </h2>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
            <span className="text-sm font-bold text-foreground ml-1">4.9/5</span>
            <span className="text-xs text-muted-foreground">· Trusted by language learners worldwide</span>
          </div>
        </div>

        <div className="max-w-xs sm:max-w-sm mx-auto relative">
          <Carousel setApi={setApi} opts={{ loop: true }}>
            <CarouselContent>
              {slides.map((s) => (
                <CarouselItem key={s.id}>
                  <div className="rounded-2xl overflow-hidden border-2 border-primary/20 shadow-xl bg-black aspect-[9/16] relative">
                    <video
                      ref={(el) => (videoRefs.current[s.id] = el)}
                      src={s.src}
                      poster={s.poster}
                      playsInline
                      muted
                      loop
                      preload="none"
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setMuted((m) => !m)}
                      className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/60 backdrop-blur text-white flex items-center justify-center"
                      aria-label={muted ? "Unmute" : "Mute"}
                    >
                      {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="mt-3 text-center px-1">
                    <p className="text-base font-black text-foreground">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.caption}</p>
                    <p className="text-xs italic text-foreground/80 mt-2">"{s.quote}"</p>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-1 md:-left-4" />
            <CarouselNext className="right-1 md:-right-4" />
          </Carousel>

          <div className="flex justify-center gap-1.5 mt-3">
            {slides.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to video ${i + 1}`}
                onClick={() => api?.scrollTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  current === i ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="max-w-md mx-auto mt-5">
          <Button
            size="lg"
            onClick={onCta}
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white font-black text-sm md:text-base h-12 rounded-xl shadow-lg"
          >
            GET THE PHYSICAL + DIGITAL COMBO NOW
          </Button>
          <p className="text-[11px] text-center text-muted-foreground mt-2">
            Free shipping · Digital book delivered instantly · Physical ships in 24–72h
          </p>
        </div>
      </div>
    </section>
  );
};

export default InfluencerVideoCarousel;