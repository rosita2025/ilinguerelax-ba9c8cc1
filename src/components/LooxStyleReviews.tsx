import { Star, BadgeCheck } from "lucide-react";
import looxReview1 from "@/assets/loox-review-1.png";
import looxReview2 from "@/assets/loox-review-2.png";
import looxReview3 from "@/assets/loox-review-3.png";
import looxReview4 from "@/assets/loox-review-4.png";
import looxReview5 from "@/assets/loox-review-5.png";
import looxReview6 from "@/assets/review-book-real-1.jpg";
import looxReview7 from "@/assets/loox-review-7.png";
import looxReview8 from "@/assets/loox-review-8.png";
import looxReview9 from "@/assets/loox-review-9.png";
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
    name: "James Wilson",
    country: "UK",
    flag: "🇬🇧",
    text: "Perfect for my morning coffee study sessions. Clear, simple, and actually fun to use.",
    image: looxReview2,
    timeAgo: "5 days ago",
    initials: "JW",
  },
  {
    name: "Michael Brown",
    country: "Canada",
    flag: "🇨🇦",
    text: "Great quality print. The thematic chapters help me learn vocabulary I actually use daily.",
    image: looxReview3,
    timeAgo: "1 week ago",
    initials: "MB",
  },
  {
    name: "Sophie Anderson",
    country: "Australia",
    flag: "🇦🇺",
    text: "Studying at home has never been easier. Pairs perfectly with the digital version on my phone!",
    image: looxReview4,
    timeAgo: "1 week ago",
    initials: "SA",
  },
  {
    name: "Olivia Martinez",
    country: "USA",
    flag: "🇺🇸",
    text: "Beautiful book and super practical. I finally feel confident speaking Spanish.",
    image: looxReview8,
    timeAgo: "2 weeks ago",
    initials: "OM",
  },
  {
    name: "Daniel Thompson",
    country: "UK",
    flag: "🇬🇧",
    text: "The 6-month study planner keeps me on track. Best Spanish book I've bought.",
    image: looxReview6,
    timeAgo: "3 weeks ago",
    initials: "DT",
  },
  {
    name: "Crady — Author",
    country: "iLingue Relax",
    flag: "✍️",
    text: "Hi! I'm the author. Every chapter is designed to make Spanish feel relaxed and natural. Thank you for trusting my work.",
    image: looxReview7,
    timeAgo: "Author",
    initials: "CR",
  },
  {
    name: "Ava Mitchell",
    country: "USA",
    flag: "🇺🇸",
    text: "My favorite reading time of the day. Calm vibes and real progress with my Spanish.",
    image: looxReview6,
    timeAgo: "1 month ago",
    initials: "AM",
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
  {
    name: "Linda Parker",
    country: "USA",
    flag: "🇺🇸",
    text: "Arrived faster than expected. Pages are clean, font is large enough, and the structure makes sense. Worth every penny!",
    image: customerBook7,
    timeAgo: "1 month ago",
    initials: "LP",
  },
];

export const LooxStyleReviews = () => {
  return (
    <section className="py-10 md:py-14 bg-white">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-2 text-sm font-semibold text-gray-700">
              4.9 · Based on real customer photos
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            What our customers are saying
          </h2>
        </div>

        {/* Mobile: horizontal scroll. Desktop: 3-col grid */}
        <div className="md:hidden -mx-4 px-4 overflow-x-auto snap-x snap-mandatory flex gap-4 pb-4 scrollbar-hide">
          {reviews.map((r, i) => (
            <ReviewCard key={i} review={r} className="snap-center shrink-0 w-[280px]" />
          ))}
        </div>

        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
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
      className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5 ${className}`}
    >
      {/* Photo */}
      <div className="aspect-square overflow-hidden bg-gray-50">
        <img
          src={review.image}
          alt={`Review by ${review.name}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Stars */}
        <div className="flex items-center gap-0.5 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
          ))}
        </div>

        {/* Reviewer */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {review.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-gray-900 truncate">
                {review.name}
              </span>
              <span className="text-base leading-none">{review.flag}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-gray-500">
              <BadgeCheck className="w-3 h-3 text-green-600" />
              <span>Verified Buyer · {review.timeAgo}</span>
            </div>
          </div>
        </div>

        {/* Review text */}
        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
          {review.text}
        </p>
      </div>
    </div>
  );
};

export default LooxStyleReviews;