import { Play, Star, Quote, BookOpen } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

// Product images
const product8000Image = "/images/product-8000.png";
const product5000Image = "/images/product-5000.png";

interface ProductTestimonial {
  videoUrl: string;
  customerName: string;
  customerLocation: string;
  testimonialQuote: string;
  productName: string;
  productImage: string;
}

interface VideoTestimonialProps {
  videoUrl: string;
  customerName?: string;
  customerLocation?: string;
  testimonialQuote?: string;
  lang?: "es" | "en";
  showProductSelector?: boolean;
}

const productTestimonials: Record<string, ProductTestimonial> = {
  "5000": {
    videoUrl: "https://youtu.be/bG35t0x3GkU",
    customerName: "Cliente Verificado",
    customerLocation: "Latinoamérica",
    testimonialQuote: "Este libro cambió completamente mi forma de aprender inglés. La pronunciación adaptada al español hace que sea muy fácil de entender. ¡100% recomendado!",
    productName: "5,000 Palabras",
    productImage: product5000Image,
  },
  "8000": {
    videoUrl: "https://youtu.be/bG35t0x3GkU",
    customerName: "María González",
    customerLocation: "México",
    testimonialQuote: "El libro de 8,000 palabras es increíble. Tiene todo el vocabulario que necesito para comunicarme con fluidez. La pronunciación en español me ayudó muchísimo.",
    productName: "8,000 Palabras",
    productImage: product8000Image,
  },
};

export const VideoTestimonial = ({
  videoUrl,
  customerName = "Cliente Satisfecho",
  customerLocation = "España",
  testimonialQuote = "Este libro cambió mi forma de aprender inglés. ¡Totalmente recomendado!",
  lang = "es",
  showProductSelector = false
}: VideoTestimonialProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeProduct, setActiveProduct] = useState<"5000" | "8000">("5000");

  // Get current testimonial data
  const currentTestimonial = showProductSelector 
    ? productTestimonials[activeProduct] 
    : { videoUrl, customerName, customerLocation, testimonialQuote, productName: "", productImage: "" };

  // Extract YouTube video ID from various URL formats
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = getYouTubeId(currentTestimonial.videoUrl);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : "";
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "";

  const text = lang === "en" ? {
    title: "What Our Customers Say",
    subtitle: "Real testimonials from satisfied students",
    watch: "Watch Testimonial",
    verified: "Verified Purchase",
    selectProduct: "Select Product"
  } : {
    title: "Lo Que Dicen Nuestros Clientes",
    subtitle: "Testimonios reales de estudiantes satisfechos",
    watch: "Ver Testimonio",
    verified: "Compra Verificada",
    selectProduct: "Selecciona un Producto"
  };

  const handleProductChange = (product: "5000" | "8000") => {
    setActiveProduct(product);
    setIsPlaying(false);
  };

  return (
    <section className="py-12 md:py-20 bg-gradient-to-b from-background to-secondary/30">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4"
          >
            <Star className="w-4 h-4 fill-primary" />
            TESTIMONIOS REALES
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-foreground mb-4"
          >
            {text.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            {text.subtitle}
          </motion.p>
        </div>

        {/* Product Selector Cards */}
        {showProductSelector && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 }}
            className="flex flex-wrap justify-center gap-4 mb-8"
          >
            {(["5000", "8000"] as const).map((product) => (
              <Card
                key={product}
                onClick={() => handleProductChange(product)}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg w-[160px] md:w-[200px] ${
                  activeProduct === product
                    ? "ring-2 ring-primary border-primary shadow-lg scale-105"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <CardContent className="p-3 md:p-4 text-center">
                  <img
                    src={productTestimonials[product].productImage}
                    alt={productTestimonials[product].productName}
                    className="w-20 h-20 md:w-24 md:h-24 object-contain mx-auto mb-2"
                  />
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <BookOpen className="w-3 h-3 text-primary" />
                    <span className="text-xs font-semibold text-primary">
                      {lang === "en" ? "English" : "Inglés"}
                    </span>
                  </div>
                  <p className="text-sm md:text-base font-bold text-foreground">
                    {productTestimonials[product].productName}
                  </p>
                  {activeProduct === product && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs"
                    >
                      <Star className="w-3 h-3 fill-primary" />
                      {lang === "en" ? "Selected" : "Seleccionado"}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="relative rounded-3xl overflow-hidden shadow-2xl bg-black"
          >
            {!isPlaying ? (
              <div className="relative aspect-video cursor-pointer group" onClick={() => setIsPlaying(true)}>
                {/* Thumbnail */}
                <img
                  src={thumbnailUrl}
                  alt="Video testimonial"
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                
                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-red-600 flex items-center justify-center shadow-2xl group-hover:bg-red-500 transition-colors"
                  >
                    <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white ml-1" />
                  </motion.div>
                </div>

                {/* Watch label */}
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                  <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2">
                    <Play className="w-4 h-4 text-red-600 fill-red-600" />
                    <span className="text-sm font-semibold text-gray-800">{text.watch}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-green-500 rounded-full px-3 py-1.5">
                    <Star className="w-3 h-3 text-white fill-white" />
                    <span className="text-xs font-bold text-white">{text.verified}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-video">
                <iframe
                  src={embedUrl}
                  title="Video testimonial"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </motion.div>

          {/* Quote section below video */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-8 bg-card rounded-2xl border border-border p-6 md:p-8 relative"
          >
            <Quote className="absolute top-4 left-4 w-8 h-8 text-primary/20" />
            <div className="text-center">
              <p className="text-lg md:text-xl text-foreground italic mb-4 relative z-10">
                "{currentTestimonial.testimonialQuote}"
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
              <p className="mt-3 font-semibold text-foreground">{currentTestimonial.customerName}</p>
              <p className="text-sm text-muted-foreground">{currentTestimonial.customerLocation}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};