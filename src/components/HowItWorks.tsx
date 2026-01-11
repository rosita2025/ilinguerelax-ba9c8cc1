const steps = [
  {
    number: "01",
    title: "Escucha",
    description:
      "Escucha la pronunciación correcta de cada palabra con nuestro audio nativo",
  },
  {
    number: "02",
    title: "Repite",
    description:
      "Practica la pronunciación a tu propio ritmo, sin presión ni estrés",
  },
  {
    number: "03",
    title: "Domina",
    description:
      "Integra las palabras en tu vocabulario diario de forma natural",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-20 md:py-28 bg-secondary/30">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Así de <span className="text-gradient">simple</span> funciona
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Un proceso natural que respeta tu ritmo de aprendizaje
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="relative group">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-border" />
              )}

              <div className="relative bg-card rounded-2xl p-8 text-center border border-border shadow-card hover:shadow-hero transition-all duration-500">
                {/* Step Number */}
                <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-6 text-primary-foreground font-bold text-xl group-hover:scale-110 transition-transform duration-300">
                  {step.number}
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
