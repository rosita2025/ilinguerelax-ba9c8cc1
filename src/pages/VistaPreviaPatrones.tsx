import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Eye, Sparkles, BookOpen, MessageCircle } from "lucide-react";
import { useState } from "react";

import patronesPreview1 from "@/assets/patrones-preview-letras-mudas.webp.asset.json";
import patronesPreview2 from "@/assets/patrones-preview-sufijos.webp.asset.json";
import patronesPreview3 from "@/assets/patrones-preview-contracciones.webp.asset.json";
import bono5000Indice from "@/assets/bono-5000-indice.webp.asset.json";
import bono5000Ropa from "@/assets/bono-5000-ropa.webp.asset.json";
import bono5000Transporte from "@/assets/bono-5000-transporte.webp.asset.json";
import ogImage from "@/assets/og-vista-previa-patrones.jpg.asset.json";
import resenaMx1 from "@/assets/resena-mx1.webp.asset.json";
import resenaMx2 from "@/assets/resena-mx2.webp.asset.json";
import resenaMx3 from "@/assets/resena-mx3.webp.asset.json";
import resenaPe1 from "@/assets/resena-mx4.webp.asset.json";

const patronesPreviews = [
  { src: patronesPreview1.url, alt: "Letras mudas en inglés con reglas y ejemplos — Inglés Relax", caption: "Letras Mudas · tabla completa con reglas" },
  { src: patronesPreview2.url, alt: "Sufijos y prefijos en inglés con pronunciación adaptada", caption: "Sufijos y Prefijos · cómo suenan realmente" },
  { src: patronesPreview3.url, alt: "Contracciones y habla rápida en inglés con pronunciación", caption: "Contracciones · habla como un nativo" },
];

const bonusPreviews = [
  { src: bono5000Indice.url, alt: "Índice del Bono 1,000 palabras en inglés con pronunciación en español", caption: "Índice por temas · A1 a B2" },
  { src: bono5000Ropa.url, alt: "1,000 palabras en inglés - Ropa y vestimenta con pronunciación", caption: "Ropa · 7 subtemas con fonética" },
  { src: bono5000Transporte.url, alt: "1,000 palabras en inglés - Transporte, alojamiento y turismo", caption: "Transporte y Turismo · vocabulario práctico" },
];

type Resena = { src: string; country: "MX" | "PE"; flag: string; label: string; alt: string };
const resenas: Resena[] = [
  { src: resenaMx1.url, country: "MX", flag: "🇲🇽", label: "México", alt: "Reseña real de cliente desde México sobre el material de Patrones Especiales" },
  { src: resenaMx2.url, country: "MX", flag: "🇲🇽", label: "México", alt: "Testimonio de cliente mexicano sobre técnicas de aprendizaje de inglés" },
  { src: resenaMx3.url, country: "MX", flag: "🇲🇽", label: "México", alt: "Cliente de México comparte su experiencia con el ebook" },
  { src: resenaPe1.url, country: "PE", flag: "🇵🇪", label: "Perú", alt: "Reseña real de cliente desde Perú sobre la pronunciación y el material" },
];

const PreviewGrid = ({
  items,
  badgeLabel,
  badgeClass,
}: {
  items: typeof patronesPreviews;
  badgeLabel: string;
  badgeClass: string;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {items.map((p, i) => (
      <figure key={p.src} className="relative rounded-2xl overflow-hidden border border-border shadow-card bg-card">
        <div className={`absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-xs font-bold ${badgeClass}`}>
          {badgeLabel} {i + 1}
        </div>
        <div className="relative aspect-[3/4] bg-white overflow-hidden">
          <img
            src={p.src}
            alt={p.alt}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-contain"
          />
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <span className="text-3xl md:text-4xl font-black text-slate-900/10 -rotate-45 tracking-widest whitespace-nowrap select-none">
              ilinguerelax.com
            </span>
          </div>
        </div>
        <figcaption className="p-3 text-sm font-semibold text-foreground text-center">
          {p.caption}
        </figcaption>
      </figure>
    ))}
  </div>
);

const VistaPreviaPatrones = () => {
  const [filtro, setFiltro] = useState<"all" | "MX" | "PE">("all");
  const visibles = filtro === "all" ? resenas : resenas.filter((r) => r.country === filtro);
  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Vista Previa · Patrones Especiales + Bono 1,000 palabras | iLingue Relax®"
        description="Mira páginas reales del ebook Patrones Especiales, Alfabeto y Combinaciones Secretas en inglés, más el bono de 1,000 palabras con pronunciación en español."
        canonicalUrl="https://ilinguerelax.com/vista-previa/patrones-especiales"
        image={`https://ilinguerelax.com${ogImage.url}`}
      />
      <Navbar />

      <div className="w-full bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground py-2.5 px-4 text-center text-sm font-semibold animate-pulse">
        🎧 Audio próximamente · Actualizaciones GRATIS de por vida · ⏳ Muy pronto subirá el precio
      </div>

      <section className="py-10 md:py-14">
        <div className="container px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-3">
                <Eye className="w-4 h-4" /> Vista previa exclusiva
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Patrones Especiales, Alfabeto y <span className="text-gradient">Combinaciones Secretas en Inglés</span>
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Páginas reales del PDF para que veas la calidad antes de cualquier compra. Marca de agua incluida.
              </p>
            </div>

            <div className="flex justify-center mb-10">
              <a
                href="#testimonios"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm md:text-base font-bold shadow-card hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="w-5 h-5" /> Ver testimonios reales 🇲🇽 🇵🇪
              </a>
            </div>

            <div className="flex items-center gap-2 mb-5">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-xl md:text-2xl font-bold text-foreground">Páginas del ebook principal</h2>
            </div>
            <PreviewGrid
              items={patronesPreviews}
              badgeLabel="Página"
              badgeClass="bg-primary text-primary-foreground"
            />

            <div className="mt-14">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/15 text-accent text-sm font-bold mb-3">
                  <Sparkles className="w-4 h-4" /> Bono incluido GRATIS
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  + Bono: <span className="text-gradient">1,000 palabras en inglés</span> con pronunciación en español
                </h2>
                <p className="text-muted-foreground">
                  Vocabulario esencial organizado por temas (A1 a B2) con fonética UK/US adaptada.
                </p>
              </div>
              <div className="max-w-3xl mx-auto mb-8 rounded-2xl border border-accent/30 bg-accent/5 p-5 md:p-6 shadow-card">
                <p className="text-foreground font-semibold mb-3">
                  🎁 Además recibirás un bono especial:
                </p>
                <p className="text-foreground font-bold mb-3">📘 1,000 Palabras en Inglés con:</p>
                <ul className="space-y-2 text-foreground">
                  <li>✅ Significado en español</li>
                  <li>✅ Pronunciación para hispanohablantes</li>
                  <li>✅ Fonética adaptada</li>
                  <li>✅ Inglés USA y UK (Americano y Británico)</li>
                </ul>
              </div>
              <PreviewGrid
                items={bonusPreviews}
                badgeLabel="Bono"
                badgeClass="bg-accent text-accent-foreground"
              />
            </div>

            <div className="mt-14">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-3">
                  <MessageCircle className="w-4 h-4" /> Reseñas reales de clientes
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Testimonios desde <span className="text-gradient">México y Perú</span>
                </h2>
                <p className="text-muted-foreground">
                  Capturas reales de WhatsApp de clientes que ya usan el material. Filtra por país:
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {([
                  { id: "all", label: "Todas", flag: "🌎" },
                  { id: "MX", label: "México", flag: "🇲🇽" },
                  { id: "PE", label: "Perú", flag: "🇵🇪" },
                ] as const).map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setFiltro(b.id)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                      filtro === b.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {b.flag} {b.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visibles.map((r) => (
                  <figure
                    key={r.src}
                    className="relative rounded-2xl overflow-hidden border border-border shadow-card bg-card"
                  >
                    <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                      {r.flag} {r.label}
                    </div>
                    <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                      ✓ Compra verificada
                    </div>
                    <img
                      src={r.src}
                      alt={r.alt}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-auto"
                    />
                  </figure>
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground mt-4">
                Datos personales y números ocultos por privacidad. Marca de agua añadida.
              </p>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-8">
              Vistas previas con marca de agua. El PDF completo se entrega tras la compra.
            </p>
          </div>
        </div>
      </section>

      <Footer />
      <ScrollToTop />
      <WhatsAppButton />
    </main>
  );
};

export default VistaPreviaPatrones;