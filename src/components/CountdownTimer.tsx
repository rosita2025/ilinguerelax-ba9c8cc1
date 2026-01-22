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
  lang = "es"
}: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
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
          hours: Math.floor(difference / (1000 * 60 * 60) % 24) + Math.floor(difference / (1000 * 60 * 60 * 24)) * 24,
          minutes: Math.floor(difference / 1000 / 60 % 60),
          seconds: Math.floor(difference / 1000 % 60)
        });
      } else {
        setTimeLeft({
          hours: 0,
          minutes: 0,
          seconds: 0
        });
      }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [endDate, hoursFromNow, storageKey]);
  const labels = lang === "en" ? {
    hours: "Hours",
    minutes: "Minutes",
    seconds: "Seconds",
    header: "Limited time offer!",
    message: "Price increases when the counter reaches zero",
    current: "Current price:",
    after: "After:"
  } : {
    hours: "Horas",
    minutes: "Minutos",
    seconds: "Segundos",
    header: "¡Oferta por tiempo limitado!",
    message: "El precio sube cuando el contador llegue a cero",
    current: "Precio actual:",
    after: "Después:"
  };
  const TimeBox = ({
    value,
    label
  }: {
    value: number;
    label: string;
  }) => <div className="flex flex-col items-center">
      <div className="bg-[#1a2332] text-white font-black text-4xl md:text-6xl rounded-2xl w-20 md:w-32 h-20 md:h-32 flex items-center justify-center shadow-2xl border-2 border-white/10 relative overflow-hidden">
        <span className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
        <span className="relative">{value.toString().padStart(2, "0")}</span>
      </div>
      <span className="text-xs md:text-sm text-white/90 mt-3 font-semibold uppercase tracking-widest">{label}</span>
    </div>;
  return (
    <section className="bg-gradient-to-r from-red-600 via-orange-500 to-red-600 py-6 md:py-8 relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0tNiA2aC0ydi00aDJ2NHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center text-center">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-6 h-6 text-yellow-300 animate-pulse" />
            <h3 className="text-xl md:text-2xl font-bold text-white uppercase tracking-wide">
              {labels.header}
            </h3>
            <Flame className="w-6 h-6 text-yellow-300 animate-pulse" />
          </div>

          {/* Timer Display */}
          <div className="flex items-center justify-center gap-3 md:gap-6 mb-6">
            <TimeBox value={timeLeft.hours} label={labels.hours} />
            <span className="text-4xl md:text-6xl font-bold text-white/80 -mt-6">:</span>
            <TimeBox value={timeLeft.minutes} label={labels.minutes} />
            <span className="text-4xl md:text-6xl font-bold text-white/80 -mt-6">:</span>
            <TimeBox value={timeLeft.seconds} label={labels.seconds} />
          </div>

          {/* Price Comparison */}
          <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-300" />
              <span className="text-white/90 font-medium">{labels.current}</span>
              <span className="text-2xl md:text-3xl font-black text-yellow-300">{currentPrice}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/70 font-medium">{labels.after}</span>
              <span className="text-xl md:text-2xl font-bold text-white/60 line-through">{originalPrice}</span>
            </div>
          </div>

          {/* Urgency Message */}
          <p className="text-sm md:text-base text-white/80 font-medium">
            ⚡ {labels.message}
          </p>
        </div>
      </div>
    </section>
  );
};