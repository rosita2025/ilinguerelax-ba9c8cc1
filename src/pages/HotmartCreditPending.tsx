import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  CreditCard,
  MessageCircle,
  Mail,
  Shield,
  ArrowRight,
} from "lucide-react";

const HotmartCreditPending = () => {
  const handleWhatsApp = () => {
    window.open("https://wa.me/15752160934?text=¡Hola!%20Mi%20pago%20está%20en%20análisis%20de%20crédito", "_blank");
  };

  const handleEmail = () => {
    window.location.href = "mailto:hola@ilinguerelax.com?subject=Análisis%20de%20Crédito%20Inglés%20Relax";
  };

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Análisis de Crédito en Proceso - Inglés Relax"
        description="Tu pago está siendo analizado. Te notificaremos cuando esté aprobado."
      />
      <Navbar />

      {/* Credit Analysis Content */}
      <section className="pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="container px-4 md:px-6">
          <motion.div
            className="max-w-2xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Credit Icon */}
            <motion.div
              className="mb-8 inline-flex"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <CreditCard className="w-14 h-14 text-blue-500" />
                </div>
                <motion.div
                  className="absolute -top-2 -right-2"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  <Shield className="w-8 h-8 text-blue-600" />
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
              Análisis de Crédito en Proceso
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-muted-foreground mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Tu pago está siendo analizado por la institución financiera. Te notificaremos el resultado.
            </motion.p>

            {/* Info Card */}
            <motion.div
              className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-3xl border-2 border-blue-500/30 shadow-xl p-8 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">
                🔍 ¿Qué Significa Esto?
              </h2>
              <div className="text-left space-y-4 text-muted-foreground">
                <p className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold">1.</span>
                  Tu banco o tarjeta de crédito está verificando la transacción.
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold">2.</span>
                  Este proceso puede tomar de unas horas hasta 2 días hábiles.
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold">3.</span>
                  Una vez aprobado, recibirás acceso inmediato a tu libro por email.
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold">4.</span>
                  No te preocupes, este es un proceso de seguridad estándar.
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

export default HotmartCreditPending;
