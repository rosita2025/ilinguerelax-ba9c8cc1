import { Check, Play, Shield, Smartphone, Mail, Heart, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FAQ } from "@/components/FAQ";

/**
 * Landing en italiano para el curso de video "Maglia Relax".
 * Secciones: presentazione, dolore, problema, prodotto, videolezioni,
 * lavori fatti a mano, recensioni (solo reales), FAQ y chiusura.
 *
 * REGLAS (no cambiar sin pensarlo):
 *  - Sin duraciones de video.
 *  - Siempre decir que son videolezioni REGISTRATE (no en vivo).
 *  - No inventar reseñas ni resultados.
 */

// ── Cosas que Rosa decide (cambia true/false y listo) ─────────────────────────
/** ¿El producto incluye una guía en PDF además de los videos? */
const INCLUDES_PDF = false;
/** ¿Vas a agregar videos nuevos con el tiempo? Solo pon true si lo vas a cumplir. */
const ADDS_NEW_LESSONS = false;

// ── Reseñas REALES. Vacío = la sección no aparece. ───────────────────────────
// Ejemplo: { name: "Giulia", city: "Torino", text: "..." }
interface RealReview {
  name: string;
  city?: string;
  text: string;
}
const REAL_REVIEWS: RealReview[] = [];

// ── Textos ────────────────────────────────────────────────────────────────────
const PRESENTATION_SUBTITLE =
  "Impara a lavorare a maglia con i ferri, passo dopo passo e senza stress.";
const PRESENTATION_TEXT =
  "Videolezioni registrate in italiano, da guardare quando vuoi, dal telefono, dal tablet o dal computer.";

const PRESENTATION_POINTS = [
  "Videolezioni registrate (non sono lezioni dal vivo)",
  "Accesso immediato via email dopo l'acquisto",
  "Accesso a vita",
  "Garanzia di 7 giorni",
];

const PAIN_POINTS = [
  "Hai comprato ferri e gomitoli, ma sono ancora in un cassetto perché non sai da dove iniziare.",
  "Guardi video online, ma ognuno spiega una cosa diversa e finisci per confonderti.",
  "Le maglie ti scappano, i bordi vengono storti e non capisci dove sbagli.",
  "Hai paura di rovinare il lavoro e lo lasci a metà.",
];

const LESSONS = [
  "Ferri e filati per iniziare",
  "Avviare le maglie",
  "Maglia dritta",
  "Maglia rovescia",
  "Chiudere le maglie",
  "Chiusura elastica",
  "Punto riso e come recuperare le maglie",
  "Aumenti",
  "Leggere uno schema e il primo progetto",
  "Orlo",
];
const BONUS_LESSON = "Bonus: Maniche raglan e come raccogliere le maglie";

const FAQ_ITEMS = [
  {
    question: "Devo avere esperienza?",
    answer: "No. Parti da zero: la prima videolezione ti spiega quali ferri e quali filati scegliere.",
  },
  {
    question: "Sono lezioni dal vivo?",
    answer: "No. Sono videolezioni registrate: le guardi quando vuoi, tutte le volte che vuoi.",
  },
  {
    question: "Come ricevo il prodotto?",
    answer: "Subito dopo l'acquisto ricevi una email con l'accesso.",
  },
  {
    question: "Per quanto tempo ho accesso?",
    answer: "A vita.",
  },
  {
    question: "Posso guardarle dal telefono?",
    answer: "Sì, da telefono, tablet o computer.",
  },
  {
    question: "Cosa mi serve per iniziare?",
    answer:
      "Dei ferri e un filato adatto ai principianti. Nella prima videolezione ti spieghiamo come scegliere.",
  },
  {
    question: "C'è una garanzia?",
    // Revisar que coincida con las condiciones reales de reembolso de la web.
    answer:
      "Sì, hai 7 giorni di garanzia. Se il corso non fa per te, scrivici entro 7 giorni e ti spieghiamo come ottenere il rimborso.",
  },
  {
    question: "Come posso pagare?",
    answer: "Con carta di credito o debito e con PayPal, in modo sicuro.",
  },
];

interface MagliaRelaxLandingProps {
  /** Fotos reales de lavori (product.gallery_images). Vacío = la sección no aparece. */
  galleryImages: string[];
  /** Texto del botón, ej. "Lo voglio — 24,97 €". */
  ctaLabel: string;
  ctaDisabled?: boolean;
  onBuy: () => void;
}

export const MagliaRelaxLanding = ({
  galleryImages,
  ctaLabel,
  ctaDisabled,
  onBuy,
}: MagliaRelaxLandingProps) => {
  const photos = (galleryImages || []).filter(Boolean);

  const CtaButton = () => (
    <Button
      onClick={onBuy}
      size="lg"
      disabled={ctaDisabled}
      className="w-full sm:w-auto sm:min-w-[320px] h-12 text-base font-black shadow-hero bg-emerald-600 hover:bg-emerald-700 text-white"
    >
      {ctaLabel}
    </Button>
  );

  const included = [
    "Videolezioni registrate in italiano, in ordine",
    ...(INCLUDES_PDF ? ["Guida digitale in PDF"] : []),
    "Accesso immediato via email",
    "Accesso a vita",
    ...(ADDS_NEW_LESSONS ? ["Nuove videolezioni aggiunte nel tempo"] : []),
  ];

  return (
    <div className="mt-4 space-y-4">
      {/* 1. Presentazione */}
      <section className="py-4 border-t border-slate-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">
            Maglia Relax
          </h2>
          <p className="text-base md:text-lg font-semibold text-slate-800 mb-2">{PRESENTATION_SUBTITLE}</p>
          <p className="text-sm text-muted-foreground mb-4">{PRESENTATION_TEXT}</p>
          <ul className="grid sm:grid-cols-2 gap-2 text-left mb-5">
            {PRESENTATION_POINTS.map((p) => (
              <li
                key={p}
                className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-emerald-600" />
                </span>
                <span className="text-sm font-bold text-slate-700">{p}</span>
              </li>
            ))}
          </ul>
          <CtaButton />
        </div>
      </section>

      {/* 2. Dolore */}
      <section className="py-5 px-4 md:px-8 rounded-[1.5rem] bg-slate-50 border border-slate-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mb-3 text-center">
            Ti riconosci in questo?
          </h2>
          <ul className="space-y-2">
            {PAIN_POINTS.map((p) => (
              <li key={p} className="flex items-start gap-2 p-3 rounded-xl bg-white border border-slate-100">
                <Heart className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 leading-snug">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3. Problema */}
      <section className="py-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mb-2">
            Il problema non sei tu.
          </h2>
          <p className="text-sm md:text-base text-slate-600 leading-relaxed">
            Quando impari con video sparsi, senza un ordine, è normale sentirsi persi. Lavorare a maglia si
            impara bene quando si parte dalle basi e si va avanti un passo alla volta, con una cosa nuova per
            volta.
          </p>
        </div>
      </section>

      {/* 4. Prodotto */}
      <section className="py-5 px-4 md:px-8 rounded-[1.5rem] border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mb-2 text-center">
            Maglia Relax: un percorso semplice, in ordine.
          </h2>
          <p className="text-sm md:text-base text-slate-600 leading-relaxed mb-4 text-center">
            Dai ferri e dai filati giusti fino al tuo primo lavoro: ogni videolezione tratta un solo
            argomento, spiegato con calma, mostrando le mani da vicino.
          </p>
          <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 mb-2">Cosa ricevi</h3>
          <ul className="space-y-2 mb-3">
            {included.map((p) => (
              <li key={p} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-emerald-600" />
                </span>
                <span className="text-sm font-semibold text-slate-700">{p}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground italic">
            Prodotto digitale: non si spedisce nulla e non sono lezioni dal vivo.
          </p>
        </div>
      </section>

      {/* 5. Videolezioni (senza durata) */}
      <section className="py-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mb-3 text-center">
            Le videolezioni
          </h2>
          <ol className="grid gap-2">
            {LESSONS.map((title, i) => (
              <li
                key={title}
                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm"
              >
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-black shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm font-bold text-slate-800 flex-1">{title}</span>
                <Play className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
              </li>
            ))}
            <li className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-black shrink-0">
                {LESSONS.length + 1}
              </span>
              <span className="text-sm font-bold text-emerald-900 flex-1">{BONUS_LESSON}</span>
              <Play className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
            </li>
          </ol>
          <div className="flex flex-wrap justify-center gap-3 mt-4 text-[11px] font-bold text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5" /> Telefono, tablet o computer
            </span>
            <span className="inline-flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Accesso via email
            </span>
            <span className="inline-flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Garanzia di 7 giorni
            </span>
          </div>
        </div>
      </section>

      {/* 6. Lavori fatti a mano (solo foto reali) */}
      {photos.length > 0 && (
        <section className="py-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mb-3 text-center">
              Lavori fatti a mano
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {photos.map((src, i) => (
                <img
                  key={`${src}-${i}`}
                  src={src}
                  alt={`Lavoro a maglia ${i + 1}`}
                  loading="lazy"
                  className="w-full aspect-square object-cover rounded-2xl border border-slate-100"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. Recensioni (solo se ci sono recensioni reali) */}
      {REAL_REVIEWS.length > 0 && (
        <section className="py-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mb-3 text-center">
              Cosa dicono le persone che hanno iniziato
            </h2>
            <div className="grid md:grid-cols-2 gap-3">
              {REAL_REVIEWS.map((r, i) => (
                <figure key={i} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <blockquote className="text-sm text-slate-700 leading-snug mb-2">“{r.text}”</blockquote>
                  <figcaption className="text-xs font-bold text-slate-500">
                    {r.name}
                    {r.city ? `, ${r.city}` : ""}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. FAQ */}
      <FAQ
        title="Domande frequenti"
        subtitle="Risposte rapide"
        items={FAQ_ITEMS.map((f) => ({ ...f, icon: HelpCircle }))}
      />

      {/* 9. Chiusura */}
      <section className="py-6 px-4 rounded-[1.5rem] bg-slate-900 text-white text-center">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-1">Inizia oggi, con i tuoi tempi.</h2>
        <p className="text-slate-300 text-sm mb-4">Una videolezione alla volta, senza stress.</p>
        <CtaButton />
      </section>
    </div>
  );
};

export default MagliaRelaxLanding;
