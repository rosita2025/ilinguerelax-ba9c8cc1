import { Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { lazyWithRetry as lazy } from "@/lib/lazyWithRetry";
import { motion } from "framer-motion";
import {
  Check,
  Star,
  ShieldCheck,
  Download,
  Smartphone,
  BookOpen,
  GraduationCap,
  Users,
  Sparkles,
  Zap,
  ArrowRight,
  Crown,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ScrollToTop } from "@/components/ScrollToTop";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { trackHotmartEvent } from "@/hooks/useMetaPixel";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";

const Footer = lazy(() => import("@/components/Footer").then((m) => ({ default: m.Footer })));



import previewA1 from "@/assets/ilr-preview-a1.png.asset.json";
import previewComparativos from "@/assets/ilr-preview-comparativos.png.asset.json";
import previewErrores from "@/assets/ilr-preview-errores.png.asset.json";
import previewFuturePerfect from "@/assets/ilr-preview-future-perfect.png.asset.json";
import coverImage from "@/assets/estructuras-gramaticales-ingles-cover.webp.asset.json";

const previewPages = [
  {
    src: previewA1.url,
    title: "Nivel A1 — Estructura base",
    caption: "Article + Object · explicaciones claras paso a paso",
  },
  {
    src: previewComparativos.url,
    title: "Comparativos y superlativos",
    caption: "Reglas, excepciones y ejemplos con pronunciación",
  },
  {
    src: previewErrores.url,
    title: "Errores comunes",
    caption: "Aprende a evitar los fallos típicos en inglés",
  },
  {
    src: previewFuturePerfect.url,
    title: "Future Perfect (C1.3)",
    caption: "Estructura, uso, ejemplos y pronunciación adaptada",
  },
];

const benefits = [
  { icon: BookOpen, text: "Más de 150 estructuras gramaticales" },
  { icon: GraduationCap, text: "Desde nivel A1 hasta C1" },
  { icon: Sparkles, text: "Explicaciones fáciles en español" },
  { icon: Check, text: "Ejemplos reales y prácticos" },
  { icon: Zap, text: "Aprende a construir oraciones correctamente" },
  { icon: Users, text: "Método diseñado para hispanohablantes" },
];

const learnTopics = [
  "Present Simple",
  "Present Continuous",
  "Past Simple",
  "Past Continuous",
  "Future Tenses",
  "Present Perfect",
  "Conditionals",
  "Passive Voice",
  "Reported Speech",
  "Modal Verbs",
  "Phrasal Verbs",
  "Relative Clauses",
  "Advanced Grammar Structures",
];

const audience = [
  "Principiantes",
  "Estudiantes de inglés",
  "Universitarios",
  "Profesionales",
  "Viajeros",
  "Personas que desean hablar inglés correctamente",
];

const includes = [
  "Ebook completo en PDF",
  "Más de 300 estructuras gramaticales",
  "Ejemplos prácticos",
  "Explicaciones paso a paso",
  "Acceso inmediato",
  "Compatible con celular, tablet y computadora",
];

const testimonials = [
  {
    name: "María González",
    role: "Estudiante universitaria · México",
    text:
      "Por fin entiendo la gramática inglesa. Las explicaciones en español me ayudaron a desbloquear el Present Perfect y los condicionales en pocas semanas.",
  },
  {
    name: "Carlos Ramírez",
    role: "Profesional bilingüe · Colombia",
    text:
      "El mejor ebook de gramática que he comprado. Está súper organizado por niveles A1 a C1 y los ejemplos prácticos son oro puro para reuniones de trabajo.",
  },
  {
    name: "Lucía Fernández",
    role: "Viajera · España",
    text:
      "Llevo el PDF en el móvil y lo repaso antes de cada viaje. Construir frases correctas dejó de ser un dolor de cabeza. 100% recomendado.",
  },
];

const scrollToContent = () => {
  document.getElementById("contenido")?.scrollIntoView({ behavior: "smooth" });
};

// SKU exacto del producto ya creado en /admin/productos — mismo texto que la
// URL pública, para que quede todo conectado.
const PRODUCT_SKU = "estructuras-gramaticales-ingles-a1-c1";

const ProductEstructurasGramaticalesIngles = () => {
  const navigate = useNavigate();
  const addItem = useCheckoutPruebaStore((s) => s.addItem);

  // Antes esto mandaba siempre a Hotmart (sitio externo), rompiendo la
  // confianza justo en el momento de comprar. Ahora va al checkout propio,
  // igual que el resto del catálogo. Es un PDF digital: isPhysical false,
  // no se pide dirección de envío.
  const goToCheckout = () => {
    trackHotmartEvent("AddToCart", {
      content_name: "Estructuras Gramaticales A1 a B1 Inglés",
      content_category: "Digital Book",
      content_ids: [PRODUCT_SKU],
      content_type: "product",
      value: 12,
      currency: "USD",
      num_items: 1,
    });
    addItem({
      id: PRODUCT_SKU,
      name: "Estructuras Gramaticales A1 a B1 Inglés (PDF)",
      price: 12,
      quantity: 1,
      isPhysical: false,
    });
    navigate(`/checkouts/${PRODUCT_SKU}`);
  };

  return (
    <main className="min-h-screen bg-[#04102a] text-white">
      <SEO
        title="Gramática Inglesa PDF · Estructuras A1 a C1"
        description="150+ estructuras gramaticales del inglés explicadas paso a paso, del nivel A1 al C1. Método práctico para hispanohablantes. PDF con acceso inmediato."
        canonicalUrl="https://ilinguerelax.com/products/estructuras-gramaticales-ingles-a1-c1"
        type="product"
        price="12.00"
        originalPrice="59"
        rating="4.9"
        reviewCount="320"
        sku="ILR-GRAMMAR-A1C1"
        keywords="gramática inglesa, gramática inglesa pdf, estructuras gramaticales en inglés, curso de gramática inglesa, aprender gramática inglés desde cero, tiempos verbales en inglés, inglés A1 A2 B1 B2 C1, inglés para hispanohablantes, ebook gramática inglés, gramática inglesa fácil"
      />

      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.35),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(212,175,55,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#04102a]/40 to-[#04102a]" />

        <div className="container relative px-4 md:px-6 pt-10 md:pt-16 pb-12 md:pb-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f5d57a]/10 border border-[#f5d57a]/30 text-[#f5d57a] text-xs font-bold uppercase tracking-wider mb-5">
                <Crown className="w-3.5 h-3.5" /> Bestseller iLingue Relax®
              </span>

              <h1 className="font-bold leading-[1.05] text-4xl md:text-5xl lg:text-6xl mb-4">
                ESTRUCTURAS GRAMATICALES{" "}
                <span className="bg-gradient-to-r from-[#3b82f6] via-[#60a5fa] to-[#f5d57a] bg-clip-text text-transparent">
                  DE INGLÉS
                </span>
              </h1>
              <p className="text-lg md:text-xl text-white/80 mb-3 font-medium">
                Desde Cero hasta Avanzado <span className="text-[#f5d57a] font-bold">(A1 – C1)</span>
              </p>
              <p className="text-base md:text-lg text-white/70 mb-7 max-w-xl">
                Domina la gramática inglesa paso a paso con más de 300 estructuras esenciales,
                explicaciones claras en español y ejemplos prácticos para hispanohablantes.
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#f5d57a] text-[#f5d57a]" />
                  ))}
                </div>
                <span className="text-sm text-white/70">
                  <strong className="text-white">4.9</strong> · 320+ estudiantes
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="xl"
                  onClick={goToCheckout}
                  className="bg-gradient-to-r from-[#f5d57a] to-[#d4af37] hover:from-[#fce29c] hover:to-[#e6c34d] text-[#04102a] font-black shadow-[0_10px_30px_-10px_rgba(245,213,122,0.6)] hover:scale-[1.02] transition-transform"
                >
                  COMPRAR AHORA <ArrowRight className="w-5 h-5" />
                </Button>
                <Button
                  size="xl"
                  variant="outline"
                  onClick={scrollToContent}
                  className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white font-bold backdrop-blur"
                >
                  VER CONTENIDO
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-6 text-xs text-white/60">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Pago seguro
                </span>
                <span className="flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-[#60a5fa]" /> Acceso inmediato
                </span>
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#f5d57a]" /> Cualquier dispositivo
                </span>
              </div>
            </motion.div>

            {/* Hero card mock */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative"
            >
              <div className="absolute -inset-6 bg-gradient-to-br from-[#3b82f6]/40 via-[#1d4ed8]/20 to-[#f5d57a]/20 blur-3xl rounded-full" />
              <img
                src={coverImage.url}
                alt="Portada del ebook Estructuras Gramaticales de Inglés iLingue Relax® - Desde Cero hasta Avanzado A1 a C1"
                className="relative w-full max-w-lg mx-auto h-auto drop-shadow-[0_25px_50px_rgba(59,130,246,0.35)]"
                loading="eager"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="contenido" className="py-14 md:py-20 bg-[#06163a]">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              ¿Por qué elegir <span className="text-[#f5d57a]">iLingue Relax®</span>?
            </h2>
            <p className="text-white/70">
              Un método pensado al detalle para que la gramática inglesa por fin tenga sentido.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {benefits.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] hover:border-[#f5d57a]/40 hover:bg-white/[0.06] p-5 md:p-6 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="font-semibold text-white">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What you'll learn */}
      <section className="py-14 md:py-20">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3b82f6]/15 border border-[#3b82f6]/30 text-[#60a5fa] text-xs font-bold uppercase tracking-wider mb-3">
              Contenido completo
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Lo que aprenderás</h2>
            <p className="text-white/70">
              13 bloques esenciales para dominar el inglés de A1 a C1.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {learnTopics.map((topic, i) => (
              <motion.div
                key={topic}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] hover:border-[#f5d57a]/40 px-4 py-3 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-[#f5d57a]/15 text-[#f5d57a] flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm md:text-base">{topic}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Audience */}
      <section className="py-14 md:py-20 bg-gradient-to-b from-[#06163a] to-[#04102a]">
      </section>

      {/* Preview pages (1:1) */}
      <section className="py-14 md:py-20">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5d57a]/15 border border-[#f5d57a]/30 text-[#f5d57a] text-xs font-bold uppercase tracking-wider mb-3">
              Vista previa del ebook
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Mira por dentro <span className="text-[#f5d57a]">3 páginas reales</span>
            </h2>
            <p className="text-white/70">
              Así de claro y estructurado es el contenido que vas a recibir en PDF.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {previewPages.map((page, i) => (
              <motion.figure
                key={page.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group rounded-2xl overflow-hidden border border-white/10 bg-white/[0.04] hover:border-[#f5d57a]/40 transition-all hover:shadow-[0_15px_40px_-15px_rgba(245,213,122,0.35)]"
              >
                <div className="relative aspect-square bg-white overflow-hidden">
                  <img
                    src={page.src}
                    alt={`Vista previa — ${page.title}`}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-500"
                  />
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <span className="text-4xl md:text-5xl font-black text-slate-900/10 -rotate-45 tracking-widest whitespace-nowrap select-none">
                      ilinguerelax.com
                    </span>
                  </div>
                </div>
                <figcaption className="p-4">
                  <p className="font-bold text-white text-sm md:text-base">{page.title}</p>
                  <p className="text-xs text-white/60 mt-1">{page.caption}</p>
                </figcaption>
              </motion.figure>
            ))}
          </div>
          <p className="text-center text-xs text-white/75 mt-6">
            Vistas previas con marca de agua. El PDF completo se entrega tras la compra.
          </p>
        </div>
      </section>

      {/* Audience */}
      <section className="py-14 md:py-20 bg-gradient-to-b from-[#06163a] to-[#04102a]">
        <div className="container px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                ¿Para quién es este libro?
              </h2>
              <p className="text-white/70 mb-6">
                Si quieres hablar inglés correctamente y dejar de adivinar, este ebook es para ti.
              </p>
              <ul className="space-y-3">
                {audience.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-[#f5d57a]/25 bg-gradient-to-br from-[#0a1d4a] to-[#04102a] p-7 md:p-9 shadow-xl">
              <h3 className="text-2xl font-bold mb-5 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-[#f5d57a]" /> Incluye
              </h3>
              <ul className="space-y-3">
                {includes.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-xl leading-none mt-0.5">📘</span>
                    <span className="text-white/90">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-14 md:py-20">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Lo que dicen nuestros estudiantes
            </h2>
            <p className="text-white/70">Más de 320 personas ya están dominando la gramática.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 hover:border-[#f5d57a]/40 transition-colors"
              >
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-[#f5d57a] text-[#f5d57a]" />
                  ))}
                </div>
                <p className="text-white/85 italic mb-5 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] flex items-center justify-center font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{t.name}</p>
                    <p className="text-xs text-white/60">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantee + Price */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-[#06163a] to-[#020a1f]">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="rounded-3xl border-2 border-[#f5d57a]/40 bg-gradient-to-br from-[#0a1d4a] via-[#04102a] to-[#0a1d4a] p-7 md:p-10 shadow-[0_20px_60px_-20px_rgba(245,213,122,0.4)] relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#f5d57a]/10 rounded-full blur-3xl" />
              <div className="relative text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
                  <ShieldCheck className="w-3.5 h-3.5" /> Garantía de satisfacción
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-3">
                  Acceso inmediato tras la compra
                </h2>
                <p className="text-white/70 mb-7 max-w-xl mx-auto">
                  Compra 100% segura mediante Hotmart. Si no quedas satisfecho, te devolvemos tu dinero.
                </p>

                <div className="flex items-baseline justify-center gap-3 mb-2">
                  <span className="text-base text-white/75 line-through">Antes US$59</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#f5d57a] text-[#04102a] text-[11px] font-black uppercase">
                    Hoy -80%
                  </span>
                </div>
                <div className="flex items-baseline justify-center gap-2 mb-6">
                  <span className="text-6xl md:text-7xl font-black bg-gradient-to-r from-[#f5d57a] to-[#d4af37] bg-clip-text text-transparent">
                    US$12
                  </span>
                  <span className="text-xl font-bold text-white/60">.00</span>
                </div>

                <Button
                  size="xl"
                  onClick={goToCheckout}
                  className="w-full sm:w-auto bg-gradient-to-r from-[#f5d57a] to-[#d4af37] hover:from-[#fce29c] hover:to-[#e6c34d] text-[#04102a] font-black px-8 shadow-[0_10px_30px_-10px_rgba(245,213,122,0.7)] hover:scale-[1.02] transition-transform"
                >
                  OBTENER ACCESO INMEDIATO <ArrowRight className="w-5 h-5" />
                </Button>

                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-6 text-xs text-white/60">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Pago seguro
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-[#60a5fa]" /> Descarga inmediata
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-[#f5d57a]" /> Móvil, tablet y PC
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="h-40" />}>
        <Footer />
      </Suspense>

      <ScrollToTop />
      <WhatsAppButton />
    </main>
  );
};

export default ProductEstructurasGramaticalesIngles;