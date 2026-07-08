import { useState } from "react";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, Send, Instagram, Facebook, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useSpanishRelaxPixelContact } from "@/hooks/useMetaPixel";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const ContactPage = () => {
  // Meta Pixel tracking for Contact page
  useSpanishRelaxPixelContact();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Por favor ingresa un email válido");
      return;
    }

    if (formData.name.length > 100 || formData.email.length > 255 || formData.message.length > 1000) {
      toast.error("Uno o más campos exceden el límite de caracteres");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim() || undefined,
          message: formData.message.trim(),
        },
      });

      if (error) {
        throw error;
      }

      toast.success("¡Mensaje enviado! Te responderemos pronto.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Error al enviar el mensaje. Por favor intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Contacto - Soporte y Ayuda"
        description="¿Dudas sobre nuestros libros de inglés con pronunciación? Escríbenos a hola@ilinguerelax.com. Respuesta en 24-48 horas. Atención en español."
        canonicalUrl="https://ilinguerelax.com/contacto"
        keywords="contacto iLingue Relax, soporte libros inglés, ayuda pronunciación inglés, atención cliente iLingue"
      />
      <Navbar />

      {/* Hero Section */}
      <motion.section
        className="pt-32 pb-16 gradient-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container px-4 md:px-6">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
              Contáctanos
            </h1>
            <p className="text-lg text-primary-foreground/90">
              Estamos aquí para ayudarte con cualquier duda
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Main Content */}
      <section className="py-20 md:py-28">
        <div className="container px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <motion.div
                className="bg-card rounded-3xl border border-border shadow-card p-8 md:p-10"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="mb-8">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                    <MessageSquare className="w-4 h-4" />
                    Envíanos un mensaje
                  </span>
                  <h2 className="text-2xl font-bold text-foreground">
                    ¿Cómo podemos ayudarte?
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                        Nombre *
                      </label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Tu nombre"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        maxLength={100}
                        className="w-full"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                        Email *
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        maxLength={255}
                        className="w-full"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                      Asunto
                    </label>
                    <Input
                      id="subject"
                      type="text"
                      placeholder="¿De qué se trata?"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      maxLength={200}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                      Mensaje *
                    </label>
                    <Textarea
                      id="message"
                      placeholder="Escribe tu mensaje aquí..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      maxLength={1000}
                      rows={5}
                      className="w-full resize-none"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {formData.message.length}/1000
                    </p>
                  </div>

                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Enviando..."
                    ) : (
                      <>
                        Enviar Mensaje
                        <Send className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>

              {/* Contact Info */}
              <motion.div
                className="space-y-6"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {/* Email */}
                <motion.div
                  className="bg-card rounded-2xl border border-border shadow-card p-6"
                  variants={fadeInUp}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl gradient-hero flex items-center justify-center flex-shrink-0">
                      <Mail className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">Email</h3>
                      <p className="text-muted-foreground">hola@ilinguerelax.com</p>
                      <p className="text-sm text-muted-foreground mt-1">Respondemos en 24-48 horas</p>
                    </div>
                  </div>
                </motion.div>

                {/* Response Time */}
                <motion.div
                  className="bg-card rounded-2xl border border-border shadow-card p-6"
                  variants={fadeInUp}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl gradient-hero flex items-center justify-center flex-shrink-0">
                      <Clock className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">Horario de Atención</h3>
                      <p className="text-muted-foreground">Lunes a Viernes</p>
                      <p className="text-sm text-muted-foreground mt-1">9:00 AM - 6:00 PM (GMT-5)</p>
                    </div>
                  </div>
                </motion.div>

                {/* Social Media */}
                <motion.div
                  className="bg-card rounded-2xl border border-border shadow-card p-6"
                  variants={fadeInUp}
                >
                  <h3 className="text-lg font-semibold text-foreground mb-4">Síguenos en Redes</h3>
                  <div className="flex gap-4">
                    <a
                      href="https://www.instagram.com/ilinguerelax/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center transition-transform hover:scale-105"
                      aria-label="Instagram @ilinguerelax"
                    >
                      <Instagram className="w-6 h-6 text-white" />
                    </a>
                    <a
                      href="https://web.facebook.com/ilinguerelax/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center transition-transform hover:scale-105"
                      aria-label="Facebook iLingue Relax"
                    >
                      <Facebook className="w-6 h-6 text-white" />
                    </a>
                  </div>
                </motion.div>

                {/* FAQ Link */}
                <motion.div
                  className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-6 border border-primary/20"
                  variants={fadeInUp}
                >
                  <h3 className="text-lg font-semibold text-foreground mb-2">¿Preguntas Frecuentes?</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Consulta nuestras preguntas frecuentes para respuestas inmediatas sobre nuestros productos.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/faq">Ver FAQ</a>
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
</main>
  );
};

export default ContactPage;
