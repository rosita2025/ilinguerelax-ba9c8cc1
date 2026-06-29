import { Tag } from "lucide-react";

export const PrecioEconomicoBanner = () => (
  <div className="max-w-3xl mx-auto mb-6 rounded-2xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-400/15 to-amber-400/15 p-4 md:p-5 text-center shadow-lg">
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400 text-slate-900 text-xs font-extrabold mb-2">
      <Tag className="w-3.5 h-3.5" /> PRECIO MÁS ECONÓMICO · NO ES CARO
    </div>
    <p className="text-foreground font-bold text-base md:text-lg">
      💰 El precio más bajo del mercado · Pago único, sin suscripciones
    </p>
    <p className="text-sm text-muted-foreground mt-1">
      Yape y Plin desde Perú (soles) · Hotmart desde México y todo el mundo
    </p>
  </div>
);
