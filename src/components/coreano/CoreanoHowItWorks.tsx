import { Check } from "lucide-react";
import { motion } from "framer-motion";

export const CoreanoHowItWorks = () => {
  const sampleWords = [
    { hangul: "안녕하세요", rom: "Annyeonghaseyo", esp: "Hola" },
    { hangul: "감사합니다", rom: "Gamsahamnida", esp: "Gracias" },
    { hangul: "물", rom: "Mul", esp: "Agua" },
    { hangul: "밥", rom: "Bap", esp: "Comida / Arroz" },
    { hangul: "사랑해요", rom: "Saranghaeyo", esp: "Te amo" }
  ];

  return (
    <section className="py-16 md:py-24 bg-primary/5">
      <div className="container px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
              Así aprenderás las palabras
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Un método visual y directo. Sin complicaciones, diseñado para que entiendas la palabra, su escritura y su pronunciación al instante.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0 font-bold">1</div>
                <div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">Mira el Hangul</h4>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">Familiarízate con la escritura original del alfabeto coreano.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0 font-bold">2</div>
                <div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">Lee la pronunciación</h4>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">Adaptada para que cualquier hispanohablante pueda decirla correctamente.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0 font-bold">3</div>
                <div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">Entiende el significado</h4>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">Traducción directa al español para que no queden dudas.</p>
                </div>
              </div>

              <div className="pt-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-bold text-sm">
                  Coreano → Pronunciación → Español
                </div>
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, rotateY: 10 }}
              whileInView={{ opacity: 1, rotateY: 0 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl border-4 border-slate-100 dark:border-slate-700 relative"
            >
              {/* PDF Header Mockup */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-700">
                <span className="text-xs font-black text-primary tracking-widest uppercase">Página 14 · Saludos</span>
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-200" />)}
                </div>
              </div>

              <div className="space-y-6">
                {sampleWords.map((word, i) => (
                  <div key={i} className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-50 dark:border-slate-700 pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-col">
                      <span className="text-2xl font-black text-primary">{word.hangul}</span>
                      <span className="text-sm font-bold text-slate-400 italic">{word.rom}</span>
                    </div>
                    <span className="hidden md:block text-slate-200">—</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">{word.esp}</span>
                  </div>
                ))}
              </div>

            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
