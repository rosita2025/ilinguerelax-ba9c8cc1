import { BookOpen, Sparkles, Heart, Globe, Coffee } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

export const Benefits = () => {
  const { language } = useI18n();

  const content = {
    es: {
      badge: "¿Por qué iLingue Relax?",
      title: "Aprender idiomas debería ser",
      titleHighlight: "relajado y accesible",
      subtitle: "Diseñado para personas que quieren aprender sin la presión de los métodos tradicionales",
      benefits: [
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
      ],
    },
    en: {
      badge: "Why iLingue Relax?",
      title: "Learning languages should be",
      titleHighlight: "relaxed and accessible",
      subtitle: "Designed for people who want to learn without the pressure of traditional methods",
      benefits: [
        {
          icon: Sparkles,
          title: "Stress-Free",
          description: "Relaxed methodology that respects your pace, without pressure or stressful exams",
          highlight: true,
        },
        {
          icon: Heart,
          title: "Clear & Friendly",
          description: "Simple and direct explanations, without complicated terms that confuse",
          highlight: false,
        },
        {
          icon: Globe,
          title: "Learn Languages",
          description: "Focused on what you really need to communicate with confidence",
          highlight: false,
        },
        {
          icon: Coffee,
          title: "At Your Pace",
          description: "Study whenever you want, wherever you want. No fixed schedules or commitments",
          highlight: false,
        },
      ],
    },
    fr: {
      badge: "Pourquoi iLingue Relax?",
      title: "Apprendre les langues devrait être",
      titleHighlight: "détendu et accessible",
      subtitle: "Conçu pour les personnes qui veulent apprendre sans la pression des méthodes traditionnelles",
      benefits: [
        {
          icon: Sparkles,
          title: "Sans Stress",
          description: "Méthodologie détendue qui respecte votre rythme, sans pression ni examens stressants",
          highlight: true,
        },
        {
          icon: Heart,
          title: "Clair et Amical",
          description: "Explications simples et directes, sans termes compliqués qui confondent",
          highlight: false,
        },
        {
          icon: Globe,
          title: "Apprenez les Langues",
          description: "Axé sur ce dont vous avez vraiment besoin pour communiquer avec confiance",
          highlight: false,
        },
        {
          icon: Coffee,
          title: "À Votre Rythme",
          description: "Étudiez quand vous voulez, où vous voulez. Sans horaires fixes ni engagements",
          highlight: false,
        },
      ],
    },
    pt: {
      badge: "Por que iLingue Relax?",
      title: "Aprender idiomas deveria ser",
      titleHighlight: "relaxado e acessível",
      subtitle: "Projetado para pessoas que querem aprender sem a pressão dos métodos tradicionais",
      benefits: [
        {
          icon: Sparkles,
          title: "Sem Estresse",
          description: "Metodologia relaxada que respeita seu ritmo, sem pressão ou provas estressantes",
          highlight: true,
        },
        {
          icon: Heart,
          title: "Claro e Amigável",
          description: "Explicações simples e diretas, sem termos complicados que confundem",
          highlight: false,
        },
        {
          icon: Globe,
          title: "Aprenda Idiomas",
          description: "Focado no que você realmente precisa para se comunicar com confiança",
          highlight: false,
        },
        {
          icon: Coffee,
          title: "No Seu Ritmo",
          description: "Estude quando quiser, onde quiser. Sem horários fixos ou compromissos",
          highlight: false,
        },
      ],
    },
  };

  const c = content[language];

  return (
    <section id="beneficios" className="py-20 md:py-28 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2" />
      
      <div className="container px-4 md:px-6 relative">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            {c.badge}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {c.title}
            <br />
            <span className="text-gradient">{c.titleHighlight}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {c.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {c.benefits.map((benefit, index) => (
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
