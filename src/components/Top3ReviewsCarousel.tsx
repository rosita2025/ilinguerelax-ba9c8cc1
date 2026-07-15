import { useEffect, useState } from "react";
import { Star, BadgeCheck } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import customerBook2 from "@/assets/customer-book-2.webp";
import customerBook4 from "@/assets/customer-book-4.webp";
import looxReview5 from "@/assets/loox-review-5.webp";

type Review = {
  name: string;
  initials: string;
  flag: string;
  country: string;
  text: string;
  image: string;
  timeAgo: string;
};

const reviews: Review[] = [
  {
    name: "Robert Klein",
    initials: "RK",
    flag: "🇺🇸",
    country: "USA",
    text: "Even my golden retriever approves! Honestly the best Spanish learning book I've bought. The pronunciation guide is a game changer.",
    image: customerBook2,
    timeAgo: "4 days ago",
  },
  {
    name: "Emma Roberts",
    initials: "ER",
    flag: "🇺🇸",
    country: "USA",
    text: "My quiet reading corner. The book feels calm and the lessons just flow. Spanish has never felt this relaxed to learn.",
    image: looxReview5,
    timeAgo: "1 day ago",
  },
  {
    name: "Patricia Hill",
    initials: "PH",
    flag: "🇺🇸",
    country: "USA",
    text: "Perfect size to carry around. I read a few pages every morning with my coffee. The thematic chapters are exactly what I needed.",
    image: customerBook4,
    timeAgo: "1 week ago",
  },
];

export const Top3ReviewsCarousel = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    const update = () => setCurrent(api.selectedScrollSnap());
    update();
    api.on("select", update);
    const interval = setInterval(() => api.scrollNext(), 5000);
    return () => clearInterval(interval);
  }, [api]);

  return (
    <section className="py-8 md:py-12 bg-gradient-to-b from-gray-50/50 to-white">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-2 text-xs md:text-sm font-semibold text-gray-700">
              Top reviews from real readers
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Why readers love Spanish Relax
          </h2>
        </div>

        <div className="max-w-md md:max-w-3xl mx-auto">
          <Carousel setApi={setApi} opts={{ loop: true, align: "center" }}>
            <CarouselContent>
              {reviews.map((r, i) => (
                <CarouselItem key={i} className="md:basis-1/1">
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mx-1">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/2 aspect-[4/5] md:aspect-auto bg-gray-100 overflow-hidden">
                        <img
                          src={r.image}
                          alt={`Verified review by ${r.name}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex flex-col justify-center p-5 md:p-7 md:w-1/2">
                        <div className="flex items-center gap-0.5 mb-3">
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <p className="text-sm md:text-base text-gray-800 leading-relaxed mb-4">
                          “{r.text}”
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {r.initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-sm text-gray-900 truncate">
                                {r.name}
                              </span>
                              <span className="text-base leading-none">{r.flag}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                              <BadgeCheck className="w-3 h-3 text-green-600" />
                              <span>Verified Buyer · {r.timeAgo}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 md:-left-4" />
            <CarouselNext className="right-0 md:-right-4" />
          </Carousel>

          <div className="flex justify-center gap-1.5 mt-4">
            {reviews.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to review ${i + 1}`}
                onClick={() => api?.scrollTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  current === i ? "w-6 bg-primary" : "w-1.5 bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Top3ReviewsCarousel;
