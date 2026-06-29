import { Sparkles, TrendingUp, BookOpen } from "lucide-react";
import bonoGramaticaImg from "@/assets/estructuras-gramaticas-a1-a2.webp.asset.json";

export const SegundoBonoGramatica = () => {
  return (
    <div className="mt-14">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/15 text-accent text-sm font-bold mb-3">
          <Sparkles className="w-4 h-4" /> 2º Bono incluido GRATIS
        </div>
        <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          + Bono 2: <span className="text-gradient">Estructuras Gramaticales desde Cero hasta A2</span>
        </h3>
        <p className="text-muted-foreground">
          Verbos, afirmativos, negativos, preguntas y pronunciación adaptada para hispanohablantes.
        </p>
      </div>

      <div className="max-w-2xl mx-auto mb-6 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 md:p-5 flex items-center gap-3 text-center sm:text-left">
        <div className="shrink-0 w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center shadow-md">
          <TrendingUp className="w-5 h-5 text-black" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-extrabold text-foreground">
            ⏳ Pronto subirá el precio · Aprovecha hoy
          </p>
          <p className="text-xs text-muted-foreground">
            Bono incluido sin costo extra solo por tiempo limitado.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden border border-accent/30 bg-card shadow-card">

        <div className="relative bg-white">
          <img
            src={bonoGramaticaImg.url}
            alt="Estructuras Gramaticales de inglés A1 a A2 — Verbos en presente DO/DOES con pronunciación en español"
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
          Vista previa real · Nivel A1–A2
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-4">
        Vista previa con marca de agua. El PDF completo se entrega tras la compra.
      </p>
    </div>
  );
};
