import { Star, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import looxReview1 from "@/assets/loox-review-1.png";
import looxReview2 from "@/assets/loox-review-2.png";
import looxReview3 from "@/assets/loox-review-3.png";
import looxReview4 from "@/assets/loox-review-4.png";
import looxReview5 from "@/assets/loox-review-5.png";
import looxReview7 from "@/assets/loox-review-7.png";
import looxReview8 from "@/assets/loox-review-8.png";
import looxReview9 from "@/assets/loox-review-9.png";
import customerBook1 from "@/assets/customer-book-1.webp";
import customerBook2 from "@/assets/customer-book-2.webp";
import customerBook3 from "@/assets/customer-book-3.webp";
import customerBook4 from "@/assets/customer-book-4.webp";
import customerBook5 from "@/assets/customer-book-5.webp";
import customerBook6 from "@/assets/customer-book-6.webp";
import customerBook7 from "@/assets/customer-book-7.webp";

interface Review {
  name: string;
  flag: string;
  text: string;
  image: string;
  timeAgo: string;
  initials: string;
  product: string;
  format: "Digital" | "Físico";
  productSlug: string;
}

const reviews: Review[] = [
  {
    name: "María González",
    flag: "🇪🇸",
    text: "El libro digital de 5,000 palabras me ha cambiado la forma de aprender inglés. La pronunciación adaptada es genial.",
    image: looxReview1,
    timeAgo: "hace 2 días",
    initials: "MG",
    product: "5,000 Palabras Inglés",
    format: "Digital",
    productSlug: "5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa",
  },
  {
    name: "Jennifer Hayes",
    flag: "🇺🇸",
    text: "Just got my Spanish Relax book! The cover is beautiful and the pronunciation guide is amazing.",
    image: customerBook1,
    timeAgo: "hace 3 días",
    initials: "JH",
    product: "Spanish Relax 5,000",
    format: "Físico",
    productSlug: "5-000-spanish-words-physical-book",
  },
  {
    name: "Carlos Ramírez",
    flag: "🇲🇽",
    text: "Los 1,000 verbos en inglés son justo lo que necesitaba. Práctico y muy bien explicado.",
    image: looxReview2,
    timeAgo: "hace 5 días",
    initials: "CR",
    product: "1,000 Verbos Inglés",
    format: "Digital",
    productSlug: "1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion",
  },
  {
    name: "Robert Klein",
    flag: "🇺🇸",
    text: "Best Spanish book I've bought. The pronunciation guide is a complete game changer.",
    image: customerBook2,
    timeAgo: "hace 1 semana",
    initials: "RK",
    product: "Spanish Relax 5,000",
    format: "Físico",
    productSlug: "5-000-spanish-words-physical-book",
  },
  {
    name: "Ana Martín",
    flag: "🇪🇸",
    text: "Compré el de alemán y el francés. Los dos están súper bien hechos, descarga inmediata.",
    image: looxReview3,
    timeAgo: "hace 1 semana",
    initials: "AM",
    product: "5,000 Palabras Alemán",
    format: "Digital",
    productSlug: "5-000-palabras-en-aleman-con-pronunciacion-para-hispanohablantes",
  },
  {
    name: "Emma Roberts",
    flag: "🇺🇸",
    text: "My quiet reading corner. The Spanish Relax book feels calm and lessons just flow naturally.",
    image: looxReview5,
    timeAgo: "hace 1 día",
    initials: "ER",
    product: "Spanish Relax 5,000",
    format: "Físico",
    productSlug: "5-000-spanish-words-physical-book",
  },
  {
    name: "Luis Herrera",
    flag: "🇨🇴",
    text: "Las 500 preguntas en inglés me ayudaron a soltarme hablando. Material muy útil.",
    image: looxReview4,
    timeAgo: "hace 4 días",
    initials: "LH",
    product: "500 Preguntas Inglés",
    format: "Digital",
    productSlug: "500-preguntas-en-ingles-con-pronunciacion-para-hispanohablantes",
  },
  {
    name: "Patricia Hill",
    flag: "🇺🇸",
    text: "Perfect size to carry around. I read a few pages every morning with my coffee.",
    image: customerBook4,
    timeAgo: "hace 2 semanas",
    initials: "PH",
    product: "Spanish Relax 5,000",
    format: "Físico",
    productSlug: "5-000-spanish-words-physical-book",
  },
  {
    name: "Sofía Pereira",
    flag: "🇧🇷",
    text: "El libro de portugués 5,000 palabras es excelente. Fácil de seguir y muy completo.",
    image: looxReview7,
    timeAgo: "hace 6 días",
    initials: "SP",
    product: "5,000 Palabras Portugués",
    format: "Digital",
    productSlug: "5-000-palabras-en-portugues-con-pronunciacion-para-hispanohablantes",
  },
  {
    name: "Thomas Wright",
    flag: "🇺🇸",
    text: "Got this for my wife and ended up reading it myself. Super well organized.",
    image: customerBook3,
    timeAgo: "hace 1 semana",
    initials: "TW",
    product: "Spanish Relax 5,000",
    format: "Físico",
    productSlug: "5-000-spanish-words-physical-book",
  },
  {
    name: "Giulia Romano",
    flag: "🇮🇹",
    text: "Il libro di italiano è fatto molto bene. La pronuncia adattata è perfetta per ispanofoni.",
    image: looxReview8,
    timeAgo: "hace 2 semanas",
    initials: "GR",
    product: "5,000 Palabras Italiano",
    format: "Digital",
    productSlug: "5-000-palabras-en-italiano-con-pronunciacion-para-hispanohablantes",
  },
  {
    name: "Karen Mitchell",
    flag: "🇺🇸",
    text: "Quality print, vibrant cover, easy to follow. Finally enjoying Spanish without stress.",
    image: customerBook6,
    timeAgo: "hace 3 semanas",
    initials: "KM",
    product: "Spanish Relax 5,000",
    format: "Físico",
    productSlug: "5-000-spanish-words-physical-book",
  },
  {
    name: "Diego Fernández",
    flag: "🇦🇷",
    text: "Probé el libro gratis de 1,000 palabras y terminé comprando el de 5,000. Vale cada centavo.",
    image: looxReview9,
    timeAgo: "hace 1 mes",
    initials: "DF",
    product: "5,000 Palabras Inglés",
    format: "Digital",
    productSlug: "5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa",
  },
  {
    name: "Rachel Foster",
    flag: "🇺🇸",
    text: "Bought it for a trip to Mexico and I actually feel prepared. Thematic chapters are perfect.",
    image: customerBook5,
    timeAgo: "hace 2 semanas",
    initials: "RF",
    product: "Spanish Relax 5,000",
    format: "Físico",
    productSlug: "5-000-spanish-words-physical-book",
  },
  {
    name: "Lucía Ortiz",
    flag: "🇪🇸",
    text: "Los 3,000 verbos en español físico llegaron rapidísimo y la calidad de impresión es premium.",
    image: customerBook7,
    timeAgo: "hace 5 días",
    initials: "LO",
    product: "3,000 Verbos Español",
    format: "Físico",
    productSlug: "3-000-spanish-verbs-mastery-physical-book-preorder",
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
              4.9 · Reseñas verificadas de todos nuestros productos
            </span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Lo que dicen nuestros clientes
          </h2>
          <p className="mt-2 text-sm md:text-base text-gray-500">
            Reseñas reales de lectores de nuestros libros digitales y físicos en todos los idiomas.
          </p>
        </div>

        {/* Mobile: horizontal snap scroll */}
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

        {/* Tablet & Desktop: grid */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
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
    <Link
      to={`/products/${review.productSlug}`}
      aria-label={`Ver ${review.product} — reseña de ${review.name}`}
      className={`group flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
        <img
          src={review.image}
          alt={`Reseña verificada de ${review.name} sobre ${review.product}`}
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
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

        <div className="text-[11px] font-semibold text-primary mb-2 truncate group-hover:underline">
          {review.product} →
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
    </Link>
  );
};

export default AllProductsReviews;