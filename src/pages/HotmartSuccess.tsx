import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { getLastCheckoutForPurchase, trackHotmartEvent } from "@/hooks/useMetaPixel";
import { trackGAEvent } from "@/hooks/useGoogleAnalytics";
import {
  CheckCircle,
  MessageCircle,
  Mail,
  PartyPopper,
  Heart,
  ArrowRight,
  Star,
} from "lucide-react";

const HotmartSuccess = () => {
  const [confetti, setConfetti] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Fire browser-side Purchase event for Meta Pixel attribution
    // This complements the server-side CAPI event for better matching
    const productParam = searchParams.get("product") || "";
    const valueParam = searchParams.get("value");
    
    const lastCheckout = getLastCheckoutForPurchase();

    // Determine product info from URL params, last checkout memory, or defaults
    let contentName = "Inglés Relax - Compra";
    let contentId = "product-5000";
    let value = 12;

    if (!productParam && lastCheckout) {
      contentName = typeof lastCheckout.content_name === "string" ? lastCheckout.content_name : contentName;
      const ids = Array.isArray(lastCheckout.content_ids) ? lastCheckout.content_ids : [];
      contentId = ids.length ? String(ids[0]) : contentId;
      value = typeof lastCheckout.value === "number" ? lastCheckout.value : value;
    }

    if (productParam.includes("coreano") || productParam.includes("korean")) {
      contentName = "Coreano Sin Complicaciones - 100 Mapas Mentales";
      contentId = "product-coreano-100-mapas";
      value = 10;
    } else if (productParam.includes("patrones")) {
      contentName = "Patrones Especiales, Alfabeto y Combinaciones Secretas en Inglés";
      contentId = "patrones-especiales";
      value = 8.08;
    } else if (productParam.includes("estructuras") || productParam.includes("grammar")) {
      contentName = "Estructuras Gramaticales de Inglés A1-C1";
      contentId = "product-estructuras-gramaticales";
      value = 12;
    } else if (productParam.includes("8000") || productParam.includes("8,000")) {
      contentName = "Inglés Relax - 8,000 Palabras";
      contentId = "product-8000";
      value = 22;
    } else if (productParam.includes("5000") || productParam.includes("5,000")) {
      contentName = "Inglés Relax - 5,000 Palabras";
      contentId = "product-5000";
      value = 12;
    } else if (productParam.includes("verbos") || productParam.includes("1000")) {
      contentName = "Inglés Relax - 1,000 Verbos";
      contentId = "product-1000-verbos";
      value = 12;
    } else if (productParam.includes("preguntas") || productParam.includes("500")) {
      contentName = "Inglés Relax - 500 Preguntas";
      contentId = "product-500-preguntas";
      value = 7;
    } else if (productParam.includes("spanish")) {
      contentName = "Spanish Relax - 5,000 Words";
      contentId = "product-spanish-5000";
      value = 22;
    }

    if (valueParam) {
      value = parseFloat(valueParam) || value;
    }

    trackHotmartEvent("Purchase", {
      content_name: contentName,
      content_category: "Digital Book",
      content_ids: [contentId],
      content_type: "product",
      value: value,
      currency: "USD",
      num_items: 1,
      __skipFunnelLog: true,
    });

    // Google Analytics 4: purchase (Hotmart)
    trackGAEvent("purchase", {
      transaction_id: searchParams.get("transaction") || `hotmart_${Date.now()}`,
      currency: "USD",
      value: value,
      payment_provider: "hotmart",
      items: [
        {
          item_id: contentId,
          item_name: contentName,
          item_category: "Digital Book",
          price: value,
          quantity: 1,
        },
      ],
    });

    const timer = setTimeout(() => setConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [searchParams]);

  const handleWhatsApp = () => {
    window.open(
      "https://wa.me/112512724704?text=¡Hola!%20Acabo%20de%20comprar%20Inglés%20Relax",
      "_blank"
    );
  };

  const handleEmail = () => {
    window.location.href =
      "mailto:hola@ilinguerelax.com?subject=Soporte%20Compra%20Inglés%20Relax";
  };

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="¡Gracias Por Tu Compra! - Inglés Relax"
        description="Tu pedido ha sido confirmado. ¡Revisa tu email para acceder a tus libros Inglés Relax!"
        noIndex
      />
      <Navbar />

      {/* Confetti */}
      {confetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ["#22c55e", "#8b5cf6", "#f59e0b", "#ec4899", "#3b82f6"][
                  Math.floor(Math.random() * 5)
                ],
              }}
              initial={{ y: -20, opacity: 1, rotate: 0 }}
              animate={{
                y: window.innerHeight + 20,
                opacity: 0,
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 2,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Success Content */}
      <section className="pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="container px-4 md:px-6">
          <motion.div
            className="max-w-2xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Success Icon */}
            <motion.div
              className="mb-8 inline-flex"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-14 h-14 text-green-500" />
                </div>
                <motion.div
                  className="absolute -top-2 -right-2"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  <PartyPopper className="w-8 h-8 text-amber-500" />
                </motion.div>
              </div>
            </motion.div>

            <motion.h1
              className="text-3xl md:text-5xl font-bold text-foreground mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              ¡Gracias Por Tu Compra!
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-muted-foreground mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              ¡Revisa tu email para acceder a tu libro!
            </motion.p>

            {/* Access Info Card */}
            <motion.div
              className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-3xl border-2 border-green-500/30 shadow-xl p-8 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">
                📧 Revisa Tu Correo Electrónico
              </h2>
              <p className="text-muted-foreground mb-4">
                <strong>
                  Te enviaremos el acceso directamente al correo que registraste en
                  Hotmart.
                </strong>
              </p>
              <p className="text-muted-foreground mb-4">
                Por favor revisa tu bandeja de entrada (y la carpeta de spam) en los
                próximos minutos.
              </p>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-700 dark:text-amber-400 text-sm">
                <strong>⚠️ ¿No recibiste el correo?</strong>
                <br />
                Contáctanos por WhatsApp o email y te daremos acceso manualmente.
              </div>
            </motion.div>

            {/* Contact Card */}
            <motion.div
              className="bg-card rounded-3xl border border-border shadow-card p-8 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h2 className="text-xl font-semibold text-foreground mb-6">
                ¿Necesitas Ayuda? Contáctanos
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleWhatsApp}
                  variant="outline"
                  size="lg"
                  className="bg-green-500/10 border-green-500/30 hover:bg-green-500/20 text-green-600"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  WhatsApp: +1 251 272 4704
                </Button>
                <Button
                  onClick={handleEmail}
                  variant="outline"
                  size="lg"
                  className="bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20 text-purple-600"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  hola@ilinguerelax.com
                </Button>
              </div>
            </motion.div>

            {/* Thank You */}
            <motion.div
              className="flex items-center justify-center gap-2 text-muted-foreground mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              <span>¡Gracias por elegir Inglés Relax!</span>
            </motion.div>

            {/* Review CTA */}
            <motion.div
              className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-3xl border-2 border-amber-500/30 shadow-xl p-8 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center justify-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                ⭐ ¿Te gustó tu libro?
              </h2>
              <p className="text-muted-foreground mb-4">
                Tu opinión ayuda a otros estudiantes. ¡Déjanos una reseña!
              </p>
              <Link to="/dejar-resena?product=english">
                <Button variant="hero" size="lg" className="shadow-xl">
                  <Star className="w-5 h-5 mr-2" />
                  Dejar Mi Reseña
                </Button>
              </Link>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Link to="/">
                <Button variant="outline" size="lg">
                  Volver al Inicio
                </Button>
              </Link>
              <Link to="/products">
                <Button variant="hero" size="lg">
                  Explorar Más Productos
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default HotmartSuccess;
