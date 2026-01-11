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
              iLingue Relax es una marca educativa enfocada en el aprendizaje de idiomas sin estrés, pensada para personas que desean aprender de forma simple, clara y a su propio ritmo. Creemos que aprender un idioma no debe ser difícil ni frustrante. Por eso, iLingue Relax ofrece materiales prácticos, organizados y accesibles, diseñados especialmente para autodidactas y principiantes.
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
                Ayudar a las personas a aprender idiomas de forma relajada, práctica y accesible, sin métodos complicados.
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-card p-6">
              <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Nuestra Visión</h3>
              <p className="text-muted-foreground leading-relaxed">
                Convertir a iLingue Relax en una marca educativa reconocida por enseñar idiomas sin estrés, de manera clara y amigable.
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
