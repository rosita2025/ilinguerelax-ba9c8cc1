import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

type ProductKey =
  | "spanish5000"
  | "english5000"
  | "english8000"
  | "verbs1000"
  | "questions500"
  | "book5000"
  | "book8000";

interface RealSale {
  name: string;
  country: string | null;
  sku: string | null;
  productName: string;
  provider: string;
  soldAt: string;
}

/** Canonical SKUs (or shopify product_key) per product page */
const SKUS_BY_KEY: Record<ProductKey, string[]> = {
  english5000: ["5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa"],
  english8000: ["8-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa"],
  verbs1000: ["1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion"],
  questions500: ["500-preguntas-en-ingles-con-pronunciacion-para-hispanohablantes"],
  book5000: ["5-000-palabras-libro-fisico"],
  book8000: ["8-000-palabras-libro-fisico"],
  spanish5000: [
    "5-000-spanish-words-with-english-pronunciation-digital",
    "5-000-spanish-words-with-english-pronunciation-physical",
    "5000-words-spanish-relax-with-english-pronunciation-spanish-relax-cmb7",
    "spanish5000",
  ],
};

const PROVIDER_LABEL: Record<string, string> = {
  stripe: "Stripe",
  dlocalgo: "dLocal Go",
  mercadopago: "Mercado Pago",
  hotmart: "Hotmart",
  binance: "Binance Pay",
  shopify: "Shopify",
  manual: "Transferencia",
};

const COUNTRY_NAMES: Record<string, { es: string; en: string; flag: string }> = {
  US: { es: "Estados Unidos", en: "United States", flag: "🇺🇸" },
  MX: { es: "México", en: "Mexico", flag: "🇲🇽" },
  ES: { es: "España", en: "Spain", flag: "🇪🇸" },
  PE: { es: "Perú", en: "Peru", flag: "🇵🇪" },
  CO: { es: "Colombia", en: "Colombia", flag: "🇨🇴" },
  AR: { es: "Argentina", en: "Argentina", flag: "🇦🇷" },
  CL: { es: "Chile", en: "Chile", flag: "🇨🇱" },
  EC: { es: "Ecuador", en: "Ecuador", flag: "🇪🇨" },
  VE: { es: "Venezuela", en: "Venezuela", flag: "🇻🇪" },
  BO: { es: "Bolivia", en: "Bolivia", flag: "🇧🇴" },
  UY: { es: "Uruguay", en: "Uruguay", flag: "🇺🇾" },
  PY: { es: "Paraguay", en: "Paraguay", flag: "🇵🇾" },
  BR: { es: "Brasil", en: "Brazil", flag: "🇧🇷" },
  CR: { es: "Costa Rica", en: "Costa Rica", flag: "🇨🇷" },
  GT: { es: "Guatemala", en: "Guatemala", flag: "🇬🇹" },
  PA: { es: "Panamá", en: "Panama", flag: "🇵🇦" },
  DO: { es: "Rep. Dominicana", en: "Dominican Rep.", flag: "🇩🇴" },
  PR: { es: "Puerto Rico", en: "Puerto Rico", flag: "🇵🇷" },
  HN: { es: "Honduras", en: "Honduras", flag: "🇭🇳" },
  SV: { es: "El Salvador", en: "El Salvador", flag: "🇸🇻" },
  NI: { es: "Nicaragua", en: "Nicaragua", flag: "🇳🇮" },
  CA: { es: "Canadá", en: "Canada", flag: "🇨🇦" },
  GB: { es: "Reino Unido", en: "United Kingdom", flag: "🇬🇧" },
  IE: { es: "Irlanda", en: "Ireland", flag: "🇮🇪" },
  AU: { es: "Australia", en: "Australia", flag: "🇦🇺" },
  DE: { es: "Alemania", en: "Germany", flag: "🇩🇪" },
  FR: { es: "Francia", en: "France", flag: "🇫🇷" },
  IT: { es: "Italia", en: "Italy", flag: "🇮🇹" },
  PT: { es: "Portugal", en: "Portugal", flag: "🇵🇹" },
  NL: { es: "Países Bajos", en: "Netherlands", flag: "🇳🇱" },
  CH: { es: "Suiza", en: "Switzerland", flag: "🇨🇭" },
  JP: { es: "Japón", en: "Japan", flag: "🇯🇵" },
  KR: { es: "Corea del Sur", en: "South Korea", flag: "🇰🇷" },
};

interface SalesNotificationProps {
  productName?: string;
  productLabel?: string;
  variant?: "latin" | "international";
  /** UI language for the notification copy. Defaults to "es". */
  lang?: "es" | "en";
  /** When provided, filters notifications to only this product. */
  productKey?: ProductKey;
}

const SalesNotification = ({
  lang = "es",
  productKey,
}: SalesNotificationProps) => {
  const [sales, setSales] = useState<RealSale[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [saleIndex, setSaleIndex] = useState(0);

  // Load REAL sales (Stripe, dLocal Go, Mercado Pago, Hotmart, Binance, Shopify, transfers)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("recent-sales");
        if (cancelled || error) return;
        const all: RealSale[] = (data as any)?.sales ?? [];
        const wanted = productKey ? SKUS_BY_KEY[productKey] : null;
        const filtered = wanted ? all.filter((s) => s.sku && wanted.includes(s.sku)) : all;
        const pool = filtered.length > 0 ? filtered : all;
        if (pool.length === 0) return;
        setSales(pool);
        setSaleIndex(0);
      } catch (e) {
        console.warn("recent-sales fetch failed", e);
      }
    })();
    return () => { cancelled = true; };
  }, [productKey]);

  const currentSale = sales[saleIndex] ?? null;

  useEffect(() => {
    if (sales.length === 0) return;
    const t = setTimeout(() => setIsVisible(true), 5000);
    return () => clearTimeout(t);
  }, [sales.length]);

  useEffect(() => {
    if (sales.length === 0) return;
    let intervalId: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      const nextInterval = Math.floor(Math.random() * 3001) + 7000;
      intervalId = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          setSaleIndex((prev) => (prev + 1) % sales.length);
          setIsVisible(true);
        }, 500);
        scheduleNext();
      }, nextInterval);
    };

    const firstTimeout = setTimeout(scheduleNext, 15000);
    return () => {
      clearTimeout(firstTimeout);
      clearTimeout(intervalId);
    };
  }, [sales]);

  const timeAgo = useMemo(() => {
    if (!currentSale) return "";
    const mins = Math.max(1, Math.floor((Date.now() - new Date(currentSale.soldAt).getTime()) / 60000));
    if (mins < 60) return lang === "en" ? `${mins} min ago` : `hace ${mins} min`;
    const h = Math.floor(mins / 60);
    if (h < 24) return lang === "en" ? `${h}h ago` : `hace ${h} h`;
    const d = Math.floor(h / 24);
    return lang === "en" ? `${d}d ago` : `hace ${d} d`;
  }, [currentSale, lang]);

  if (!currentSale) return null;

  const code = (currentSale.country ?? "").toUpperCase();
  const countryInfo = COUNTRY_NAMES[code];
  const countryLabel = countryInfo
    ? `${countryInfo.flag} ${lang === "en" ? countryInfo.en : countryInfo.es}`
    : code || (lang === "en" ? "International" : "Internacional");
  const providerLabel = PROVIDER_LABEL[currentSale.provider] ?? currentSale.provider;
  const dateLabel = new Date(currentSale.soldAt).toLocaleDateString(lang === "en" ? "en-US" : "es-ES", {
    day: "2-digit",
    month: "short",
  });

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: -100, opacity: 0, scale: 0.8 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: -100, opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, duration: 0.5 }}
          className="fixed top-4 left-4 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-2 md:p-3 max-w-[280px] md:max-w-xs"
        >
          <button
            onClick={() => setIsVisible(false)}
            className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 bg-gray-100 hover:bg-gray-200 rounded-full p-0.5 md:p-1 transition-colors"
          >
            <X className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-500" />
          </button>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-400 rounded flex items-center justify-center shrink-0">
              <span className="text-[7px] md:text-[8px] font-bold text-black text-center leading-tight">
                ✓<br />{lang === "en" ? "REAL" : "REAL"}
              </span>
            </div>

            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-center gap-1 flex-wrap">
                <p className="text-[10px] md:text-xs font-semibold text-gray-800 truncate">
                  {currentSale.name}
                </p>
                <span className="text-[9px] md:text-[10px] text-muted-foreground">•</span>
                <p className="text-[9px] md:text-[10px] text-gray-500 truncate">
                  {countryLabel}
                </p>
              </div>
              <p className="text-[9px] md:text-xs text-gray-600 line-clamp-2">
                {lang === "en" ? "Purchased" : "Compró"} {currentSale.productName}
              </p>
              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                <span className="text-[8px] md:text-[10px] text-green-600 font-medium">
                  ✓ {lang === "en" ? "Verified Purchase" : "Compra Verificada"}
                </span>
                <span className="text-[8px] md:text-[9px] text-muted-foreground">
                  {providerLabel} · {dateLabel} · {timeAgo}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SalesNotification;
