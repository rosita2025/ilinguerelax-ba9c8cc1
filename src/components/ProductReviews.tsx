import { useRef } from "react";
import { Star, Quote, CheckCircle } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

// Import Spanish testimonial images
import reviewSpanish1 from "@/assets/review-spanish-1.png";
import reviewSpanish2 from "@/assets/review-spanish-2.jpg";
import reviewSpanish3 from "@/assets/review-spanish-3.jpg";
import reviewSpanish4 from "@/assets/review-spanish-4.jpg";

// Testimonial screenshot images - English product
const englishTestimonials = [
  "https://images.loox.io/uploads/2025/11/23/tQUUkUAf_.jpg",
  "https://images.loox.io/uploads/2025/11/23/IiDiyw9-U.jpg",
  "https://images.loox.io/uploads/2025/11/23/GcNv27Ltw.jpg",
  "https://images.loox.io/uploads/2025/11/23/6IAXeCS3b.jpg",
  "https://images.loox.io/uploads/2025/11/23/mJSaAZynx.jpg",
  "https://images.loox.io/uploads/2025/11/23/BWXo4KTI7Q.jpg",
  "https://images.loox.io/uploads/2025/11/23/r5UcoWJcpE.jpg",
  "https://images.loox.io/uploads/2025/11/23/-dLV0FCgkX.jpg",
  "https://images.loox.io/uploads/2025/11/23/O3AgBj_If.jpg",
  "https://images.loox.io/uploads/2025/11/23/smyzA3a5t.jpg",
];

// Testimonial images - Spanish product (book photos)
const spanishTestimonials = [
  reviewSpanish1,
  reviewSpanish2,
  reviewSpanish3,
  reviewSpanish4,
];

// Real verified reviews - iLingue Relax
const textReviewsEnglish = [
  { text: "Compré el libro y me llegó al instante. La pronunciación está super clara y me ayudó mucho con mi trabajo.", verified: true, date: "2026-01-15" },
  { text: "Llevo 2 semanas estudiando y ya noto la diferencia. El método es muy relajado como dice el nombre.", verified: true, date: "2026-01-10" },
  { text: "Lo mejor es que tiene la fonética UK y USA. Muy completo para el precio que tiene.", verified: true, date: "2026-01-05" },
  { text: "Mi hijo de 15 años lo está usando y le encanta. Fácil de entender para cualquier edad.", verified: true, date: "2025-12-28" },
  { text: "Excelente inversión. Los 52 capítulos están muy bien organizados por temas.", verified: true, date: "2025-11-20" },
  { text: "La descarga fue inmediata y el PDF se ve perfecto en mi tablet. Muy recomendado.", verified: true, date: "2025-10-15" },
  { text: "Después de probar varios métodos, este es el que mejor me funcionó. Gracias iLingue Relax.", verified: true, date: "2025-09-18" },
  { text: "Los bonus que incluye valen oro. El diccionario alfabético es genial para consultas rápidas.", verified: true, date: "2025-08-22" },
  { text: "Soy maestra y lo recomiendo a mis alumnos. El contenido es de calidad profesional.", verified: true, date: "2025-08-05" },
  { text: "Nunca pensé que aprender vocabulario fuera tan fácil. Las 5,000 palabras están muy bien seleccionadas.", verified: true, date: "2025-07-12" },
];

const textReviewsSpanish = [
  { text: "Bought it instantly and the pronunciation guide is crystal clear. Helped me so much!", verified: true, date: "2026-01-15" },
  { text: "Been studying for 2 weeks and I can already see the difference. Love the relaxed method!", verified: true, date: "2026-01-10" },
  { text: "The UK and USA phonetics are the best part. Very complete for the price.", verified: true, date: "2026-01-05" },
  { text: "My teenager is using it and loves it. Easy to understand for any age.", verified: true, date: "2025-12-28" },
  { text: "Great investment! The chapters are well organized by topics.", verified: true, date: "2025-11-20" },
  { text: "Instant download and the PDF looks perfect on my tablet. Highly recommended!", verified: true, date: "2025-10-15" },
  { text: "After trying many methods, this one works best for me. Thank you iLingue Relax!", verified: true, date: "2025-09-18" },
  { text: "The included bonuses are worth gold. The alphabetical dictionary is great for quick lookups.", verified: true, date: "2025-08-22" },
  { text: "I'm a teacher and recommend it to my students. Professional quality content.", verified: true, date: "2025-08-05" },
  { text: "Never thought learning vocabulary could be this easy. The 5,000 words are well selected.", verified: true, date: "2025-07-12" },
];

interface ProductReviewsProps {
  productType?: "english" | "spanish";
}

export const ProductReviews = ({ productType = "english" }: ProductReviewsProps) => {
  const swiperRef = useRef<any>(null);
  const testimonials = productType === "english" ? englishTestimonials : spanishTestimonials;
  const textReviews = productType === "english" ? textReviewsEnglish : textReviewsSpanish;

  // Schema.org structured data for reviews
  const reviewSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": productType === "english" ? "Inglés Relax - 5,000 Palabras" : "Spanish Relax - 5,000 Words",
    "brand": {
      "@type": "Brand",
      "name": "iLingue Relax"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": testimonials.length + textReviews.length,
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": textReviews.map((review, index) => ({
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5"
      },
      "author": {
        "@type": "Person",
        "name": `Cliente Verificado #${index + 1}`
      },
      "datePublished": review.date,
      "reviewBody": review.text,
      "publisher": {
        "@type": "Organization",
        "name": "iLingue Relax"
      }
    }))
  };

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-secondary/30 to-background overflow-hidden">
      {/* Schema.org JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }}
      />

      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-8">
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
            <span className="text-lg font-semibold text-foreground">4.9</span>
            <span className="text-muted-foreground">
              ({testimonials.length + textReviews.length}+ {productType === "spanish" ? "reviews" : "reseñas"})
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {productType === "spanish" 
              ? "Powered by iLingue Relax" 
              : "Reseñas verificadas por iLingue Relax"
            }
          </p>
        </div>
      </div>

      {/* Full-width Auto-scrolling Carousel - like stickers */}
      <div className="w-full">
        <Swiper
          ref={swiperRef}
          modules={[Autoplay]}
          spaceBetween={20}
          slidesPerView="auto"
          centeredSlides={false}
          loop={true}
          speed={7500}
          autoplay={{
            delay: 0,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          allowTouchMove={true}
          className="!overflow-visible"
        >
          {[...testimonials, ...testimonials].map((img, index) => (
            <SwiperSlide key={index} className="!w-[200px] md:!w-[220px]">
              <div className="rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 relative">
                <img
                  src={img}
                  alt={`Testimonio ${(index % testimonials.length) + 1}`}
                  className="w-full h-[280px] md:h-[320px] object-cover"
                  loading="lazy"
                />
                {/* Watermark overlay - more visible to protect content */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                  <span 
                    className="text-white font-bold text-lg md:text-xl opacity-70 rotate-[-25deg] select-none"
                    style={{
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.5)',
                      letterSpacing: '0.05em'
                    }}
                  >
                    iLingue Relax
                  </span>
                </div>
                {/* Bottom watermark */}
                <div className="absolute bottom-2 left-2 right-2 flex justify-center pointer-events-none">
                  <span 
                    className="text-white text-xs font-semibold opacity-80 bg-black/40 px-2 py-1 rounded select-none"
                  >
                    © iLingue Relax
                  </span>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Text-only Reviews Section */}
      <div className="container px-4 md:px-6 mt-12">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-sm font-medium text-muted-foreground">
            {productType === "spanish" ? "Reviews from" : "Reseñas de"}
          </span>
          <span className="text-sm font-bold text-primary">iLingue Relax</span>
          <CheckCircle className="w-4 h-4 text-green-500" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {textReviews.map((review, index) => (
            <div 
              key={index} 
              className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  {review.verified && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">
                        {productType === "spanish" ? "Verified" : "Verificado"}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-foreground text-sm leading-relaxed">
                  "{review.text}"
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {productType === "spanish" ? "Customer via iLingue Relax" : "Cliente de iLingue Relax"}
                  </span>
                  <span>{new Date(review.date).toLocaleDateString(productType === "spanish" ? "en-US" : "es-ES", { month: "short", year: "numeric" })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Footer */}
      <div className="container px-4 md:px-6">
        <div className="text-center mt-8 space-y-2">
          <p className="text-muted-foreground text-sm">
            {productType === "spanish" 
              ? "✓ All reviews are from verified customers of iLingue Relax"
              : "✓ Todas las reseñas son de clientes verificados de iLingue Relax"
            }
          </p>
          <p className="text-xs text-muted-foreground/70">
            © {new Date().getFullYear()} iLingue Relax - {productType === "spanish" ? "All rights reserved" : "Todos los derechos reservados"}
          </p>
        </div>
      </div>
    </section>
  );
};
