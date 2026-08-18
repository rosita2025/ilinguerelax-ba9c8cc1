import { motion } from "framer-motion";
import { MessageCircle, ShieldCheck, Globe2 } from "lucide-react";
import t1 from "@/assets/testimonio-coreano-wa-1.webp.asset.json";
import t2 from "@/assets/testimonio-coreano-wa-2.webp.asset.json";
import t3 from "@/assets/testimonio-coreano-wa-3.webp.asset.json";
import t4 from "@/assets/testimonio-coreano-wa-4.webp.asset.json";

const testimonios = [
  { src: t1.url, alt: "Testimonio real WhatsApp Coreano · Compradora Perú (+51)", pais: "Perú 🇵🇪" },
  { src: t2.url, alt: "Testimonio real WhatsApp Coreano · Contraseña de acceso", pais: "Perú 🇵🇪" },
  { src: t3.url, alt: "Testimonio real WhatsApp Coreano · Feedback sobre gramática", pais: "Perú 🇵🇪" },
  { src: t4.url, alt: "Testimonio real WhatsApp Coreano · Entrega con bonos", pais: "Perú 🇵🇪" },
];

export const WhatsAppTestimoniosCoreano = () => {
  return (
    <section id="testimonios-whatsapp" className="py-12 md:py-16 bg-muted/30 scroll-mt-20">
      <div className="container px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 text-sm font-bold mb-3">
              <MessageCircle className="w-4 h-4" /> Testimonios reales por WhatsApp
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3 text-balance">
              Compradores reales de <span className="text-gradient">todo el mundo</span> 🌎
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
              Conversaciones auténticas con compradores del ebook <strong>1,000 Palabras Esenciales de Coreano</strong>. Datos personales protegidos por privacidad.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-primary" /> Nombres y números protegidos</span>
              <span className="inline-flex items-center gap-1"><Globe2 className="w-4 h-4 text-primary" /> Ventas internacionales verificadas</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {testimonios.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl overflow-hidden border-2 border-green-500/20 bg-card shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative bg-black">
                  <img
                    src={t.src}
                    alt={t.alt}
                    loading="lazy"
                    className="w-full h-auto object-cover pointer-events-none select-none"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </div>
                <div className="p-3 flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">{t.pais}</span>
                  <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                    <MessageCircle className="w-3 h-3" /> WhatsApp verificado
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6 max-w-xl mx-auto">
            Por privacidad, ocultamos nombres, números y datos personales de los compradores. Las capturas llevan marca de agua de <strong>iLingue Relax®</strong>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default WhatsAppTestimoniosCoreano;
