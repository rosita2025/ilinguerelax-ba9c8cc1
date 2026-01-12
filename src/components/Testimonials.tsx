import { Star, Quote } from "lucide-react";

interface Testimonial {
  name: string;
  location: string;
  rating: number;
  text: string;
  product?: string;
}

const testimonials: Testimonial[] = [
  {
    name: "María García",
    location: "México",
    rating: 5,
    text: "¡Increíble! Por fin entiendo cómo pronunciar correctamente. La fonética adaptada para hispanohablantes hace toda la diferencia. Llevaba años intentando aprender inglés y este método es el único que realmente funcionó.",
    product: "8,000 palabras",
  },
  {
    name: "Carlos Rodríguez",
    location: "Colombia",
    rating: 5,
    text: "El mejor recurso que he encontrado. Sin estrés, sin complicaciones, solo aprender paso a paso. En 3 meses ya puedo mantener conversaciones básicas en inglés.",
    product: "8,000 palabras",
  },
  {
    name: "Ana Martínez",
    location: "España",
    rating: 5,
    text: "Las 5,000 palabras organizadas por temas me ayudaron a enfocarme en lo que realmente necesitaba. La pronunciación en español es genial para nosotros los hispanohablantes.",
    product: "5,000 palabras",
  },
  {
    name: "Luis Hernández",
    location: "Argentina",
    rating: 5,
    text: "Compré el de 5,000 palabras y me encantó tanto que luego adquirí el de 8,000. La calidad es impresionante y los bonus valen mucho más de lo que pagué.",
    product: "5,000 palabras",
  },
  {
    name: "Patricia López",
    location: "Perú",
    rating: 5,
    text: "Después de probar muchos métodos caros, encontré este libro y fue la mejor decisión. Simple, efectivo y sin el estrés de los métodos tradicionales. ¡100% recomendado!",
    product: "8,000 palabras",
  },
  {
    name: "Roberto Sánchez",
    location: "Chile",
    rating: 5,
    text: "La fonética UK/USA incluida es un plus enorme. Ahora puedo elegir qué acento quiero practicar. El material está muy bien organizado.",
    product: "5,000 palabras",
  },
];

interface TestimonialsProps {
  variant?: "light" | "dark";
  showCount?: number;
}

export const Testimonials = ({
  variant = "light",
  showCount = 6,
}: TestimonialsProps) => {
  const displayTestimonials = testimonials.slice(0, showCount);
  const bgClass = variant === "dark" ? "bg-foreground" : "bg-secondary/30";
  const cardBg = variant === "dark" ? "bg-card/10 border-border/20" : "bg-card border-border";
  const textColor = variant === "dark" ? "text-primary-foreground" : "text-foreground";
  const mutedColor = variant === "dark" ? "text-primary-foreground/70" : "text-muted-foreground";

  return (
    <section className={`py-20 md:py-28 ${bgClass}`}>
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16">
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-bold mb-4`}>
            <Star className="w-4 h-4 fill-current" />
            TESTIMONIOS
          </span>
          <h2 className={`text-3xl md:text-4xl font-bold ${textColor} mb-4`}>
            Lo que dicen nuestros estudiantes
          </h2>
          <p className={`text-lg ${mutedColor} max-w-2xl mx-auto`}>
            Miles de hispanohablantes ya están aprendiendo inglés sin estrés
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {displayTestimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`${cardBg} rounded-2xl border shadow-card p-6 hover:shadow-hero transition-all duration-500`}
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <Quote className={`w-8 h-8 ${mutedColor} mb-3 opacity-50`} />
              <p className={`${mutedColor} mb-4 leading-relaxed text-sm`}>
                "{testimonial.text}"
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div>
                  <p className={`font-semibold ${textColor}`}>{testimonial.name}</p>
                  <p className={`text-sm ${mutedColor}`}>{testimonial.location}</p>
                </div>
                {testimonial.product && (
                  <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {testimonial.product}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};