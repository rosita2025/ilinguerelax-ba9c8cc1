import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useI18n } from "@/i18n/I18nContext";

export const Pricing = () => {
  const { t } = useI18n();
  const features = t.pricing.priceFeatures;

  return (
    <section id="pricing" className="py-20 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
            {t.pricing.title}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t.pricing.subtitle}
          </p>
        </div>
        
        <div className="max-w-md mx-auto">
          <div className="bg-card rounded-2xl border border-border shadow-lg p-8">
            <h3 className="text-2xl font-bold mb-4">8,000 {t.pricing.words}</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">{t.pricing.viewStore}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
            <Link to="/products">
              <Button className="w-full" size="lg">
                {t.pricing.viewProducts}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
