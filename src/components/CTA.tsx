import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nContext";

export const CTA = () => {
  const { t } = useI18n();

  return (
    <section className="py-20 md:py-28 gradient-hero">
      <div className="container px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            {t.cta.title}
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8">
            {t.cta.subtitle}
          </p>
          <Button 
            variant="hero" 
            size="xl" 
            className="bg-white text-primary hover:bg-white/90"
            onClick={() => window.location.href = "/products"}
          >
            {t.cta.button}
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};
