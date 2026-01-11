import { Headphones, BookOpen, Sparkles, Heart, Globe, Coffee } from "lucide-react";

const benefits = [
  {
    icon: Sparkles,
    title: "Sin Estrés",
    description: "Metodología relajada que respeta tu ritmo, sin presiones ni exámenes estresantes",
    highlight: true,
  },
  {
    icon: Heart,
    title: "Claro y Amigable",
    description: "Explicaciones simples y directas, sin términos complicados que confundan",
    highlight: false,
  },
  {
    icon: Globe,
    title: "Aprende Idiomas",
    description: "Enfocado en lo que realmente necesitas para comunicarte con confianza",
    highlight: false,
  },
  {
    icon: Coffee,
    title: "A Tu Ritmo",
    description: "Estudia cuando quieras, donde quieras. Sin horarios fijos ni compromisos",
    highlight: false,
  },
];

export const Benefits = () => {
  return (
    <section id="beneficios" className="py-20 md:py-28 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2" />
      
      <div className="container px-4 md:px-6 relative">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            ¿Por qué iLingue Relax?
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Aprender idiomas debería ser
            <br />
            <span className="text-gradient">relajado y accesible</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Diseñado para personas que quieren aprender sin la presión de los métodos tradicionales
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className={`group p-8 rounded-3xl transition-all duration-500 hover:-translate-y-1 ${
                benefit.highlight 
                  ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-hero' 
                  : 'bg-card border border-border/50 shadow-card hover:shadow-hero'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 ${
                benefit.highlight 
                  ? 'bg-primary-foreground/20' 
                  : 'gradient-hero'
              }`}>
                <benefit.icon className={`w-7 h-7 ${benefit.highlight ? 'text-primary-foreground' : 'text-primary-foreground'}`} />
              </div>
              <h3 className={`text-xl font-semibold mb-3 ${benefit.highlight ? 'text-primary-foreground' : 'text-foreground'}`}>
                {benefit.title}
              </h3>
              <p className={`leading-relaxed ${benefit.highlight ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
