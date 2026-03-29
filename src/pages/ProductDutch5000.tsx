import { useState } from "react";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FAQ } from "@/components/FAQ";
import { ProductReviews } from "@/components/ProductReviews";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, BookOpen, Mail, Loader2, Lightbulb, Globe, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const productDutch5000Image = "/images/product-dutch-5000.png";

const features = [
  "5,000 palabras esenciales en neerlandés",
  "Pronunciación adaptada para hispanohablantes",
  "Fonética neerlandesa",
  "Traducción al español",
  "Ideal para principiantes",
  "Organizado por categorías temáticas",
  "Formato digital PDF",
  "Acceso de por vida",
];

const ProductDutch5000 = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast({ title: "Error", description: "Por favor ingresa un correo electrónico válido.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-store-notification", {
        body: { email, storeName: "Neerlandés Relax - 5,000 Palabras", productType: "dutch" },
      });
      if (error) throw error;
      setIsSubscribed(true);
      toast({ title: "¡Gracias por suscribirte! 🎉", description: "Te avisaremos cuando el libro esté disponible. ¡Muy pronto!" });
    } catch (error) {
      console.error("Error subscribing:", error);
      toast({ title: "Error", description: "Hubo un error al suscribirte. Intenta de nuevo.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="5,000 Palabras en Neerlandés con Pronunciación para Hispanohablantes y Fonética Neerlandesa"
        description="Aprende 5,000 palabras en neerlandés con pronunciación adaptada para hispanohablantes y fonética neerlandesa. Muy pronto disponible."
        canonicalUrl="https://ilinguerelax.com/products/5-000-palabras-en-neerlandes-con-pronunciacion-para-hispanohablantes"
        image="https://ilinguerelax.com/og-image.png"
        type="product"
        price="12"
        originalPrice="54"
        sku="ILINGUE-DUTCH-5000"
        keywords="palabras en neerlandés, aprender neerlandés, pronunciación neerlandés hispanohablantes, fonética neerlandesa, neerlandés para hispanohablantes, holandés"
      />
      <Navbar />

      <section className="pt-4 pb-6 md:pt-8 md:pb-10">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="absolute -inset-4 gradient-hero opacity-20 blur-3xl rounded-3xl" />
              <div className="relative">
                <img src={productDutch5000Image} alt="Neerlandés Relax - 5,000 Palabras en Neerlandés" className="w-full h-auto rounded-2xl shadow-hero" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 text-sm font-bold border border-amber-500/20">
                  <Sparkles className="w-4 h-4" />
                  <span>🇳🇱 MUY PRONTO</span>
                </motion.div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                5,000 Palabras en Neerlandés con Pronunciación para Hispanohablantes y Fonética Neerlandesa
              </h1>

              <p className="text-lg text-muted-foreground mb-6">
                Aprende neerlandés de forma relajada con pronunciación adaptada al español. Fonética neerlandesa incluida.
              </p>

              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-2xl p-6 border border-amber-500/20 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <span className="text-amber-600 font-semibold text-sm uppercase">Precio de Lanzamiento</span>
                </div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-5xl md:text-6xl font-black text-foreground">$12</span>
                  <span className="text-2xl text-muted-foreground line-through">$54</span>
                  <motion.span animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-sm font-bold shadow-lg">
                    AHORRA 78%
                  </motion.span>
                </div>
                <p className="text-sm text-muted-foreground">💳 Pago único • Sin suscripciones • Acceso de por vida</p>
              </motion.div>

              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="bg-card rounded-2xl border-2 border-primary/20 p-6 mb-6">
                {isSubscribed ? (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">¡Gracias por suscribirte! 🎉</h3>
                    <p className="text-muted-foreground">Te enviaremos un correo cuando el libro esté disponible. ¡Muy pronto!</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-primary" />
                      ¡Suscríbete y te avisamos cuando esté listo!
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">Deja tu correo y serás el primero en saber cuando esté disponible.</p>
                    <form onSubmit={handleSubscribe} className="flex gap-2">
                      <Input type="email" placeholder="Tu correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1" disabled={isLoading} />
                      <Button type="submit" disabled={isLoading} className="shrink-0">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><Mail className="w-4 h-4 mr-2" />Suscribirme</>)}
                      </Button>
                    </form>
                  </>
                )}
              </motion.div>
              <p className="text-center text-sm text-muted-foreground mb-6">📧 Te notificaremos por correo cuando esté disponible</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 md:py-10">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
              5,000 Palabras en Neerlandés con{" "}<span className="text-gradient">Pronunciación Hispanohablante</span>
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-12">Todo lo que necesitas para comenzar a hablar neerlandés con confianza</p>
            <div className="bg-card rounded-3xl border border-border shadow-card p-8 mb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full gradient-hero flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProductReviews productType="dutch" reviews={[]} showReviewForm />
      <FAQ
        items={[
          { question: "¿Cuándo estará disponible?", answer: "Estamos trabajando en el libro y estará disponible muy pronto. Suscríbete para ser el primero en saberlo.", icon: Sparkles },
          { question: "¿Qué incluye este libro?", answer: "Incluye 5,000 palabras en neerlandés con pronunciación adaptada para hispanohablantes, fonética neerlandesa y traducción al español.", icon: BookOpen },
          { question: "¿Necesito saber neerlandés para usarlo?", answer: "No. Puedes empezar desde cero. Cada palabra incluye su traducción y pronunciación adaptada al español.", icon: Lightbulb },
          { question: "¿En qué formato estará disponible?", answer: "Estará disponible en formato digital (PDF) con descarga inmediata. Podrás imprimirlo si lo deseas.", icon: Globe },
        ]}
        title="Preguntas Frecuentes"
        subtitle="Resolvemos tus dudas sobre 5,000 Palabras en Neerlandés"
      />
      <Footer />
      <WhatsAppButton />
      <ScrollToTop showAfter={500} />
    </main>
  );
};

export default ProductDutch5000;
