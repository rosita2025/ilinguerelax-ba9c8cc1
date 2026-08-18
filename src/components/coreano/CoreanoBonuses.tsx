import { Sparkles, Check, Gift } from "lucide-react";
import { motion } from "framer-motion";

export const CoreanoBonuses = () => {
  const bonuses = [
    {
      title: "BONO 1",
      name: "100 Expresiones Coreanas Esenciales",
      description: "Aprende expresiones prácticas que puedes encontrar en conversaciones y situaciones cotidianas.",
      preview: [
        { hangul: "안녕하세요", rom: "Annyeonghaseyo", esp: "Hola" },
        { hangul: "감사합니다", rom: "Gamsahamnida", esp: "Gracias" },
        { hangul: "괜찮아요", rom: "Gwaenchanayo", esp: "Está bien" }
      ],
      color: "primary"
    },
    {
      title: "BONO 2",
      name: "Ejercicios de Escritura en Hangul",
      description: "Practica la escritura del alfabeto coreano mediante ejercicios diseñados para ayudarte a familiarizarte con los caracteres.",
      content: "Guía paso a paso con trazos y repeticiones para dominar el alfabeto desde cero.",
      color: "amber"
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-900/30">
      <div className="container px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-sm font-bold mb-4 border border-amber-500/20"
            >
              <Gift className="w-4 h-4" /> OFERTA POR LANZAMIENTO
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
              🎁 Además, recibirás <span className="text-primary">2 bonos gratis</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest">
              INCLUIDOS CON TU COMPRA
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {bonuses.map((bonus, idx) => (
              <motion.div
                key={bonus.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className={`relative rounded-3xl border-2 p-8 h-full flex flex-col ${
                  bonus.color === 'primary' 
                    ? 'border-primary/20 bg-white dark:bg-slate-800 shadow-xl shadow-primary/5' 
                    : 'border-amber-500/20 bg-white dark:bg-slate-800 shadow-xl shadow-amber-500/5'
                }`}
              >
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4 ${
                  bonus.color === 'primary' ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-600'
                }`}>
                  {bonus.title}
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">
                  {bonus.name}
                </h3>
                
                <p className="text-slate-600 dark:text-slate-400 mb-8 font-medium">
                  {bonus.description}
                </p>

                {bonus.preview ? (
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 space-y-3 mt-auto border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Muestra del contenido:</p>
                    {bonus.preview.map((item, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 last:border-0 last:pb-0">
                        <span className="font-bold text-primary">{item.hangul}</span>
                        <span className="text-xs text-slate-400">—</span>
                        <span className="font-bold text-slate-900 dark:text-white">{item.esp}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 mt-auto border border-slate-100 dark:border-slate-700">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {bonus.content}
                      </p>
                    </div>
                  </div>
                )}

                <div className={`absolute -top-3 -right-3 w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                  bonus.color === 'primary' ? 'bg-primary' : 'bg-amber-500'
                }`}>
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
