import { ArrowRight, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CTA = () => {
  return (
    <section className="py-20 md:py-28 gradient-hero relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl" />
      <div className="absolute top-10 left-1/4 w-20 h-20 bg-accent/20 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-10 right-1/4 w-16 h-16 bg-primary-foreground/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="container px-4 md:px-6 relative">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-foreground/10 mb-8">
            <Smile className="w-8 h-8 text-primary-foreground" />
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            ¿Listo para aprender
            <br />
            <span className="text-accent">sin estrés</span>?
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto">
            Únete a miles de personas que ya están aprendiendo idiomas de forma relajada con <strong>iLingue Relax</strong>
          </p>

          <Button variant="hero" size="xl" className="shadow-xl hover:shadow-2xl transition-shadow">
            Comenzar Mi Viaje
            <ArrowRight className="w-5 h-5" />
          </Button>

          <div className="flex flex-wrap justify-center gap-6 mt-8 text-primary-foreground/70 text-sm">
            <span>✓ Acceso inmediato</span>
            <span>✓ Sin suscripciones</span>
            <span>✓ Garantía de 30 días</span>
          </div>
        </div>
      </div>
    </section>
  );
};
