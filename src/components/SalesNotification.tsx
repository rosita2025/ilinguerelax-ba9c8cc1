import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Sale {
  name: string;
  country: string;
  product: string;
  timeAgo: string;
}

const salesData: Sale[] = [
  { name: "María García", country: "México", product: "5,000 Palabras en Inglés", timeAgo: "hace 2 min" },
  { name: "Carlos López", country: "España", product: "5,000 Palabras en Inglés", timeAgo: "hace 5 min" },
  { name: "Ana Martínez", country: "Argentina", product: "5,000 Palabras en Inglés", timeAgo: "hace 8 min" },
  { name: "Pedro Sánchez", country: "Colombia", product: "5,000 Palabras en Inglés", timeAgo: "hace 12 min" },
  { name: "Laura Rodríguez", country: "Chile", product: "5,000 Palabras en Inglés", timeAgo: "hace 15 min" },
  { name: "José Hernández", country: "Perú", product: "5,000 Palabras en Inglés", timeAgo: "hace 18 min" },
  { name: "Carmen Díaz", country: "Ecuador", product: "5,000 Palabras en Inglés", timeAgo: "hace 22 min" },
  { name: "Miguel Torres", country: "Venezuela", product: "5,000 Palabras en Inglés", timeAgo: "hace 25 min" },
  { name: "Sofía Ramírez", country: "Guatemala", product: "5,000 Palabras en Inglés", timeAgo: "hace 28 min" },
  { name: "Diego Morales", country: "Costa Rica", product: "5,000 Palabras en Inglés", timeAgo: "hace 32 min" },
  { name: "Valentina Ruiz", country: "Uruguay", product: "5,000 Palabras en Inglés", timeAgo: "hace 35 min" },
  { name: "Fernando Castro", country: "Panamá", product: "5,000 Palabras en Inglés", timeAgo: "hace 38 min" },
  { name: "Isabella Vargas", country: "Honduras", product: "5,000 Palabras en Inglés", timeAgo: "hace 42 min" },
  { name: "Andrés Mendoza", country: "Bolivia", product: "5,000 Palabras en Inglés", timeAgo: "hace 45 min" },
  { name: "Lucía Flores", country: "El Salvador", product: "5,000 Palabras en Inglés", timeAgo: "hace 48 min" },
  { name: "Roberto Jiménez", country: "Paraguay", product: "5,000 Palabras en Inglés", timeAgo: "hace 52 min" },
  { name: "Camila Ortega", country: "Nicaragua", product: "5,000 Palabras en Inglés", timeAgo: "hace 55 min" },
  { name: "Alejandro Reyes", country: "Puerto Rico", product: "5,000 Palabras en Inglés", timeAgo: "hace 58 min" },
  { name: "Paula Vega", country: "República Dominicana", product: "5,000 Palabras en Inglés", timeAgo: "hace 1 hora" },
  { name: "Javier Navarro", country: "Cuba", product: "5,000 Palabras en Inglés", timeAgo: "hace 1 hora" },
  { name: "Daniela Molina", country: "Estados Unidos", product: "5,000 Palabras en Inglés", timeAgo: "hace 1 hora" },
  { name: "Martín Aguirre", country: "Brasil", product: "5,000 Palabras en Inglés", timeAgo: "hace 1 hora" },
  { name: "Gabriela Peña", country: "Canadá", product: "5,000 Palabras en Inglés", timeAgo: "hace 2 horas" },
  { name: "Ricardo Salazar", country: "Alemania", product: "5,000 Palabras en Inglés", timeAgo: "hace 2 horas" },
];

const SalesNotification = () => {
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [saleIndex, setSaleIndex] = useState(0);

  useEffect(() => {
    // Show first notification after 2 seconds
    const initialTimeout = setTimeout(() => {
      setCurrentSale(salesData[0]);
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(initialTimeout);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    // Hide notification after 3 seconds
    const hideTimeout = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    // Show next notification after 6 seconds (3s visible + 3s hidden)
    const nextTimeout = setTimeout(() => {
      const nextIndex = (saleIndex + 1) % salesData.length;
      setSaleIndex(nextIndex);
      setCurrentSale(salesData[nextIndex]);
      setIsVisible(true);
    }, 6000);

    return () => {
      clearTimeout(hideTimeout);
      clearTimeout(nextTimeout);
    };
  }, [isVisible, saleIndex]);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!currentSale || !isVisible) return null;

  return (
    <div 
      className={`fixed bottom-4 left-4 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-3 max-w-xs transform transition-all duration-500 ${
        isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
      }`}
    >
      <button 
        onClick={handleClose}
        className="absolute -top-2 -right-2 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors"
      >
        <X className="w-3 h-3 text-gray-500" />
      </button>
      
      <div className="flex items-start gap-3">
        {/* Product thumbnail */}
        <div className="w-12 h-12 bg-yellow-400 rounded-md flex items-center justify-center shrink-0">
          <span className="text-[6px] font-bold text-black text-center leading-tight">
            5,000<br/>PALABRAS
          </span>
        </div>
        
        {/* Sale info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500">
            Comprado en {currentSale.country}
          </p>
          <p className="text-sm font-semibold text-gray-800 truncate">
            {currentSale.name}
          </p>
          <p className="text-xs text-gray-600 truncate">
            {currentSale.product}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {currentSale.timeAgo}
          </p>
        </div>
      </div>
      
      {/* Verified badge */}
      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
        <span className="text-[10px] text-green-600 font-medium">✓ Compra verificada</span>
      </div>
    </div>
  );
};

export default SalesNotification;
