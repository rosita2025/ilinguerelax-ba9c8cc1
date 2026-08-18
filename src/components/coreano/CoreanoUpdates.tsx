import { RefreshCw, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export const CoreanoUpdates = () => {
  return (
    <section className="py-16 md:py-24 container px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-[2rem] overflow-hidden bg-slate-900 text-white p-8 md:p-12 shadow-2xl"
        >
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -z-0" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 blur-[100px] -z-0" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12 text-center md:text-left">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 animate-spin-slow">
              <RefreshCw className="w-10 h-10 md:w-12 md:h-12 text-primary" />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold mb-4 border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> VALOR A LARGO PLAZO
              </div>
              <h3 className="text-3xl md:text-4xl font-black mb-4">
                🎁 Actualizaciones gratuitas incluidas
              </h3>
              <p className="text-slate-300 text-lg md:text-xl font-medium max-w-2xl">
                ¡Próxima expansión a <span className="text-white font-bold underline decoration-amber-500">2,000 palabras</span> incluida! Podrás recibir las nuevas versiones <span className="text-white font-bold underline decoration-primary decoration-2">sin pagar nuevamente</span> por ellas.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
