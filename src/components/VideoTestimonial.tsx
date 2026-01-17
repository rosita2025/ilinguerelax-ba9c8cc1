import { Play, Star, Quote } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

interface VideoTestimonialProps {
  videoUrl: string;
  customerName?: string;
  customerLocation?: string;
  testimonialQuote?: string;
  lang?: "es" | "en";
}

export const VideoTestimonial = ({
  videoUrl,
  customerName = "Cliente Satisfecho",
  customerLocation = "España",
  testimonialQuote = "Este libro cambió mi forma de aprender inglés. ¡Totalmente recomendado!",
  lang = "es"
}: VideoTestimonialProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Extract YouTube video ID from various URL formats
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = getYouTubeId(videoUrl);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : "";
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "";

  const text = lang === "en" ? {
    title: "What Our Customers Say",
    subtitle: "Real testimonials from satisfied students",
    watch: "Watch Testimonial",
    verified: "Verified Purchase"
  } : {
    title: "Lo Que Dicen Nuestros Clientes",
    subtitle: "Testimonios reales de estudiantes satisfechos",
    watch: "Ver Testimonio",
    verified: "Compra Verificada"
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
                "{testimonialQuote}"
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
              <p className="mt-3 font-semibold text-foreground">{customerName}</p>
              <p className="text-sm text-muted-foreground">{customerLocation}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
