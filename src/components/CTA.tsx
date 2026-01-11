import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CTA = () => {
  return (
    <section className="py-20 md:py-28 gradient-hero relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl" />

      <div className="container px-4 md:px-6 relative">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            ¿Listo para dominar el inglés de forma relajada?
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto">
            Únete a miles de hispanohablantes que ya están aprendiendo inglés
            sin estrés con iLingue Relax
          </p>

          <Button variant="hero" size="xl">
            Comenzar Mi Viaje
            <ArrowRight className="w-5 h-5" />
          </Button>

          <p className="text-primary-foreground/70 text-sm mt-6">
            Acceso inmediato • Sin suscripciones • Garantía de 30 días
          </p>
        </div>
      </div>
    </section>
  );
};
