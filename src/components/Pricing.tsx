import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const features = [
  "8,000 palabras esenciales del inglés",
  "Pronunciación con audio nativo",
  "Diseñado para hispanohablantes",
  "Sin necesidad de diccionarios",
  "Metodología paso a paso",
  "Acceso de por vida",
  "Actualizaciones gratuitas",
  "Soporte personalizado"
];

export const Pricing = () => {
  return (
    <section id="pricing" className="py-16 md:py-24 bg-background">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Nuestros Cursos
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Elige tu <span className="text-gradient">camino</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Cursos diseñados para aprender sin estrés
          </p>
        </div>

        <div className="max-w-md mx-auto bg-card rounded-2xl border border-border shadow-card p-8">
          <h3 className="text-2xl font-bold text-foreground mb-4 text-center">
            Inglés Relax
          </h3>
          <ul className="space-y-3 mb-8">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-green-500" />
                </div>
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
          <Link to="/productos">
            <Button className="w-full" size="lg">
              Ver Productos
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};