import { useEffect, useRef, useState } from "react";
import { Check, Brain, Layers, Repeat, Target, ShieldCheck, Download, Mail, CalendarDays, BookOpen, ClipboardCheck, Play } from "lucide-react";
import { RELAX_PREVIEWS, RELAX_BONUS_PLANNER, RELAX_BONUS_EXAM, RELAX_VIDEOS } from "./spanishRelaxMedia";
import { Button } from "@/components/ui/button";
import { LazyImg } from "@/components/LazyImg";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/**
 * Landing de "Spanish Relax · 5,000 Spanish Words" (versión digital, en inglés).
 * Solo contenido: el precio, el botón de compra, los métodos de pago y la barra fija
 * los sigue manejando ProductDynamic (el precio sale del SKU en el admin).
 * Sin reseñas ni cifras inventadas: la confianza viene de vistas previas reales.
 */

export type RelaxPreview = { title: string; image: string };

type Props = {
  price: string | null;
  onBuy: () => void;
  buyDisabled?: boolean;
};

const sectionTitle = "text-2xl md:text-3xl font-black tracking-tight text-slate-900";

function Cta({ label, onBuy, disabled }: { label: string; onBuy: () => void; disabled?: boolean }) {
  return (
    <div className="mt-6 text-center">
      <Button
        onClick={onBuy}
        disabled={disabled}
        size="lg"
        className="h-12 w-full max-w-md bg-emerald-600 px-6 text-sm font-black uppercase tracking-wide text-white shadow-hero hover:bg-emerald-700 sm:text-base"
      >
        {label}
      </Button>
    </div>
  );
}

// Las miniaturas piden a la CDN de la tienda una versión reducida (ancho 640); al abrir se ve la original.
const thumb = (url: string) => (url.includes("cdn.shopify.com") ? `${url}${url.includes("?") ? "&" : "?"}width=640` : url);

function PreviewTile({ item, className = "" }: { item: RelaxPreview; className?: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className={`group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
          <LazyImg src={thumb(item.image)} alt={item.title} wrapperClassName="block h-full w-full" className="h-full w-full object-contain" />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 to-transparent p-2 text-left text-[11px] font-bold text-white">
            {item.title}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl overflow-hidden bg-white p-0">
        <DialogHeader className="bg-slate-900 p-4 text-white">
          <DialogTitle>{item.title}</DialogTitle>
        </DialogHeader>
        <img src={item.image} alt={item.title} loading="lazy" className="h-auto w-full" />
      </DialogContent>
    </Dialog>
  );
}

const pains = [
  { icon: Brain, title: "You forget new words", text: "You study vocabulary today, but struggle to recall it later. Regular review can help reinforce what you learn." },
  { icon: Layers, title: "Your resources are scattered", text: "Apps, videos, websites, and random word lists can leave you unsure what to study next." },
  { icon: Repeat, title: "Your routine fades", text: "You start with enthusiasm, but without a manageable plan it can be difficult to keep going." },
  { icon: Target, title: "You want practical vocabulary", text: "You want a resource you can return to instead of searching for scattered vocabulary every day." },
];

const plan = [
  { days: "Days 1–7", title: "Build your foundation", text: "Begin with manageable groups of words and establish a study habit." },
  { days: "Days 8–15", title: "Expand your vocabulary", text: "Continue studying and revisit words from earlier sessions." },
  { days: "Days 16–23", title: "Strengthen recall", text: "Try recalling meanings before checking your resource." },
  { days: "Days 24–30", title: "Review and assess", text: "Revisit challenging words and use the exam to review your knowledge." },
];

// Cada video se muestra como vista previa muda de 4 segundos en bucle: se ve al instante,
// solo se reproduce el que está en pantalla y se toca para pausar o reanudar.
const PREVIEW_SECONDS = 4;

function RelaxVideo({ src, index }: { src: string; index: number }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [paused, setPaused] = useState(false);
  const pausedByUser = useRef(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const saveData = !!conn?.saveData;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          if (!pausedByUser.current && !saveData) void v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: [0, 0.6, 1] },
    );
    io.observe(v);
    const onTime = () => { if (v.currentTime >= PREVIEW_SECONDS) v.currentTime = 0; };
    v.addEventListener("timeupdate", onTime);
    return () => { io.disconnect(); v.removeEventListener("timeupdate", onTime); };
  }, []);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { pausedByUser.current = false; void v.play().catch(() => {}); }
    else { pausedByUser.current = true; v.pause(); }
  };

  return (
    <div className="relative aspect-[9/16] w-[72%] shrink-0 snap-center overflow-hidden rounded-2xl bg-slate-900 sm:w-[260px]">
      <video
        ref={ref}
        src={`${src}#t=0.1`}
        muted
        loop
        playsInline
        preload="metadata"
        disablePictureInPicture
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        onClick={toggle}
        className="h-full w-full object-contain"
        aria-label={`Spanish Relax video ${index + 1}`}
      />
      {paused && (
        <button type="button" onClick={toggle} aria-label={`Play video ${index + 1}`} className="absolute inset-0 flex items-center justify-center bg-slate-900/20">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-xl">
            <Play className="ml-1 h-6 w-6" />
          </span>
        </button>
      )}
    </div>
  );
}

function VideoCarousel() {
  return (
    <div className="mx-auto mt-5 flex max-w-4xl snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {RELAX_VIDEOS.map((src, i) => (
        <RelaxVideo key={src} src={src} index={i} />
      ))}
    </div>
  );
}

export function SpanishRelaxLanding({ price, onBuy, buyDisabled }: Props) {
  const vocabPreviews = RELAX_PREVIEWS;
  const plannerPreview = RELAX_BONUS_PLANNER;
  const examPreview = RELAX_BONUS_EXAM;
  return (
    <div className="mt-6 space-y-10 md:space-y-14">
      {/* Dolor */}
      <section>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className={sectionTitle}>Does Learning Spanish Feel More Difficult Than It Should?</h2>
          <p className="mt-2 text-sm text-slate-600 md:text-base">
            You want to understand more Spanish, travel with confidence, or connect with Spanish-speaking people. But it can be hard to know what to study and how to stay consistent.
          </p>
        </div>
        <div className="mx-auto mt-5 grid max-w-4xl gap-3 sm:grid-cols-2">
          {pains.map((p) => (
            <div key={p.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p.icon className="mb-2 h-6 w-6 text-primary" />
              <h3 className="text-base font-black text-slate-900">{p.title}</h3>
              <p className="mt-1 text-sm leading-snug text-slate-600">{p.text}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-5 max-w-3xl text-center text-sm font-bold text-slate-800 md:text-base">
          Make Spanish study feel more organized. Spanish Relax brings together a 5,000-word vocabulary resource, a daily study planner, and a language exam in one digital bundle.
        </p>
        <Cta label="Make Spanish part of my daily routine" onBuy={onBuy} disabled={buyDisabled} />
      </section>

      {/* Solución */}
      <section className="rounded-3xl bg-slate-50 p-5 md:p-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className={sectionTitle}>Meet Spanish Relax: Your 5,000-Word Spanish Vocabulary Resource</h2>
          <p className="mt-2 text-sm text-slate-600 md:text-base">
            Spanish Relax is designed for English speakers who want a practical resource for expanding their Spanish vocabulary. Whether you are starting with the basics or already know some Spanish, use the collection to study at your own pace and revisit vocabulary as you progress.
          </p>
        </div>
        <ul className="mx-auto mt-5 grid max-w-3xl gap-2 sm:grid-cols-2">
          {["5,000 Spanish words", "English meanings", "Simplified pronunciation guidance for English speakers", "Digital PDF format", "A resource for repeated review"].map((t) => (
            <li key={t} className="flex items-start gap-2 rounded-xl border border-slate-100 bg-white p-3 text-sm font-bold text-slate-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {t}
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-4 max-w-3xl text-center text-xs text-slate-500 md:text-sm">
          Use Spanish Relax alongside listening, speaking, reading, and grammar practice. It is a vocabulary-learning resource, not a promise of instant fluency.
        </p>
        <Cta label="Get my 5,000-word Spanish resource" onBuy={onBuy} disabled={buyDisabled} />
      </section>

      {/* Producto: vista previa real */}
      <section>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className={sectionTitle}>Take a Closer Look at Spanish Relax</h2>
          <p className="mt-2 text-sm text-slate-600 md:text-base">Wondering what you&apos;ll receive? Explore the actual learning materials before you decide.</p>
        </div>
        <div className="mx-auto mt-5 grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-3">
          {vocabPreviews.map((p) => (
            <PreviewTile key={p.title} item={p} className="aspect-[3/4]" />
          ))}
        </div>
      </section>

      {/* Videos */}
      <section>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className={sectionTitle}>See Spanish Relax in Action</h2>
          <p className="mt-2 text-sm text-slate-600 md:text-base">Swipe to see the 3 short previews. Tap a video to pause it.</p>
        </div>
        <VideoCarousel />
      </section>

      {/* Bonos: dos bloques independientes */}
      <section>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className={sectionTitle}>Two Companion Study Resources Included</h2>
        </div>
        <div className="mx-auto mt-5 grid max-w-4xl gap-4 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <PreviewTile item={plannerPreview} className="aspect-square w-full rounded-none border-0" />
            <div className="p-4">
              <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-black uppercase text-emerald-700">
                <CalendarDays className="h-3 w-3" /> Bonus 1
              </div>
              <h3 className="text-lg font-black text-slate-900">Daily Study Planner: Spanish for English Speakers</h3>
              <p className="mt-1 text-sm text-slate-600">Organize your study sessions, set a routine, and keep your learning schedule in one place.</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <PreviewTile item={examPreview} className="aspect-square w-full rounded-none border-0" />
            <div className="p-4">
              <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-black uppercase text-emerald-700">
                <ClipboardCheck className="h-3 w-3" /> Bonus 2
              </div>
              <h3 className="text-lg font-black text-slate-900">Complete Spanish Language Exam</h3>
              <p className="mt-1 text-sm text-slate-600">Use the included exam to practice and review your Spanish knowledge.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Plan sugerido de 30 días */}
      <section>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className={sectionTitle}>A Suggested 30-Day Study Plan</h2>
        </div>
        <div className="mx-auto mt-5 grid max-w-4xl gap-3 sm:grid-cols-2">
          {plan.map((s) => (
            <div key={s.days} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-[11px] font-black uppercase tracking-widest text-primary">{s.days}</div>
              <h3 className="mt-0.5 text-base font-black text-slate-900">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-4 max-w-3xl text-center text-xs text-slate-500">
          This is a suggested routine, not a guarantee of memorizing all 5,000 words or achieving fluency in 30 days.
        </p>
      </section>

      {/* Oferta */}
      <section className="rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-5 text-center md:p-8">
        <h2 className={sectionTitle}>One Bundle. Three Resources. One More Organized Way to Study.</h2>
        <ul className="mx-auto mt-5 grid max-w-xl gap-2 text-left">
          {[
            { icon: BookOpen, t: "Spanish Relax — 5,000 Spanish Words" },
            { icon: CalendarDays, t: "Daily Study Planner — Spanish for English Speakers" },
            { icon: ClipboardCheck, t: "Complete Spanish Language Exam" },
            { icon: Download, t: "Digital PDF format" },
          ].map((i) => (
            <li key={i.t} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 text-sm font-bold text-slate-800">
              <i.icon className="h-5 w-5 shrink-0 text-emerald-600" /> {i.t}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-lg font-black text-slate-900 md:text-xl">
          {price ? `Get the complete digital bundle for ${price}.` : "Get the complete digital bundle."}
        </p>
        <Cta label="Yes, I want Spanish Relax" onBuy={onBuy} disabled={buyDisabled} />
        <p className="mt-3 text-xs text-slate-500">Digital PDF bundle · No physical book will be shipped.</p>
      </section>

      {/* Confianza */}
      <section>
        <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-3">
          {[
            { icon: Mail, title: "Delivered by email", text: "Your download link arrives in your inbox after payment." },
            { icon: ShieldCheck, title: "7-day guarantee", text: "Full refund within 7 days if you haven't downloaded the files, or 50% back if you have." },
            { icon: Download, title: "Digital PDF", text: "Study on phone, tablet, or computer. No physical book is shipped." },
          ].map((c) => (
            <div key={c.title} className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-center">
              <c.icon className="mx-auto mb-2 h-6 w-6 text-emerald-600" />
              <h3 className="text-sm font-black text-slate-900">{c.title}</h3>
              <p className="mt-1 text-xs text-slate-600">{c.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function SpanishRelaxClosing({ price, onBuy, buyDisabled }: { price: string | null; onBuy: () => void; buyDisabled?: boolean }) {
  return (
    <section className="mx-auto mt-8 max-w-3xl rounded-3xl bg-slate-900 p-6 text-center text-white md:p-8">
      <h2 className="text-2xl font-black tracking-tight md:text-3xl">Ready to Make Spanish Part of Your Routine?</h2>
      <p className="mt-2 text-sm text-slate-300">
        {price ? `The complete digital bundle: ${price}.` : "The complete digital bundle."} Spanish Relax, a daily study planner, and a language exam in one PDF bundle.
      </p>
      <Cta label="Get the Spanish Relax bundle" onBuy={onBuy} disabled={buyDisabled} />
      <p className="mt-3 text-xs text-slate-400">Digital PDF bundle · No physical book will be shipped</p>
    </section>
  );
}
