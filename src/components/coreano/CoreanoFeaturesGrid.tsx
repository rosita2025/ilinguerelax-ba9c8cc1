import { BookOpen, Globe, Languages, MessageSquare, List, Gift } from "lucide-react";
import { motion } from "framer-motion";

export const CoreanoFeaturesGrid = () => {
  const features = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "1,000 PALABRAS",
      description: "Vocabulario esencial organizado para estudiar de forma progresiva.",
      color: "bg-blue-500"
    },
    {
      icon: <Languages className="w-6 h-6" />,
      title: "HANGUL",
      description: "Visualiza las palabras directamente en coreano.",
      color: "bg-primary"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "ESPAÑOL",
      description: "Comprende claramente el significado.",
      color: "bg-emerald-500"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "PRONUNCIACIÓN",
      description: "Pronunciación adaptada para hispanohablantes.",
      color: "bg-amber-500"
    },
    {
      icon: <List className="w-6 h-6" />,
      title: "CATEGORÍAS",
      description: "Encuentra fácilmente el vocabulario por temas.",
      color: "bg-purple-500"
    },
    {
      icon: <Gift className="w-6 h-6" />,
      title: "EXTRAS",
      description: "Ejercicios de escritura en Hangul y frases clave de k-dramas.",
      color: "bg-pink-500"
    }
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
              ¿Qué recibes con tu compra?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Todo lo que necesitas para dominar el vocabulario coreano en un solo lugar, de forma organizada y visual.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-2xl transition-all hover:-translate-y-1 group"
              >
                <div className={`${feature.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 font-medium">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
