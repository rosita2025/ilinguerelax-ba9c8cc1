import { motion } from "framer-motion";

export const CoreanoCategories = () => {
  const categories = [
    { emoji: "👋", name: "Saludos" },
    { emoji: "👨‍👩‍👧", name: "Familia" },
    { emoji: "🍜", name: "Comida" },
    { emoji: "🏠", name: "Casa" },
    { emoji: "🏫", name: "Escuela" },
    { emoji: "❤️", name: "Emociones" },
    { emoji: "💼", name: "Trabajo" },
    { emoji: "✈️", name: "Viajes" },
    { emoji: "🛍️", name: "Compras" },
    { emoji: "⏰", name: "Tiempo" },
    { emoji: "🏃", name: "Verbos" },
    { emoji: "🎨", name: "Colores" }
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
              Aprende vocabulario por categorías
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Todo el vocabulario está organizado temáticamente para que puedas aprender lo que necesitas en cada situación real.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat, idx) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-colors group"
              >
                <span className="text-4xl group-hover:scale-110 transition-transform">{cat.emoji}</span>
                <span className="text-sm font-black text-slate-900 dark:text-white text-center">{cat.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
