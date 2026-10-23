import { useEffect, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Loader2, Lock } from "lucide-react";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { invokeWithRetry } from "@/lib/invokeWithRetry";
import { mapStripeError, type Lang } from "@/lib/stripeErrorMap";

/**
 * Formulario de pago de Stripe estilo "Payment Element": pestañas de método
 * (Tarjeta, Klarna, Cash App…), solo los campos de pago y un botón de pagar.
 * NO repite nombre del producto, nombre ni correo (ya se llenaron arriba).
 *
 * APAGADO por defecto (ver PAYMENT_ELEMENT_ENABLED en PaymentMethodsGroup.tsx).
 * Para probarlo: abre el checkout con  ?pe=1  al final del enlace.
 *
 * El monto lo calcula el servidor (create-express-intent), nunca el navegador.
 */

const COPY: Record<Lang, { pay: string; paying: string; secure: string; error: string; loading: string }> = {
  es: { pay: "Pagar", paying: "Procesando…", secure: "Pago seguro procesado por Stripe", error: "No se pudo completar el pago. Intenta de nuevo.", loading: "Cargando formulario de pago…" },
  en: { pay: "Pay", paying: "Processing…", secure: "Secure payment processed by Stripe", error: "The payment could not be completed. Please try again.", loading: "Loading payment form…" },
  pt: { pay: "Pagar", paying: "Processando…", secure: "Pagamento seguro processado pela Stripe", error: "Não foi possível concluir o pagamento. Tente novamente.", loading: "Carregando formulário de pagamento…" },
  fr: { pay: "Payer", paying: "Traitement…", secure: "Paiement sécurisé traité par Stripe", error: "Le paiement n'a pas pu être finalisé. Réessaie.", loading: "Chargement du formulaire de paiement…" },
  it: { pay: "Paga", paying: "Elaborazione…", secure: "Pagamento sicuro elaborato da Stripe", error: "Non è stato possibile completare il pagamento. Riprova.", loading: "Caricamento del modulo di pagamento…" },
};

const ZERO_DECIMAL = new Set(["bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf"]);

const formatMinor = (minor: number, currency: string, language: string): string => {
  const major = ZERO_DECIMAL.has(currency.toLowerCase()) ? minor : minor / 100;
  try {
    return new Intl.NumberFormat(language, { style: "currency", currency: currency.toUpperCase() }).format(major);
  } catch {
    return `${major.toFixed(2)} ${currency.toUpperCase()}`;
  }
};

interface Quote {
  amount: number;
  currency: string;
}

interface Props {
  language: string;
  country: string;
  /** Moneda que se muestra en el checkout (el servidor decide la final). */
  currency: string;
  /** El formulario de datos de arriba ya está completo. */
  canPay: boolean;
  /** Se llama si falta llenar los datos de arriba. */
  onNeedBuyerInfo: () => void;
  /** Se llama justo antes de cobrar (ej. guardar carrito abandonado). */
  onBeforePay?: () => void;
  /** Si no se puede cargar el formulario nuevo, el checkout vuelve al formulario anterior. */
  onUnavailable?: () => void;
}

const Inner = ({
  language,
  country,
  quote,
  canPay,
  onNeedBuyerInfo,
  onBeforePay,
}: Omit<Props, "currency" | "onUnavailable"> & { quote: Quote }) => {
  const lang = (["es", "en", "pt", "fr", "it"].includes(language) ? language : "es") as Lang;
  const t = COPY[lang];
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements || busy) return;
    if (!canPay) {
      onNeedBuyerInfo();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || t.error);
        return;
      }

      const s = useCheckoutPruebaStore.getState();
      const email = s.buyer.email.trim();
      const name = s.buyer.fullName.trim();
      onBeforePay?.();

      const { data, error: fnError } = await invokeWithRetry<{ clientSecret?: string; paymentIntentId?: string }>(
        "create-express-intent",
        {
          body: {
            environment: getStripeEnvironment(),
            action: "create",
            source: "payment-element",
            items: s.items.map((i) => ({ id: i.id, quantity: i.quantity })),
            currency: quote.currency,
            country,
            couponCode: s.coupon ?? undefined,
            contact: { email, name: name || undefined, phone: (s.buyer.phone ?? "").trim().slice(0, 30) || undefined },
          },
        },
        { attempts: 2, baseDelayMs: 500 },
      );

      if (fnError || !data?.clientSecret || !data.paymentIntentId) {
        console.error("[payment-element] create intent failed", fnError, data);
        setError(mapStripeError(fnError, lang).message || t.error);
        return;
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret: data.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkouts/return?session_id=${encodeURIComponent(data.paymentIntentId)}`,
          payment_method_data: {
            billing_details: { name: name || undefined, email, phone: (s.buyer.phone ?? "").trim() || undefined },
          },
        },
      });

      // Si todo sale bien, Stripe redirige solo a return_url (no llegamos aquí).
      if (confirmError) setError(mapStripeError(confirmError, lang).message || confirmError.message || t.error);
    } catch (err) {
      console.error("[payment-element] unexpected error", err);
      setError(mapStripeError(err, lang).message || t.error);
    } finally {
      setBusy(false);
    }
  };

  const s0 = useCheckoutPruebaStore.getState();
  return (
    <div className="space-y-3">
      {!ready && (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {t.loading}
        </div>
      )}
      <div className={ready ? "" : "h-0 overflow-hidden opacity-0"}>
        <PaymentElement
          options={{
            layout: { type: "tabs", defaultCollapsed: false },
            // Nombre y correo ya los tenemos arriba: no se vuelven a pedir.
            fields: { billingDetails: { name: "never", email: "never", phone: "never" } },
            defaultValues: { billingDetails: { email: s0.buyer.email.trim(), name: s0.buyer.fullName.trim() } },
          }}
          onReady={() => setReady(true)}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handlePay}
        disabled={!ready || busy || !stripe}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 text-base font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> {t.paying}
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" /> {t.pay} {formatMinor(quote.amount, quote.currency, language)}
          </>
        )}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <Lock className="h-3 w-3" /> {t.secure}
      </p>
    </div>
  );
};

export default function StripePaymentElementBox(props: Props) {
  const { currency, country } = props;
  const items = useCheckoutPruebaStore((s) => s.items);
  const coupon = useCheckoutPruebaStore((s) => s.coupon);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [failed, setFailed] = useState(false);
  const stripePromise = useMemo(() => {
    try {
      return getStripe();
    } catch {
      return null;
    }
  }, []);

  const signature = JSON.stringify({ items: items.map((i) => [i.id, i.quantity]), coupon, currency, country });

  useEffect(() => {
    setQuote(null);
    setFailed(false);
    if (!stripePromise || items.length === 0 || country.length !== 2) return;
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
      if (cancelled) return;
      if (error || !data?.amount || !data.currency) {
        setFailed(true);
        return;
      }
      setQuote({ amount: data.amount, currency: data.currency });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, stripePromise]);

  const unavailable = !stripePromise || failed;
  useEffect(() => {
    if (unavailable) props.onUnavailable?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unavailable]);

  if (unavailable) return null;
  if (!quote) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  const locale = (["es", "en", "pt", "fr", "it"].includes(props.language) ? props.language : "es") as "es" | "en" | "pt" | "fr" | "it";

  return (
    <Elements
      key={`${quote.amount}-${quote.currency}`}
      stripe={stripePromise}
      options={{
        mode: "payment",
        amount: quote.amount,
        currency: quote.currency,
        setupFutureUsage: "off_session",
        locale,
        appearance: { theme: "stripe" },
      }}
    >
      <Inner
        language={props.language}
        country={props.country}
        canPay={props.canPay}
        onNeedBuyerInfo={props.onNeedBuyerInfo}
        onBeforePay={props.onBeforePay}
        quote={quote}
      />
    </Elements>
  );
}
