// Texto de arriba de la página de Patrones. UNA sola fuente: lo usa la página (React) y también la pantalla inicial que
// vite.config.ts pinta desde el HTML, antes de que llegue el JavaScript (así el título y lo que incluye se ven al instante).
export const PATRONES_HERO = {
  headline: "Deja de pronunciar el inglés como se escribe.",
  subtitle:
    "Descubre los patrones, letras mudas y combinaciones secretas que cambian el sonido de las palabras, y empieza a hablar con seguridad desde la primera lectura. Método paso a paso hecho para hispanohablantes.",
  bonusTitle: "🎁 Hoy recibes el PDF + 3 BONOS GRATIS",
  bonusItems: [
    "Ebook PDF «Patrones Especiales»",
    "Bono 1: 1,000 palabras con pronunciación y audios",
    "Bono 2: Estructuras gramaticales desde cero",
    "Bono 3: Examen de 98 preguntas con respuestas",
  ],
  bonusNote: "Pago único · Sin suscripciones · Descarga inmediata",
} as const;
