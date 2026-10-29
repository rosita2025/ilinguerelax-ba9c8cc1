import { useState, useEffect, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

type ProductKey =
  | "spanish5000"
  | "english5000"
  | "english8000"
  | "verbs1000"
  | "questions500"
  | "book5000"
  | "book8000"
  | "patrones";

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
  patrones: ["patrones-especiales-alfabeto-combinaciones-secretas-ingles"],
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
  /** Portada del producto: se muestra como miniatura (si no, un círculo verde con check). */
  productImage?: string;
}

const SalesNotification = ({
  lang = "es",
  productKey,
  productImage,
}: SalesNotificationProps) => {
  const [sales, setSales] = useState<RealSale[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [saleIndex, setSaleIndex] = useState(0);
  // Si la persona cierra el aviso con la X, no vuelve a salir durante esta visita.
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem("ilr_sales_notif_closed") === "1"; } catch { return false; }
  });
  const closeForGood = () => {
    setIsVisible(false);
    setDismissed(true);
    try { sessionStorage.setItem("ilr_sales_notif_closed", "1"); } catch { /* sin almacenamiento */ }
  };

  // Load REAL sales (Stripe, dLocal Go, Mercado Pago, Hotmart, Binance, Shopify, transfers)
  useEffect(() => {
    if (dismissed) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("recent-sales");
        if (cancelled || error) return;
        const all: RealSale[] = (data as any)?.sales ?? [];
        const wanted = productKey ? SKUS_BY_KEY[productKey] : null;
        const filtered = wanted ? all.filter((s) => s.sku && wanted.includes(s.sku)) : all;
        const base = filtered.length > 0 ? filtered : all;
        // Siempre ventas reales; si hay recientes (últimos 30 días) se muestran primero esas.
        const recent = base.filter((s) => Date.now() - new Date(s.soldAt).getTime() < 30 * 86400000);
        const pool = recent.length > 0 ? recent : base;
        if (pool.length === 0) return;
        setSales(pool);
        setSaleIndex(0);
      } catch (e) {
        console.warn("recent-sales fetch failed", e);
      }
    })();
    return () => { cancelled = true; };
  }, [productKey, dismissed]);

  const currentSale = sales[saleIndex] ?? null;

  useEffect(() => {
    if (sales.length === 0 || dismissed) return;
    const t = setTimeout(() => setIsVisible(true), 5000);
    return () => clearTimeout(t);
  }, [sales.length, dismissed]);

  useEffect(() => {
    if (sales.length === 0 || dismissed) return;
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
  }, [sales, dismissed]);

  const timeAgo = useMemo(() => {
    if (!currentSale) return "";
    const mins = Math.max(1, Math.floor((Date.now() - new Date(currentSale.soldAt).getTime()) / 60000));
    if (mins < 60) return lang === "en" ? `${mins} min ago` : `hace ${mins} min`;
    const h = Math.floor(mins / 60);
    if (h < 24) return lang === "en" ? `${h}h ago` : `hace ${h} h`;
    const d = Math.floor(h / 24);
    return lang === "en" ? `${d}d ago` : `hace ${d} d`;
  }, [currentSale, lang]);

  if (!currentSale || dismissed) return null;

  const code = (currentSale.country ?? "").toUpperCase();
  const countryInfo = COUNTRY_NAMES[code];
  const countryLabel = countryInfo
    ? `${countryInfo.flag} ${lang === "en" ? countryInfo.en : countryInfo.es}`
    : code || (lang === "en" ? "International" : "Internacional");
  const providerLabel = PROVIDER_LABEL[currentSale.provider] ?? currentSale.provider;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: -100, opacity: 0, scale: 0.8 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: -100, opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, duration: 0.5 }}
          className="fixed left-3 sm:left-4 bottom-[calc(var(--sticky-bar-h,105px)+64px)] sm:bottom-[calc(var(--sticky-bar-h,105px)+78px)] z-[55] bg-white rounded-xl shadow-xl border border-gray-200 p-2.5 md:p-3 w-[calc(100vw-5.75rem)] sm:w-[320px] max-w-[320px]"
        >
          <button
            onClick={closeForGood}
            aria-label={lang === "en" ? "Close" : "Cerrar"}
            className="absolute -top-2 -right-2 bg-white border border-gray-200 shadow hover:bg-gray-100 rounded-full p-1 transition-colors"
          >
            <X className="w-3 h-3 text-gray-600" />
          </button>

          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              {productImage ? (
                <img
                  src={productImage}
                  alt=""
                  width={48}
                  height={48}
                  loading="lazy"
                  decoding="async"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border border-gray-200 bg-gray-100"
                />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-emerald-50 border border-emerald-200" />
              )}
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center" aria-hidden="true">
                <Check className="w-3 h-3 text-white" strokeWidth={3.5} />
              </span>
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <p className="text-[13px] leading-tight font-bold text-gray-900 truncate">
                {currentSale.name} <span className="font-normal text-gray-500">· {countryLabel}</span>
              </p>
              <p className="text-xs leading-snug text-gray-700 line-clamp-1 sm:line-clamp-2">
                {lang === "en" ? "Purchased" : "Compró"} {currentSale.productName}
              </p>
              <p className="text-[11px] leading-tight text-gray-500">
                <span className="text-emerald-600 font-semibold">✓ {lang === "en" ? "Verified purchase" : "Compra verificada"}</span>
                <span className="hidden sm:inline">{" · "}{providerLabel}</span>{" · "}{timeAgo}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SalesNotification;
