import { BookOpen, Gift, Brain, AlertTriangle, FileText, ClipboardList, RefreshCw, XCircle } from "lucide-react";

import preview8kIndex from "@/assets/preview-8k-index.webp";
import preview8kPronunciation from "@/assets/preview-8k-pronunciation.webp";
import bonus8kTemario from "@/assets/bonus-8k-temario.webp";
import bonus8kFormulario from "@/assets/bonus-8k-formulario.webp";
import bonus8kEjemplos from "@/assets/bonus-8k-ejemplos.webp";
import bonus8kRecuerda from "@/assets/bonus-8k-recuerda.webp";
import bonus8kErrores from "@/assets/bonus-8k-errores.webp";
import bonus8kAviso from "@/assets/bonus-8k-aviso.webp";
import bonus8kNotas from "@/assets/bonus-8k-notas.webp";

const previewItems = [
  "8,000 PALABRAS organizadas por temas y niveles (A1 a C1)",
  "PRONUNCIACIÓN para hispanohablantes (escrita fácil)",
  "TRADUCCIÓN al español / castellano",
  "FONÉTICA USA + UK (dos acentos en una sola palabra)",
];

const bonusItems = [
  {
    icon: BookOpen,
    image: bonus8kTemario,
    title: "Temario Gramatical Completo",
    description: "Verbos, tiempos verbales, reglas esenciales.\n📘 Capítulo 49: Verbos más frecuentes (pág. 103)",
  },
  {
    icon: ClipboardList,
    image: bonus8kFormulario,
    title: "Formulario Extra de Repaso Gramatical",
    description: "Ejercicios rápidos para practicar lo aprendido.",
  },
  {
    icon: FileText,
    image: bonus8kEjemplos,
    title: "Ejemplos de Estructuras Gramaticales en Contexto",
    description: "Cada regla tiene ejemplos claros con vocabulario del libro.",
  },
  {
    icon: RefreshCw,
    image: bonus8kRecuerda,
    title: "Recuerda Anterior",
    description: "Conexión entre lecciones para repaso continuo.\nEjemplo: A1.5 (afirmativo) ➡ A1.6 (negativo)",
  },
  {
    icon: XCircle,
    image: bonus8kErrores,
    title: "Errores Comunes de Hispanohablantes",
    description: '❌ "I have 25 years" → ✅ "I am 25 years old"\n❌ "I am agree" → ✅ "I agree"\n❌ "Make a photo" → ✅ "Take a photo"\n❌ "People is" → ✅ "People are"',
  },
  {
    icon: AlertTriangle,
    image: bonus8kAviso,
    title: "Aviso Importante",
    description: "Diferencias clave entre TO BE y verbos:\n✅ TO BE negativo: I am not, you are not, she is not\n✅ Verbos negativo: I don't, you don't, she doesn't + VERBO BASE",
  },
  {
    icon: Brain,
    image: bonus8kNotas,
    title: "Lista de Notas y Apuntes Personales",
    description: "Espacios para escribir tus propias observaciones y ejemplos.",
  },
];

export const Product8000Preview = () => {
  return (
    <>
      {/* ESTE LIBRO INCLUYE */}
      <section className="py-8 md:py-12 bg-secondary/30">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
               📚 <span className="text-gradient">VISTA PREVIA ANTES DE COMPRAR</span>
             </h2>
          </div>

          {/* 2 Preview Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
            <img
              src={preview8kIndex}
              alt="8,000 palabras organizadas por temas y niveles"
              className="w-full rounded-2xl shadow-hero border border-border"
            />
            <img
              src={preview8kPronunciation}
              alt="Pronunciación, traducción y fonética UK/USA"
              className="w-full rounded-2xl shadow-hero border border-border"
            />
          </div>

          {/* 4 Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {previewItems.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-card rounded-xl border border-border p-4 shadow-card"
              >
                <span className="text-2xl font-bold text-primary flex-shrink-0">{i + 1}️⃣</span>
                <p className="text-foreground font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BONUS ESPECIALES */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              🎁 <span className="text-gradient">BONUS ESPECIALES</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Incluidos GRATIS con tu compra
            </p>
            <p className="text-base font-semibold text-primary mt-2">
              ✅ Tiene 35 Estructuras Gramaticales en nivel desde Cero hasta Avanzado
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {bonusItems.map((bonus, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-hero transition-all duration-500"
              >
                <img
                  src={bonus.image}
                  alt={bonus.title}
                  className="w-full h-56 object-cover object-top"
                />
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center flex-shrink-0">
                      <bonus.icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{bonus.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm whitespace-pre-line leading-relaxed">
                    {bonus.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
