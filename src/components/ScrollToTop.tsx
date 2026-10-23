import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ScrollToTopProps {
  showAfter?: number;
}

export const ScrollToTop = ({ showAfter = 400 }: ScrollToTopProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > showAfter) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, [showAfter]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={scrollToTop}
          className="fixed bottom-[var(--sticky-bar-h,105px)] translate-y-[-10px] left-3 sm:left-4 z-[60] w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-primary/80 sm:bg-primary shadow-lg ring-2 ring-background hover:bg-primary/90 transition-colors flex items-center justify-center group touch-manipulation"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5 text-primary-foreground group-hover:animate-bounce" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
