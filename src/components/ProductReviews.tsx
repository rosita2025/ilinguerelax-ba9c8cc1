import { useRef } from "react";
import { Star } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

// Testimonial screenshot images - just image cards like the reference
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

interface ProductReviewsProps {
  productType?: "english" | "spanish";
}

export const ProductReviews = ({ productType = "english" }: ProductReviewsProps) => {
  const swiperRef = useRef<any>(null);
  const testimonials = productType === "english" ? englishTestimonials : spanishTestimonials;

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

        {/* Simple Image Carousel - like reference site */}
        <div className="relative max-w-6xl mx-auto">
          <Swiper
            ref={swiperRef}
            modules={[Autoplay, Navigation]}
            spaceBetween={22}
            slidesPerView={1.5}
            centeredSlides={false}
            loop={true}
            autoplay={{
              delay: 3500,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            navigation={{
              nextEl: ".review-swiper-next",
              prevEl: ".review-swiper-prev",
            }}
            breakpoints={{
              480: {
                slidesPerView: 2,
                spaceBetween: 16,
              },
              640: {
                slidesPerView: 3,
                spaceBetween: 18,
              },
              768: {
                slidesPerView: 4,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 5,
                spaceBetween: 22,
              },
            }}
            className="!pb-4"
          >
            {testimonials.map((img, index) => (
              <SwiperSlide key={index}>
                <div className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer">
                  <img
                    src={img}
                    alt={`Testimonio ${index + 1}`}
                    className="w-full h-auto object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Navigation Buttons */}
          <button 
            className="review-swiper-prev absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card/90 border border-border shadow-lg hover:bg-secondary transition-all duration-300 flex items-center justify-center -translate-x-2 hover:scale-110 backdrop-blur-sm"
            aria-label="Anterior"
          >
            <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            className="review-swiper-next absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card/90 border border-border shadow-lg hover:bg-secondary transition-all duration-300 flex items-center justify-center translate-x-2 hover:scale-110 backdrop-blur-sm"
            aria-label="Siguiente"
          >
            <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Trust Footer */}
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
