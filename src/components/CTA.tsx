import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CTA = () => {
  return (
    <section className="py-20 md:py-28 gradient-hero">
      <div className="container px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            ¿Listo para dominar el inglés sin estrés?
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8">
            Únete a más de 10,000 estudiantes que ya están aprendiendo con iLingue Relax
          </p>
          <Button 
            variant="hero" 
            size="xl" 
            className="bg-white text-primary hover:bg-white/90"
            onClick={() => window.location.href = "/productos"}
          >
            VER PRODUCTOS
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};