import { Brain, Layers, MicOff, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

/**
 * Landing de "Domina el vocabulario en inglés" (digital, para hispanohablantes).
 * Solo contenido: el precio, el botón de compra, los métodos de pago y la barra fija
 * los sigue manejando ProductDynamic (el precio sale del SKU en el admin).
 * Producto SIN bonos. Sin cifras ni reseñas inventadas.
 */

type Props = {
  price: string | null;
  onBuy: () => void;
  buyDisabled?: boolean;
};

const sectionTitle = "text-2xl md:text-3xl font-black tracking-tight text-slate-900";

const pains = [
  { icon: Brain, text: "Llevas años \"aprendiendo\" inglés, pero cuando alguien te habla te quedas en blanco porque no encuentras las palabras." },
  { icon: Layers, text: "Has probado apps, academias y YouTube, pero sin un método claro de A a Z el vocabulario no se queda." },
  { icon: MicOff, text: "No sabes cómo pronunciar las palabras y te da vergüenza hablar por miedo a que no te entiendan." },
  { icon: Clock, text: "Sabes que el inglés abre puertas profesionales y personales, pero lo sigues posponiendo porque no sabes por dónde empezar." },
];

const benefits = [
  "Dominas el vocabulario del inglés, nivel a nivel, con un sistema que tu cerebro puede seguir sin agobiarse.",
  "Pronuncias sin miedo gracias a la pronunciación visual en español: lees como en español y te haces entender.",
  "Memorizas más rápido porque cada palabra lleva una frase real del contexto donde se usa.",
  "Tienes una sola referencia para toda tu vida: no necesitas buscar en mil sitios distintos.",
];

const forYou = [
  "📚 Empiezas desde cero y quieres saber exactamente qué vocabulario aprender y en qué orden.",
  "📱 Llevas tiempo con apps como Duolingo pero sientes que no avanzas de verdad.",
  "💼 Necesitas mejorar tu inglés para el trabajo, viajar o comunicarte con más confianza.",
  "🎯 Quieres preparar Cambridge, Trinity, Aptis o cualquier examen oficial sin pagar una academia.",
  "😰 Te da miedo hablar porque no recuerdas las palabras o no sabes cómo pronunciarlas.",
];

const objections = [
  { q: "\"No sé por dónde empezar.\"", a: "La guía está ordenada por niveles, del A1 al C1, y por temas. Empiezas por el primero y avanzas en orden, sin tener que decidir qué estudiar." },
  { q: "\"No tengo tiempo.\"", a: "Estudias a tu ritmo, sin horarios, desde tu celular o computadora. Puedes avanzar un tema a la vez, en los ratos que tengas." },
  { q: "\"Estudio pero no consigo hablar.\"", a: "Cada palabra incluye su pronunciación figurada en español y una frase real, para que practiques diciéndola en voz alta y no solo leyéndola." },
  { q: "\"Se me olvida todo lo que aprendo.\"", a: "Cada entrada trae una frase real del contexto donde se usa la palabra. Ver la palabra en contexto te ayuda a recordarla, y puedes volver a repasarla cuando quieras." },
  { q: "\"Llevo meses estancado.\"", a: "Un método claro de A a Z: sabes en qué nivel estás y cuál es el siguiente paso, sin dar vueltas entre recursos sueltos." },
  { q: "\"He probado de todo y nada funciona.\"", a: "A diferencia de academias o apps, aquí tienes una sola guía estructurada, con pago único y acceso para siempre. Tú decides cuándo y cuánto estudiar." },
];

const levels = ["A1", "A2", "B1", "B2", "C1"];

export function DominaVocabularioLanding({ price, onBuy, buyDisabled }: Props) {
  return (
    <div className="space-y-10 py-6">
      {/* Dolor */}
      <section>
        <div className="mx-auto max-w-3xl px-4">
          <h2 className={`${sectionTitle} text-center`}>¿Te suena esto familiar?</h2>
          <p className="mt-1 text-center text-sm text-slate-500">El problema que frena a la mayoría</p>
          <ul className="mt-5 space-y-3">
            {pains.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
                <span className="text-sm text-slate-800">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Beneficios */}
      <section className="bg-emerald-50/60 py-8">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className={`${sectionTitle} text-center`}>Lo que consigues con esta guía</h2>
          <ul className="mt-5 space-y-3">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-white p-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                <span className="text-sm text-slate-800">{b}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-center text-sm text-slate-600">
            A diferencia de academias o apps, aquí tienes una guía estructurada para avanzar sin perderte: vocabulario del A1 al C1, pronunciación visual fácil y frases de uso real.
            Estudia a tu ritmo, sin horarios, con pago único y acceso para siempre.
          </p>
        </div>
      </section>

      {/* Para quién es */}
      <section>
        <div className="mx-auto max-w-3xl px-4">
          <h2 className={`${sectionTitle} text-center`}>Este eBook es para ti si…</h2>
          <ul className="mt-5 space-y-2">
            {forYou.map((t) => (
              <li key={t} className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800">{t}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Objeciones */}
      <section className="bg-slate-50 py-8">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className={`${sectionTitle} text-center`}>Lo que te impide hablar inglés (y cómo lo resolvemos)</h2>
          <Accordion type="single" collapsible className="mt-5 rounded-xl border border-slate-200 bg-white px-4">
            {objections.map(({ q, a }, i) => (
              <AccordionItem key={q} value={`o-${i}`}>
                <AccordionTrigger className="text-left text-sm font-bold text-slate-900">{q}</AccordionTrigger>
                <AccordionContent className="text-sm text-slate-600">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Contenido */}
      <section>
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className={sectionTitle}>Todo el vocabulario que necesitas, nivel a nivel</h2>
          <p className="mt-2 text-sm text-slate-600">
            Más de 5.000 palabras y expresiones organizadas en 126 temas, con pronunciación figurada y frase real en cada entrada.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {levels.map((l) => (
              <span key={l} className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 text-sm font-black text-emerald-700">{l}</span>
            ))}
          </div>
          <div className="mt-6">
            <Button
              onClick={onBuy}
              disabled={buyDisabled}
              size="lg"
              className="h-12 w-full max-w-md bg-emerald-600 px-6 text-sm font-black uppercase tracking-wide text-white shadow-hero hover:bg-emerald-700 sm:text-base"
            >
              {price ? `Lo quiero — ${price}` : "Lo quiero"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
