import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import magicEVideo from "@/assets/patron-magic-e.mp4.asset.json";
import magicEPoster from "@/assets/patron-magic-e.jpg.asset.json";
import patternsVideo from "@/assets/patron-sin-traducir.mp4.asset.json";
import patternsPoster from "@/assets/patron-sin-traducir.jpg.asset.json";
import productVideo from "@/assets/patrones-practicos.mp4.asset.json";
import productPoster from "@/assets/patrones-practicos.jpg.asset.json";

const VIDEOS = [
  {
    src: magicEVideo.url,
    poster: magicEPoster.url,
    title: "Aprende inglés entendiendo sus patrones",
    eyebrow: "Consejo práctico",
  },
  {
    src: patternsVideo.url,
    poster: patternsPoster.url,
    title: "Deja de traducir palabra por palabra",
    eyebrow: "Patrones en inglés",
  },
  {
    src: productVideo.url,
    poster: productPoster.url,
    title: "Mira cómo funciona Patrones Especiales",
    eyebrow: "Vista real del producto",
  },
];

export const TikTokVideos = () => {
  const [current, setCurrent] = useState(0);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);

  const scrollTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: track.clientWidth * index, behavior: "smooth" });
  }, []);

  const goTo = useCallback(
    (index: number) => {
      const safe = (index + VIDEOS.length) % VIDEOS.length;
      videoRefs.current.forEach((v) => v?.pause());
      setPlayingIndex(null);
      setCurrent(safe);
      scrollTo(safe);
    },
    [scrollTo],
  );

  // Keep the active dot in sync with touch swipes
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const index = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
        setCurrent((prev) => {
          if (prev === index) return prev;
          videoRefs.current.forEach((v, i) => {
            if (i !== index) v?.pause();
          });
          return index;
        });
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const togglePlayback = useCallback((index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;
    if (video.paused) {
      videoRefs.current.forEach((v, i) => {
        if (i !== index) v?.pause();
      });
      void video.play();
    } else {
      video.pause();
    }
  }, []);

  const active = VIDEOS[current];

  return (
    <section className="mb-6 rounded-2xl border border-border bg-card p-3 sm:p-4 shadow-lg">
      <div className="mb-3 text-center">
        <p className="text-xs font-bold uppercase text-primary">Aprende con ejemplos reales</p>
        <h2 className="mt-1 text-xl font-bold text-foreground sm:text-2xl">Mira los patrones en acción</h2>
        <p className="mt-1 text-xs text-muted-foreground">Desliza para ver los 3 videos • tú decides cuándo reproducir</p>
      </div>

      <div className="relative mx-auto w-full max-w-[340px]">
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth rounded-xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {VIDEOS.map((item, index) => {
            const isPlaying = playingIndex === index;
            return (
              <div key={item.src} className="w-full shrink-0 snap-center">
                <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-black">
                  <video
                    ref={(el) => {
                      videoRefs.current[index] = el;
                    }}
                    src={item.src}
                    poster={item.poster}
                    controls={isPlaying}
                    controlsList="nodownload noplaybackrate noremoteplayback"
                    disablePictureInPicture
                    playsInline
                    preload="metadata"
                    onPlay={() => setPlayingIndex(index)}
                    onPause={() => setPlayingIndex((prev) => (prev === index ? null : prev))}
                    onEnded={() => setPlayingIndex((prev) => (prev === index ? null : prev))}
                    onContextMenu={(event) => event.preventDefault()}
                    className="h-full w-full object-contain"
                    aria-label={item.title}
                  />

                  {!isPlaying && (
                    <button
                      type="button"
                      onClick={() => togglePlayback(index)}
                      className="absolute inset-0 flex items-center justify-center bg-foreground/10 active:bg-foreground/20"
                      aria-label={`Reproducir: ${item.title}`}
                    >
                      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl">
                        <Play className="ml-1 h-9 w-9" />
                      </span>
                    </button>
                  )}

                  {isPlaying && (
                    <button
                      type="button"
                      onClick={() => togglePlayback(index)}
                      className="absolute right-2 top-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-background/90 text-foreground shadow-lg"
                      aria-label="Pausar video"
                    >
                      <Pause className="h-6 w-6" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => goTo(current - 1)}
          className="absolute left-1 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 text-foreground shadow-lg"
          aria-label="Video anterior"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => goTo(current + 1)}
          className="absolute right-1 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 text-foreground shadow-lg"
          aria-label="Video siguiente"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        <span className="pointer-events-none absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-foreground/70 px-2.5 py-0.5 text-xs font-semibold text-background">
          {current + 1} / {VIDEOS.length}
        </span>
      </div>

      <div className="mt-3 min-h-[52px] text-center">
        <p className="text-xs font-semibold text-primary">{active.eyebrow}</p>
        <h3 className="text-base font-bold text-foreground">{active.title}</h3>
      </div>

      <div className="mt-2 flex justify-center gap-2" aria-label={`Video ${current + 1} de ${VIDEOS.length}`}>
        {VIDEOS.map((item, index) => (
          <button
            type="button"
            key={item.src}
            onClick={() => goTo(index)}
            className={`h-3 rounded-full transition-all ${index === current ? "w-9 bg-primary" : "w-3 bg-muted-foreground/30"}`}
            aria-label={`Ver video ${index + 1}: ${item.title}`}
          />
        ))}
      </div>

    </section>
  );
};

export default TikTokVideos;
