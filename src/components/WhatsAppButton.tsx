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
      className="fixed bottom-6 right-6 z-[60] group"
    >
      <div className="flex items-center gap-2">
        <span className="px-3 py-1.5 rounded-full bg-emerald-500 text-white text-sm font-semibold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          {label}
        </span>
        <div className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95">
          <MessageCircle className="w-7 h-7 fill-white" />
        </div>
      </div>
    </a>
  );
};
