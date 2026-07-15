import { Star, BadgeCheck } from "lucide-react";
import looxReview1 from "@/assets/loox-review-1.webp";
import looxReview2 from "@/assets/loox-review-2.webp";
import looxReview3 from "@/assets/loox-review-3.webp";
import looxReview4 from "@/assets/loox-review-4.webp";
import looxReview5 from "@/assets/loox-review-5.webp";
import looxReview6 from "@/assets/review-book-real-1.webp";
import looxReview7 from "@/assets/loox-review-7.webp";
import looxReview8 from "@/assets/loox-review-8.webp";
import looxReview9 from "@/assets/loox-review-9.webp";
import customerBook1 from "@/assets/customer-book-1.webp";
import customerBook2 from "@/assets/customer-book-2.webp";
import customerBook3 from "@/assets/customer-book-3.webp";
import customerBook4 from "@/assets/customer-book-4.webp";
import customerBook5 from "@/assets/customer-book-5.webp";
import customerBook6 from "@/assets/customer-book-6.webp";
import customerBook7 from "@/assets/customer-book-7.webp";

interface LooxReview {
  name: string;
  country: string;
  flag: string;
  text: string;
  image: string;
  timeAgo: string;
  initials: string;
}

const reviews: LooxReview[] = [
  {
    name: "Emma Roberts",
    country: "USA",
    flag: "🇺🇸",
    text: "My quiet reading corner. The book feels calm and the lessons just flow.",
    image: looxReview5,
    timeAgo: "1 day ago",
    initials: "ER",
  },
  {
    name: "Margaret Reed",
    country: "USA",
    flag: "🇺🇸",
    text: "I'm 62 and finally learning Spanish. The font is clear and the pace is perfect for me.",
    image: looxReview9,
    timeAgo: "3 days ago",
    initials: "MR",
  },
  {
    name: "Emily Carter",
    country: "USA",
    flag: "🇺🇸",
    text: "Loving this book! The pronunciation guide makes Spanish so much easier to read out loud.",
    image: looxReview1,
    timeAgo: "2 days ago",
    initials: "EC",
  },
  {
    name: "Jennifer Hayes",
    country: "USA",
    flag: "🇺🇸",
    text: "Just got my copy! The cover is beautiful and the pages feel premium. Already on chapter 3 and loving how clear everything is explained.",
    image: customerBook1,
    timeAgo: "2 days ago",
    initials: "JH",
  },
  {
    name: "Robert Klein",
    country: "USA",
    flag: "🇺🇸",
    text: "Even my golden retriever approves! Honestly the best Spanish learning book I've bought. The pronunciation guide is a game changer.",
    image: customerBook2,
    timeAgo: "4 days ago",
    initials: "RK",
  },
  {
    name: "Thomas Wright",
    country: "USA",
    flag: "🇺🇸",
    text: "Got this for my wife and ended up reading it myself. Super well organized and the 6-month planner keeps me consistent.",
    image: customerBook3,
    timeAgo: "1 week ago",
    initials: "TW",
  },
  {
    name: "Patricia Hill",
    country: "USA",
    flag: "🇺🇸",
    text: "Perfect size to carry around. I read a few pages every morning with my coffee. Spanish has never felt this relaxed to learn.",
    image: customerBook4,
    timeAgo: "1 week ago",
    initials: "PH",
  },
  {
    name: "Rachel Foster",
    country: "USA",
    flag: "🇺🇸",
    text: "Bought it for a trip to Mexico and I actually feel prepared. The thematic chapters are exactly what tourists need.",
    image: customerBook5,
    timeAgo: "2 weeks ago",
    initials: "RF",
  },
  {
    name: "Karen Mitchell",
    country: "USA",
    flag: "🇺🇸",
    text: "Quality print, vibrant cover, easy to follow. I'm 58 and finally enjoying learning Spanish without stress. Highly recommend.",
    image: customerBook6,
    timeAgo: "3 weeks ago",
    initials: "KM",
  },
];

export const LooxStyleReviews = () => {
  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-white to-gray-50/50">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-8 md:mb-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 md:w-5 md:h-5 fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-2 text-xs md:text-sm font-semibold text-gray-700">
              4.9 · Based on real customer photos
            </span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 tracking-tight">
            What our customers are saying
          </h2>
          <p className="mt-2 text-sm md:text-base text-gray-500">
            Verified reviews from real Spanish Relax readers around the world.
          </p>
        </div>

        {/* Mobile: horizontal snap scroll with peek + edge fade */}
        <div className="sm:hidden relative">
          <div className="-mx-4 px-4 overflow-x-auto snap-x snap-mandatory flex gap-3 pb-4 scrollbar-hide [scroll-padding-left:1rem]">
            {reviews.map((r, i) => (
              <ReviewCard
                key={i}
                review={r}
                className="snap-start shrink-0 w-[78vw] max-w-[300px]"
              />
            ))}
            <div className="shrink-0 w-1" aria-hidden />
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-50/80 to-transparent" />
        </div>

        {/* Tablet & Desktop: balanced grid (2 / 3 columns) */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
          {reviews.map((r, i) => (
            <ReviewCard key={i} review={r} />
          ))}
        </div>
      </div>
    </section>
  );
};

const ReviewCard = ({ review, className = "" }: { review: LooxReview; className?: string }) => {
  return (
    <div
      className={`flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-gray-300 ${className}`}
    >
      {/* Photo — uniform 4:5 portrait keeps the book centered on every card */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
        <img
          src={review.image}
          alt={`Verified review by ${review.name}`}
          className="absolute inset-0 w-full h-full object-cover object-center"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-semibold text-gray-700 shadow-sm">
          <BadgeCheck className="w-3 h-3 text-green-600" />
          Verified
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 md:p-5">
        {/* Stars */}
        <div className="flex items-center gap-0.5 mb-2.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
          ))}
        </div>

        {/* Reviewer */}
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
            {review.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-gray-900 truncate">
                {review.name}
              </span>
              <span className="text-base leading-none">{review.flag}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
              <BadgeCheck className="w-3 h-3 text-green-600" />
              <span className="truncate">Verified Buyer · {review.timeAgo}</span>
            </div>
          </div>
        </div>

        {/* Review text */}
        <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
          {review.text}
        </p>
      </div>
    </div>
  );
};

export default LooxStyleReviews;