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

export const Testimonials = ({ variant = "light", showCount = 6 }: TestimonialsProps) => {
  const displayTestimonials = testimonials.slice(0, showCount);
  
  return (
    <section className={`py-20 md:py-28 ${variant === "dark" ? "bg-secondary/30" : ""}`}>
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            <Star className="w-4 h-4 fill-current" />
            <span>TESTIMONIOS VERIFICADOS</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Lo que dicen nuestros{" "}
            <span className="text-gradient">estudiantes</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Miles de hispanohablantes ya están aprendiendo inglés con nuestro método
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {displayTestimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl border border-border shadow-card p-6 hover:shadow-hero transition-all duration-500 relative"
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20" />
              
              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>

              {/* Text */}
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {testimonial.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.location}
                    {testimonial.product && (
                      <span className="ml-2 text-primary">• {testimonial.product}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-bold text-foreground mb-2">10,000+</div>
            <p className="text-sm text-muted-foreground">Estudiantes activos</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-foreground mb-2">4.9/5</div>
            <p className="text-sm text-muted-foreground">Calificación promedio</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-foreground mb-2">20+</div>
            <p className="text-sm text-muted-foreground">Países alcanzados</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-foreground mb-2">98%</div>
            <p className="text-sm text-muted-foreground">Satisfacción</p>
          </div>
        </div>
      </div>
    </section>
  );
};
