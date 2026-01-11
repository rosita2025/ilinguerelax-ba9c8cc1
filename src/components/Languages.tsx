import { Check, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import product5000 from "@/assets/product-5000.png";
import product8000 from "@/assets/product-8000.png";

const languages = [
  { 
    name: "Inglés", 
    flag: "🇬🇧", 
    available: true, 
    link: "/productos",
    image: product5000,
    description: "5,000 y 8,000 palabras"
  },
  { 
    name: "Español", 
    flag: "🇪🇸", 
    available: true, 
    link: "/productos",
    image: product8000,
    description: "Aprende español fácil"
  },
  { 
    name: "Italiano", 
    flag: "🇮🇹", 
    available: true, 
    link: "/productos",
    image: product5000,
    description: "Italiano sin estrés"
  },
  { 
    name: "Portugués", 
    flag: "🇧🇷", 
    available: true, 
    link: "/productos",
    image: product8000,
    description: "Portugués brasileño"
  },
];

const comingSoon = [
  { name: "Francés", flag: "🇫🇷" },
  { name: "Alemán", flag: "🇩🇪" },
];

export const Languages = () => {
  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Nuestros Idiomas
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Aprende el idioma que <span className="text-gradient">quieras</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Cursos diseñados con el método iLingue Relax para cada idioma
          </p>
        </div>

        {/* Available Languages */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto mb-10">
          {languages.map((lang) => (
            <Link
              key={lang.name}
              to={lang.link}
              className="group relative bg-card rounded-2xl overflow-hidden border border-border shadow-card hover:shadow-hero transition-all duration-300 hover:-translate-y-2"
            >
              {/* Product Image */}
              <div className="aspect-square bg-gradient-to-br from-primary/5 to-accent/5 p-4 flex items-center justify-center">
                <img 
                  src={lang.image} 
                  alt={`Curso de ${lang.name}`}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              {/* Info */}
              <div className="p-4 text-center border-t border-border/50">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-2xl">{lang.flag}</span>
                  <h3 className="text-lg font-semibold text-foreground">{lang.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{lang.description}</p>
              </div>

              {/* Available Badge */}
              <div className="absolute top-3 right-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-500" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Coming Soon */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
            <Clock className="w-4 h-4" />
            <span>Próximamente</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {comingSoon.map((lang) => (
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
