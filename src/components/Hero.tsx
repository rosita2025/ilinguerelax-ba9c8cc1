import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination, Navigation } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import appPreview1 from "@/assets/app-preview-1.png.asset.json";
import appPreview2 from "@/assets/app-preview-2.png.asset.json";

export const Hero = () => {
  return (
    <section className="relative min-h-[70vh] md:min-h-screen flex items-start pt-20 md:pt-32 overflow-hidden bg-background">
      {/* Background Slider */}
      <div className="absolute inset-0 w-full h-full">
        <Swiper
          modules={[Autoplay, EffectFade, Pagination, Navigation]}
          effect={'fade'}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          navigation={true}
          loop={true}
          className="w-full h-full"
        >
          <SwiperSlide className="flex items-center justify-center bg-black/5 backdrop-blur-sm">
            <img
              src={appPreview1.url}
              alt="iLingue Relax App Preview 1"
              className="max-h-[85vh] w-auto object-contain transition-transform duration-700"
              loading="eager"
            />
          </SwiperSlide>
          <SwiperSlide className="flex items-center justify-center bg-black/5 backdrop-blur-sm">
            <img
              src={appPreview2.url}
              alt="iLingue Relax App Preview 2"
              className="max-h-[85vh] w-auto object-contain transition-transform duration-700"
              loading="lazy"
            />
          </SwiperSlide>
        </Swiper>
      </div>

      {/* Subtle bottom gradient to blend with next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
    </section>
  );
};