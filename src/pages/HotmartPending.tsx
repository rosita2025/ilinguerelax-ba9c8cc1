import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Clock,
  MessageCircle,
  Mail,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

const HotmartPending = () => {
  const handleWhatsApp = () => {
    window.open("https://wa.me/112512724704?text=¡Hola!%20Tengo%20un%20pago%20pendiente%20para%20Inglés%20Relax", "_blank");
  };

  const handleEmail = () => {
    window.location.href = "mailto:hola@ilinguerelax.com?subject=Pago%20Pendiente%20Inglés%20Relax";
  };

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Pago Pendiente - Inglés Relax"
        description="Tu pago está siendo procesado. Te notificaremos cuando esté confirmado."
      />
      <Navbar />

      {/* Pending Content */}
      <section className="pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="container px-4 md:px-6">
          <motion.div
            className="max-w-2xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Pending Icon */}
            <motion.div
              className="mb-8 inline-flex"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-14 h-14 text-amber-500" />
                </div>
                <motion.div
                  className="absolute -top-2 -right-2"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  <AlertCircle className="w-8 h-8 text-amber-600" />
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
              Pago Esperando Confirmación
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-muted-foreground mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Tu pago está siendo procesado. Te notificaremos por email cuando esté confirmado.
            </motion.p>

            {/* Info Card */}
            <motion.div
              className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-3xl border-2 border-amber-500/30 shadow-xl p-8 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">
                ⏳ ¿Qué Sigue?
              </h2>
              <div className="text-left space-y-4 text-muted-foreground">
                <p className="flex items-start gap-3">
                  <span className="text-amber-500 font-bold">1.</span>
                  Una vez que tu pago sea confirmado, recibirás un email con el acceso a tu libro.
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-amber-500 font-bold">2.</span>
                  El tiempo de procesamiento puede variar según el método de pago utilizado.
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-amber-500 font-bold">3.</span>
                  Si tienes dudas, no dudes en contactarnos.
                </p>
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
                ¿Tienes Preguntas? Contáctanos
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

export default HotmartPending;
