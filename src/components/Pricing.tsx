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
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t.pricing.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.pricing.subtitle}
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-card rounded-3xl border border-border shadow-card p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {t.pricing.features}
              </h3>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-4xl font-bold text-foreground">$17</span>
                <span className="text-muted-foreground line-through">$54</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Link to="/products">
              <Button variant="hero" size="xl" className="w-full">
                {t.pricing.buyNow}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};