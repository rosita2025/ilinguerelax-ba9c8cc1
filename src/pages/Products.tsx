import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, BookOpen } from "lucide-react";

const products = [
  {
    id: "8000-palabras",
    title: "Inglés Relax - 8,000 Palabras",
    subtitle: "Libro Digital Completo",
    description: "Domina 8,000 palabras en inglés con pronunciación en español para hispanohablantes",
    price: 27,
    originalPrice: 197,
    rating: 4.9,
    reviews: 800,
    badge: "MÁS VENDIDO",
    features: ["8,000 palabras", "Pronunciación español", "Fonética UK/USA"],
  },
  {
    id: "5000-palabras",
    title: "Inglés Relax - 5,000 Palabras",
    subtitle: "Nivel Básico a Intermedio",
    description: "5,000 palabras más utilizadas con pronunciación español y fonética UK/USA",
    price: 17,
    originalPrice: 100,
    rating: 4.8,
    reviews: 800,
    badge: "OFERTA 86%",
    features: ["5,000 palabras", "4 Bonus gratis", "Acceso de por vida"],
  },
];

const Products = () => {
  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Productos - Libros Digitales de Inglés"
        description="Explora nuestra colección de libros digitales para aprender inglés. 5,000 y 8,000 palabras con pronunciación para hispanohablantes. Descarga inmediata."
        canonicalUrl="https://ilinguerelax.com/productos"
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
              Elige el libro digital perfecto para tu nivel y comienza a aprender inglés sin estrés
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
                <div className="relative h-48 gradient-hero flex items-center justify-center">
                  <div className="flex items-center gap-4">
                    <BookOpen className="w-16 h-16 text-primary-foreground/80" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8">
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
                  <div className="flex flex-wrap gap-2 mb-6">
                    {product.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-3xl font-bold text-foreground">
                      ${product.price}
                    </span>
                    <span className="text-lg text-muted-foreground line-through">
                      ${product.originalPrice}
                    </span>
                    <span className="text-sm text-accent font-medium">USD</span>
                  </div>

                  {/* CTA */}
                  <Link to={`/productos/${product.id}`}>
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
    </main>
  );
};

export default Products;
