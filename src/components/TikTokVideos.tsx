import { useEffect } from "react";

const VIDEOS = [
  {
    id: "7596861806858079501",
    url: "https://www.tiktok.com/@hellomicrolearning/video/7596861806858079501",
    author: "@hellomicrolearning",
    authorUrl: "https://www.tiktok.com/@hellomicrolearning",
  },
  {
    id: "7680998984676035853",
    url: "https://www.tiktok.com/@ingls.pal.jale/video/7680998984676035853",
    author: "@ingls.pal.jale",
    authorUrl: "https://www.tiktok.com/@ingls.pal.jale",
  },
  {
    id: "7663520180038880532",
    url: "https://www.tiktok.com/@fernando_mejia0808/video/7663520180038880532",
    author: "@fernando_mejia0808",
    authorUrl: "https://www.tiktok.com/@fernando_mejia0808",
  },
];

interface TikTokVideosProps {
  title?: string;
  subtitle?: string;
}

export const TikTokVideos = ({
  title = "Míralo en video",
  subtitle = "Los patrones del inglés explicados en segundos",
}: TikTokVideosProps) => {
  useEffect(() => {
    const SRC = "https://www.tiktok.com/embed.js";
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`);
    if (existing) {
      // re-process embeds if the script is already loaded
      (window as unknown as { tiktokEmbed?: { lib?: { render?: (n?: unknown) => void } } })
        .tiktokEmbed?.lib?.render?.(document.querySelectorAll(".tiktok-embed"));
      return;
    }
    const script = document.createElement("script");
    script.src = SRC;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <section className="py-8 sm:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">{subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 justify-items-center">
          {VIDEOS.map((v) => (
            <blockquote
              key={v.id}
              className="tiktok-embed w-full"
              cite={v.url}
              data-video-id={v.id}
              style={{ maxWidth: 605, minWidth: 325 }}
            >
              <section>
                <a target="_blank" rel="noreferrer" title={v.author} href={v.authorUrl}>
                  {v.author}
                </a>
              </section>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TikTokVideos;
