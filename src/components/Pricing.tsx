import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
const features = ["8,000 palabras esenciales del inglés", "Pronunciación en español incluida", "Diseñado para hispanohablantes", "Sin necesidad de diccionarios", "Metodología paso a paso", "Acceso de por vida", "Actualizaciones gratuitas", "Soporte personalizado"];
export const Pricing = () => {
  return (
    <section id="pricing" className="py-20 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
            Planes y Precios
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Elige el plan que mejor se adapte a tus necesidades
          </p>
        </div>
        
        <div className="max-w-md mx-auto">
          <div className="bg-card rounded-2xl border border-border shadow-lg p-8">
            <h3 className="text-2xl font-bold mb-4">8,000 Palabras</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">Ver en tienda</span>
            </div>
            <ul className="space-y-3 mb-8">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
            <Link to="/products">
              <Button className="w-full" size="lg">
                Ver Productos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};