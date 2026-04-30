import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Maximize2, BookOpen, Eye } from "lucide-react";

export interface FlipbookPage {
  src: string;
  alt: string;
  caption?: string;
}

interface PdfFlipbookProps {
  pages: FlipbookPage[];
  title?: string;
  subtitle?: string;
  /** Watermark text rendered diagonally over each page (anti-piracy). */
  watermark?: string;
  /** Optional accent color class for the title (e.g. "text-purple-600"). */
  accentClass?: string;
}

/**
 * Real PDF preview as an interactive flipbook.
 * - Shows real interior pages (anti-mockup, builds trust).
 * - Diagonal watermark protects the IP.
 * - Click to expand in a modal with prev/next navigation.
 */
export const PdfFlipbook = ({
  pages,
  title = "Look inside the eBook",
  subtitle = "Real pages — click to flip",
  watermark = "PREVIEW · ilinguerelax.com",
  accentClass = "text-purple-600",
}: PdfFlipbookProps) => {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const total = pages.length;
  const page = pages[index];

  const next = () => setIndex((i) => (i + 1) % total);
  const prev = () => setIndex((i) => (i - 1 + total) % total);

  if (total === 0) return null;

  return (
    <div className="rounded-2xl border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-background to-blue-500/5 p-4 md:p-5 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="min-w-0">
          <h3 className={`text-sm md:text-base font-bold ${accentClass} flex items-center gap-1.5`}>
            <BookOpen className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{title}</span>
          </h3>
          <p className="text-[11px] md:text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <span className="text-[10px] md:text-xs font-mono text-muted-foreground bg-background/60 px-2 py-1 rounded-full border border-border whitespace-nowrap">
          {index + 1} / {total}
        </span>
      </div>

      {/* Flipbook viewport */}
      <div className="relative">
        {/* Book shadow effect */}
        <div className="absolute inset-0 -bottom-2 bg-gradient-to-b from-transparent to-purple-900/20 blur-xl rounded-2xl" />

        <div className="relative rounded-xl overflow-hidden bg-white border border-border shadow-hero">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, rotateY: -15 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="relative aspect-[4/3] md:aspect-[3/2] w-full"
              style={{ transformStyle: "preserve-3d", perspective: "1200px" }}
            >
              <img
                src={page.src}
                alt={page.alt}
                className="w-full h-full object-contain object-top bg-white select-none pointer-events-none"
                loading="lazy"
                draggable={false}
              />
              {/* Diagonal watermark — protects IP */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
                <span className="text-2xl md:text-4xl font-black text-slate-900/15 -rotate-45 tracking-widest whitespace-nowrap select-none">
                  {watermark}
                </span>
              </div>
              {/* Page curl/spine effect */}
              <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/15 to-transparent" />
              <div className="pointer-events-none absolute top-0 bottom-0 right-0 w-3 bg-gradient-to-l from-black/10 to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* Expand button */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Expand preview"
            className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 backdrop-blur-sm"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Prev / Next buttons */}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="Previous page"
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next page"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Caption */}
        {page.caption && (
          <p className="mt-2 text-center text-xs md:text-sm text-muted-foreground italic">
            {page.caption}
          </p>
        )}

        {/* Dots */}
        {total > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {pages.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to page ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === index
                    ? "w-6 bg-purple-600"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                }`}
              />
            ))}
          </div>
        )}

        {/* "Click to flip" hint */}
        <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <Eye className="w-3 h-3" />
          <span>Tap arrows to flip pages · Click <Maximize2 className="w-3 h-3 inline" /> to enlarge</span>
        </div>
      </div>

      {/* Fullscreen modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-3 md:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {title} — Page {index + 1} of {total}
            </DialogTitle>
          </DialogHeader>
          <div className="relative rounded-xl overflow-hidden bg-white border border-border">
            <img
              src={page.src}
              alt={page.alt}
              className="w-full h-auto object-contain select-none pointer-events-none"
              draggable={false}
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
              <span className="text-4xl md:text-6xl font-black text-slate-900/15 -rotate-45 tracking-widest whitespace-nowrap">
                {watermark}
              </span>
            </div>
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Previous"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/95 hover:bg-white text-slate-800 shadow-lg flex items-center justify-center"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Next"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/95 hover:bg-white text-slate-800 shadow-lg flex items-center justify-center"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Sample preview — Full {total}+ page PDF delivered after purchase.
          </p>
          <Button onClick={() => setOpen(false)} variant="outline" className="w-full">
            Close preview
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};