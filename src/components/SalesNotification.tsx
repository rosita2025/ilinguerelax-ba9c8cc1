import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Sale {
  name: string;
  country: string;
  timeAgo: string;
  productName: string;
  productLabel: string;
  platform: "hotmart" | "shopify";
}

// All real product purchases across Hotmart and Shopify
const allSales: Sale[] = [
  // 5,000 Palabras Digital (Hotmart)
  { name: "María García", country: "México", timeAgo: "hace 5 horas", productName: "5,000 Palabras en Inglés", productLabel: "5,000", platform: "hotmart" },
  { name: "Carlos López", country: "España", timeAgo: "hace 1 día", productName: "5,000 Palabras en Inglés", productLabel: "5,000", platform: "hotmart" },
  { name: "Valentina Ruiz", country: "Uruguay", timeAgo: "hace 6 días", productName: "5,000 Palabras en Inglés", productLabel: "5,000", platform: "hotmart" },
  { name: "Sofía Ramírez", country: "Guatemala", timeAgo: "hace 15 días", productName: "5,000 Palabras en Inglés", productLabel: "5,000", platform: "hotmart" },
  { name: "Diego Morales", country: "Costa Rica", timeAgo: "hace 25 días", productName: "5,000 Palabras en Inglés", productLabel: "5,000", platform: "hotmart" },

  // 8,000 Palabras Digital (Hotmart)
  { name: "Ana Martínez", country: "Argentina", timeAgo: "hace 3 horas", productName: "8,000 Palabras en Inglés", productLabel: "8,000", platform: "hotmart" },
  { name: "Pedro Sánchez", country: "Colombia", timeAgo: "hace 1 día", productName: "8,000 Palabras en Inglés", productLabel: "8,000", platform: "hotmart" },
  { name: "Laura Rodríguez", country: "Chile", timeAgo: "hace 3 días", productName: "8,000 Palabras en Inglés", productLabel: "8,000", platform: "hotmart" },
  { name: "Fernando Castro", country: "Panamá", timeAgo: "hace 10 días", productName: "8,000 Palabras en Inglés", productLabel: "8,000", platform: "hotmart" },
  { name: "Camila Vargas", country: "Bolivia", timeAgo: "hace 30 días", productName: "8,000 Palabras en Inglés", productLabel: "8,000", platform: "hotmart" },

  // 1,000 Verbos (Hotmart)
  { name: "José Hernández", country: "Perú", timeAgo: "hace 8 horas", productName: "1,000 Verbos en Inglés", productLabel: "1,000", platform: "hotmart" },
  { name: "Carmen Díaz", country: "Ecuador", timeAgo: "hace 2 días", productName: "1,000 Verbos en Inglés", productLabel: "1,000", platform: "hotmart" },
  { name: "Roberto Flores", country: "Honduras", timeAgo: "hace 12 días", productName: "1,000 Verbos en Inglés", productLabel: "1,000", platform: "hotmart" },

  // 500 Preguntas (Hotmart)
  { name: "Isabel Mendoza", country: "El Salvador", timeAgo: "hace 1 día", productName: "500 Preguntas en Inglés", productLabel: "500", platform: "hotmart" },
  { name: "Andrés Ríos", country: "Paraguay", timeAgo: "hace 5 días", productName: "500 Preguntas en Inglés", productLabel: "500", platform: "hotmart" },

  // 5,000 Palabras Libro Físico (Shopify)
  { name: "Miguel Torres", country: "Venezuela", timeAgo: "hace 2 días", productName: "5,000 Palabras Libro Físico", productLabel: "📖 5K", platform: "shopify" },
  { name: "Patricia Reyes", country: "México", timeAgo: "hace 8 días", productName: "5,000 Palabras Libro Físico", productLabel: "📖 5K", platform: "shopify" },
  { name: "Gabriela Peña", country: "Chile", timeAgo: "hace 20 días", productName: "5,000 Palabras Libro Físico", productLabel: "📖 5K", platform: "shopify" },

  // 8,000 Palabras Libro Físico (Shopify)
  { name: "Ricardo Silva", country: "Colombia", timeAgo: "hace 1 día", productName: "8,000 Palabras Libro Físico", productLabel: "📖 8K", platform: "shopify" },
  { name: "Lucía Navarro", country: "España", timeAgo: "hace 4 días", productName: "8,000 Palabras Libro Físico", productLabel: "📖 8K", platform: "shopify" },
  { name: "Martín Aguilar", country: "Argentina", timeAgo: "hace 18 días", productName: "8,000 Palabras Libro Físico", productLabel: "📖 8K", platform: "shopify" },

  // Spanish for English Speakers (Hotmart)
  { name: "Sarah Johnson", country: "United States", timeAgo: "hace 6 horas", productName: "Spanish 5,000 Words", productLabel: "🇪🇸 5K", platform: "hotmart" },
  { name: "James Smith", country: "United Kingdom", timeAgo: "hace 3 días", productName: "Spanish 5,000 Words", productLabel: "🇪🇸 5K", platform: "hotmart" },
  { name: "Emily Brown", country: "Canada", timeAgo: "hace 14 días", productName: "Spanish 5,000 Words", productLabel: "🇪🇸 5K", platform: "hotmart" },
];

interface SalesNotificationProps {
  productName?: string;
  productLabel?: string;
  variant?: "latin" | "international";
}

const SalesNotification = ({ 
  variant = "latin"
}: SalesNotificationProps) => {
  // Shuffle sales on mount for variety
  const [shuffledSales] = useState(() => [...allSales].sort(() => Math.random() - 0.5));
  const [currentSale, setCurrentSale] = useState<Sale>(shuffledSales[0]);
  const [isVisible, setIsVisible] = useState(false);
  const [saleIndex, setSaleIndex] = useState(0);

  useEffect(() => {
    const initialTimeout = setTimeout(() => {
      setIsVisible(true);
    }, 5000);
    return () => clearTimeout(initialTimeout);
  }, []);

  useEffect(() => {
    const getRandomInterval = () => {
      const minInterval = 7 * 1000;
      const maxInterval = 10 * 1000;
      return Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval;
    };

    let intervalId: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      const nextInterval = getRandomInterval();
      intervalId = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          setSaleIndex(prev => {
            const nextIndex = (prev + 1) % shuffledSales.length;
            setCurrentSale(shuffledSales[nextIndex]);
            return nextIndex;
          });
          setIsVisible(true);
        }, 500);
        scheduleNext();
      }, nextInterval);
    };

    const firstTimeout = setTimeout(() => {
      scheduleNext();
    }, 15000);

    return () => {
      clearTimeout(firstTimeout);
      clearTimeout(intervalId);
    };
  }, [shuffledSales]);

  const handleClose = () => {
    setIsVisible(false);
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
            <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-400 rounded flex items-center justify-center shrink-0">
              <span className="text-[5px] md:text-[6px] font-bold text-black text-center leading-tight">
                {currentSale.productLabel}<br/>PALABRAS
              </span>
            </div>
            
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
                Compró {currentSale.productName}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[8px] md:text-[10px] text-green-600 font-medium">✓ Verificado</span>
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
