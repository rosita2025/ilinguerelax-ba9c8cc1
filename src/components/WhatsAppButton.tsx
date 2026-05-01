import { MessageCircle } from "lucide-react";

const WHATSAPP_LINK = "https://api.whatsapp.com/send?phone=15752160934&text=Hola%20me%20interesa%20en%20Ingles%20Relax.%20Informaci%C3%B3n%20Por%20favor%20";

export const WhatsAppButton = () => {
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-36 md:bottom-48 right-4 z-20 flex items-center justify-center w-14 h-14 rounded-full bg-green-500 text-white shadow-lg hover:scale-110 hover:bg-green-600 transition-all duration-300"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="w-7 h-7 fill-white" />
    </a>
  );
};
