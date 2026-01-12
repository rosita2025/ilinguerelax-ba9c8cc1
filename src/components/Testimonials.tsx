import { Star, Quote } from "lucide-react";
interface Testimonial {
  name: string;
  location: string;
  rating: number;
  text: string;
  product?: string;
}
const testimonials: Testimonial[] = [{
  name: "María García",
  location: "México",
  rating: 5,
  text: "¡Increíble! Por fin entiendo cómo pronunciar correctamente. La fonética adaptada para hispanohablantes hace toda la diferencia. Llevaba años intentando aprender inglés y este método es el único que realmente funcionó.",
  product: "8,000 palabras"
}, {
  name: "Carlos Rodríguez",
  location: "Colombia",
  rating: 5,
  text: "El mejor recurso que he encontrado. Sin estrés, sin complicaciones, solo aprender paso a paso. En 3 meses ya puedo mantener conversaciones básicas en inglés.",
  product: "8,000 palabras"
}, {
  name: "Ana Martínez",
  location: "España",
  rating: 5,
  text: "Las 5,000 palabras organizadas por temas me ayudaron a enfocarme en lo que realmente necesitaba. La pronunciación en español es genial para nosotros los hispanohablantes.",
  product: "5,000 palabras"
}, {
  name: "Luis Hernández",
  location: "Argentina",
  rating: 5,
  text: "Compré el de 5,000 palabras y me encantó tanto que luego adquirí el de 8,000. La calidad es impresionante y los bonus valen mucho más de lo que pagué.",
  product: "5,000 palabras"
}, {
  name: "Patricia López",
  location: "Perú",
  rating: 5,
  text: "Después de probar muchos métodos caros, encontré este libro y fue la mejor decisión. Simple, efectivo y sin el estrés de los métodos tradicionales. ¡100% recomendado!",
  product: "8,000 palabras"
}, {
  name: "Roberto Sánchez",
  location: "Chile",
  rating: 5,
  text: "La fonética UK/USA incluida es un plus enorme. Ahora puedo elegir qué acento quiero practicar. El material está muy bien organizado.",
  product: "5,000 palabras"
}];
interface TestimonialsProps {
  variant?: "light" | "dark";
  showCount?: number;
}
export const Testimonials = ({
  variant = "light",
  showCount = 6
}: TestimonialsProps) => {
  const displayTestimonials = testimonials.slice(0, showCount);
  return;
};