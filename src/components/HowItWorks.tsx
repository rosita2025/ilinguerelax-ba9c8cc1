import { useI18n } from "@/i18n/I18nContext";

export const HowItWorks = () => {
  const { t } = useI18n();
  const steps = t.howItWorks.steps;

  return (
    <section className="py-20 md:py-28 bg-secondary/30">
      <div className="container px-4 md:px-6">
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
