import { useEffect, useMemo, useState } from "react";
import { Star, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react";
import { useRegionTier } from "@/hooks/useRegionTier";
import { useI18n } from "@/i18n/I18nContext";

type Testimonial = { name: string; city: string; flag: string; country: string };

const POOL: Record<string, Testimonial[]> = {
  MX: [
    { name: "María G.", city: "CDMX", flag: "🇲🇽", country: "México" },
    { name: "Luis R.", city: "Monterrey", flag: "🇲🇽", country: "México" },
    { name: "Andrea P.", city: "Guadalajara", flag: "🇲🇽", country: "México" },
  ],
  CO: [
    { name: "Camila V.", city: "Bogotá", flag: "🇨🇴", country: "Colombia" },
    { name: "Daniel M.", city: "Medellín", flag: "🇨🇴", country: "Colombia" },
    { name: "Sofía L.", city: "Cali", flag: "🇨🇴", country: "Colombia" },
  ],
  AR: [
    { name: "Martín F.", city: "Buenos Aires", flag: "🇦🇷", country: "Argentina" },
    { name: "Julieta S.", city: "Córdoba", flag: "🇦🇷", country: "Argentina" },
    { name: "Nicolás B.", city: "Rosario", flag: "🇦🇷", country: "Argentina" },
  ],
  CL: [
    { name: "Fernanda A.", city: "Santiago", flag: "🇨🇱", country: "Chile" },
    { name: "Cristóbal N.", city: "Valparaíso", flag: "🇨🇱", country: "Chile" },
    { name: "Paula E.", city: "Concepción", flag: "🇨🇱", country: "Chile" },
  ],
  PE: [
    { name: "Rosa D.", city: "Lima", flag: "🇵🇪", country: "Perú" },
    { name: "Jorge Q.", city: "Arequipa", flag: "🇵🇪", country: "Perú" },
    { name: "Ana C.", city: "Trujillo", flag: "🇵🇪", country: "Perú" },
  ],
  US: [
    { name: "Jessica T.", city: "Miami", flag: "🇺🇸", country: "USA" },
    { name: "Michael K.", city: "New York", flag: "🇺🇸", country: "USA" },
    { name: "Emily R.", city: "Los Angeles", flag: "🇺🇸", country: "USA" },
  ],
  ES: [
    { name: "Carlos M.", city: "Madrid", flag: "🇪🇸", country: "España" },
    { name: "Lucía H.", city: "Barcelona", flag: "🇪🇸", country: "España" },
    { name: "Pablo O.", city: "Valencia", flag: "🇪🇸", country: "España" },
  ],
  BR: [
    { name: "João S.", city: "São Paulo", flag: "🇧🇷", country: "Brasil" },
    { name: "Mariana C.", city: "Rio de Janeiro", flag: "🇧🇷", country: "Brasil" },
    { name: "Rafael T.", city: "Belo Horizonte", flag: "🇧🇷", country: "Brasil" },
  ],
  EC: [
    { name: "Valeria P.", city: "Quito", flag: "🇪🇨", country: "Ecuador" },
    { name: "Diego F.", city: "Guayaquil", flag: "🇪🇨", country: "Ecuador" },
    { name: "Karla M.", city: "Cuenca", flag: "🇪🇨", country: "Ecuador" },
  ],
  VE: [
    { name: "Andrés J.", city: "Caracas", flag: "🇻🇪", country: "Venezuela" },
    { name: "Gabriela R.", city: "Maracaibo", flag: "🇻🇪", country: "Venezuela" },
    { name: "Ricardo P.", city: "Valencia", flag: "🇻🇪", country: "Venezuela" },
  ],
};

const DEFAULT: Testimonial[] = [
  { name: "Laura M.", city: "Ciudad", flag: "🌎", country: "LATAM" },
  { name: "Diego S.", city: "Ciudad", flag: "🌎", country: "LATAM" },
  { name: "Ana P.", city: "Ciudad", flag: "🌎", country: "LATAM" },
];

const QUOTES: Record<string, string[]> = {
  es: [
    "Exactamente, fue rápido. Envío digital sin demoras.",
    "Compré y en minutos ya tenía el material en mi correo. Excelente.",
    "Todo llegó al instante, muy fácil de descargar. Súper recomendado.",
  ],
  en: [
    "Exactly as promised, fast digital delivery with no delays.",
    "Bought it and had the material in my inbox within minutes. Excellent.",
    "Everything arrived instantly, super easy to download. Highly recommended.",
  ],
  fr: [
    "Exactement comme promis, livraison numérique rapide sans retard.",
    "Acheté et reçu le matériel en quelques minutes. Excellent.",
    "Tout est arrivé instantanément, très facile à télécharger.",
  ],
  pt: [
    "Exatamente como prometido, entrega digital rápida sem demoras.",
    "Comprei e em minutos recebi o material no e-mail. Excelente.",
    "Tudo chegou na hora, super fácil de baixar. Recomendo muito.",
  ],
};

const HEADINGS: Record<string, string> = {
  es: "Compradores verificados en",
  en: "Verified buyers in",
  fr: "Acheteurs vérifiés en",
  pt: "Compradores verificados em",
};

const VERIFIED: Record<string, string> = {
  es: "Compra verificada",
  en: "Verified purchase",
  fr: "Achat vérifié",
  pt: "Compra verificada",
};

export function CheckoutTestimonials() {
  const region = useRegionTier();
  const { language } = useI18n();
  const [idx, setIdx] = useState(0);

  const items = useMemo(() => {
    const cc = (region.country || "").toUpperCase();
    return POOL[cc] ?? DEFAULT;
  }, [region.country]);

  const countryLabel = items[0]?.country ?? "";
  const quotes = QUOTES[language] ?? QUOTES.es;
  const heading = HEADINGS[language] ?? HEADINGS.es;
  const verified = VERIFIED[language] ?? VERIFIED.es;

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 4500);
    return () => clearInterval(t);
  }, [items.length]);

  const prev = () => setIdx((i) => (i - 1 + items.length) % items.length);
  const next = () => setIdx((i) => (i + 1) % items.length);

  const isLoading = !region.country;

  if (isLoading) {
    return (
      <section
        aria-label="Testimonios verificados"
        aria-busy="true"
        className="rounded-2xl border bg-card/60 backdrop-blur px-4 py-4 sm:px-5 sm:py-5 min-h-[176px] sm:min-h-[168px]"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-48 rounded bg-muted animate-pulse" />
          <div className="hidden sm:flex gap-1">
            <div className="h-7 w-7 rounded-full bg-muted animate-pulse" />
            <div className="h-7 w-7 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-24 rounded bg-muted animate-pulse" />
            <div className="h-3.5 w-full rounded bg-muted animate-pulse" />
            <div className="h-3.5 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-1.5 w-1.5 rounded-full bg-muted animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Testimonios verificados"
      className="rounded-2xl border bg-card/60 backdrop-blur px-4 py-4 sm:px-5 sm:py-5 min-h-[176px] sm:min-h-[168px]"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm sm:text-base font-semibold text-foreground">
          {heading} <span className="text-primary">{countryLabel}</span>
        </h3>
        <div className="hidden sm:flex items-center gap-1">
          <button
            type="button"
            onClick={prev}
            aria-label="Anterior"
            className="p-1.5 rounded-full hover:bg-muted transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Siguiente"
            className="p-1.5 rounded-full hover:bg-muted transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {items.map((it, i) => (
            <article
              key={i}
              className="min-w-full flex items-start gap-3 sm:gap-4 pr-1"
            >
              <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-lg sm:text-2xl">
                {it.flag}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 text-amber-500 mb-1">
                  {[0, 1, 2, 3, 4].map((s) => (
                    <Star key={s} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                  ))}
                  <span className="ml-1 text-[11px] sm:text-xs text-muted-foreground">5/5</span>
                </div>
                <p className="text-[13px] sm:text-[15px] text-foreground leading-snug break-words">
                  "{quotes[i % quotes.length]}"
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{it.name}</span>
                  <span className="truncate">· {it.city}, {it.country}</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 whitespace-nowrap">
                    <BadgeCheck className="w-3.5 h-3.5" /> {verified}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-3">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Ir al testimonio ${i + 1}`}
            onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

export default CheckoutTestimonials;
