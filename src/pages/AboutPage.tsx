import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BookOpen, Heart, Target, Users, Award, Globe } from "lucide-react";

const AboutPage = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 gradient-hero">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
              Sobre Nosotros
            </h1>
            <p className="text-lg text-primary-foreground/90">
              Conoce la historia detrás de iLingue Relax
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 md:py-28">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            {/* About Section */}
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Heart className="w-4 h-4" />
                Nuestra Historia
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Sobre <span className="text-gradient">iLingue Relax</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                iLingue Relax es una marca educativa enfocada en el aprendizaje de idiomas sin estrés, 
                pensada para personas que desean aprender de forma simple, clara y a su propio ritmo. 
                Creemos que aprender un idioma no debe ser difícil ni frustrante. Por eso, iLingue Relax 
                ofrece materiales prácticos, organizados y accesibles, diseñados especialmente para 
                autodidactas y principiantes.
              </p>
            </div>

            {/* Mission & Vision */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <div className="bg-card rounded-2xl border border-border shadow-card p-8">
                <div className="w-14 h-14 rounded-xl gradient-hero flex items-center justify-center mb-6">
                  <Target className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-4">Nuestra Misión</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Ayudar a las personas a aprender idiomas de forma relajada, práctica y accesible, 
                  sin métodos complicados ni estrés innecesario. Queremos que cada estudiante disfrute 
                  del proceso de aprendizaje.
                </p>
              </div>

              <div className="bg-card rounded-2xl border border-border shadow-card p-8">
                <div className="w-14 h-14 rounded-xl gradient-hero flex items-center justify-center mb-6">
                  <BookOpen className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-4">Nuestra Visión</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Convertir a iLingue Relax en una marca educativa reconocida a nivel mundial por 
                  enseñar idiomas sin estrés, de manera clara y amigable para hispanohablantes.
                </p>
              </div>
            </div>

            {/* Values */}
            <div className="mb-16">
              <h3 className="text-2xl font-bold text-foreground text-center mb-8">Nuestros Valores</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card rounded-2xl border border-border shadow-card p-6 text-center hover:shadow-hero transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">Empatía</h4>
                  <p className="text-sm text-muted-foreground">
                    Entendemos las dificultades de aprender un nuevo idioma
                  </p>
                </div>

                <div className="bg-card rounded-2xl border border-border shadow-card p-6 text-center hover:shadow-hero transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Award className="w-6 h-6 text-accent" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">Calidad</h4>
                  <p className="text-sm text-muted-foreground">
                    Contenido cuidadosamente diseñado y verificado
                  </p>
                </div>

                <div className="bg-card rounded-2xl border border-border shadow-card p-6 text-center hover:shadow-hero transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">Accesibilidad</h4>
                  <p className="text-sm text-muted-foreground">
                    Materiales accesibles para todos los presupuestos
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl p-8 md:p-12">
              <h3 className="text-2xl font-bold text-foreground text-center mb-8">Nuestros Logros</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { number: "10,000+", label: "Estudiantes" },
                  { number: "8,000", label: "Palabras" },
                  { number: "4.9/5", label: "Valoración" },
                  { number: "20+", label: "Países" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.number}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default AboutPage;
