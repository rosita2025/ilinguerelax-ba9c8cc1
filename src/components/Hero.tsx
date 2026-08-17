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
    <section className="relative w-full overflow-hidden bg-background">
      <div className="w-full aspect-[9/19] md:aspect-video relative">
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
          <SwiperSlide key="slide-1" className="bg-black/5 backdrop-blur-sm">
            <img
              src={`${appPreview1.url}?v=${new Date().getTime()}`}
              alt="iLingue Relax App Preview 1"
              className="w-full h-full object-cover transition-transform duration-700"
              loading="eager"
            />
          </SwiperSlide>
          <SwiperSlide key="slide-2" className="bg-black/5 backdrop-blur-sm">
            <img
              src={`${appPreview2.url}?v=${new Date().getTime()}`}
              alt="iLingue Relax App Preview 2"
              className="w-full h-full object-cover transition-transform duration-700"
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