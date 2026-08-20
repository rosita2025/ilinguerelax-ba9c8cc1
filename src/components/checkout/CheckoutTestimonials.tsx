import { memo, useEffect, useMemo, useRef, useState } from "react";
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
  BO: [
    { name: "Marcela T.", city: "La Paz", flag: "🇧🇴", country: "Bolivia" },
    { name: "Iván C.", city: "Santa Cruz", flag: "🇧🇴", country: "Bolivia" },
    { name: "Noelia R.", city: "Cochabamba", flag: "🇧🇴", country: "Bolivia" },
  ],
  UY: [
    { name: "Federico A.", city: "Montevideo", flag: "🇺🇾", country: "Uruguay" },
    { name: "Lucía D.", city: "Salto", flag: "🇺🇾", country: "Uruguay" },
    { name: "Santiago P.", city: "Maldonado", flag: "🇺🇾", country: "Uruguay" },
  ],
  PY: [
    { name: "Rodrigo B.", city: "Asunción", flag: "🇵🇾", country: "Paraguay" },
    { name: "Belén O.", city: "Ciudad del Este", flag: "🇵🇾", country: "Paraguay" },
    { name: "Hugo M.", city: "Encarnación", flag: "🇵🇾", country: "Paraguay" },
  ],
  CR: [
    { name: "Natalia S.", city: "San José", flag: "🇨🇷", country: "Costa Rica" },
    { name: "Esteban V.", city: "Alajuela", flag: "🇨🇷", country: "Costa Rica" },
    { name: "Mariela G.", city: "Heredia", flag: "🇨🇷", country: "Costa Rica" },
  ],
  PA: [
    { name: "Roberto Q.", city: "Ciudad de Panamá", flag: "🇵🇦", country: "Panamá" },
    { name: "Yariela C.", city: "Colón", flag: "🇵🇦", country: "Panamá" },
    { name: "Luis A.", city: "David", flag: "🇵🇦", country: "Panamá" },
  ],
  GT: [
    { name: "Silvia M.", city: "Ciudad de Guatemala", flag: "🇬🇹", country: "Guatemala" },
    { name: "Erick L.", city: "Quetzaltenango", flag: "🇬🇹", country: "Guatemala" },
    { name: "Dulce R.", city: "Escuintla", flag: "🇬🇹", country: "Guatemala" },
  ],
  DO: [
    { name: "Yamil P.", city: "Santo Domingo", flag: "🇩🇴", country: "República Dominicana" },
    { name: "Ingrid F.", city: "Santiago", flag: "🇩🇴", country: "República Dominicana" },
    { name: "Héctor N.", city: "La Romana", flag: "🇩🇴", country: "República Dominicana" },
  ],
  PR: [
    { name: "Wanda S.", city: "San Juan", flag: "🇵🇷", country: "Puerto Rico" },
    { name: "Ángel R.", city: "Ponce", flag: "🇵🇷", country: "Puerto Rico" },
    { name: "Keila M.", city: "Bayamón", flag: "🇵🇷", country: "Puerto Rico" },
  ],
};

// Generic first names used when a country has no hand-written pool.
const GENERIC_NAMES = ["Laura M.", "Diego S.", "Ana P."];

/** 🇦🇷 style flag emoji from any ISO-3166 alpha-2 code. */
function flagFromCode(cc: string): string {
  if (!/^[A-Z]{2}$/.test(cc)) return "🌎";
  return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/** Localized country name (Bolivia, Argentina, ...) from the ISO code. */
function countryNameFromCode(cc: string, language: string): string {
  try {
    const dn = new Intl.DisplayNames([language || "es"], { type: "region" });
    return dn.of(cc) || cc;
  } catch {
    return cc;
  }
}

/**
 * Testimonials always match the visitor's country. Countries with a curated
 * pool use real cities; any new country (Bolivia, Uruguay, ...) is generated
 * automatically with its own flag and localized country name instead of the
 * old generic "LATAM" label.
 */
function poolForCountry(cc: string, language: string): Testimonial[] {
  if (POOL[cc]) return POOL[cc];
  if (!/^[A-Z]{2}$/.test(cc)) {
    return GENERIC_NAMES.map((name) => ({ name, city: "Ciudad", flag: "🌎", country: "LATAM" }));
  }
  const country = countryNameFromCode(cc, language);
  const flag = flagFromCode(cc);
  return GENERIC_NAMES.map((name) => ({ name, city: country, flag, country }));
}


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

const cardClass = "h-[148px] sm:h-[152px] w-full max-w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/40 px-4 py-4 sm:px-5 sm:py-5";

function TestimonialsSkeleton() {
  return (
    <section aria-label="Testimonios verificados" aria-busy="true" className={cardClass}>
      <div className="mb-2 flex h-5 items-center justify-between">
        <div className="h-4 w-40 rounded bg-muted animate-pulse" />
        <div className="hidden gap-1 sm:flex">
          <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
          <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
        </div>
      </div>
      <div className="flex h-[72px] items-start gap-2.5 sm:gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-muted animate-pulse sm:h-10 sm:w-10" />
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex h-3.5 items-center gap-1">
            {[0, 1, 2, 3, 4].map((s) => <div key={s} className="h-3.5 w-3.5 rounded-sm bg-muted animate-pulse" />)}
            <div className="ml-1 h-3 w-6 rounded bg-muted animate-pulse" />
          </div>
          <div className="mb-1 h-3.5 w-full rounded bg-muted animate-pulse" />
          <div className="mb-1.5 h-3.5 w-3/4 rounded bg-muted animate-pulse" />
          <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
        </div>
      </div>
      <div className="mt-1.5 flex h-2 items-center justify-center gap-1.5">
        {[0, 1, 2].map((i) => <div key={i} className={`h-1.5 rounded-full bg-muted animate-pulse ${i === 0 ? "w-5" : "w-1.5"}`} />)}
      </div>
    </section>
  );
}

const TestimonialsContent = memo(function TestimonialsContent() {
  const region = useRegionTier();
  const { language } = useI18n();
  const [idx, setIdx] = useState(0);

  const items = useMemo(() => {
    const cc = (region.country || "").toUpperCase();
    return poolForCountry(cc, language);
  }, [region.country, language]);

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

  if (isLoading) return <TestimonialsSkeleton />;


  return (
    <section
      aria-label="Testimonios verificados"
      className={cardClass}
    >

      <div className="mb-2 flex h-5 items-center justify-between">
        <h3 className="min-w-0 truncate text-[13px] sm:text-sm font-semibold text-foreground">
          {heading} <span className="text-primary">{countryLabel}</span>
        </h3>
        <div className="hidden sm:flex items-center gap-1">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous"
            className="p-1 rounded-full hover:bg-muted transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next"
            className="p-1 rounded-full hover:bg-muted transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative h-[72px] w-full overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {items.map((it, i) => (
            <article
              key={i}
              className="w-full min-w-full max-w-full flex items-start gap-2.5 sm:gap-3 pr-1 overflow-hidden"
            >
              <div className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-lg sm:text-xl">
                {it.flag}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex h-3.5 items-center gap-1 text-amber-500 mb-1">
                  {[0, 1, 2, 3, 4].map((s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-current" />
                  ))}
                  <span className="ml-1 text-[11px] sm:text-xs text-muted-foreground">5/5</span>
                </div>
                 <p className="line-clamp-2 text-[13px] sm:text-sm text-foreground leading-[1.25] break-words">
                  "{quotes[i % quotes.length]}"
                </p>
                <div className="mt-1 flex min-w-0 items-center gap-1.5 overflow-hidden text-[10px] sm:text-[11px] text-muted-foreground">
                  <span className="shrink-0 font-medium text-foreground">{it.name}</span>
                  <span className="min-w-0 truncate">· {it.city}, {it.country}</span>
                  <span className="ml-auto inline-flex shrink-0 items-center gap-0.5 text-emerald-600">
                    <BadgeCheck className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{verified}</span>
                  </span>
                </div>

              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-1.5 flex h-2 items-center justify-center gap-1.5">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to testimonial ${i + 1}`}
            onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </section>
  );
});

export const CheckoutTestimonials = memo(function CheckoutTestimonials() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "160px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="w-full max-w-full overflow-hidden [contain:layout]">
      {isVisible ? <TestimonialsContent /> : <TestimonialsSkeleton />}
    </div>
  );
});

export default CheckoutTestimonials;
