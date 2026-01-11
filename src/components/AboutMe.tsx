import { BookOpen, Heart, Target, Award } from "lucide-react";

export const AboutMe = () => {
  return (
    <section id="sobre-mi" className="py-20 md:py-28 bg-secondary/30">
      <div className="container px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Heart className="w-4 h-4" />
              Nuestra Historia
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Sobre <span className="text-gradient">iLingue Relax</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Creamos recursos educativos diseñados especialmente para hispanohablantes que quieren aprender inglés de forma natural y sin estrés.
            </p>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-card rounded-2xl border border-border shadow-card p-6">
              <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Nuestra Misión</h3>
              <p className="text-muted-foreground leading-relaxed">
                Hacer que el aprendizaje del inglés sea accesible, práctico y libre de estrés para todos los hispanohablantes, sin importar su nivel inicial.
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-card p-6">
              <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Nuestro Método</h3>
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos pronunciación adaptada al español y fonética UK-USA para que puedas aprender a hablar correctamente desde el primer día.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { number: "10,000+", label: "Estudiantes" },
              { number: "8,000", label: "Palabras" },
              { number: "4.9/5", label: "Valoración" },
              { number: "100%", label: "Garantía" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card rounded-xl border border-border p-4 text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary mb-1">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
