import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Eye, Sparkles, BookOpen, Headphones, ShoppingCart, Check } from "lucide-react";

import coverAsset from "@/assets/coreano-100-mapas-cover.webp.asset.json";
import mapaVocales from "@/assets/coreano-mapa-02-vocales.webp.asset.json";
import mapaSaludos from "@/assets/coreano-mapa-01-saludos.webp.asset.json";
import mapaFamilia from "@/assets/coreano-mapa-09-familia.webp.asset.json";
import mapaRopa from "@/assets/coreano-mapa-15-ropa.webp.asset.json";
import mapaEscuela from "@/assets/coreano-mapa-18-escuela.webp.asset.json";
import mapaObjetos from "@/assets/coreano-mapa-objetos-casa.webp.asset.json";
import bonoHangul from "@/assets/Bono-1-hangul.webp.asset.json";
import demoPdfAsset from "@/assets/demo-gratis-coreano.pdf.asset.json";
import { WhatsAppTestimoniosCoreano } from "@/components/WhatsAppTestimoniosCoreano";
import { ResenasWhatsAppCoreano } from "@/components/ResenasWhatsAppCoreano";

const previews = [
  { src: mapaVocales.url, alt: "Vocabulario Coreano · Alfabeto Hangul: Vocales", caption: "Alfabeto Hangul · Vocales" },
  { src: mapaSaludos.url, alt: "Vocabulario Coreano · Saludos y Presentaciones", caption: "Saludos y Presentaciones" },
  { src: mapaFamilia.url, alt: "Vocabulario Coreano · La Familia", caption: "La Familia" },
  { src: mapaRopa.url, alt: "Vocabulario Coreano · Ropa y Vestimenta", caption: "Ropa y Vestimenta" },
  { src: mapaEscuela.url, alt: "Vocabulario Coreano · Escuela y Objetos", caption: "Escuela y Objetos" },
  { src: bonoHangul.url, alt: "Bono · Guía de Escritura Hangul", caption: "Bono · Guía de Escritura" },
];

const VistaPreviaCoreano = () => {
  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Vista Previa · Coreano Sin Complicaciones · 1,000 Palabras Esenciales | iLingue Relax®"
        description="Mira páginas reales del ebook Coreano Sin Complicaciones con 1,000 palabras esenciales. Hangul, pronunciación en español, vocabulario y frases por categorías."
        canonicalUrl="https://ilinguerelax.com/vista-previa/coreano-1000-palabras"
        image={`https://ilinguerelax.com${coverAsset.url}`}
      />
      <Navbar />

      <section className="py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-3">
                <Eye className="w-4 h-4" /> Vista previa exclusiva · 🇰🇷
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 text-balance leading-tight">
                Coreano Sin Complicaciones · <span className="text-gradient">1,000 Palabras Esenciales</span>
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
                Páginas reales del PDF con Hangul, pronunciación para hispanohablantes y vocabulario práctico.
              </p>
            </div>

            {/* YouTube Short */}
            <div className="max-w-sm mx-auto mb-10">
              <div className="relative rounded-3xl overflow-hidden shadow-hero border-2 border-primary/20 bg-black" style={{ aspectRatio: "9 / 16" }}>
                <iframe
                  src="https://www.youtube.com/embed/6kV0N5VKlWw?rel=0&modestbranding=1"
                  title="Vista previa Coreano Sin Complicaciones · YouTube Short"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
              <p className="text-center text-xs text-muted-foreground mt-2">🎬 Mira el video corto del ebook</p>
            </div>

            {/* Cover + CTA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mb-10">
              <div className="relative">
                <div className="absolute -inset-4 gradient-hero opacity-20 blur-3xl rounded-3xl" />
                <img
                  src={coverAsset.url}
                  alt="Portada Coreano Sin Complicaciones 1,000 Palabras Esenciales"
                  className="relative w-full h-auto rounded-2xl shadow-hero"
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
              <div>
                <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 p-5 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Headphones className="w-5 h-5 text-amber-600" />
                    <span className="text-amber-600 font-bold text-xs uppercase">🎧 Audio · Muy pronto</span>
                  </div>
                  <p className="text-foreground font-bold mb-1">
                    Muy pronto subiremos la vista previa en audio 🔊
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Escucharás la pronunciación real del Hangul, los saludos y las frases más usadas en k-dramas y K-pop, narradas para hispanohablantes.
                  </p>
                </div>

                <a href="#testimonios-whatsapp" className="block mb-3">
                  <Button size="lg" variant="outline" className="w-full font-bold border-2 border-green-500/40 text-green-700 dark:text-green-400 hover:bg-green-500/10">
                    💬 Ver testimonios reales por WhatsApp
                  </Button>
                </a>
                <a
                  href="https://wa.link/pdcwv8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button size="lg" className="w-full text-base py-6 bg-[#25D366] hover:bg-[#20b858] text-white font-bold shadow-hero">
                    💬 Escríbenos antes de comprar
                  </Button>
                </a>
                <p className="text-center text-xs text-muted-foreground mt-2">
                  ✍️ Si te gustaría comprar, mándanos un mensaje y te enviamos precio y detalles.
                </p>
              </div>
            </div>


            {/* Quality card */}
            <div className="mb-8 rounded-2xl border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-amber-500/10 to-primary/10 p-5 shadow-card">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-1">
                    ✨ Alta calidad · Sin errores ortográficos
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Revisado en Hangul y español por hablantes nativos. Diseño visual claro y progresivo.
                  </p>
                </div>
              </div>
            </div>

            {/* Preview grid */}
            <div className="flex items-center gap-2 mb-5">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-xl md:text-2xl font-bold text-foreground">Páginas reales del ebook</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {previews.map((p, i) => (
                <figure key={p.src} className="relative rounded-2xl overflow-hidden border border-border shadow-card bg-card">
                  <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                    Página {i + 1}
                  </div>
                  <div className="relative aspect-[3/4] bg-white overflow-hidden">
                    <img
                      src={p.src}
                      alt={p.alt}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-contain"
                      onContextMenu={(e) => e.preventDefault()}
                    />
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0">
                      {/* Watermark removed as requested */}
                    </div>
                  </div>
                  <figcaption className="p-3 text-sm font-semibold text-foreground text-center">
                    {p.caption}
                  </figcaption>
                </figure>
              ))}
            </div>

            {/* Bonuses */}
            <div className="mt-12">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 text-sm font-bold mb-3 border border-amber-500/20">
                  <Sparkles className="w-4 h-4" /> Incluye 3 Bonos GRATIS
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Bonos <span className="text-gradient">incluidos</span> en tu compra
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-amber-500/5 p-6 shadow-card">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold mb-3">Bono 1 ✍️</div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Guía completa del Alfabeto Hangul con ejercicios de caligrafía</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Aprende a leer y escribir Hangul desde cero con trazos paso a paso y ejercicios prácticos de caligrafía.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Check className="w-4 h-4" /> Incluido GRATIS
                  </div>
                </div>
                <div className="rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-primary/5 p-6 shadow-card">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 text-xs font-bold mb-3">Bono 2 📝</div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Guía explicativa del Hangul con notas y consejos clave</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Explicaciones detalladas del sistema Hangul con notas culturales y consejos clave para memorizar más rápido.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-600">
                    <Check className="w-4 h-4" /> Incluido GRATIS
                  </div>
                </div>
                <div className="rounded-2xl border-2 border-[#1DB954]/40 bg-gradient-to-br from-[#1DB954]/10 to-primary/5 p-6 shadow-card">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1DB954]/15 text-[#1DB954] text-xs font-bold mb-3">Bono 3 · Compra Anticipada 🎧</div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Próximamente el audio de coreano en Spotify</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Acceso al podcast con la pronunciación real del Hangul, saludos y frases de k-dramas y K-pop. Exclusivo compra anticipada.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#1DB954]">
                    <Check className="w-4 h-4" /> Incluido GRATIS
                  </div>
                </div>
              </div>
            </div>

            {/* Final CTA */}
            <div className="mt-12 rounded-3xl bg-gradient-to-br from-primary/10 via-amber-500/10 to-primary/10 border border-primary/20 p-6 md:p-8 text-center">
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                ¿Te gustaría <span className="text-gradient">comprarlo</span>?
              </h3>
              <p className="text-muted-foreground mb-5">
                Mándanos un mensaje por WhatsApp y te enviamos el <strong>precio y todos los detalles</strong> antes de comprar. 😊
              </p>
              <a
                href="https://wa.link/pdcwv8"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button size="lg" className="text-lg py-7 px-10 bg-[#25D366] hover:bg-[#20b858] text-white font-bold shadow-hero hover:scale-[1.02] transition-transform">
                  💬 Escríbenos por WhatsApp
                </Button>
              </a>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6">
              Vistas previas optimizadas. El PDF completo se entrega tras la compra.
            </p>
          </div>
        </div>
      </section>

      
      <ResenasWhatsAppCoreano />

      <Footer />
      <ScrollToTop />
      <WhatsAppButton />
    </main>
  );
};

export default VistaPreviaCoreano;
