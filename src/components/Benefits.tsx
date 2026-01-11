import { Headphones, BookOpen, Sparkles, CheckCircle2 } from "lucide-react";

const benefits = [
  {
    icon: Headphones,
    title: "Pronunciación Perfecta",
    description: "Audio nativo diseñado especialmente para hispanohablantes",
  },
  {
    icon: BookOpen,
    title: "8,000 Palabras",
    description: "Vocabulario esencial organizado por frecuencia de uso",
  },
  {
    icon: Sparkles,
    title: "Sin Estrés",
    description: "Metodología relajada que respeta tu ritmo de aprendizaje",
  },
  {
    icon: CheckCircle2,
    title: "Paso a Paso",
    description: "Sin diccionarios, sin confusión. Solo aprendizaje fluido",
  },
];

export const Benefits = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            ¿Por qué elegir{" "}
            <span className="text-gradient">iLingue Relax</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Un método revolucionario diseñado para que aprendas inglés de forma
            natural, sin frustración
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className="group p-6 md:p-8 rounded-2xl bg-card gradient-card border border-border/50 shadow-card hover:shadow-hero transition-all duration-500 hover:-translate-y-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-xl gradient-hero flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <benefit.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
