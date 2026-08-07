import { useEffect, useState } from "react";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, BookOpen, Shield, Zap, ArrowRight, MessageCircle, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { VerifiedReviews } from "@/components/VerifiedReviews";

const LandingVentasSEO = () => {
  return (
    <>
      <SEO 
        title="iLingue Relax — Método Revolucionario para Aprender Idiomas"
        description="Descubre cómo aprender idiomas sin estrés con la metodología de iLingue Relax. Libros con pronunciación figurada y mapas mentales."
      />
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden bg-slate-950 text-white">
          <div className="container px-4 mx-auto relative z-10">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-medium animate-fade-in">
                <Sparkles className="w-4 h-4" />
                <span>Método Probado por +10,000 Estudiantes</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                Domina un Nuevo Idioma <span className="text-primary italic">Sin Estrés</span> y en Tiempo Récord
              </h1>
              <p className="text-lg md:text-xl text-slate-300">
                Olvida las reglas gramaticales aburridas. Con iLingue Relax, hablas desde el primer día usando nuestra metodología visual y fonética única.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button asChild size="lg" className="h-14 px-8 text-lg font-bold shadow-xl shadow-primary/20">
                  <Link to="/products">
                    Ver Catálogo Completo <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg font-bold border-white/20 hover:bg-white/10">
                  <a href="#metodologia">Nuestra Metodología</a>
                </Button>
              </div>
              <div className="pt-8">
                <VerifiedReviews className="justify-center text-white" rating={4.9} count={12450} />
              </div>
            </div>
          </div>
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent rounded-full blur-[120px]" />
          </div>
        </section>

        {/* Beneficios Section */}
        <section className="py-20 bg-slate-50 dark:bg-slate-900/50" id="beneficios">
          <div className="container px-4 mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">¿Por qué elegir iLingue Relax?</h2>
              <p className="text-muted-foreground">Hemos rediseñado el aprendizaje de idiomas para que sea natural, divertido y altamente efectivo.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Aprendizaje Acelerado",
                  desc: "Nuestros mapas mentales activan ambos hemisferios del cerebro, permitiéndote retener información 3 veces más rápido.",
                  icon: Zap,
                  color: "text-amber-500",
                  bg: "bg-amber-500/10"
                },
                {
                  title: "Pronunciación Perfecta",
                  desc: "Sistema de fonética figurada exclusivo. Si sabes leer español, puedes pronunciar correctamente cualquier palabra en inglés o coreano.",
                  icon: MessageCircle,
                  color: "text-blue-500",
                  bg: "bg-blue-500/10"
                },
                {
                  title: "Acceso de Por Vida",
                  desc: "Compra una vez y estudia a tu ritmo. Sin suscripciones mensuales ni pagos ocultos. El conocimiento es tuyo para siempre.",
                  icon: Shield,
                  color: "text-green-500",
                  bg: "bg-green-500/10"
                }
              ].map((b, i) => (
                <div key={i} className="p-8 bg-background rounded-2xl border border-border shadow-sm hover:shadow-md transition-all">
                  <div className={`w-12 h-12 rounded-xl ${b.bg} ${b.color} flex items-center justify-center mb-6`}>
                    <b.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{b.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Metodología Section */}
        <section className="py-20" id="metodologia">
          <div className="container px-4 mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/2 space-y-6">
                <div className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-bold uppercase tracking-wider">
                  El Secreto de los Políglotas
                </div>
                <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                  La Metodología que Cambió las Reglas del Juego
                </h2>
                <p className="text-lg text-muted-foreground">
                  En iLingue Relax utilizamos un enfoque holístico basado en la neurociencia del aprendizaje:
                </p>
                <div className="space-y-4">
                  {[
                    "Mapas Mentales: Conexiones visuales para memorización profunda.",
                    "Repetición Espaciada: Optimizamos cuándo repasas para que nunca olvides.",
                    "Inmersión Fonética: Pronunciación escrita tal como suena en tu idioma.",
                    "Contexto Real: Frases que realmente usarás en viajes o trabajo."
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-1 bg-primary/20 rounded-full p-1">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium">{text}</span>
                    </div>
                  ))}
                </div>
                <Button asChild size="lg" className="mt-6">
                  <Link to="/products">Empezar Ahora</Link>
                </Button>
              </div>
              <div className="lg:w-1/2 relative">
                <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border-8 border-background">
                  <img 
                    src="/placeholder.svg" 
                    alt="Metodología iLingue Relax" 
                    className="w-full h-auto aspect-video object-cover"
                  />
                </div>
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-accent rounded-full blur-3xl opacity-30" />
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary rounded-full blur-3xl opacity-30" />
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Summary */}
        <section className="py-20 bg-slate-950 text-white">
          <div className="container px-4 mx-auto text-center">
            <h2 className="text-3xl font-bold mb-12">Lo que dicen nuestros estudiantes</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: "Carlos R.", text: "Por fin entiendo cómo pronunciar en inglés sin miedo. El libro de 8000 palabras es increíble.", rating: 5 },
                { name: "Maria L.", text: "Los mapas mentales de coreano me ahorraron meses de estudio. ¡Súper recomendado!", rating: 5 },
                { name: "Jean P.", text: "Metodología clara y directa. Ideal para quienes no tenemos mucho tiempo.", rating: 5 }
              ].map((t, i) => (
                <div key={i} className="p-6 bg-white/5 rounded-xl border border-white/10 text-left">
                  <div className="flex gap-1 mb-4 text-amber-400">
                    {[...Array(t.rating)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="italic text-slate-300 mb-4">"{t.text}"</p>
                  <p className="font-bold text-sm">— {t.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container px-4 mx-auto">
            <div className="max-w-4xl mx-auto p-12 bg-gradient-to-br from-primary to-accent rounded-[2rem] text-white text-center shadow-2xl relative overflow-hidden">
              <div className="relative z-10 space-y-6">
                <h2 className="text-4xl font-bold">¿Listo para hablar un nuevo idioma?</h2>
                <p className="text-xl opacity-90">Únete a miles de personas que ya están cumpliendo sus metas con iLingue Relax.</p>
                <Button asChild size="lg" variant="secondary" className="h-14 px-10 text-lg font-bold">
                  <Link to="/products">Explorar Catálogo</Link>
                </Button>
              </div>
              {/* Decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl" />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default LandingVentasSEO;
