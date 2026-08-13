import { ExternalLink, Book } from "lucide-react";
import logoAmazon from "@/assets/logo-amazon.png";
import logoEtsy from "@/assets/logo-etsy.png";
import logoHotmart from "@/assets/logo-hotmart.svg";
import logoKindle from "@/assets/logo-kindle.png";
import logoShopify from "@/assets/logo-shopify.png";

const storeLinks = [
  // Digitales disponibles
  {
    name: "Amazon Kindle",
    logo: logoKindle,
    url: "https://www.amazon.com/vocabulario-pronunciaci%C3%B3n-hispano-hablantes-espa%C3%B1ol-ebook/dp/B0FMPNWH14",
    available: true,
    price: "$6.99",
    priceNote: "impuestos incluidos",
    type: "📖 Libro Digital",
  },
  {
    name: "Etsy",
    logo: logoEtsy,
    url: "https://www.etsy.com/listing/4349268621/5000-english-words-with-spanish",
    available: true,
    price: "$12.00",
    priceNote: "impuestos incluidos",
    type: "📖 Libro Digital",
  },
  {
    name: "Hotmart",
    logo: logoHotmart,
    url: "https://hotmart.com/es/marketplace/productos/10-categorias-de-ingles-con-pronunciacion-hispanohablantes-espanol-1000-palabras/O100578526P",
    available: true,
    price: "$17",
    priceNote: "",
    type: "📖 Libro Digital",
  },
  // Libro físico próximamente
  {
    name: "Amazon",
    logo: logoAmazon,
    url: "https://www.amazon.com/Ingles-Relax-palabras-pronunciación-fonética/dp/B0GDTV8GWR?ref_=ast_author_dp",
    available: true,
    price: "$24.00",
    priceNote: "",
    type: "📚 Libro Físico",
  },
  {
    name: "Shopify",
    logo: logoShopify,
    url: "https://inglesrelax.shop/products/ingles-relax-5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-usa-copy",
    available: true,
    price: "$24.00",
    priceNote: "",
    type: "📚 Libro Físico",
  },
];

export const OnlineStore = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            🛒 Tienda Online
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Disponible en las Mejores Plataformas
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Elige tu plataforma favorita y comienza tu viaje hacia el dominio del inglés
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {storeLinks.map((store, index) => (
            <a
              key={index}
              href={store.available ? store.url : undefined}
              target={store.available ? "_blank" : undefined}
              rel={store.available ? "noopener noreferrer" : undefined}
              className={`group relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all duration-300 ${
                store.available
                  ? "bg-background border-border hover:border-primary hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                  : "bg-muted/50 border-dashed border-muted-foreground/30 cursor-default"
              }`}
            >
              <img
                src={store.logo}
                alt={store.name}
                className={`h-10 md:h-12 w-auto object-contain mb-4 ${
                  store.available ? "opacity-80 group-hover:opacity-100" : "opacity-50 grayscale"
                } transition-all duration-300`}
              />
              
              <span className={`font-semibold text-lg ${
                store.available ? "text-foreground" : "text-muted-foreground"
              }`}>
                {store.name}
              </span>

              {store.available && store.type && (
                <span className="text-xs text-muted-foreground mt-1">{store.type}</span>
              )}

              {store.available && store.price && (
                <div className="mt-2 text-center">
                  <span className="text-2xl font-bold text-primary">{store.price}</span>
                  {store.priceNote && (
                    <span className="block text-xs text-muted-foreground">{store.priceNote}</span>
                  )}
                </div>
              )}

              {store.available && (
                <span className="flex items-center gap-1 mt-3 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Comprar ahora <ExternalLink className="w-3 h-3" />
                </span>
              )}

              {store.available && (
                <div className="absolute top-3 right-3">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
