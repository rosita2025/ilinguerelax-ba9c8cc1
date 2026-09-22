import { Sparkles, BookOpen } from "lucide-react";
import bonoExamenImg from "@/assets/examen-completo-patrones.webp.asset.json";

export const TercerBonoExamen = () => {
  return (
    <div className="mt-14">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/15 text-accent text-sm font-bold mb-3">
          <Sparkles className="w-4 h-4" /> 3º Bono incluido GRATIS
        </div>
        <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          + Bono 3: <span className="text-gradient">Examen Completo — Patrones Especiales</span>
        </h3>
        <p className="text-muted-foreground">
          98 preguntas para confirmar que ya dominas los patrones de pronunciación, con hoja de respuestas incluida.
        </p>
      </div>

      <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden border border-accent/30 bg-card shadow-card">

        <div className="relative bg-white">
          <img
            src={bonoExamenImg.url}
            alt="Examen Completo — Patrones Especiales: 98 preguntas con hoja de respuestas incluida"
            loading="lazy"
            className="w-full h-auto object-contain"
            onContextMenu={(e) => e.preventDefault()}
          />
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <span className="text-4xl md:text-6xl font-black text-slate-900/10 -rotate-45 tracking-widest whitespace-nowrap select-none">
              ilinguerelax.com
            </span>
          </div>
        </div>
        <div className="p-4 flex items-center gap-2 justify-center text-sm font-semibold text-foreground">
          <BookOpen className="w-4 h-4 text-accent" />
          Vista previa real · 98 preguntas con respuestas
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-4">
        Vista previa con marca de agua. El PDF completo se entrega tras la compra.
      </p>
    </div>
  );
};
