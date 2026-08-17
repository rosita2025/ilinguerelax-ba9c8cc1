import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useI18n } from "@/i18n/I18nContext";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination, Navigation } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import appPreview1 from "@/assets/app-preview-1.png.asset.json";
import appPreview2 from "@/assets/app-preview-2.png.asset.json";

export const Hero = () => {
  const { t, language } = useI18n();

  // Language-specific content
  const heroContent = {
    es: {
      title1: "iLingue Relax App",
      title2: "Muy Pronto",
      subtitle: "Escucha y repite en <strong>Español, Inglés y Coreano</strong>.",
      subtitle2: "Mejora tu escucha sin memorizar.",
      cta1: "Explorar Cursos",
      cta2: "Ver Demo",
    },
    en: {
      title1: "iLingue Relax App",
      title2: "Coming Soon",
      subtitle: "Listen and repeat in <strong>Spanish, English, and Korean</strong>.",
      subtitle2: "Improve your listening without memorizing.",
      cta1: "Explore Courses",
      cta2: "Watch Demo",
    },
    fr: {
      title1: "iLingue Relax App",
      title2: "Très Bientôt",
      subtitle: "Écoutez et répétez en <strong>Espagnol, Anglais et Coréen</strong>.",
      subtitle2: "Améliorez votre écoute sans mémoriser.",
      cta1: "Explorer",
      cta2: "Voir la Démo",
    },
    pt: {
      title1: "iLingue Relax App",
      title2: "Muito em Breve",
      subtitle: "Ouça e repita em <strong>Espanhol, Inglés e Coreano</strong>.",
      subtitle2: "Melhore sua audição sin memorizar.",
      cta1: "Explorar Cursos",
      cta2: "Ver Demo",
    },
  };

  const content = heroContent[language];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Slider */}
      <div className="absolute inset-0 w-full h-full">
        <Swiper
          modules={[Autoplay, EffectFade, Pagination, Navigation]}
          effect={'fade'}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          navigation={true}
          loop={true}
          className="w-full h-full"
        >
          <SwiperSlide className="flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <img
              src={appPreview1.url}
              alt="iLingue Relax App"
              className="max-h-[70vh] md:max-h-[80vh] w-auto object-contain transition-transform duration-700 hover:scale-105"
              loading="eager"
            />
          </SwiperSlide>
          <SwiperSlide className="flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <img
              src={appPreview2.url}
              alt="2,000 Korean Words"
              className="max-h-[70vh] md:max-h-[80vh] w-auto object-contain transition-transform duration-700 hover:scale-105"
              loading="lazy"
            />
          </SwiperSlide>
        </Swiper>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90 pointer-events-none z-10" />

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-10 w-20 h-20 bg-accent/20 rounded-full blur-2xl animate-pulse z-20" />
      <div className="absolute bottom-1/4 right-10 w-32 h-32 bg-primary-foreground/10 rounded-full blur-3xl animate-pulse z-20" style={{ animationDelay: "1s" }} />

      {/* Content */}
      <div className="relative container px-4 md:px-6 py-20 md:py-32 z-30">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-6 animate-fade-in">
            {content.title1}
            <br />
            <span className="relative inline-block">
              <span className="text-accent">{content.title2}</span>
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 300 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 10C50 4 150 2 298 6"
                  stroke="hsl(var(--accent))"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-2xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto font-light animate-fade-in" style={{ animationDelay: "100ms" }}>
            <span dangerouslySetInnerHTML={{ __html: content.subtitle }} />
            <br className="hidden md:block" />
            {content.subtitle2}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: "200ms" }}>
            <Link to="/products">
              <Button variant="hero" size="xl" className="shadow-xl hover:shadow-2xl transition-shadow">
                {content.cta1}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="heroOutline" size="xl">
              <Play className="w-5 h-5" />
              {content.cta2}
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
