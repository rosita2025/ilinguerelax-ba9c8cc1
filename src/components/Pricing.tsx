import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useI18n } from "@/i18n/I18nContext";

export const Pricing = () => {
  const { t } = useI18n();
  const features = t.pricing.priceFeatures;

  return (
    <section id="pricing" className="py-20 md:py-28 bg-secondary/30">
      <div className="container px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            💰 {t.pricing.popular}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t.pricing.title}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t.pricing.subtitle}
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="relative bg-card rounded-3xl border-2 border-primary shadow-hero p-8 md:p-10">
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1.5 rounded-full gradient-accent text-accent-foreground text-sm font-bold">
                {t.pricing.popular}
              </span>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                8,000 {t.pricing.words}
              </h3>
              <p className="text-muted-foreground">
                {t.pricing.features}
              </p>
            </div>

            {/* Price */}
            <div className="text-center mb-8">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold text-foreground">$10</span>
                <span className="text-lg text-muted-foreground line-through">$20</span>
                <span className="text-sm text-accent font-medium">USD</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{t.pricing.guarantee}</p>
            </div>

            {/* Features */}
            <ul className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link to="/products/5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa">
              <Button variant="hero" size="lg" className="w-full">
                {t.pricing.buyNow}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
