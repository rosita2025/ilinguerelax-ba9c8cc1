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
    <section className="relative w-full bg-background py-4 sm:py-6 md:py-8 lg:py-12">
      <div className="container mx-auto px-0 sm:px-4 lg:max-w-4xl">
        <div className="relative w-full sm:rounded-2xl bg-black/5 hero-swiper-container lg:shadow-hero">
          <Swiper
            modules={[Autoplay, EffectFade, Pagination, Navigation]}
            effect={'fade'}
            autoHeight={true}
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
            className="w-full"
          >
            <SwiperSlide key="slide-1" className="flex items-center justify-center bg-black/5">
              <div className="w-full relative flex items-center justify-center">
                <img
                  src={`${appPreview1.url}?v=${new Date().getTime()}`}
                  alt="iLingue Relax App Preview 1"
                  className="w-full h-auto object-contain block mx-auto rounded-2xl"
                  loading="eager"
                />
              </div>
            </SwiperSlide>
            <SwiperSlide key="slide-2" className="flex items-center justify-center bg-black/5">
              <div className="w-full relative flex items-center justify-center">
                <img
                  src={`${appPreview2.url}?v=${new Date().getTime()}`}
                  alt="iLingue Relax App Preview 2"
                  className="w-full h-auto object-contain block mx-auto rounded-2xl"
                  loading="lazy"
                />
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .hero-swiper-container .swiper-button-next,
        .hero-swiper-container .swiper-button-prev {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(8px);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: white;
          transition: all 0.3s ease;
          z-index: 20;
        }
        .hero-swiper-container .swiper-button-next:after,
        .hero-swiper-container .swiper-button-prev:after {
          font-size: 14px;
          font-weight: bold;
        }
        .hero-swiper-container .swiper-button-next { right: 12px; }
        .hero-swiper-container .swiper-button-prev { left: 12px; }
        
        .hero-swiper-container .swiper-button-next:hover,
        .hero-swiper-container .swiper-button-prev:hover {
          background: rgba(255, 255, 255, 0.4);
          transform: translateY(-50%) scale(1.1);
        }

        @media (min-width: 640px) {
          .hero-swiper-container .swiper-button-next,
          .hero-swiper-container .swiper-button-prev {
            width: 44px;
            height: 44px;
          }
          .hero-swiper-container .swiper-button-next:after,
          .hero-swiper-container .swiper-button-prev:after {
            font-size: 18px;
          }
        }

        @media (min-width: 1024px) {
          .hero-swiper-container .swiper-button-next { right: 16px; }
          .hero-swiper-container .swiper-button-prev { left: 16px; }
        }
      `}} />

      {/* Subtle bottom gradient to blend with next section */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
    </section>
  );
};