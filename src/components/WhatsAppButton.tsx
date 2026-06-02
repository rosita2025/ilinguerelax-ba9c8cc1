import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  url?: string;
  label?: string;
}

export const WhatsAppButton = ({ url, label = "¿Dudas?" }: WhatsAppButtonProps) => {
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-28 left-4 sm:bottom-32 sm:left-6 z-[70] group"
    >
      <div className="flex items-center gap-2">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-xl ring-2 ring-white/40 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95">
          <MessageCircle className="w-7 h-7 fill-white" />
        </div>
        <span className="px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-semibold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          {label}
        </span>
      </div>
    </a>
  );
};
