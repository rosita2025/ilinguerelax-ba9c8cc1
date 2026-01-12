import { Clock, Star, Sparkles, ShoppingCart, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import product5000 from "@/assets/product-5000.png";
import product8000 from "@/assets/product-8000.png";
import productSpanish5000 from "@/assets/product-spanish-5000.png";
import product8000Book from "@/assets/product-8000-book.png";
const products = [{
  id: "5000",
  name: "5,000 Palabras",
  flag: "🇬🇧",
  country: "Inglés UK / USA",
  link: "/products/5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa",
  image: product5000,
  title: "Inglés Relax - 5,000 Palabras",
  description: "Vocabulario esencial con pronunciación",
  rating: 4.8,
  reviews: 1247,
  price: 17.00,
  originalPrice: 54.00,
  discount: 67,
  badge: "Más Vendido"
}, {
  id: "8000",
  name: "8,000 Palabras",
  flag: "🇬🇧",
  country: "Inglés UK / USA",
  link: "/products/8-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa",
  image: product8000,
  title: "Inglés Relax - 8,000 Palabras",
  description: "Vocabulario completo + gramática",
  rating: 4.9,
  reviews: 892,
  price: 24.00,
  originalPrice: 76.00,
  discount: 70,
  badge: "Premium"
}, {
  id: "8000-book",
  name: "8,000 Palabras Libro",
  flag: "🇬🇧",
  country: "Inglés UK / USA",
  link: "/products/8-000-palabras-libro-fisico",
  image: product8000Book,
  title: "Inglés Relax - 8,000 Palabras",
  description: "Libro físico tapa blanda premium",
  rating: 4.9,
  reviews: 800,
  price: 32.99,
  originalPrice: null,
  discount: null,
  badge: "📖 Libro Físico"
}, {
  id: "spanish-5000",
  name: "5,000 Palabras Español",
  flag: "🇪🇸",
  country: "Español para Angloparlantes",
  link: "/products/5-000-palabras-en-espanol-con-pronunciacion-inglesa",
  image: productSpanish5000,
  title: "Spanish Relax - 5,000 Palabras",
  description: "Español con pronunciación inglesa",
  rating: 4.8,
  reviews: 500,
  price: 17.00,
  originalPrice: 54.00,
  discount: 67,
  badge: "🆕 Nuevo"
}];
const comingSoon = [{
  name: "Italiano",
  flag: "🇮🇹"
}, {
  name: "Portugués",
  flag: "🇧🇷"
}, {
  name: "Francés",
  flag: "🇫🇷"
}, {
  name: "Alemán",
  flag: "🇩🇪"
}];
export const Languages = () => {
  const renderStars = (rating: number) => {
    return Array.from({
      length: 5
    }, (_, i) => <Star key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : i < rating ? "text-yellow-400 fill-yellow-400/50" : "text-gray-300"}`} />);
  };
  return <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Nuestros Productos
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Elige tu libro digital de <span className="text-gradient">Idioma</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Libros digitales diseñados con el método iLingue Relax para aprender sin estrés
          </p>
        </div>

        {/* Products */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          {products.map(product => <div key={product.id} className="group relative bg-card rounded-2xl overflow-hidden border border-border shadow-card hover:shadow-hero transition-all duration-300 hover:-translate-y-2">
              {/* Discount Badge */}
              {product.discount && <div className="absolute top-3 left-3 z-10">
                  <div className="px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    -{product.discount}% OFF
                  </div>
                </div>}

              {/* Product Badge */}
              <div className="absolute top-3 right-3 z-10">
                <div className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  {product.badge}
                </div>
              </div>

              {/* Product Image - Clickable */}
              <Link to={product.link}>
                <div className="aspect-[4/3] bg-gradient-to-br from-primary/5 to-accent/5 p-6 flex items-center justify-center cursor-pointer">
                  <img src={product.image} alt={product.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
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
                <Link to={product.link}>
                  <h3 className="text-xl font-bold text-foreground mb-1 hover:text-primary transition-colors">{product.title}</h3>
                </Link>
                <p className="text-sm text-muted-foreground mb-3">{product.description}</p>

                {/* Reviews */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-0.5">
                    {renderStars(product.rating)}
                  </div>
                  <span className="text-sm font-medium text-foreground">{product.rating}</span>
                  <span className="text-sm text-muted-foreground">({product.reviews.toLocaleString()} reseñas)</span>
                </div>

                {/* Pricing & Buy Button */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">${product.price}</span>
                    {product.originalPrice && <span className="text-sm text-muted-foreground line-through">${product.originalPrice}</span>}
                  </div>
                  <Button size="sm" className="gap-2" onClick={() => window.open(product.link, '_self')}>
                    <ShoppingCart className="w-4 h-4" />
                    Comprar
                  </Button>
                </div>
              </div>
            </div>)}
        </div>

        {/* Coming Soon Languages */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
            <Clock className="w-4 h-4" />
            <span>Próximamente más idiomas</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {comingSoon.map(lang => <div key={lang.name} className="flex items-center gap-3 px-5 py-3 rounded-xl bg-muted/50 border border-border/50">
                <span className="text-2xl">{lang.flag}</span>
                <span className="text-muted-foreground font-medium">{lang.name}</span>
              </div>)}
          </div>
        </div>
      </div>
    </section>;
};