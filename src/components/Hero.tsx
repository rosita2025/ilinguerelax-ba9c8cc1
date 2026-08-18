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
    <section className="relative w-full overflow-hidden bg-background py-4">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="relative w-full aspect-[9/16] md:aspect-video max-h-[75vh] md:max-h-[500px] overflow-hidden rounded-2xl bg-black/5">
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
            <SwiperSlide key="slide-1" className="flex items-center justify-center">
              <img
                src={`${appPreview1.url}?v=${new Date().getTime()}`}
                alt="iLingue Relax App Preview 1"
                className="w-full h-full object-contain mx-auto transition-transform duration-700"
                loading="eager"
              />
            </SwiperSlide>
            <SwiperSlide key="slide-2" className="flex items-center justify-center">
              <img
                src={`${appPreview2.url}?v=${new Date().getTime()}`}
                alt="iLingue Relax App Preview 2"
                className="w-full h-full object-contain mx-auto transition-transform duration-700"
                loading="lazy"
              />
            </SwiperSlide>
          </Swiper>
        </div>
      </div>

      {/* Subtle bottom gradient to blend with next section */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
    </section>
  );
};