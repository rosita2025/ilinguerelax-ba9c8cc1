import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const features = [
  "8,000 palabras esenciales del inglés",
  "Pronunciación en español incluida",
  "Diseñado para hispanohablantes",
  "Sin necesidad de diccionarios",
  "Metodología paso a paso",
  "Acceso de por vida",
  "Actualizaciones gratuitas",
  "Soporte personalizado"
];

export const Pricing = () => {
  return (
    <section id="pricing" className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Inversión Única
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Un solo pago, acceso de por vida
          </p>
        </div>
        
        <div className="max-w-lg mx-auto bg-card rounded-2xl shadow-xl p-8 border border-border">
          <div className="text-center mb-6">
            <span className="text-sm text-muted-foreground line-through">$76.00</span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-5xl font-bold text-primary">$24</span>
              <span className="text-muted-foreground">.00 USD</span>
            </div>
            <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              70% de descuento
            </span>
          </div>
          
          <ul className="space-y-3 mb-8">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
          
          <Link to="/products">
            <Button size="lg" className="w-full text-lg py-6">
              Ver Todos los Productos
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};