import { Clock, Star, Sparkles, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { products, comingSoonLanguages, getProductLink } from "@/data/products";
import { useI18n } from "@/i18n/I18nContext";

export const Languages = () => {
  const { t, language, formatPrice } = useI18n();

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-yellow-400"
            : i < rating
            ? "text-yellow-400 fill-yellow-400/50"
            : "text-gray-300"
        }`}
      />
    ));
  };

  // Language-specific content
  const content = {
    es: {
      badge: "Nuestros Productos",
      title: "Elige tu libro digital de",
      titleHighlight: "Idioma",
      subtitle: "Libros digitales diseñados con el método iLingue Relax para aprender sin estrés",
      reviews: "reseñas",
      buy: "Comprar",
      comingSoon: "Próximamente más idiomas",
    },
    en: {
      badge: "Our Products",
      title: "Choose your digital book for",
      titleHighlight: "Language",
      subtitle: "Digital books designed with the iLingue Relax method to learn stress-free",
      reviews: "reviews",
      buy: "Buy",
      comingSoon: "More languages coming soon",
    },
    fr: {
      badge: "Nos Produits",
      title: "Choisissez votre livre numérique de",
      titleHighlight: "Langue",
      subtitle: "Livres numériques conçus avec la méthode iLingue Relax pour apprendre sans stress",
      reviews: "avis",
      buy: "Acheter",
      comingSoon: "Plus de langues bientôt",
    },
    pt: {
      badge: "Nossos Produtos",
      title: "Escolha seu livro digital de",
      titleHighlight: "Idioma",
      subtitle: "Livros digitais projetados com o método iLingue Relax para aprender sem estresse",
      reviews: "avaliações",
      buy: "Comprar",
      comingSoon: "Mais idiomas em breve",
    },
  };

  const c = content[language];

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            {c.badge}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {c.title} <span className="text-gradient">{c.titleHighlight}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {c.subtitle}
          </p>
        </div>

        {/* Products */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
          {products.map((product) => (
            <div
              key={product.id}
              className="group relative bg-card rounded-2xl overflow-hidden border border-border shadow-card hover:shadow-hero transition-all duration-300 hover:-translate-y-2"
            >
              {/* Discount Badge */}
              {product.discount && (
                <div className="absolute top-3 left-3 z-10">
                  <div className="px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    -{product.discount}% OFF
                  </div>
                </div>
              )}

              {/* Product Badge */}
              <div className="absolute top-3 right-3 z-10">
                <div className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  {product.badge}
                </div>
              </div>

              {/* Product Image - Clickable */}
              <Link to={getProductLink(product)}>
                <div className="aspect-[4/3] bg-gradient-to-br from-primary/5 to-accent/5 p-6 flex items-center justify-center cursor-pointer">
                  <img
                    src={product.image}
                    alt={product.title}
                    loading="lazy"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Link>

              {/* Info */}
              <div className="p-5 border-t border-border/50">
                {/* Country Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{product.flag}</span>
                  <span className="text-sm text-muted-foreground">{product.country}</span>
                </div>

                {/* Title */}
                <Link to={getProductLink(product)}>
                  <h3 className="text-xl font-bold text-foreground mb-1 hover:text-primary transition-colors">
                    {product.title}
                  </h3>
                </Link>
                <p className="text-sm text-muted-foreground mb-3">{product.description}</p>

                {/* Reviews */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-0.5">{renderStars(product.rating)}</div>
                  <span className="text-sm font-medium text-foreground">{product.rating}</span>
                  <span className="text-sm text-muted-foreground">
                    ({product.reviews.toLocaleString()} {c.reviews})
                  </span>
                </div>

                {/* Pricing & Buy Button */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">{formatPrice(product.price)}</span>
                    {product.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                  <Button size="sm" className="gap-2" asChild>
                    <Link to={getProductLink(product)}>
                      <ShoppingCart className="w-4 h-4" />
                      {c.buy}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Coming Soon Languages */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
            <Clock className="w-4 h-4" />
            <span>{c.comingSoon}</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {comingSoonLanguages.map((lang) => (
              <div
                key={lang.name}
                className="flex items-center gap-3 px-5 py-3 rounded-xl bg-muted/50 border border-border/50"
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className="text-muted-foreground font-medium">{lang.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
