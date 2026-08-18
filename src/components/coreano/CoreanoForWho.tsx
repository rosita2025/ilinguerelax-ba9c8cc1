import { Check } from "lucide-react";
import { motion } from "framer-motion";

export const CoreanoForWho = () => {
  const points = [
    {
      title: "Principiantes absolutos",
      desc: "Si no sabes nada de coreano y quieres empezar con una base sólida de vocabulario."
    },
    {
      title: "Fans de K-dramas y K-pop",
      desc: "Entiende mejor las frases y palabras que escuchas en tus series y canciones favoritas."
    },
    {
      title: "Viajeros",
      desc: "Aprende las palabras esenciales para moverte, comer y comunicarte en Corea."
    },
    {
      title: "Estudiantes visuales",
      desc: "Si te aburren los libros de gramática densos y prefieres aprender de forma clara y gráfica."
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-900/30">
      <div className="container px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
                ¿Es para ti?
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 font-medium">
                Este material ha sido diseñado pensando en facilitar el primer contacto con el idioma coreano a personas de habla hispana.
              </p>
              
              <div className="space-y-6">
                {points.map((point, idx) => (
                  <motion.div 
                    key={point.title}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0 mt-1">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white mb-1">{point.title}</h4>
                      <p className="text-slate-600 dark:text-slate-400 font-medium text-sm leading-relaxed">{point.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl relative">
                <img 
                  src="https://images.unsplash.com/photo-1542044896530-05d85be9b11a?w=800&h=800&fit=crop" 
                  alt="Aprendiendo coreano" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" />
              </div>
              
              {/* Floating element */}
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 max-w-[240px]">
                <p className="text-slate-900 dark:text-white font-black italic">
                  "Perfecto para empezar sin sentirse abrumado por la gramática."
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <div className="w-8 h-8 rounded-full bg-slate-200" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">María G.</p>
                    <p className="text-[10px] text-slate-400">Estudiante verified</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
