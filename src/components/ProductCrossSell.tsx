import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Star, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useCardPrice } from "@/hooks/useCardPrice";

// Product images
const product8000Image = "/images/product-8000.webp";
const product5000Image = "/images/product-5000.webp";

interface ProductCrossSellProps {
  currentProduct: "5000" | "8000";
  lang?: "es" | "en";
}

const products = {
  "5000": {
    image: product5000Image,
    title: "5,000 Palabras en Inglés",
    subtitle: "con Pronunciación Español",
    sku: "5000",
    priceUsd: 10,
    originalPrice: "$54",
    discount: "81%",
    url: "/products/5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa",
    rating: 4.8,
    reviews: 800,
  },
  "8000": {
    image: product8000Image,
    title: "8,000 Palabras en Inglés",
    subtitle: "con Pronunciación Español",
    sku: "8000",
    priceUsd: 20,
    originalPrice: "$54",
    discount: "63%",
    url: "/products/8-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa",
    rating: 4.9,
    reviews: 892,
  },
};

export const ProductCrossSell = ({ currentProduct, lang = "es" }: ProductCrossSellProps) => {
  const otherProduct = currentProduct === "5000" ? "8000" : "5000";
  const product = products[otherProduct];
  const cardPrice = useCardPrice();

  const text = lang === "en" ? {
    heading: "Would you like another option?",
    subheading: "Discover our complete collection",
    viewNow: "View Now",
    save: "SAVE",
  } : {
    heading: "¿Te gustaría otra opción?",
    subheading: "Descubre nuestra colección completa",
    viewNow: "Ver Ahora",
    save: "AHORRA",
  };

  return (
    <section className="py-12 md:py-16 bg-secondary/30">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4"
          >
            <Sparkles className="w-4 h-4" />
            {lang === "en" ? "MORE OPTIONS" : "MÁS OPCIONES"}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-3xl font-bold text-foreground mb-2"
          >
            {text.heading}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground"
          >
            {text.subheading}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="max-w-md mx-auto"
        >
          <Card className="overflow-hidden border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-0">
              {/* Product Image */}
              <div className="relative bg-gradient-to-br from-secondary/50 to-background p-6">
                {/* Discount Badge */}
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold shadow-lg">
                  {text.save} {product.discount}
                </div>
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-48 h-48 md:w-56 md:h-56 object-contain mx-auto"
                />
              </div>

              {/* Product Info */}
              <div className="p-6">
                {/* Category */}
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-primary uppercase">
                    {lang === "en" ? "Digital Book" : "Libro Digital"}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-foreground mb-1">
                  {product.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {product.subtitle}
                </p>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {product.rating}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({product.reviews}+ {lang === "en" ? "reviews" : "reseñas"})
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-4">
                  {!cardPrice.ready ? (
                    <Skeleton className="h-10 w-32" />
                  ) : (
                    <>
                      <span className="text-3xl font-black text-foreground">
                        {cardPrice.format(product.sku, product.priceUsd)}
                      </span>
                      <span className="text-lg text-muted-foreground line-through opacity-70">
                        {cardPrice.formatOriginal(product.sku, product.priceUsd * 2.5)}
                      </span>
                      <span className="text-sm text-primary font-semibold">{cardPrice.currencyLabel(product.sku)}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">{cardPrice.regionLabel}</span>
                    </>
                  )}
                </div>

                {/* CTA Button */}
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={() => window.location.href = product.url}
                >
                  {text.viewNow}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};
