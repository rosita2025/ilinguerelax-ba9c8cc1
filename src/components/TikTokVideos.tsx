import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, ShoppingCart } from "lucide-react";
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

interface TikTokVideosProps {
  onBuy?: () => void;
  priceLabel?: string;
}

export const TikTokVideos = ({ onBuy, priceLabel }: TikTokVideosProps) => {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const selectVideo = useCallback((index: number) => {
    videoRef.current?.pause();
    setPlaying(false);
    setCurrent(index);
  }, []);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  }, []);

  const previous = () => selectVideo((current - 1 + VIDEOS.length) % VIDEOS.length);
  const next = () => selectVideo((current + 1) % VIDEOS.length);
  const video = VIDEOS[current];

  return (
    <section className="mb-6 rounded-2xl border border-border bg-card p-3 sm:p-4 shadow-lg">
      <div className="mb-3 text-center">
        <p className="text-xs font-bold uppercase text-primary">Aprende con ejemplos reales</p>
        <h2 className="mt-1 text-xl font-bold text-foreground sm:text-2xl">Mira los patrones en acción</h2>
        <p className="mt-1 text-xs text-muted-foreground">Tú decides cuándo reproducir o pausar cada video</p>
      </div>

      <div className="relative mx-auto w-full max-w-[310px] overflow-hidden rounded-xl bg-muted aspect-[9/16]">
        <video
          key={video.src}
          ref={videoRef}
          src={video.src}
          poster={video.poster}
          controls={playing}
          controlsList="nodownload noplaybackrate noremoteplayback"
          disablePictureInPicture
          playsInline
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onContextMenu={(event) => event.preventDefault()}
          className="h-full w-full object-cover"
          aria-label={video.title}
        />

        {!playing && (
          <button
            type="button"
            onClick={togglePlayback}
            className="absolute inset-0 flex items-center justify-center bg-foreground/10"
            aria-label={`Reproducir: ${video.title}`}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl">
              <Play className="ml-1 h-7 w-7" />
            </span>
          </button>
        )}

        {playing && (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={togglePlayback}
            className="absolute right-2 top-2 z-10 rounded-full shadow-lg"
            aria-label="Pausar video"
          >
            <Pause />
          </Button>
        )}

        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={previous}
          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full shadow-lg"
          aria-label="Video anterior"
        >
          <ChevronLeft />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={next}
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full shadow-lg"
          aria-label="Video siguiente"
        >
          <ChevronRight />
        </Button>
      </div>

      <div className="mt-3 min-h-[52px] text-center">
        <p className="text-xs font-semibold text-primary">{video.eyebrow}</p>
        <h3 className="text-base font-bold text-foreground">{video.title}</h3>
      </div>

      <div className="mt-2 flex justify-center gap-2" aria-label={`Video ${current + 1} de ${VIDEOS.length}`}>
        {VIDEOS.map((item, index) => (
          <button
            type="button"
            key={item.src}
            onClick={() => selectVideo(index)}
            className={`h-2.5 rounded-full transition-all ${index === current ? "w-8 bg-primary" : "w-2.5 bg-muted-foreground/30"}`}
            aria-label={`Ver video ${index + 1}: ${item.title}`}
          />
        ))}
      </div>

      {onBuy && (
        <Button type="button" variant="hero" size="xl" onClick={onBuy} className="mt-4 w-full shadow-xl">
          <ShoppingCart className="h-5 w-5" />
          LO QUIERO{priceLabel ? ` • ${priceLabel}` : ""}
        </Button>
      )}
    </section>
  );
};

export default TikTokVideos;