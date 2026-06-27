import { Music2, Sparkles } from "lucide-react";

export const SPOTIFY_URL = "https://open.spotify.com/show/033EQVooL7r6tAjURcAbFn?si=97993b0d8e7348c5";


export const SpotifyLaunchBanner = () => {
  return (
    <section className="w-full bg-gradient-to-r from-[#0a0a0a] via-[#0f3d2e] to-[#1DB954]/90 text-white border-y border-[#1DB954]/40">
      <div className="container px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-center gap-3 text-center">
          <div className="shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#1DB954] flex items-center justify-center shadow-lg">
            <Music2 className="w-5 h-5 md:w-6 md:h-6 text-black" />
          </div>
          <div className="leading-tight">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#1DB954]/20 text-[#1DB954] text-[10px] md:text-xs font-extrabold uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3" /> Audio disponible
            </div>
            <p className="text-sm md:text-base font-bold">
              🎧 Escucha ahora <span className="text-[#1DB954]">1,000 palabras en inglés</span>
              <span className="hidden md:inline"> + </span>
              <span className="block md:inline text-white/90">Podcast iLingue Relax en Spotify</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpotifyLaunchBanner;