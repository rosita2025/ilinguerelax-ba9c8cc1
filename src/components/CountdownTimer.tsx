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
  return;
};