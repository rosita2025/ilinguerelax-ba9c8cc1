import { Check, Star, ShieldCheck, Zap, Download, Lock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import coverAsset from "@/assets/coreano-100-mapas-cover.webp.asset.json";
import mapaSaludos from "@/assets/coreano-mapa-01-saludos.webp.asset.json";

interface CoreanoHeroRedesignProps {
  price: string;
  onBuy: () => void;
}

export const CoreanoHeroRedesign = ({ price, onBuy }: CoreanoHeroRedesignProps) => {
  return (
    <section className="relative pt-6 pb-12 md:pt-12 md:pb-20 overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-5%] w-[30%] h-[30%] rounded-full bg-amber-500/5 blur-[100px]" />
      </div>

      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Mockup & Preview */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <div className="relative group">
              {/* Main Cover */}
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 transform lg:-rotate-2 hover:rotate-0 transition-transform duration-500">
                <img
                  src="https://opyitzdvvurdyyyzkwwv.supabase.co/storage/v1/object/public/product-images/1-000-palabras-esenciales-para-aprender-coreano/1784178628839-09lsq.webp"
                  alt="Aprende Coreano con 1,000 Palabras Esenciales"
                  className="w-full h-auto"
                />
              </div>

              {/* Page Preview Overlapping */}
              <div className="absolute -bottom-6 -right-6 md:-bottom-10 md:-right-10 z-20 w-1/2 rounded-xl overflow-hidden shadow-xl border-4 border-white dark:border-slate-800 transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <img
                  src={mapaSaludos.url}
                  alt="Vista previa interior Coreano"
                  className="w-full h-auto"
                />
                <div className="absolute top-2 right-2 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                  VISTA PREVIA EBOOK
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute top-10 -left-6 z-20 bg-white dark:bg-slate-900 p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 animate-bounce-slow">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <Star className="w-4 h-4 text-amber-600 fill-amber-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Calificación</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">4.9/5.0 Estrellas</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Copy & CTA */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="order-1 lg:order-2"
          >
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20">
                <span className="text-base">🇰🇷</span> COREANO PARA HISPANOHABLANTES
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-sm font-bold border border-amber-500/20">
                <Sparkles className="w-4 h-4" /> NUEVO LANZAMIENTO
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6 leading-[1.1] text-balance">
              Aprende las <span className="text-primary">1,000 palabras</span> esenciales del coreano 🇰🇷
            </h1>

            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 font-medium">
              Amplía tu vocabulario coreano con <span className="text-slate-900 dark:text-white font-bold underline decoration-amber-500 decoration-2">Hangul</span>, traducción al español y pronunciación fácil de entender.
            </p>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 mb-8">
              <p className="text-slate-700 dark:text-slate-300 font-semibold mb-4 text-sm uppercase tracking-wider">Una guía práctica para estudiar a tu propio ritmo:</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                {[
                  "1,000 palabras esenciales",
                  "Coreano desde Cero (A1)",
                  "Hangul + español",
                  "Pronunciación adaptada",
                  "Organizado por categorías",
                  "Actualización GRATIS a 2,000 palabras"
                ].map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3 text-slate-700 dark:text-slate-200 font-bold">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">{price}</span>
                  <span className="text-lg text-slate-400 line-through font-bold">$39</span>

                </div>
                <p className="text-emerald-600 font-bold text-sm">¡Ahorra 70% hoy!</p>
              </div>

              <Button 
                onClick={onBuy}
                size="lg" 
                className="w-full sm:w-auto px-10 py-8 text-xl font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.03] transition-transform active:scale-95 bg-primary hover:bg-primary/90 text-white"
              >
                QUIERO APRENDER COREANO
                <Zap className="ml-2 w-6 h-6 fill-white" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-tighter">
                <Lock className="w-4 h-4 text-primary" /> Pago seguro
              </div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-tighter">
                <Zap className="w-4 h-4 text-amber-500" /> Acceso inmediato
              </div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-tighter">
                <Download className="w-4 h-4 text-primary" /> Producto digital
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
