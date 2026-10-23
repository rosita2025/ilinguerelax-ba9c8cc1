import { useEffect, useMemo, useState } from "react";
import { Elements, ExpressCheckoutElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { StripeExpressCheckoutElementConfirmEvent } from "@stripe/stripe-js";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { useRegionTier } from "@/hooks/useRegionTier";
import { useI18n } from "@/i18n/I18nContext";
import { useCheckoutMethodsConfig } from "@/hooks/useCheckoutMethodsConfig";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { invokeWithRetry } from "@/lib/invokeWithRetry";
import { mapStripeError, type Lang } from "@/lib/stripeErrorMap";

/**
 * EXPRESS CHECKOUT de Stripe: botones de Apple Pay, Google Pay y Link arriba del checkout.
 * La persona paga con un toque, sin llenar el formulario.
 *
 * ACTIVO para TODOS los países (solo se ve si el dispositivo tiene Apple Pay / Google Pay / Link).
 * Para ocultarlo en una prueba: agregar ?express=0 al enlace del checkout
 * (o poner EXPRESS_CHECKOUT_ENABLED en false para apagarlo para todos).
 *
 * Reglas:
 *  - Solo productos digitales (sin envío).
 *  - Solo si Stripe está activado para la región en /admin/checkout-methods.
 *  - Si el dispositivo no tiene ninguna billetera disponible, no se muestra nada.
 *  - El monto lo calcula el servidor (create-express-intent), nunca el navegador.
 */
export const EXPRESS_CHECKOUT_ENABLED = true;

const COPY: Record<Lang, { title: string; divider: string; genericError: string }> = {
  es: { title: "Pago rápido", divider: "o completa tus datos abajo", genericError: "No se pudo completar el pago. Intenta de nuevo." },
  en: { title: "Express checkout", divider: "or fill in your details below", genericError: "The payment could not be completed. Please try again." },
  pt: { title: "Pagamento rápido", divider: "ou preencha seus dados abaixo", genericError: "Não foi possível concluir o pagamento. Tente novamente." },
  fr: { title: "Paiement rapide", divider: "ou remplis tes informations ci-dessous", genericError: "Le paiement n'a pas pu être finalisé. Réessaie." },
  it: { title: "Pagamento rapido", divider: "oppure compila i tuoi dati qui sotto", genericError: "Non è stato possibile completare il pagamento. Riprova." },
};

const isEnabled = (): boolean => {
  if (EXPRESS_CHECKOUT_ENABLED) return true;
  try {
    return new URLSearchParams(window.location.search).get("express") === "1";
  } catch {
    return false;
  }
};

interface Quote {
  amount: number;
  currency: string;
}

interface InnerProps {
  language: Lang;
  country: string;
  currency: string;
  onAvailable: (available: boolean) => void;
  available: boolean;
}

const ExpressInner = ({ language, country, currency, onAvailable, available }: InnerProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const t = COPY[language] ?? COPY.es;

  const handleConfirm = async (event: StripeExpressCheckoutElementConfirmEvent) => {
    if (!stripe || !elements) return;
    setError(null);
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || t.genericError);
        return;
      }

      const s = useCheckoutPruebaStore.getState();
      const email = (event.billingDetails?.email || s.buyer.email || "").trim();
      if (!email) {
        setError(t.genericError);
        return;
      }

      const { data, error: fnError } = await invokeWithRetry<{ clientSecret?: string; paymentIntentId?: string }>(
        "create-express-intent",
        {
          body: {
            environment: getStripeEnvironment(),
            action: "create",
            items: s.items.map((i) => ({ id: i.id, quantity: i.quantity })),
            currency,
            country,
            couponCode: s.coupon ?? undefined,
            contact: {
              email,
              name: (event.billingDetails?.name || s.buyer.fullName || "").trim() || undefined,
              phone: (event.billingDetails?.phone || s.buyer.phone || "").trim().slice(0, 30) || undefined,
            },
          },
        },
        { attempts: 2, baseDelayMs: 500 },
      );

      if (fnError || !data?.clientSecret || !data.paymentIntentId) {
        console.error("[express-checkout] create intent failed", fnError, data);
        setError(t.genericError);
        return;
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret: data.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkouts/return?session_id=${encodeURIComponent(data.paymentIntentId)}`,
        },
      });

      // Si todo sale bien, Stripe redirige solo a return_url (no llegamos aquí).
      if (confirmError) {
        setError(mapStripeError(confirmError, language).message || t.genericError);
      }
    } catch (err) {
      console.error("[express-checkout] unexpected error", err);
      setError(mapStripeError(err, language).message || t.genericError);
    }
  };

  return (
    <div className={available ? "space-y-2" : "hidden"}>
      <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.title}</p>
      <ExpressCheckoutElement
        options={{ buttonHeight: 48, emailRequired: true, phoneNumberRequired: false }}
        onReady={(e) => {
          const methods = e.availablePaymentMethods as Record<string, boolean> | undefined;
          onAvailable(!!methods && Object.values(methods).some(Boolean));
        }}
        onConfirm={handleConfirm}
      />
      {error && <p role="alert" className="text-center text-xs text-destructive">{error}</p>}
      <p className="pt-1 text-center text-[11px] text-muted-foreground">— {t.divider} —</p>
    </div>
  );
};

export default function ExpressCheckoutBox({ language }: { language: string }) {
  const lang = (["es", "en", "pt", "fr", "it"].includes(language) ? language : "es") as Lang;
  const items = useCheckoutPruebaStore((s) => s.items);
  const coupon = useCheckoutPruebaStore((s) => s.coupon);
  const region = useRegionTier();
  const { currency } = useI18n();
  const country = (region.country || "").toUpperCase().slice(0, 2);
  const methods = useCheckoutMethodsConfig(country);

  const enabled = useMemo(isEnabled, []);
  const stripePromise = useMemo(() => {
    try {
      return getStripe();
    } catch {
      return null;
    }
  }, []);

  const hasPhysical = items.some((i) => i.isPhysical);
  const signature = JSON.stringify({ items: items.map((i) => [i.id, i.quantity]), coupon, currency, country });
  const [quote, setQuote] = useState<Quote | null>(null);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    setQuote(null);
    if (!enabled || !stripePromise || hasPhysical || items.length === 0 || country.length !== 2) return;
    if (!methods.loaded || !methods.stripe) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await invokeWithRetry<{ amount?: number; currency?: string }>(
        "create-express-intent",
        {
          body: {
            environment: getStripeEnvironment(),
            action: "quote",
            items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
            currency: String(currency || "USD").toLowerCase(),
            country,
            couponCode: coupon ?? undefined,
          },
        },
        { attempts: 2, baseDelayMs: 500 },
      );
      if (cancelled || error || !data?.amount || !data.currency) return;
      setQuote({ amount: data.amount, currency: data.currency });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, enabled, stripePromise, hasPhysical, methods.loaded, methods.stripe]);

  if (!enabled || !stripePromise || !quote || hasPhysical) return null;

  return (
    <div className="rounded-xl border bg-card p-3 sm:p-4 shadow-sm">
      <Elements
        key={`${quote.amount}-${quote.currency}`}
        stripe={stripePromise}
        options={{
          mode: "payment",
          amount: quote.amount,
          currency: quote.currency,
          setupFutureUsage: "off_session",
          appearance: { theme: "stripe" },
        }}
      >
        <ExpressInner language={lang} country={country} currency={quote.currency} available={available} onAvailable={setAvailable} />
      </Elements>
    </div>
  );
}
