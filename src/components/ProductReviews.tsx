import { useRef } from "react";
import { Star, Quote } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

// Testimonial screenshot images
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

const spanishTestimonials = [
  "https://images.loox.io/uploads/2025/11/23/tQUUkUAf_.jpg",
  "https://images.loox.io/uploads/2025/11/23/IiDiyw9-U.jpg",
  "https://images.loox.io/uploads/2025/11/23/GcNv27Ltw.jpg",
  "https://images.loox.io/uploads/2025/11/23/6IAXeCS3b.jpg",
  "https://images.loox.io/uploads/2025/11/23/mJSaAZynx.jpg",
  "https://images.loox.io/uploads/2025/11/23/BWXo4KTI7Q.jpg",
];

// Text-only reviews
const textReviewsEnglish = [
  "¡Excelente libro! La pronunciación está muy bien explicada y fácil de entender.",
  "Me encantó, muy completo y organizado. Lo recomiendo 100%.",
  "Perfecto para aprender inglés desde cero. Las fonéticas ayudan mucho.",
  "El mejor libro que he comprado para aprender vocabulario en inglés.",
  "Muy práctico y útil. Lo uso todos los días para estudiar.",
  "La calidad del contenido es increíble. Vale cada peso invertido.",
  "Súper recomendado. Aprendí más en una semana que en meses de clases.",
  "Excelente material de estudio. La organización por temas es genial.",
  "Me ayudó muchísimo con mi pronunciación. ¡Gracias iLingue Relax!",
  "El formato es muy fácil de seguir. Perfecto para autodidactas.",
];

const textReviewsSpanish = [
  "Amazing book! The pronunciation guide is so helpful for English speakers.",
  "I love how organized it is. Makes learning Spanish so much easier!",
  "Best Spanish vocabulary book I've ever purchased. Highly recommend!",
  "The phonetics really help with pronunciation. Great resource!",
  "Perfect for self-study. I use it every day.",
  "Worth every penny! The content quality is incredible.",
  "Learned more in a week than months of classes. Thank you!",
  "The topic organization is brilliant. Easy to find what you need.",
  "Helped me so much with my Spanish. Highly recommended!",
  "Great format, easy to follow. Perfect for beginners.",
];

interface ProductReviewsProps {
  productType?: "english" | "spanish";
}

export const ProductReviews = ({ productType = "english" }: ProductReviewsProps) => {
  const swiperRef = useRef<any>(null);
  const testimonials = productType === "english" ? englishTestimonials : spanishTestimonials;
  const textReviews = productType === "english" ? textReviewsEnglish : textReviewsSpanish;

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-secondary/30 to-background overflow-hidden">
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
            <span className="text-lg font-semibold text-foreground">5.0</span>
            <span className="text-muted-foreground">({testimonials.length}+ {productType === "spanish" ? "reviews" : "reseñas"})</span>
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {textReviews.map((review, index) => (
            <div 
              key={index} 
              className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-start gap-3">
                <Quote className="w-6 h-6 text-accent/60 flex-shrink-0 mt-1" />
                <div>
                  <div className="flex gap-0.5 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-foreground text-sm leading-relaxed italic">
                    "{review}"
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Footer */}
      <div className="container px-4 md:px-6">
        <div className="text-center mt-8">
          <p className="text-muted-foreground text-sm">
            {productType === "spanish" 
              ? "✓ All reviews are from verified customers"
              : "✓ Todas las reseñas son de clientes verificados"
            }
          </p>
        </div>
      </div>
    </section>
  );
};
