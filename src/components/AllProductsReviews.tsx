import { Star, BadgeCheck } from "lucide-react";
import customerBook2 from "@/assets/customer-book-2.webp";
import inglesDigitalWhatsapp from "@/assets/review-ingles-digital-whatsapp.webp";
import inglesFisico8000 from "@/assets/review-ingles-fisico-8000.jpg";
import spanishDigitalPages from "@/assets/review-spanish-digital-pages.jpg";

interface Review {
  name: string;
  flag: string;
  text: string;
  image: string;
  timeAgo: string;
  initials: string;
  product: string;
  format: "Digital" | "Físico";
}

const reviews: Review[] = [
  {
    name: "María González",
    flag: "🇪🇸",
    text: "Recibí mi Inglés Relax digital de 5,000 palabras al instante por WhatsApp con los 4 bonus gratis. Atención súper rápida.",
    image: inglesDigitalWhatsapp,
    timeAgo: "hace 2 días",
    initials: "MG",
    product: "Inglés Relax · 5,000 Palabras",
    format: "Digital",
  },
  {
    name: "Carlos Méndez",
    flag: "🇲🇽",
    text: "El libro físico de Inglés Relax 8,000 palabras tiene calidad premium. La fonética UK/USA y la traducción español-inglés son clarísimas.",
    image: inglesFisico8000,
    timeAgo: "hace 5 días",
    initials: "CM",
    product: "Inglés Relax · Libro Físico 8,000",
    format: "Físico",
  },
  {
    name: "Emma Roberts",
    flag: "🇺🇸",
    text: "Spanish Relax digital is perfectly organized. The vocabulary tables with English pronunciation are exactly what I needed.",
    image: spanishDigitalPages,
    timeAgo: "hace 3 días",
    initials: "ER",
    product: "Spanish Relax · 5,000 Words",
    format: "Digital",
  },
  {
    name: "Robert Klein",
    flag: "🇺🇸",
    text: "Best Spanish learning book I've bought. The pronunciation guide is a complete game changer. Even my dog approves!",
    image: customerBook2,
    timeAgo: "hace 1 semana",
    initials: "RK",
    product: "Spanish Relax · Libro Físico",
    format: "Físico",
  },
];

export const AllProductsReviews = () => {
  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-white to-gray-50/50">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-8 md:mb-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 md:w-5 md:h-5 fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-2 text-xs md:text-sm font-semibold text-gray-700">
              4.9 · Reseñas verificadas
            </span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Lo que dicen nuestros clientes
          </h2>
          <p className="mt-2 text-sm md:text-base text-gray-500">
            Inglés Relax y Spanish Relax — en formato digital y físico.
          </p>
        </div>

        {/* Mobile: snap scroll */}
        <div className="sm:hidden relative">
          <div className="-mx-4 px-4 overflow-x-auto snap-x snap-mandatory flex gap-3 pb-4 scrollbar-hide">
            {reviews.map((r, i) => (
              <ReviewCard
                key={i}
                review={r}
                className="snap-start shrink-0 w-[78vw] max-w-[300px]"
              />
            ))}
            <div className="shrink-0 w-1" aria-hidden />
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-50/80 to-transparent" />
        </div>

        {/* Tablet & Desktop: 4-column grid */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
          {reviews.map((r, i) => (
            <ReviewCard key={i} review={r} />
          ))}
        </div>
      </div>
    </section>
  );
};

const ReviewCard = ({ review, className = "" }: { review: Review; className?: string }) => {
  return (
    <div
      className={`flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-gray-300 ${className}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
        <img
          src={review.image}
          alt={`Reseña verificada de ${review.name} sobre ${review.product}`}
          className="absolute inset-0 w-full h-full object-cover object-center"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-semibold text-gray-700 shadow-sm">
          <BadgeCheck className="w-3 h-3 text-green-600" />
          Verificado
        </div>
        <div
          className={`absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-sm text-[10px] font-semibold shadow-sm ${
            review.format === "Digital"
              ? "bg-primary/90 text-primary-foreground"
              : "bg-accent/90 text-accent-foreground"
          }`}
        >
          {review.format}
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4 md:p-5">
        <div className="flex items-center gap-0.5 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
          ))}
        </div>

        <div className="text-[11px] font-semibold text-primary mb-2 truncate">
          {review.product}
        </div>

        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
            {review.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-gray-900 truncate">
                {review.name}
              </span>
              <span className="text-base leading-none">{review.flag}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
              <BadgeCheck className="w-3 h-3 text-green-600" />
              <span className="truncate">Comprador verificado · {review.timeAgo}</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
          {review.text}
        </p>
      </div>
    </div>
  );
};

export default AllProductsReviews;
