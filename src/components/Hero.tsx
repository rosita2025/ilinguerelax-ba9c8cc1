import { ArrowRight, Play, Smile, Brain, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useI18n } from "@/i18n/I18nContext";
import heroBg from "@/assets/hero-bg.jpg";

export const Hero = () => {
  const { t, language } = useI18n();

  // Language-specific content
  const heroContent = {
    es: {
      title1: "iLingue Relax App",
      title2: "Muy Pronto",
      subtitle: "Escucha y repite en <strong class='font-semibold'>Español, Inglés y Coreano</strong>.",
      subtitle2: "Mejora tu escucha sin memorizar. El método definitivo para aprender idiomas sin estrés.",
      pill1: "Aprendizaje relajado",
      pill2: "Método claro y amigable",
      pill3: "Sin presiones",
      cta1: "Explorar Cursos",
      cta2: "Ver Demo",
      trust: "Confiado por estudiantes en todo el mundo",
      rating: "valoración",
      students: "estudiantes",
      guarantee: "Garantía 7 días",
    },
    en: {
      title1: "iLingue Relax App",
      title2: "Coming Soon",
      subtitle: "Listen and repeat in <strong class='font-semibold'>Spanish, English, and Korean</strong>.",
      subtitle2: "Improve your listening without memorizing. The definitive method to learn languages stress-free.",
      pill1: "Relaxed learning",
      pill2: "Clear & friendly method",
      pill3: "No pressure",
      cta1: "Explore Courses",
      cta2: "Watch Demo",
      trust: "Trusted by students worldwide",
      rating: "rating",
      students: "students",
      guarantee: "7-day guarantee",
    },
    fr: {
      title1: "iLingue Relax App",
      title2: "Très Bientôt",
      subtitle: "Écoutez et répétez en <strong class='font-semibold'>Espagnol, Anglais et Coréen</strong>.",
      subtitle2: "Améliorez votre écoute sans mémoriser. La méthode définitive pour apprendre les langues sans stress.",
      pill1: "Apprentissage détendu",
      pill2: "Méthode claire et amicale",
      pill3: "Sans pression",
      cta1: "Explorer",
      cta2: "Voir la Démo",
      trust: "Approuvé par des étudiants du monde entier",
      rating: "évaluation",
      students: "étudiants",
      guarantee: "Garantie 7 jours",
    },
    pt: {
      title1: "iLingue Relax App",
      title2: "Muito em Breve",
      subtitle: "Ouça e repita em <strong class='font-semibold'>Espanhol, Inglês e Coreano</strong>.",
      subtitle2: "Melhore sua audição sem memorizar. O método definitivo para aprender idiomas sem estresse.",
      pill1: "Aprendizado relaxado",
      pill2: "Método claro e amigável",
      pill3: "Sem pressão",
      cta1: "Explorar Cursos",
      cta2: "Ver Demo",
      trust: "Confiado por estudantes em todo o mundo",
      rating: "avaliação",
      students: "estudantes",
      guarantee: "Garantia 7 dias",
    },
  };

  const content = heroContent[language];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image - LCP candidate */}
      <img
        src={heroBg}
        alt=""
        width={1920}
        height={1080}
        loading="eager"
        // @ts-ignore - fetchPriority is supported but types are missing
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/85 to-black/95" />

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-10 w-20 h-20 bg-accent/20 rounded-full blur-2xl animate-pulse" />
      <div className="absolute bottom-1/4 right-10 w-32 h-32 bg-primary-foreground/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      {/* Content */}
      <div className="relative container px-4 md:px-6 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo Badge */}
          <div className="inline-flex flex-col items-center gap-2 mb-8 animate-fade-in">
            <span className="text-2xl md:text-3xl font-bold text-primary-foreground tracking-tight">
              iLingue <span className="font-light">Relax</span> <span className="text-accent ml-1">App</span>
            </span>
            <span className="bg-accent/20 text-accent text-xs font-semibold px-3 py-1 rounded-full border border-accent/30 uppercase tracking-widest">
              Muy Pronto / Coming Soon
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
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
          <p className="text-lg md:text-2xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto font-light animate-fade-in" style={{ animationDelay: "200ms" }}>
            <span dangerouslySetInnerHTML={{ __html: content.subtitle }} />
            <br className="hidden md:block" />
            {content.subtitle2}
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-10 animate-fade-in" style={{ animationDelay: "250ms" }}>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground text-sm">
              <Smile className="w-4 h-4 text-accent" />
              <span>{content.pill1}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground text-sm">
              <Brain className="w-4 h-4 text-accent" />
              <span>{content.pill2}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground text-sm">
              <Clock className="w-4 h-4 text-accent" />
              <span>{content.pill3}</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: "300ms" }}>
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

          {/* Trust Indicators */}
          <div className="mt-14 pt-8 border-t border-primary-foreground/20 animate-fade-in" style={{ animationDelay: "400ms" }}>
            <p className="text-primary-foreground/60 text-sm mb-4">{content.trust}</p>
            <div className="flex flex-wrap justify-center gap-8 text-primary-foreground/80 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <span>4.9/5 {content.rating}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <span>+10,000 {content.students}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔒</span>
                <span>{content.guarantee}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
