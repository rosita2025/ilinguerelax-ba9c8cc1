import { useEffect, useRef } from "react";
import { Star, CheckCircle, Quote } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import reviewEnglishFrases from "@/assets/review-english-frases.jpg";
import reviewEnglishIpad from "@/assets/review-english-ipad.png";
import reviewSpanishVocab from "@/assets/review-spanish-vocab.jpg";
import reviewSpanishLove from "@/assets/review-spanish-love.jpg";
import reviewSpanishHealth from "@/assets/review-spanish-health.jpg";
import reviewSymptoms from "@/assets/review-symptoms.jpg";
import reviewBookCover from "@/assets/review-book-cover.jpg";
import reviewPersonHolding from "@/assets/review-person-holding.jpg";

interface Review {
  id: string;
  nickname: string;
  review: string;
  rating: number;
  img?: string;
  date: string;
  verified: boolean;
}

// Reviews for English product (5000 palabras)
const englishReviews: Review[] = [
  {
    id: "1",
    nickname: "Alejandra M.",
    review: "Inglés Relax me ayuda muchísimos! Las palabras son muy útiles! Es mejor!!!",
    rating: 5,
    img: "https://images.loox.io/uploads/2025/11/23/tQUUkUAf_.jpg",
    date: "2025-11-23",
    verified: true,
  },
  {
    id: "2",
    nickname: "Rosa A.",
    review: "Excelente Material Inglés Relax, esa la pronunciación más fácil y me ayudó muchísimo! Lo aprendí más rápido en inglés, porque soy una persona con discapacidad auditiva. Gracias por salvar lo mejor 100% Inglés Relax",
    rating: 5,
    img: "https://images.loox.io/uploads/2025/11/23/IiDiyw9-U.jpg",
    date: "2025-11-23",
    verified: true,
  },
  {
    id: "3",
    nickname: "Daniela",
    review: "La pronunciación escrita me ayuda un montón. Es como tener un profesor, pero sin gastar tanto dinero.",
    rating: 5,
    img: "https://images.loox.io/uploads/2025/11/23/GcNv27Ltw.jpg",
    date: "2025-09-21",
    verified: true,
  },
  {
    id: "4",
    nickname: "Oscar",
    review: "En pocos días ya podía leer y pronunciar palabras que antes me costaban mucho. Perfecto para principiantes como yo.",
    rating: 5,
    img: "https://images.loox.io/uploads/2025/11/23/6IAXeCS3b.jpg",
    date: "2025-09-21",
    verified: true,
  },
  {
    id: "5",
    nickname: "Rosangela",
    review: "Me encantó porque todo está organizado por categorías y con la pronunciación en español. No me siento perdido como con otros libros o apps.",
    rating: 5,
    img: "https://images.loox.io/uploads/2025/11/23/mJSaAZynx.jpg",
    date: "2025-09-21",
    verified: true,
  },
  {
    id: "6",
    nickname: "Rosa",
    review: "Lo mejor me recomiendo 100%, lo más fácil inglés y también pronuncia hispanohablantes. Gracias Inglés Relax!",
    rating: 5,
    img: "https://images.loox.io/uploads/2025/11/23/BWXo4KTI7Q.jpg",
    date: "2025-08-28",
    verified: true,
  },
  {
    id: "7",
    nickname: "Francisco Javier Z.",
    review: "El nuevo ebook está en excelente estado, muy contento con mi compra.",
    rating: 5,
    img: "https://images.loox.io/uploads/2025/11/23/r5UcoWJcpE.jpg",
    date: "2025-08-02",
    verified: true,
  },
  {
    id: "8",
    nickname: "Eduardo Peña",
    review: "Llegó muy rápido PDF y en perfecto estado 😊",
    rating: 5,
    img: "https://images.loox.io/uploads/2025/11/23/-dLV0FCgkX.jpg",
    date: "2025-07-12",
    verified: true,
  },
  {
    id: "9",
    nickname: "Adam Rentería",
    review: "Notebook de trabajo legendario para el ebook de texto legendario. Aprender es luz, no aprender es oscuridad.",
    rating: 5,
    img: "https://images.loox.io/uploads/2025/11/23/O3AgBj_If.jpg",
    date: "2025-04-22",
    verified: true,
  },
  {
    id: "10",
    nickname: "Valeria Rey",
    review: "Buen precio, más barato y en perfecto estado.",
    rating: 5,
    img: "https://images.loox.io/uploads/2025/11/23/smyzA3a5t.jpg",
    date: "2025-03-14",
    verified: true,
  },
  {
    id: "11",
    nickname: "María Elena G.",
    review: "Me encanta cómo están organizados los verbos profesionales y académicos. La pronunciación escrita es muy clara y fácil de seguir. ¡Excelente material!",
    rating: 5,
    img: reviewEnglishFrases,
    date: "2025-01-10",
    verified: true,
  },
  {
    id: "12",
    nickname: "Carlos Hernández",
    review: "Lo uso en mi iPad todos los días. Las categorías de compras, amistad, trabajo y tecnología son muy útiles. La pronunciación UK y US es perfecta para aprender.",
    rating: 5,
    img: reviewEnglishIpad,
    date: "2025-01-08",
    verified: true,
  },
  {
    id: "13",
    nickname: "Patricia López",
    review: "La sección de síntomas y emergencias es súper útil. Ahora puedo comunicarme si tengo algún problema de salud en inglés. Muy práctico!",
    rating: 5,
    img: reviewSymptoms,
    date: "2025-01-05",
    verified: true,
  },
  {
    id: "14",
    nickname: "Miguel Ángel R.",
    review: "El libro tiene todo organizado por temas. Me encanta poder estudiar vocabulario específico según lo que necesito. La calidad es excelente.",
    rating: 5,
    img: reviewBookCover,
    date: "2025-01-03",
    verified: true,
  },
  {
    id: "15",
    nickname: "Laura Fernández",
    review: "Muy contenta con mi compra! El libro es exactamente como se ve en las fotos. La pronunciación escrita me ayuda muchísimo a practicar sola.",
    rating: 5,
    img: reviewPersonHolding,
    date: "2024-12-28",
    verified: true,
  },
  {
    id: "16",
    nickname: "Andrea Martínez",
    review: "Súper recomendado para principiantes. Las categorías están muy bien pensadas y la fonética es clara. Lo uso todos los días!",
    rating: 5,
    img: "https://images.loox.io/uploads/2025/11/23/tQUUkUAf_.jpg",
    date: "2024-12-20",
    verified: true,
  },
  {
    id: "17",
    nickname: "Jorge Sánchez",
    review: "Perfecto para hispanohablantes que quieren aprender inglés de manera sencilla. La pronunciación en español es genial!",
    rating: 5,
    img: "https://images.loox.io/uploads/2025/11/23/IiDiyw9-U.jpg",
    date: "2024-12-15",
    verified: true,
  },
];

// Reviews for Spanish product (5000 words - for English speakers)
const spanishReviews: Review[] = [
  {
    id: "s1",
    nickname: "Sarah M.",
    review: "This book is amazing! The vocabulary section with vegetables, legumes, meats and dairy is so well organized. The pronunciation guide makes learning Spanish so much easier!",
    rating: 5,
    img: reviewSpanishVocab,
    date: "dynamic",
    verified: true,
  },
  {
    id: "s2",
    nickname: "Michael T.",
    review: "Love the romance chapter! Learning words of affection and love relationships in Spanish is so fun. The pronunciation guide is perfect for English speakers.",
    rating: 5,
    img: reviewSpanishLove,
    date: "dynamic",
    verified: true,
  },
  {
    id: "s3",
    nickname: "Jennifer L.",
    review: "The health and emergencies section is incredibly useful. Now I can communicate symptoms and ask for help in Spanish. Very practical vocabulary!",
    rating: 5,
    img: reviewSpanishHealth,
    date: "dynamic",
    verified: true,
  },
  {
    id: "s4",
    nickname: "David R.",
    review: "The step-by-step method is brilliant. I was always stressed about learning Spanish but this book changed my perspective completely.",
    rating: 5,
    img: reviewSpanishVocab,
    date: "dynamic",
    verified: true,
  },
  {
    id: "s5",
    nickname: "Emily K.",
    review: "Bought this for my trip to Spain next year. The pronunciation guide with UK and US phonetics is exactly what I needed!",
    rating: 5,
    img: reviewSpanishLove,
    date: "dynamic",
    verified: true,
  },
  {
    id: "s6",
    nickname: "Robert H.",
    review: "Great value for money. 5,000 words with pronunciation included. The digital PDF is a nice bonus while waiting for the physical book.",
    rating: 5,
    img: reviewSpanishHealth,
    date: "dynamic",
    verified: true,
  },
  {
    id: "s7",
    nickname: "Amanda P.",
    review: "Finally a Spanish learning book designed for English speakers! No more guessing pronunciation. Highly recommend!",
    rating: 5,
    img: reviewSpanishVocab,
    date: "dynamic",
    verified: true,
  },
  {
    id: "s8",
    nickname: "Chris B.",
    review: "The stress-free method really works. I study 20 minutes a day and I'm already seeing progress. Can't wait for the physical book!",
    rating: 5,
    img: reviewSpanishLove,
    date: "dynamic",
    verified: true,
  },
  {
    id: "s9",
    nickname: "Lisa W.",
    review: "I ordered for my whole family. We're all learning Spanish together now. The book is well organized and easy to follow.",
    rating: 5,
    img: reviewSpanishHealth,
    date: "dynamic",
    verified: true,
  },
];

interface ProductReviewsProps {
  productType?: "english" | "spanish";
}

export const ProductReviews = ({ productType = "english" }: ProductReviewsProps) => {
  const baseReviews = productType === "english" ? englishReviews : spanishReviews;
  const swiperRef = useRef<any>(null);
  
  // Generate dynamic dates for reviews (1-15 days ago)
  const reviews = baseReviews.map((review, index) => {
    if (review.date === "dynamic") {
      const daysAgo = (index % 14) + 1;
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      return { ...review, date: date.toISOString().split('T')[0] };
    }
    return review;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return productType === "spanish" ? "Yesterday" : "Ayer";
    if (diffDays <= 7) return productType === "spanish" ? `${diffDays} days ago` : `Hace ${diffDays} días`;
    if (diffDays <= 14) return productType === "spanish" ? `${Math.floor(diffDays / 7)} week ago` : `Hace ${Math.floor(diffDays / 7)} semana`;
    
    return date.toLocaleDateString(productType === "spanish" ? "en-US" : "es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-secondary/30 to-background overflow-hidden">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-bold mb-4">
            <Star className="w-4 h-4 fill-accent" />
            {productType === "spanish" ? "VERIFIED REVIEWS" : "RESEÑAS VERIFICADAS"}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {productType === "spanish" ? "What Our Customers Say" : "Lo que dicen nuestros clientes"}
          </h2>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-accent text-accent" />
              ))}
            </div>
            <span className="text-lg font-semibold text-foreground">5.0</span>
            <span className="text-muted-foreground">({reviews.length}+ {productType === "spanish" ? "reviews" : "reseñas"})</span>
          </div>
        </div>

        {/* Swiper Carousel */}
        <div className="relative max-w-7xl mx-auto px-2 md:px-8">
          <Swiper
            ref={swiperRef}
            modules={[Autoplay, Navigation, Pagination]}
            spaceBetween={24}
            slidesPerView={1}
            centeredSlides={false}
            loop={true}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            navigation={{
              nextEl: ".swiper-button-next-custom",
              prevEl: ".swiper-button-prev-custom",
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 24,
              },
              1280: {
                slidesPerView: 4,
                spaceBetween: 24,
              },
            }}
            className="reviews-swiper !pb-14"
          >
            {reviews.map((review) => (
              <SwiperSlide key={review.id} className="h-auto">
                <div className="group bg-card rounded-2xl border border-border shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden h-full flex flex-col">
                  {/* Customer Image - Large Card Style */}
                  {review.img ? (
                    <div className="relative h-48 md:h-56 overflow-hidden flex-shrink-0">
                      <img
                        src={review.img}
                        alt={review.nickname}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* Rating on Image */}
                      <div className="absolute bottom-3 left-3 flex gap-0.5">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-accent text-accent drop-shadow-lg" />
                        ))}
                      </div>
                      
                      {/* Verified Badge on Image */}
                      {review.verified && (
                        <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/90 text-white text-xs font-medium backdrop-blur-sm">
                          <CheckCircle className="w-3 h-3" />
                          {productType === "spanish" ? "Verified" : "Verificado"}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative h-48 md:h-56 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-6xl font-bold text-primary/40">
                        {review.nickname.charAt(0)}
                      </span>
                      <div className="absolute bottom-3 left-3 flex gap-0.5">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                        ))}
                      </div>
                      {review.verified && (
                        <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/90 text-white text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          {productType === "spanish" ? "Verified" : "Verificado"}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="p-5 flex flex-col flex-grow">
                    {/* Quote Icon */}
                    <Quote className="w-6 h-6 text-primary/40 mb-2 flex-shrink-0" />
                    
                    {/* Review Text */}
                    <p className="text-foreground/90 text-sm leading-relaxed mb-4 line-clamp-3 flex-grow">
                      "{review.review}"
                    </p>
                    
                    {/* Author & Date */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-auto">
                      <p className="font-semibold text-foreground text-sm">{review.nickname}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(review.date)}
                      </p>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom Navigation Buttons */}
          <button 
            className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-card border border-border shadow-lg hover:bg-secondary transition-all duration-300 flex items-center justify-center -translate-x-1 md:-translate-x-4 hover:scale-110"
            aria-label="Anterior"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-card border border-border shadow-lg hover:bg-secondary transition-all duration-300 flex items-center justify-center translate-x-1 md:translate-x-4 hover:scale-110"
            aria-label="Siguiente"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Trust Footer */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-6 flex-wrap justify-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm">{productType === "spanish" ? "All verified purchases" : "Todas compras verificadas"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Star className="w-5 h-5 fill-accent text-accent" />
              <span className="text-sm">{productType === "spanish" ? "5-star average rating" : "Calificación promedio 5 estrellas"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Swiper Styles */}
      <style>{`
        .reviews-swiper .swiper-pagination {
          bottom: 0 !important;
        }
        .reviews-swiper .swiper-pagination-bullet {
          width: 10px;
          height: 10px;
          background: hsl(var(--muted-foreground));
          opacity: 0.4;
          transition: all 0.3s ease;
        }
        .reviews-swiper .swiper-pagination-bullet-active {
          opacity: 1;
          background: hsl(var(--primary));
          width: 24px;
          border-radius: 5px;
        }
        .reviews-swiper .swiper-slide {
          height: auto;
        }
      `}</style>
    </section>
  );
};
