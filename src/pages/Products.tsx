import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Gift } from "lucide-react";
import { products, getProductLink } from "@/data/products";
import { ExitIntentPopup } from "@/components/ExitIntentPopup";
import { WhatsAppButton } from "@/components/WhatsAppButton";

const Products = () => {
  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Libros Digitales de Inglés con Pronunciación - Catálogo"
        description="Libros digitales para aprender inglés: 5,000 y 8,000 palabras con pronunciación adaptada para hispanohablantes. Fonética UK/USA. Descarga inmediata desde $10."
        canonicalUrl="https://ilinguerelax.com/products"
        keywords="comprar libros inglés digital, vocabulario inglés 5000 8000 palabras, libros pronunciación inglés español, diccionario inglés fonética UK USA, aprender inglés hispanohablantes"
        productList={products.map((product) => ({
          name: product.title,
          description: product.description,
          price: product.price,
          image: `https://ilinguerelax.com${product.image}`,
          url: `https://ilinguerelax.com/products/${product.slug}`,
          rating: product.rating,
          reviewCount: product.reviews,
        }))}
      />
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 gradient-hero">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
              Nuestros Productos
            </h1>
            <p className="text-lg text-primary-foreground/90">
              Elige el libro digital perfecto para tu nivel y comienza a aprender idiomas sin estrés
            </p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20 md:py-28">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {products.map((product) => (
              <div
                key={product.id}
                className="group relative bg-card rounded-3xl border border-border shadow-card hover:shadow-hero transition-all duration-500 overflow-hidden"
              >
                {/* Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="px-3 py-1 rounded-full gradient-accent text-accent-foreground text-xs font-bold">
                    {product.badge}
                  </span>
                </div>

                {/* Product Image Area */}
                <div className="relative h-72 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-8">
                  <img
                    src={product.image}
                    alt={product.title}
                    loading="lazy"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Content */}
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{product.flag}</span>
                    <span className="text-sm text-muted-foreground">{product.country}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-accent text-accent"
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({product.reviews} reseñas)
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-foreground mb-1">
                    {product.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-3">
                    {product.subtitle}
                  </p>
                  <p className="text-muted-foreground mb-4">
                    {product.description}
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Digital Free Badge for Physical Products */}
                  {product.isPhysical && (
                    <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 border border-amber-200 dark:border-amber-800">
                      <Gift className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        🎁 Incluye versión digital GRATIS
                      </span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-3xl font-bold text-foreground">
                      ${product.price}
                    </span>
                    {product.isPhysical && (
                      <span className="text-sm text-muted-foreground">
                        (valor pack: ${product.id === "5000-book" ? "31.99" : "49.99"})
                      </span>
                    )}
                    {product.originalPrice && !product.isPhysical && (
                      <span className="text-lg text-muted-foreground line-through">
                        ${product.originalPrice}
                      </span>
                    )}
                    <span className="text-sm text-accent font-medium">USD</span>
                  </div>

                  {/* CTA */}
                  <Link to={getProductLink(product)}>
                    <Button variant="hero" size="lg" className="w-full">
                      Ver Detalles
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
      <ExitIntentPopup 
        discount="10%"
        couponCode="NEW10"
        lang="es"
        storageKey="exit_intent_products"
      />
    </main>
  );
};

export default Products;
