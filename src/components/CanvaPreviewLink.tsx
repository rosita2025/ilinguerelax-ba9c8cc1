import { ExternalLink, Eye } from "lucide-react";

export const CANVA_PREVIEW_URL = "https://canva.link/4a6u9xsdne6yey2";

export const CanvaPreviewLink = () => {
  return (
    <div className="max-w-3xl mx-auto my-6 rounded-2xl border-2 border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 p-4 md:p-5 shadow-card">
      <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
        <div className="shrink-0 w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-md">
          <Eye className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm md:text-base font-extrabold text-foreground">
            👀 ¿Ves las imágenes borrosas? Mira la vista previa nítida en Canva
          </p>
          <p className="text-xs md:text-sm text-muted-foreground">
            Pequeñas muestras GRATIS · sin descargas · solo lectura
          </p>
        </div>
        <a
          href={CANVA_PREVIEW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-extrabold transition-colors shadow-md"
        >
          Abrir en Canva <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default CanvaPreviewLink;
