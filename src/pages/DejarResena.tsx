import { useSearchParams } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ReviewForm } from "@/components/ReviewForm";
import { motion } from "framer-motion";
import { Star, Heart } from "lucide-react";

const productLabels: Record<string, string> = {
  english: "Inglés Relax - 5,000 Palabras",
  "english-8000": "Inglés Relax - 8,000 Palabras",
  "1000-verbos": "1,000 Verbos Esenciales",
  "500-preguntas": "500 Preguntas en Inglés",
  spanish: "Spanish Relax - 5,000 Words",
};

const DejarResena = () => {
  const [searchParams] = useSearchParams();
  const product = searchParams.get("product") || "english";
  const productName = productLabels[product] || "Inglés Relax";

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title={`Deja Tu Reseña - ${productName}`}
        description={`Comparte tu experiencia con ${productName}. Tu opinión nos ayuda a mejorar.`}
        canonicalUrl="https://ilinguerelax.com/dejar-resena"
      />
      <Navbar />

      <section className="pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="container px-4 md:px-6">
          <motion.div
            className="max-w-2xl mx-auto text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-8 h-8 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              ¡Cuéntanos Tu Experiencia!
            </h1>
            <p className="text-lg text-muted-foreground">
              Tu reseña de <strong>{productName}</strong> ayuda a otros estudiantes a decidirse.
            </p>
          </motion.div>

          <ReviewForm productType={product} />

          <motion.div
            className="flex items-center justify-center gap-2 text-muted-foreground mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            <span>¡Gracias por ser parte de la familia iLingue Relax!</span>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default DejarResena;
