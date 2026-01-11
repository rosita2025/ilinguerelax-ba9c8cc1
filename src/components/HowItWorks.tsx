import { BookOpen, RefreshCw, Award } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: BookOpen,
    title: "Lee y Relájate",
    description: "Estudia contenido diseñado para que aprendas de forma natural, sin prisa ni presión",
  },
  {
    number: "02",
    icon: RefreshCw,
    title: "Practica a Tu Ritmo",
    description: "Repite cuando quieras, las veces que necesites. Sin exámenes ni fechas límite",
  },
  {
    number: "03",
    icon: Award,
    title: "Habla Con Confianza",
    description: "Integra lo aprendido poco a poco hasta comunicarte con seguridad",
  },
];

export const HowItWorks = () => {
  return (
    <section id="como-funciona" className="py-20 md:py-28 bg-secondary/30 relative">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Método Simple
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Así de <span className="text-gradient">fácil</span> es aprender
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sin complicaciones. Solo 3 pasos para dominar un nuevo idioma con iLingue Relax
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="relative group">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
              )}

              <div className="relative bg-card rounded-3xl p-8 text-center border border-border shadow-card hover:shadow-hero transition-all duration-500 hover:-translate-y-2">
                {/* Step Number Badge */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-accent text-primary-foreground text-sm font-bold">
                  Paso {step.number}
                </div>

                {/* Icon */}
                <div className="w-20 h-20 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 mt-4">
                  <step.icon className="w-10 h-10 text-primary-foreground" />
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
