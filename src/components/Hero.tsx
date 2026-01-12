import { ArrowRight, Play, Smile, Brain, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";
import logoIlingue from "@/assets/logo-ilingue.png";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/75 to-primary/90" />
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-10 w-20 h-20 bg-accent/20 rounded-full blur-2xl animate-pulse" />
      <div className="absolute bottom-1/4 right-10 w-32 h-32 bg-primary-foreground/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      {/* Content */}
      <div className="relative container px-4 md:px-6 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo Badge */}
          <div className="inline-flex items-center gap-3 mb-8 animate-fade-in">
            <img src={logoIlingue} alt="iLingue" className="h-10 md:h-12" />
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
            Estudia Idiomas
            <br />
            <span className="relative inline-block">
              <span className="text-accent">Sin Estrés</span>
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
            Aprende de forma <strong className="font-semibold">relajada, práctica y accesible</strong>.
            <br className="hidden md:block" />
            Sin métodos complicados. A tu propio ritmo.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-10 animate-fade-in" style={{ animationDelay: "250ms" }}>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground text-sm">
              <Smile className="w-4 h-4 text-accent" />
              <span>Aprendizaje relajado</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground text-sm">
              <Brain className="w-4 h-4 text-accent" />
              <span>Método claro y amigable</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground text-sm">
              <Clock className="w-4 h-4 text-accent" />
              <span>Sin presiones</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: "300ms" }}>
            <Button variant="hero" size="xl" className="shadow-xl hover:shadow-2xl transition-shadow">
              Comenzar Ahora
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="heroOutline" size="xl">
              <Play className="w-5 h-5" />
              Ver Demo
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-14 pt-8 border-t border-primary-foreground/20 animate-fade-in" style={{ animationDelay: "400ms" }}>
            <p className="text-primary-foreground/60 text-sm mb-4">Confiado por estudiantes en todo el mundo</p>
            <div className="flex flex-wrap justify-center gap-8 text-primary-foreground/80 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <span>4.9/5 valoración</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <span>+10,000 estudiantes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔒</span>
                <span>Garantía 7 días</span>
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
