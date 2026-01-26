import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FAQ } from "@/components/FAQ";
import { motion } from "framer-motion";
import {
  BookOpen,
  Globe,
  GraduationCap,
  FileText,
  User,
  Volume2,
  TrendingUp,
  CreditCard,
  MapPin,
  HeadphonesIcon,
} from "lucide-react";
import { ExitIntentPopup } from "@/components/ExitIntentPopup";
import { WhatsAppButton } from "@/components/WhatsAppButton";

const faqItems = [
  {
    question: "¿Qué es iLingue Relax?",
    answer:
      "iLingue Relax es una marca educativa enfocada en el aprendizaje de idiomas sin estrés, diseñada para personas que quieren aprender de forma clara, práctica y a su propio ritmo.",
    icon: BookOpen,
  },
  {
    question: "¿Qué tipo de idiomas ofrece iLingue Relax?",
    answer:
      "iLingue Relax ofrece y desarrollará materiales para distintos idiomas, empezando por inglés, siempre bajo la filosofía de aprender sin presión.",
    icon: Globe,
  },
  {
    question: "¿Necesito experiencia previa para usar los materiales?",
    answer:
      "No. Nuestros productos están pensados para principiantes y autodidactas, sin necesidad de conocimientos previos.",
    icon: GraduationCap,
  },
  {
    question: "¿Los materiales son físicos o digitales?",
    answer:
      "Actualmente, iLingue Relax ofrece productos digitales de descarga inmediata. En el futuro, algunos productos podrán estar disponibles en formato físico.",
    icon: FileText,
  },
  {
    question: "¿Puedo estudiar solo/a con iLingue Relax?",
    answer:
      "Sí. Todos nuestros materiales están diseñados para autoestudio, para que aprendas a tu ritmo y sin estrés.",
    icon: User,
  },
  {
    question: "¿Incluyen pronunciación?",
    answer:
      "Sí. Nuestros contenidos incluyen pronunciación clara y fácil de entender, adaptada para hispanohablantes.",
    icon: Volume2,
  },
  {
    question: "¿Desde qué nivel puedo empezar?",
    answer:
      "Puedes empezar desde nivel principiante y avanzar progresivamente según el material.",
    icon: TrendingUp,
  },
  {
    question: "¿Cómo realizo el pago?",
    answer:
      "Aceptamos pagos seguros mediante: Tarjeta de crédito o débito internacional (Stripe) y Hotmart, con múltiples métodos de pago según tu país.",
    icon: CreditCard,
  },
  {
    question: "¿Puedo acceder al contenido desde cualquier país?",
    answer:
      "Sí. Los productos digitales de iLingue Relax están disponibles para usuarios de cualquier país.",
    icon: MapPin,
  },
  {
    question: "¿iLingue Relax ofrece soporte o ayuda?",
    answer:
      "Sí. Si tienes alguna duda, puedes contactarnos a través de nuestros canales oficiales: 📧 Correo: hola@ilinguerelax.com | 📱 WhatsApp: +1 575 216 0934 (USA)",
    icon: HeadphonesIcon,
  },
];

const FAQPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Preguntas Frecuentes - Todo lo que Necesitas Saber"
        description="Resuelve tus dudas sobre iLingue Relax. Información sobre productos, métodos de pago, pronunciación, garantía y soporte."
        canonicalUrl="https://ilinguerelax.com/faq"
      />
      <Navbar />
      <motion.main
        className="pt-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <FAQ
          items={faqItems}
          title="Preguntas Frecuentes"
          subtitle="Todo lo que necesitas saber sobre iLingue Relax"
        />
      </motion.main>
      <Footer />
      <WhatsAppButton />
      <ExitIntentPopup 
        discount="10%"
        couponCode="NEW10"
        lang="es"
        storageKey="exit_intent_faq"
      />
    </div>
  );
};

export default FAQPage;
