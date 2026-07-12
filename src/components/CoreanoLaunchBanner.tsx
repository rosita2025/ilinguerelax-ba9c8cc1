import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import coverAsset from "@/assets/coreano-100-mapas-cover.webp.asset.json";
import { useCardPrice } from "@/hooks/useCardPrice";

const COREANO_SKU = "100-mapas-mentales-para-aprender-coreano-hangul-c1";

export const CoreanoLaunchBanner = () => {
  const cardPrice = useCardPrice();
  return (
    <section className="py-10 md:py-14 bg-gradient-to-br from-primary/5 via-background to-accent/10">
      <div className="container mx-auto px-4">
        <Link
          to="/products/100-mapas-mentales-para-aprender-coreano-hangul-c1"
          className="group block rounded-2xl border border-primary/20 bg-card shadow-lg hover:shadow-xl transition-all overflow-hidden"
        >
          <div className="grid md:grid-cols-2 gap-0 items-center">
            <div className="relative aspect-[4/3] md:aspect-auto md:h-full overflow-hidden bg-muted">
              <img
                src={coverAsset.url}
                alt="Coreano Sin Complicaciones · 100 Mapas Mentales"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs font-bold shadow">
                <Sparkles className="w-3 h-3" /> NUEVO LANZAMIENTO
              </span>
            </div>

            <div className="p-6 md:p-8 space-y-3">
              <p className="text-sm font-semibold text-primary">🇰🇷 Coreano Sin Complicaciones</p>
              <h2 className="text-2xl md:text-3xl font-bold text-balance">
                Aprende coreano con <span className="text-gradient">+100 Mapas Mentales</span>
              </h2>
              <p className="text-muted-foreground text-pretty">
                Método visual y natural conectado con k-dramas, K-pop y cultura coreana. Desde cero (A1) hasta nivel avanzado.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <span className="text-3xl font-bold text-primary">$10</span>
                <span className="text-sm text-muted-foreground">USD · pago único</span>
              </div>
              <div className="inline-flex items-center gap-2 text-primary font-semibold pt-2 group-hover:gap-3 transition-all">
                Ver el producto <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
};
