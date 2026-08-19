import { Star, BadgeCheck } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

// Assets
import review1 from "@/assets/review-spanish-1.webp";
import review2 from "@/assets/review-spanish-2.webp";
import review3 from "@/assets/review-spanish-3.webp";
import review4 from "@/assets/review-spanish-4.webp";
import reviewFb1 from "@/assets/review-fb-1.webp";
import reviewFb2 from "@/assets/review-fb-2.webp";
import reviewBook1 from "@/assets/review-book-real-1.webp";
import reviewBook2 from "@/assets/review-book-real-2.webp";

interface Review {
  id: number;
  image: string;
  name: string;
  comment: string;
  rating: number;
}

export const CustomerReviewsSlider = () => {
  const { language } = useI18n();

  const reviews: Review[] = [
    {
      id: 1,
      image: reviewBook1,
      name: "Michael R.",
      comment: language === "es" ? "¡El libro físico es increíble! La pronunciación escrita ayuda muchísimo." : "The physical book is amazing! The written pronunciation helps so much.",
      rating: 5,
    },
    {
      id: 2,
      image: reviewFb1,
      name: "Sarah J.",
      comment: language === "es" ? "Por fin entiendo cómo pronunciar las palabras correctamente. Muy recomendado." : "Finally I understand how to pronounce words correctly. Highly recommended.",
      rating: 5,
    },
    {
      id: 3,
      image: reviewBook2,
      name: "David W.",
      comment: language === "es" ? "Envío rápido y el material es de gran calidad. Vale cada centavo." : "Fast shipping and high quality material. Worth every penny.",
      rating: 5,
    },
    {
      id: 4,
      image: reviewFb2,
      name: "Emma L.",
      comment: language === "es" ? "El PDF gratuito es genial para estudiar en el tren mientras espero mi libro." : "The free PDF is great for studying on the train while waiting for my book.",
      rating: 5,
    },
    {
      id: 5,
      image: review1,
      name: "James T.",
      comment: language === "es" ? "Excelente método. Muy relajado y efectivo para aprender vocabulario." : "Excellent method. Very relaxed and effective for learning vocabulary.",
      rating: 5,
    },
    {
      id: 6,
      image: review2,
      name: "Linda K.",
      comment: language === "es" ? "Me encanta el diseño y lo fácil que es de seguir." : "I love the design and how easy it is to follow.",
      rating: 5,
    },
  ];

  const title = language === "es" ? "Reseñas reales y capturas de estudiantes" : "Real Student Reviews & Screenshots";
  const verifiedLabel = language === "es" ? "Comprador Verificado" : "Verified Buyer";

  return (
    <section className="w-full max-w-full overflow-hidden bg-slate-50/50 py-8 md:py-12 border-y border-slate-200">
      <div className="container px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            {title}
          </h2>
          <div className="flex justify-center items-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-2 text-sm font-bold text-slate-700">4.9/5 based on 500+ reviews</span>
          </div>
        </div>

        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {reviews.map((review) => (
            <div 
              key={review.id}
              className="w-[280px] shrink-0 snap-center bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col"
            >
              {/* Image Container */}
              <div className="aspect-[4/5] w-full bg-slate-100 relative overflow-hidden group">
                <img 
                  src={review.image} 
                  alt={`Review from ${review.name}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-sm border border-slate-100">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">{verifiedLabel}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col flex-grow">
                <div className="flex gap-0.5 mb-2">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                
                <p className="text-sm text-slate-700 italic mb-3 flex-grow line-clamp-3">
                  "{review.comment}"
                </p>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                    {review.name.charAt(0)}
                  </div>
                  <span className="text-sm font-bold text-slate-900">{review.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Mobile Swipe Hint */}
        <div className="flex justify-center mt-2 md:hidden">
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`h-1 rounded-full ${i === 0 ? 'w-4 bg-slate-400' : 'w-1 bg-slate-200'}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
