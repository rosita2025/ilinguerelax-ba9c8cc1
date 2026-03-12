import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Sale {
  name: string;
  country: string;
  timeAgo: string;
}

// Sales for Spanish speakers learning English (Latin America) - more realistic time ranges
const latinSalesPeople: Sale[] = [
  { name: "María García", country: "México", timeAgo: "hace 1 hora" },
  { name: "Carlos López", country: "España", timeAgo: "hace 3 horas" },
  { name: "Ana Martínez", country: "Argentina", timeAgo: "hace 5 horas" },
  { name: "Pedro Sánchez", country: "Colombia", timeAgo: "hace 8 horas" },
  { name: "Laura Rodríguez", country: "Chile", timeAgo: "hace 1 día" },
  { name: "José Hernández", country: "Perú", timeAgo: "hace 1 día" },
  { name: "Carmen Díaz", country: "Ecuador", timeAgo: "hace 2 días" },
  { name: "Miguel Torres", country: "Venezuela", timeAgo: "hace 2 días" },
  { name: "Sofía Ramírez", country: "Guatemala", timeAgo: "hace 3 días" },
  { name: "Diego Morales", country: "Costa Rica", timeAgo: "hace 3 días" },
  { name: "Valentina Ruiz", country: "Uruguay", timeAgo: "hace 4 días" },
  { name: "Fernando Castro", country: "Panamá", timeAgo: "hace 5 días" },
];

// Sales for English speakers learning Spanish (Europe, USA, Canada, Asia) - more realistic time ranges
const internationalSalesPeople: Sale[] = [
  { name: "Sarah Johnson", country: "United States", timeAgo: "1 hour ago" },
  { name: "James Smith", country: "United Kingdom", timeAgo: "3 hours ago" },
  { name: "Emily Brown", country: "Canada", timeAgo: "5 hours ago" },
  { name: "Michael Davis", country: "Australia", timeAgo: "8 hours ago" },
  { name: "Sophie Martin", country: "France", timeAgo: "1 day ago" },
  { name: "Thomas Mueller", country: "Germany", timeAgo: "1 day ago" },
  { name: "Emma Wilson", country: "Ireland", timeAgo: "2 days ago" },
  { name: "David Anderson", country: "Scotland", timeAgo: "2 days ago" },
  { name: "Olivia Taylor", country: "New Zealand", timeAgo: "3 days ago" },
  { name: "William Thompson", country: "Netherlands", timeAgo: "3 days ago" },
  { name: "Charlotte White", country: "Sweden", timeAgo: "4 days ago" },
  { name: "Daniel Lee", country: "Singapore", timeAgo: "4 days ago" },
  { name: "Mia Jackson", country: "South Africa", timeAgo: "5 days ago" },
  { name: "Alexander Harris", country: "Norway", timeAgo: "5 days ago" },
  { name: "Yuki Tanaka", country: "Japan", timeAgo: "6 days ago" },
  { name: "Benjamin Clark", country: "Belgium", timeAgo: "1 week ago" },
];

interface SalesNotificationProps {
  productName?: string;
  productLabel?: string;
  variant?: "latin" | "international";
}

const SalesNotification = ({ 
  productName = "5,000 Palabras en Inglés",
  productLabel = "5,000",
  variant = "latin"
}: SalesNotificationProps) => {
  const salesPeople = variant === "international" ? internationalSalesPeople : latinSalesPeople;
  const [currentSale, setCurrentSale] = useState<Sale>(salesPeople[0]);
  const [isVisible, setIsVisible] = useState(false);
  const [saleIndex, setSaleIndex] = useState(0);

  useEffect(() => {
    // Show first notification after 5 seconds (more natural delay)
    const initialTimeout = setTimeout(() => {
      setIsVisible(true);
    }, 5000);

    return () => clearTimeout(initialTimeout);
  }, []);

  useEffect(() => {
    // Random interval between 7-10 seconds
    const getRandomInterval = () => {
      const minInterval = 7 * 1000; // 7 seconds
      const maxInterval = 10 * 1000; // 10 seconds
      return Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval;
    };

    let intervalId: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      const nextInterval = getRandomInterval();
      intervalId = setTimeout(() => {
        // Hide current notification
        setIsVisible(false);
        
        // After 500ms (fade out), show next notification
        setTimeout(() => {
          setSaleIndex(prev => {
            const nextIndex = (prev + 1) % salesPeople.length;
            setCurrentSale(salesPeople[nextIndex]);
            return nextIndex;
          });
          setIsVisible(true);
        }, 500);

        // Schedule the next notification
        scheduleNext();
      }, nextInterval);
    };

    // Start the cycle after initial display (show first one for 15 seconds)
    const firstTimeout = setTimeout(() => {
      scheduleNext();
    }, 15000);

    return () => {
      clearTimeout(firstTimeout);
      clearTimeout(intervalId);
    };
  }, [salesPeople]);

  const handleClose = () => {
    setIsVisible(false);
    // Don't auto-resume - user dismissed it, wait for next cycle
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ x: -100, opacity: 0, scale: 0.8 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: -100, opacity: 0, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25,
            duration: 0.5 
          }}
          className="fixed top-4 left-4 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-2 md:p-3 max-w-[280px] md:max-w-xs"
        >
          <button 
            onClick={handleClose}
            className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 bg-gray-100 hover:bg-gray-200 rounded-full p-0.5 md:p-1 transition-colors"
          >
            <X className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-500" />
          </button>
          
          <div className="flex items-center gap-2 md:gap-3">
            {/* Product thumbnail */}
            <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-400 rounded flex items-center justify-center shrink-0">
              <span className="text-[5px] md:text-[6px] font-bold text-black text-center leading-tight">
                {productLabel}<br/>{variant === "international" ? "WORDS" : "PALABRAS"}
              </span>
            </div>
            
            {/* Sale info - horizontal layout */}
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-center gap-1 flex-wrap">
                <p className="text-[10px] md:text-xs font-semibold text-gray-800 truncate">
                  {currentSale.name}
                </p>
                <span className="text-[9px] md:text-[10px] text-gray-400">•</span>
                <p className="text-[9px] md:text-[10px] text-gray-500 truncate">
                  {currentSale.country}
                </p>
              </div>
              <p className="text-[9px] md:text-xs text-gray-600 truncate">
                {variant === "international" ? `Purchased ${productName}` : `Compró ${productName}`}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[8px] md:text-[10px] text-green-600 font-medium">{variant === "international" ? "✓ Verified" : "✓ Verificado"}</span>
                <span className="text-[8px] md:text-[9px] text-gray-400">{currentSale.timeAgo}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SalesNotification;
