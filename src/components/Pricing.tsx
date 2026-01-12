import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
const features = ["8,000 palabras esenciales del inglés", "Pronunciación en español incluida", "Diseñado para hispanohablantes", "Sin necesidad de diccionarios", "Metodología paso a paso", "Acceso de por vida", "Actualizaciones gratuitas", "Soporte personalizado"];
export const Pricing = () => {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Planes y Precios
        </h2>
        <p className="text-muted-foreground mb-12">
          Elige el plan que mejor se adapte a tus necesidades
        </p>
        <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
          <ul className="space-y-3 mb-8">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3 text-left">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-foreground">{feature}</span>
              </li>
            ))}
          </ul>
          <Link to="/products">
            <Button size="lg" className="w-full">
              Ver Productos
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};