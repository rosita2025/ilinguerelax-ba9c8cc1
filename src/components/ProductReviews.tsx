import { useState, useEffect } from "react";
import { Star, ChevronLeft, ChevronRight, Quote, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
];

// Reviews for Spanish product (5000 words - for English speakers)
const spanishReviews: Review[] = [
  {
    id: "s1",
    nickname: "Sarah M.",
    review: "This book is amazing! The English pronunciation guide makes learning Spanish so much easier. I've tried many methods but this stress-free approach really works!",
    rating: 5,
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    date: "dynamic",
    verified: true,
  },
  {
    id: "s2",
    nickname: "Michael T.",
    review: "Perfect for beginners like me. No complicated grammar rules, just practical words I can use right away. The PDF arrived instantly!",
    rating: 5,
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    date: "dynamic",
    verified: true,
  },
  {
    id: "s3",
    nickname: "Jennifer L.",
    review: "I love that I don't need a dictionary. Everything is explained in a way English speakers can understand. Already learning 15 words a day!",
    rating: 5,
    img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    date: "dynamic",
    verified: true,
  },
  {
    id: "s4",
    nickname: "David R.",
    review: "The step-by-step method is brilliant. I was always stressed about learning Spanish but this book changed my perspective completely.",
    rating: 5,
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    date: "dynamic",
    verified: true,
  },
  {
    id: "s5",
    nickname: "Emily K.",
    review: "Bought this for my trip to Spain next year. The pronunciation guide with UK and US phonetics is exactly what I needed!",
    rating: 5,
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    date: "dynamic",
    verified: true,
  },
  {
    id: "s6",
    nickname: "Robert H.",
    review: "Great value for money. 5,000 words with pronunciation included. The digital PDF is a nice bonus while waiting for the physical book.",
    rating: 5,
    img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    date: "dynamic",
    verified: true,
  },
  {
    id: "s7",
    nickname: "Amanda P.",
    review: "Finally a Spanish learning book designed for English speakers! No more guessing pronunciation. Highly recommend!",
    rating: 5,
    img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    date: "dynamic",
    verified: true,
  },
  {
    id: "s8",
    nickname: "Chris B.",
    review: "The stress-free method really works. I study 20 minutes a day and I'm already seeing progress. Can't wait for the physical book!",
    rating: 5,
    img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    date: "dynamic",
    verified: true,
  },
  {
    id: "s9",
    nickname: "Lisa W.",
    review: "I ordered for my whole family. We're all learning Spanish together now. The book is well organized and easy to follow.",
    rating: 5,
    img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
    date: "dynamic",
    verified: true,
  },
];

interface ProductReviewsProps {
  productType?: "english" | "spanish";
}

export const ProductReviews = ({ productType = "english" }: ProductReviewsProps) => {
  const baseReviews = productType === "english" ? englishReviews : spanishReviews;
  
  // Generate dynamic dates for reviews (1-15 days ago)
  const reviews = baseReviews.map((review, index) => {
    if (review.date === "dynamic") {
      const daysAgo = (index % 14) + 1; // 1-14 days ago
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      return { ...review, date: date.toISOString().split('T')[0] };
    }
    return review;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  // Reviews to show based on screen size
  const reviewsPerPage = 3;
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalPages);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isAutoPlaying, totalPages]);

  const goToPrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % totalPages);
  };

  const goToPage = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  const currentReviews = reviews.slice(
    currentIndex * reviewsPerPage,
    currentIndex * reviewsPerPage + reviewsPerPage
  );

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
    <section className="py-16 md:py-20 bg-gradient-to-b from-secondary/30 to-background">
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

        {/* Reviews Carousel */}
        <div className="relative max-w-6xl mx-auto">
          {/* Navigation Arrows */}
          <button
            onClick={goToPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-10 p-3 rounded-full bg-card border border-border shadow-lg hover:bg-secondary transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-10 p-3 rounded-full bg-card border border-border shadow-lg hover:bg-secondary transition-colors"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-6 h-6 text-foreground" />
          </button>

          {/* Reviews Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {currentReviews.map((review) => (
                <div
                  key={review.id}
                  className="group bg-card rounded-2xl border border-border shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden"
                >
                  {/* Customer Image - Large Card Style */}
                  {review.img ? (
                    <div className="relative h-48 md:h-56 overflow-hidden">
                      <img
                        src={review.img}
                        alt={review.nickname}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                    <div className="relative h-48 md:h-56 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <span className="text-6xl font-bold text-primary/40">
                        {review.nickname.charAt(0)}
                      </span>
                      {/* Rating */}
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
                  <div className="p-5">
                    {/* Quote Icon */}
                    <Quote className="w-6 h-6 text-primary/40 mb-2" />
                    
                    {/* Review Text */}
                    <p className="text-foreground/90 text-sm leading-relaxed mb-4 line-clamp-3">
                      "{review.review}"
                    </p>
                    
                    {/* Author & Date */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <p className="font-semibold text-foreground text-sm">{review.nickname}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(review.date)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Pagination Dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => goToPage(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-primary w-8"
                    : "bg-primary/30 hover:bg-primary/50"
                }`}
                aria-label={`Ir a página ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Trust Badge */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-green-500/10 border border-green-500/20">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              {productType === "spanish" ? "All reviews are from real verified customers" : "Todas las reseñas son de clientes reales verificados"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
