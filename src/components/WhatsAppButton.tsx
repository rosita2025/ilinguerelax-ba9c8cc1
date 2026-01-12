import { MessageCircle } from "lucide-react";

const WHATSAPP_LINK = "https://api.whatsapp.com/send?phone=15752160934&text=Hola%20me%20interesa%20en%20Ingles%20Relax.%20Informaci%C3%B3n%20Por%20favor%20";

export const WhatsAppButton = () => {
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-black text-white shadow-lg hover:scale-105 transition-transform duration-300 group"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="w-6 h-6 fill-green-500 text-green-500" />
      <span className="font-medium hidden sm:inline">Chat</span>
    </a>
  );
};
