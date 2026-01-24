import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { trackHotmartEvent } from "@/hooks/useMetaPixel";
import {
  CheckCircle,
  Download,
  MessageCircle,
  Mail,
  PartyPopper,
  Heart,
  ArrowRight,
} from "lucide-react";

const HotmartSuccess = () => {
  const [confetti, setConfetti] = useState(true);

  useEffect(() => {
    // Fire Purchase event for Hotmart Pixel (24959578143733255)
    trackHotmartEvent("Purchase", {
      content_name: "Inglés Relax - 5,000 Palabras",
      content_category: "Digital Book",
      content_ids: ["product-5000"],
      content_type: "product",
      value: 10,
      currency: "USD",
      num_items: 1,
    });

    // Hide confetti after animation
    const timer = setTimeout(() => setConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleDownload = () => {
    // Hotmart delivers the product automatically, but we can add a backup link
    window.open("https://www.hotmart.com/my-purchases", "_blank");
  };

  const handleWhatsApp = () => {
    window.open("https://wa.me/15752160934?text=¡Hola!%20Acabo%20de%20comprar%20Inglés%20Relax%205,000%20Palabras", "_blank");
  };

  const handleEmail = () => {
    window.location.href = "mailto:hola@ilinguerelax.com?subject=Soporte%20Compra%20Inglés%20Relax";
  };

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="¡Gracias Por Tu Compra! - Inglés Relax"
        description="Tu pedido ha sido confirmado. ¡Revisa tu email para acceder a tu libro Inglés Relax 5,000 Palabras!"
      />
      <Navbar />

      {/* Confetti Animation */}
      {confetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#22c55e', '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6'][Math.floor(Math.random() * 5)],
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

            {/* Title */}
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
              Tu libro Inglés Relax - 5,000 Palabras está listo. ¡Revisa tu email!
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
                <strong>Te enviaremos el acceso a tu libro directamente al correo que registraste en Hotmart.</strong>
              </p>
              <p className="text-muted-foreground mb-4">
                Por favor revisa tu bandeja de entrada (y la carpeta de spam) en los próximos minutos.
              </p>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-700 dark:text-amber-400 text-sm">
                <strong>⚠️ ¿No recibiste el correo?</strong><br />
                Contáctanos por WhatsApp o email y te daremos acceso manualmente.
              </div>
            </motion.div>

            {/* Contact Info Card */}
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
                  WhatsApp: +1 575 216 0934
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

            {/* Thank You Message */}
            <motion.div
              className="flex items-center justify-center gap-2 text-muted-foreground mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              <span>¡Gracias por elegir Inglés Relax!</span>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
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
