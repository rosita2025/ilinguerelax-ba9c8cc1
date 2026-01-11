import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Sale {
  name: string;
  country: string;
  timeAgo: string;
}

const salesPeople: Sale[] = [
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
  { name: "Isabella Vargas", country: "Honduras", timeAgo: "hace 42 min" },
  { name: "Andrés Mendoza", country: "Bolivia", timeAgo: "hace 45 min" },
  { name: "Lucía Flores", country: "El Salvador", timeAgo: "hace 48 min" },
  { name: "Roberto Jiménez", country: "Paraguay", timeAgo: "hace 52 min" },
  { name: "Camila Ortega", country: "Nicaragua", timeAgo: "hace 55 min" },
  { name: "Alejandro Reyes", country: "Puerto Rico", timeAgo: "hace 58 min" },
  { name: "Paula Vega", country: "República Dominicana", timeAgo: "hace 1 hora" },
  { name: "Javier Navarro", country: "Cuba", timeAgo: "hace 1 hora" },
  { name: "Daniela Molina", country: "Estados Unidos", timeAgo: "hace 1 hora" },
  { name: "Martín Aguirre", country: "Brasil", timeAgo: "hace 1 hora" },
  { name: "Gabriela Peña", country: "Canadá", timeAgo: "hace 2 horas" },
  { name: "Ricardo Salazar", country: "Alemania", timeAgo: "hace 2 horas" },
];

interface SalesNotificationProps {
  productName?: string;
  productLabel?: string;
}

const SalesNotification = ({ 
  productName = "5,000 Palabras en Inglés",
  productLabel = "5,000"
}: SalesNotificationProps) => {
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
  }, []);

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
            {productLabel}<br/>PALABRAS
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
            Compró {productName}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[8px] md:text-[10px] text-green-600 font-medium">✓ Verificado</span>
            <span className="text-[8px] md:text-[9px] text-gray-400">{currentSale.timeAgo}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesNotification;
