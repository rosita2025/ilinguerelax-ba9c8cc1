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
          className="fixed left-4 z-[60] w-14 h-14 rounded-full bg-primary shadow-xl ring-2 ring-background hover:bg-primary/90 transition-colors flex items-center justify-center group touch-manipulation"
          style={{
            // Stay clear of the sticky buy bar and the WhatsApp button on the right,
            // stacking above whatever height the bar currently has.
            bottom: "calc(var(--sticky-bar-h, 0px) + 112px + env(safe-area-inset-bottom, 0px))",
          }}
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5 text-primary-foreground group-hover:animate-bounce" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
