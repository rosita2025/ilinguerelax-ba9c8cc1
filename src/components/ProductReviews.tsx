import { useRef } from "react";
import { Star } from "lucide-react";
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
              <div className="rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                <img
                  src={img}
                  alt={`Testimonio ${(index % testimonials.length) + 1}`}
                  className="w-full h-[280px] md:h-[320px] object-cover"
                  loading="lazy"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
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
