import { useState, useEffect } from "react";
import { Clock, Flame } from "lucide-react";

interface CountdownTimerProps {
  endDate?: Date;
  hoursFromNow?: number;
  currentPrice?: string;
  originalPrice?: string;
  storageKey?: string;
  lang?: "es" | "en";
}

export const CountdownTimer = ({
  endDate,
  hoursFromNow = 24,
  currentPrice = "$10 USD",
  originalPrice = "$54 USD",
  storageKey = "countdown_target",
  lang = "es",
}: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = endDate || new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);

    // Store the target date in sessionStorage to persist across page refreshes
    let savedTarget = sessionStorage.getItem(storageKey);

    let finalTarget: Date;
    if (savedTarget) {
      finalTarget = new Date(savedTarget);
      // If the saved target has passed, reset it
      if (finalTarget.getTime() < Date.now()) {
        finalTarget = targetDate;
        sessionStorage.setItem(storageKey, targetDate.toISOString());
      }
    } else {
      finalTarget = targetDate;
      sessionStorage.setItem(storageKey, targetDate.toISOString());
    }

    const calculateTimeLeft = () => {
      const difference = finalTarget.getTime() - Date.now();

      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24) + Math.floor(difference / (1000 * 60 * 60 * 24)) * 24,
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate, hoursFromNow, storageKey]);

  const labels =
    lang === "en"
      ? {
          hours: "Hours",
          minutes: "Minutes",
          seconds: "Seconds",
          header: "Limited time offer!",
          message: "Price increases when the counter reaches zero",
          current: "Current price:",
          after: "After:",
        }
      : {
          hours: "Horas",
          minutes: "Minutos",
          seconds: "Segundos",
          header: "¡Oferta por tiempo limitado!",
          message: "El precio sube cuando el contador llegue a cero",
          current: "Precio actual:",
          after: "Después:",
        };

  const TimeBox = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-[#1a2332] text-white font-bold text-3xl md:text-5xl rounded-xl w-20 md:w-28 h-20 md:h-28 flex items-center justify-center shadow-2xl">
        {value.toString().padStart(2, "0")}
      </div>
      <span className="text-xs md:text-sm text-white/80 mt-3 font-medium uppercase tracking-widest">{label}</span>
    </div>
  );

  return (
    <section className="py-10 md:py-14 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-48 h-48 bg-yellow-300/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="container px-4 md:px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Urgency Header */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Flame className="w-6 h-6 text-white animate-pulse" />
            <span className="text-white font-bold text-base md:text-lg uppercase tracking-wider">{labels.header}</span>
            <Flame className="w-6 h-6 text-white animate-pulse" />
          </div>

          {/* Main Message */}
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-8">{labels.message}</h3>

          {/* Countdown */}
          <div className="flex items-center justify-center gap-4 md:gap-8 mb-8">
            <TimeBox value={timeLeft.hours} label={labels.hours} />
            <span className="text-4xl md:text-5xl font-bold text-white/60 mt-[-20px]">:</span>
            <TimeBox value={timeLeft.minutes} label={labels.minutes} />
            <span className="text-4xl md:text-5xl font-bold text-white/60 mt-[-20px]">:</span>
            <TimeBox value={timeLeft.seconds} label={labels.seconds} />
          </div>

          {/* Price Badges */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-[#1a2332] rounded-full px-5 py-3 shadow-lg">
              <Clock className="w-4 h-4 text-orange-400" />
              <span className="text-white font-medium text-sm md:text-base">
                {labels.current} <span className="font-bold text-orange-400">{currentPrice}</span>
              </span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-5 py-3">
              <span className="text-white text-sm md:text-base">
                {labels.after} <span className="line-through font-medium">{originalPrice}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
