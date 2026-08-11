import { useEffect, useState } from "react";
import { Instagram } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n/I18nContext";
import { Skeleton } from "@/components/ui/skeleton";

type IgItem = {
  id: string;
  caption: string;
  permalink: string;
  image: string;
  mediaType: string;
};

const copy = {
  es: { title: "Síguenos en Instagram", sub: "Consejos de pronunciación y novedades cada semana", cta: "Ver perfil" },
  en: { title: "Follow us on Instagram", sub: "Pronunciation tips and news every week", cta: "View profile" },
  fr: { title: "Suivez-nous sur Instagram", sub: "Conseils de prononciation et nouveautés chaque semaine", cta: "Voir le profil" },
  pt: { title: "Siga-nos no Instagram", sub: "Dicas de pronúncia e novidades toda semana", cta: "Ver perfil" },
};

export const InstagramFeed = () => {
  const { language } = useI18n();
  const c = copy[language] ?? copy.es;
  const [items, setItems] = useState<IgItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.functions
      .invoke("instagram-feed")
      .then(({ data, error }) => {
        if (!alive) return;
        if (error || !data?.configured || !data?.items?.length) {
          setFailed(true);
          return;
        }
        setItems(data.items.slice(0, 8));
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  if (failed) return null;

  return (
    <section className="py-14 bg-background" aria-labelledby="instagram-title">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h2 id="instagram-title" className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Instagram className="w-6 h-6 text-primary" />
              {c.title}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">{c.sub}</p>
          </div>
          <a
            href="https://www.instagram.com/ilinguerelax/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity self-start"
          >
            <Instagram className="w-4 h-4" />
            @ilinguerelax · {c.cta}
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {!items
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))
            : items.map((item) => (
                <a
                  key={item.id}
                  href={item.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block aspect-square overflow-hidden rounded-xl bg-muted"
                >
                  <img
                    src={item.image}
                    alt={item.caption?.slice(0, 120) || "iLingue Relax Instagram"}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors flex items-center justify-center">
                    <Instagram className="w-6 h-6 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </a>
              ))}
        </div>
      </div>
    </section>
  );
};
