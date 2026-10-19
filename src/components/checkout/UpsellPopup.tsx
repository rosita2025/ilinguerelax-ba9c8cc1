import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocalCurrency } from "@/hooks/useLocalCurrency";
import { formatCurrencyAmount } from "@/i18n";
import type { UpsellItem } from "@/config/checkoutCatalog";

interface Props {
  /** Oferta a mostrar. null = popup cerrado. */
  offer: UpsellItem | null;
  language: string;
  /** El comprador acepta: agrega el upsell y continúa. */
  onAdd: () => void;
  /** "No gracias": continúa sin agregar. */
  onSkip: () => void;
  /** Cierra con la X o tocando fuera: no continúa ni agrega nada. */
  onClose: () => void;
}

const COPY: Record<string, { title: string; sub: string; add: string; skip: string }> = {
  es: {
    title: "¿Te gustaría agregar este material?",
    sub: "Aprovecha este precio especial solo en tu pedido de hoy.",
    add: "Sí, agregar a mi pedido",
    skip: "No gracias, continuar",
  },
  en: {
    title: "Would you like to add this to your order?",
    sub: "Get this special price, only on today's order.",
    add: "Yes, add to my order",
    skip: "No thanks, continue",
  },
  pt: {
    title: "Quer adicionar este material ao seu pedido?",
    sub: "Aproveite este preço especial só no pedido de hoje.",
    add: "Sim, adicionar ao pedido",
    skip: "Não, obrigado, continuar",
  },
  fr: {
    title: "Souhaitez-vous ajouter ce document à votre commande ?",
    sub: "Profitez de ce prix spécial, uniquement sur la commande d'aujourd'hui.",
    add: "Oui, ajouter à ma commande",
    skip: "Non merci, continuer",
  },
};

function Amount({ usd, className }: { usd: number; className?: string }) {
  const local = useLocalCurrency(usd);
  const label = !local.isUsd && !local.loading ? local.formatted : formatCurrencyAmount(usd, "USD");
  return <span className={className}>{label}</span>;
}

/**
 * Aviso "¿Te gustaría agregar…?" que sale una vez por sesión antes de pagar
 * (Stripe, dLocal, transferencias, Yape, Binance, CLABE, Mercado Pago).
 * El precio es el mismo con descuento que muestra el panel de upsells del
 * checkout (configurado por producto en el admin).
 */
export function UpsellPopup({ offer, language, onAdd, onSkip, onClose }: Props) {
  const c = COPY[language] ?? COPY.es;
  const originalPrice = offer?.originalPrice;
  const hasDiscount = !!offer && originalPrice != null && originalPrice > offer.price;
  const percentOff = offer && originalPrice != null && hasDiscount
    ? Math.round(((originalPrice - offer.price) / originalPrice) * 100) : 0;

  return (
    <Dialog open={!!offer} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        {offer && (
          <>
            <DialogHeader>
              <div className="mx-auto mb-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              <DialogTitle className="text-center text-lg">{c.title}</DialogTitle>
              <DialogDescription className="text-center">{c.sub}</DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-3 rounded-lg border-2 border-primary/40 bg-primary/5 p-3">
              <div className="relative shrink-0">
                <img src={offer.image} alt="" className="h-16 w-16 rounded-md bg-muted object-cover" />
                {hasDiscount && (
                  <span className="absolute -right-1.5 -top-1.5 rounded bg-accent px-1 py-0.5 text-[10px] font-black leading-none text-accent-foreground shadow">
                    -{percentOff}%
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight">{offer.name}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <Amount usd={offer.price} className="text-base font-black" />
                  {hasDiscount && originalPrice != null && (
                    <Amount usd={originalPrice} className="text-xs text-muted-foreground line-through" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={onAdd} className="w-full">{c.add}</Button>
              <Button variant="ghost" onClick={onSkip} className="w-full">{c.skip}</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
