import { useState, useEffect } from "react";
import { Clock, Flame } from "lucide-react";

interface CountdownTimerProps {
  endDate?: Date;
  hoursFromNow?: number;
}

export const CountdownTimer = ({ 
  endDate, 
  hoursFromNow = 24 
}: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = endDate || new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
    
    // Store the target date in sessionStorage to persist across page refreshes
    const storageKey = "countdown_target";
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
  }, [endDate, hoursFromNow]);

  const TimeBox = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-foreground text-background font-bold text-2xl md:text-4xl rounded-lg w-16 md:w-20 h-16 md:h-20 flex items-center justify-center shadow-lg">
        {value.toString().padStart(2, "0")}
      </div>
      <span className="text-xs md:text-sm text-primary-foreground/80 mt-2 font-medium uppercase tracking-wide">
        {label}
      </span>
    </div>
  );

  return (
    <section className="py-6 gradient-accent relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-white/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="container px-4 md:px-6 relative">
        <div className="max-w-4xl mx-auto">
          {/* Urgency Header */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-primary-foreground animate-pulse" />
            <span className="text-primary-foreground font-bold text-sm md:text-base uppercase tracking-wider">
              ¡Oferta por tiempo limitado!
            </span>
            <Flame className="w-5 h-5 text-primary-foreground animate-pulse" />
          </div>

          {/* Main Message */}
          <h3 className="text-xl md:text-2xl font-bold text-primary-foreground text-center mb-6">
            El precio sube cuando el contador llegue a cero
          </h3>

          {/* Countdown */}
          <div className="flex items-center justify-center gap-3 md:gap-6 mb-6">
            <TimeBox value={timeLeft.hours} label="Horas" />
            <span className="text-3xl md:text-4xl font-bold text-primary-foreground/60">:</span>
            <TimeBox value={timeLeft.minutes} label="Minutos" />
            <span className="text-3xl md:text-4xl font-bold text-primary-foreground/60">:</span>
            <TimeBox value={timeLeft.seconds} label="Segundos" />
          </div>

          {/* Discount Badge */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              <Clock className="w-4 h-4 text-primary-foreground" />
              <span className="text-primary-foreground font-medium text-sm">
                Precio actual: <span className="font-bold">$14 USD</span>
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <span className="text-primary-foreground/80 text-sm">
                Después: <span className="line-through">$100 USD</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
