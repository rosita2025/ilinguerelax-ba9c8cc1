import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Sale {
  name: string;
  country: string;
  timeAgo: string;
}

// Sales for Spanish speakers learning English (Latin America)
const latinSalesPeople: Sale[] = [
  { name: "María García", country: "México", timeAgo: "hace 2 min" },
  { name: "Carlos López", country: "España", timeAgo: "hace 5 min" },
  { name: "Ana Martínez", country: "Argentina", timeAgo: "hace 8 min" },
  { name: "Pedro Sánchez", country: "Colombia", timeAgo: "hace 12 min" },
  { name: "Laura Rodríguez", country: "Chile", timeAgo: "hace 15 min" },
  { name: "José Hernández", country: "Perú", timeAgo: "hace 18 min" },
  { name: "Carmen Díaz", country: "Ecuador", timeAgo: "hace 22 min" },
  { name: "Miguel Torres", country: "Venezuela", timeAgo: "hace 25 min" },
  { name: "Sofía Ramírez", country: "Guatemala", timeAgo: "hace 28 min" },
  { name: "Diego Morales", country: "Costa Rica", timeAgo: "hace 32 min" },
  { name: "Valentina Ruiz", country: "Uruguay", timeAgo: "hace 35 min" },
  { name: "Fernando Castro", country: "Panamá", timeAgo: "hace 38 min" },
];

// Sales for English speakers learning Spanish (Europe, USA, Canada, Asia)
const internationalSalesPeople: Sale[] = [
  { name: "Sarah Johnson", country: "United States", timeAgo: "2 min ago" },
  { name: "James Smith", country: "United Kingdom", timeAgo: "5 min ago" },
  { name: "Emily Brown", country: "Canada", timeAgo: "8 min ago" },
  { name: "Michael Davis", country: "Australia", timeAgo: "12 min ago" },
  { name: "Sophie Martin", country: "France", timeAgo: "15 min ago" },
  { name: "Thomas Mueller", country: "Germany", timeAgo: "18 min ago" },
  { name: "Emma Wilson", country: "Ireland", timeAgo: "22 min ago" },
  { name: "David Anderson", country: "Scotland", timeAgo: "25 min ago" },
  { name: "Olivia Taylor", country: "New Zealand", timeAgo: "28 min ago" },
  { name: "William Thompson", country: "Netherlands", timeAgo: "32 min ago" },
  { name: "Charlotte White", country: "Sweden", timeAgo: "35 min ago" },
  { name: "Daniel Lee", country: "Singapore", timeAgo: "38 min ago" },
  { name: "Mia Jackson", country: "South Africa", timeAgo: "42 min ago" },
  { name: "Alexander Harris", country: "Norway", timeAgo: "45 min ago" },
  { name: "Yuki Tanaka", country: "Japan", timeAgo: "48 min ago" },
  { name: "Benjamin Clark", country: "Belgium", timeAgo: "52 min ago" },
  { name: "Grace Robinson", country: "Denmark", timeAgo: "55 min ago" },
  { name: "Ethan Lewis", country: "Switzerland", timeAgo: "58 min ago" },
  { name: "Chloe Walker", country: "Austria", timeAgo: "1 hour ago" },
  { name: "Ryan Kim", country: "South Korea", timeAgo: "1 hour ago" },
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
    // Show first notification after 2 seconds
    const initialTimeout = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(initialTimeout);
  }, []);

  useEffect(() => {
    // Cycle through notifications
    const interval = setInterval(() => {
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
    }, 8000); // Show each notification for 8 seconds

    return () => clearInterval(interval);
  }, [salesPeople]);

  const handleClose = () => {
    setIsVisible(false);
    // Resume after 5 seconds
    setTimeout(() => setIsVisible(true), 5000);
  };

  return (
    <div 
      className={`fixed top-4 left-4 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-2 md:p-3 max-w-[280px] md:max-w-xs transform transition-all duration-500 ${
        isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
      }`}
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
    </div>
  );
};

export default SalesNotification;
