import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  "8,000 palabras esenciales del inglés",
  "Pronunciación con audio nativo",
  "Diseñado para hispanohablantes",
  "Sin necesidad de diccionarios",
  "Metodología paso a paso",
  "Acceso de por vida",
  "Actualizaciones gratuitas",
  "Soporte personalizado",
];

export const Pricing = () => {
  return (
    <section className="py-20 md:py-28 gradient-hero-soft">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Empieza tu viaje hacia el{" "}
            <span className="text-gradient">inglés fluido</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Inversión única, aprendizaje de por vida
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="relative p-8 md:p-10 rounded-3xl bg-card border border-border shadow-hero overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-40 h-40 gradient-hero opacity-10 blur-3xl" />
            
            <div className="relative">
              <div className="inline-block px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-6">
                Inglés Relax
              </div>

              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl md:text-6xl font-bold text-foreground">
                  $47
                </span>
                <span className="text-muted-foreground">USD</span>
              </div>

              <p className="text-muted-foreground mb-8">
                Pago único • Acceso inmediato • Sin suscripciones
              </p>

              <ul className="space-y-4 mb-10">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full gradient-hero flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button variant="hero" size="xl" className="w-full">
                Obtener Acceso Ahora
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-4">
                🔒 Pago seguro • Garantía de 30 días
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
