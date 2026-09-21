import { useCallback, useState } from "react";
import { Play } from "lucide-react";

const VIDEOS = [
  {
    id: "7596861806858079501",
    label: "Magic E: el patrón que cambia todo",
  },
  {
    id: "7663520180038880532",
    label: "Deja de traducir palabra por palabra",
  },
];

interface TikTokVideosProps {
  title?: string;
  subtitle?: string;
}

export const TikTokVideos = ({
  title = "Míralo en video",
  subtitle = "Toca para reproducir — los videos no se activan solos",
}: TikTokVideosProps) => {
  const [active, setActive] = useState<string | null>(null);

  const handlePlay = useCallback((id: string) => {
    setActive((current) => (current === id ? null : id));
  }, []);

  return (
    <section className="py-8 sm:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">{subtitle}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {VIDEOS.map((v) => (
            <div
              key={v.id}
              className="relative w-full rounded-2xl overflow-hidden border border-border bg-muted"
              style={{ aspectRatio: "9 / 16" }}
            >
              {active === v.id ? (
                <>
                  <iframe
                    src={`https://www.tiktok.com/player/v1/${v.id}?autoplay=1&controls=1&description=0&music_info=0&rel=0`}
                    title={v.label}
                    className="absolute inset-0 w-full h-full"
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    frameBorder={0}
                  />
                  <button
                    type="button"
                    onClick={() => setActive(null)}
                    className="absolute top-2 right-2 z-10 rounded-full bg-background/80 text-foreground text-xs px-3 py-1 border border-border"
                  >
                    Pausar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handlePlay(v.id)}
                  aria-label={`Reproducir video: ${v.label}`}
                  className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-muted to-background hover:opacity-90 transition-opacity"
                >
                  <span className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 ml-0.5" />
                  </span>
                  <span className="px-4 text-sm font-semibold text-foreground text-center">{v.label}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TikTokVideos;
