import { Star, Quote } from "lucide-react";

interface Testimonial {
  name: string;
  location: string;
  rating: number;
  text: string;
  product?: string;
}

const testimonials: Testimonial[] = [];

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