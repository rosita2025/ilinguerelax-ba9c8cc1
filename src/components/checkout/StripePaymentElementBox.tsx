import { useEffect, useMemo, useState } from "react";
import { Elements, LinkAuthenticationElement, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Loader2, Lock } from "lucide-react";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { isBuyerValid } from "@/components/checkout/BuyerInfoForm";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { invokeWithRetry } from "@/lib/invokeWithRetry";
import { fetchStripeQuote } from "@/lib/stripeQuote";
import { SupportWhatsApp } from "@/components/checkout/SupportWhatsApp";
import { getOrderRef } from "@/lib/support";
import { mapStripeError, type Lang } from "@/lib/stripeErrorMap";

/**
 * Formulario de pago de Stripe estilo "Payment Element": pestañas de método
 * (Tarjeta, Klarna, Cash App…), solo los campos de pago y un botón de pagar.
 * NO repite nombre del producto, nombre ni correo (ya se llenaron arriba).
 *
 * ACTIVO para todos (ver PAYMENT_ELEMENT_ENABLED en PaymentMethodsGroup.tsx).
 * Para ver el formulario anterior en una prueba: ?pe=0 al final del enlace del checkout.
 *
 * El monto lo calcula el servidor (create-express-intent), nunca el navegador.
 */

const COPY: Record<Lang, { pay: string; paying: string; secure: string; error: string; loading: string; or: string }> = {
  es: { pay: "Pagar", paying: "Procesando…", secure: "Pago seguro procesado por Stripe", error: "No se pudo completar el pago. Intenta de nuevo.", loading: "Cargando formulario de pago…", or: "o paga con tarjeta" },
  en: { pay: "Pay", paying: "Processing…", secure: "Secure payment processed by Stripe", error: "The payment could not be completed. Please try again.", loading: "Loading payment form…", or: "or pay with card" },
  pt: { pay: "Pagar", paying: "Processando…", secure: "Pagamento seguro processado pela Stripe", error: "Não foi possível concluir o pagamento. Tente novamente.", loading: "Carregando formulário de pagamento…", or: "ou pague com cartão" },
  fr: { pay: "Payer", paying: "Traitement…", secure: "Paiement sécurisé traité par Stripe", error: "Le paiement n'a pas pu être finalisé. Réessaie.", loading: "Chargement du formulaire de paiement…", or: "ou payez par carte" },
  it: { pay: "Paga", paying: "Elaborazione…", secure: "Pagamento sicuro elaborato da Stripe", error: "Non è stato possibile completare il pagamento. Riprova.", loading: "Caricamento del modulo di pagamento…", or: "o paga con carta" },
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
  /** Método local de Stripe (solo su país, en EUR). Por defecto, tarjeta como siempre. */
  method?: "card" | "bizum" | "satispay" | "ideal" | "mb_way" | "klarna" | "crypto";
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
  method = "card",
  onUnavailable,
}: Omit<Props, "currency"> & { quote: Quote }) => {
  const lang = (["es", "en", "pt", "fr", "it"].includes(language) ? language : "es") as Lang;
  const t = COPY[lang];
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si el formulario no carga (error de Stripe o sin respuesta), se vuelve al formulario anterior.
  useEffect(() => {
    if (ready) return;
    const id = window.setTimeout(() => onUnavailable?.(), 15000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const runPayment = async (source: "payment-element" | "express-checkout") => {
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
            source,
            ...(method !== "card" ? { method } : {}),
            orderRef: getOrderRef(),
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

  const handlePay = () => runPayment("payment-element");

  const s0 = useCheckoutPruebaStore.getState();
  const buyer = useCheckoutPruebaStore((st) => st.buyer);
  const setBuyer = useCheckoutPruebaStore((st) => st.setBuyer);
  // Una vez mostrados, los campos se quedan aunque ya sean válidos (no se pierde el foco al escribir).
  const [needsContact] = useState(() => !isBuyerValid(useCheckoutPruebaStore.getState().buyer));
  const inputCls = "h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-base text-neutral-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";
  const contactLabels = {
    es: ["Nombre completo", "Correo electrónico"],
    en: ["Full name", "Email"],
    pt: ["Nome completo", "E-mail"],
    fr: ["Nom complet", "E-mail"],
    it: ["Nome completo", "E-mail"],
  }[lang];

  return (
    <div className="space-y-3">
      {needsContact && (
        <div className="grid gap-2">
          <input
            type="text"
            autoComplete="name"
            placeholder={contactLabels[0]}
            aria-label={contactLabels[0]}
            value={buyer.fullName}
            onChange={(e) => setBuyer({ fullName: e.target.value })}
            className={inputCls}
          />
          {/* Link de Stripe: con el correo, ofrece autocompletar la tarjeta guardada del cliente. */}
          <LinkAuthenticationElement
            options={{ defaultValues: { email: buyer.email } }}
            onChange={(e) => {
              const v = e.value?.email;
              if (typeof v === "string" && v !== buyer.email) setBuyer({ email: v });
            }}
          />
        </div>
      )}
      {!ready && (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {t.loading}
        </div>
      )}
      <div className={ready ? "" : "h-0 overflow-hidden opacity-0"}>
        <PaymentElement
          options={{
            layout: { type: "tabs", defaultCollapsed: false },
            // Apple Pay / Google Pay / Link ya están en "Pago rápido" (arriba de la página): no se repiten aquí.
            wallets: { applePay: "never", googlePay: "never" },
            // Nombre y correo ya los tenemos arriba: no se vuelven a pedir.
            fields: { billingDetails: { name: "never", email: "never", phone: method !== "card" ? "auto" : "never" } },
            defaultValues: { billingDetails: { email: s0.buyer.email.trim(), name: s0.buyer.fullName.trim() } },
          }}
          onReady={() => setReady(true)}
          onLoadError={() => onUnavailable?.()}
        />
      </div>

      {error && (
        <div>
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
          <SupportWhatsApp variant="error" language={lang} country={country} method={method === "card" ? "card" : method} amountLabel={formatMinor(quote.amount, quote.currency, language)} error={error} />
        </div>
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

  // Stablecoins (USDC) solo se cobran en dólares; el resto, en la moneda local.
  const quoteCurrency = props.method === "crypto" ? "USD" : String(currency || "USD");
  const signature = JSON.stringify({ items: items.map((i) => [i.id, i.quantity]), coupon, currency: quoteCurrency, country });

  useEffect(() => {
    setQuote(null);
    setFailed(false);
    if (!stripePromise || items.length === 0 || country.length !== 2) return;
    let cancelled = false;
    (async () => {
      const q = await fetchStripeQuote({ items, currency: quoteCurrency, country, couponCode: coupon });
      if (cancelled) return;
      if (!q) {
        setFailed(true);
        return;
      }
      setQuote(q);
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
      key={`${quote.amount}-${quote.currency}-${props.method ?? "card"}`}
      stripe={stripePromise}
      options={{
        mode: "payment",
        amount: quote.amount,
        currency: quote.currency,
        ...(props.method && props.method !== "card" ? {} : { setupFutureUsage: "off_session" as const }),
        // Este formulario maneja solo tarjeta de crédito/débito; las billeteras rápidas van arriba.
        paymentMethodTypes: props.method && props.method !== "card" ? [props.method] : ["card"],
        locale,
        appearance: { theme: "stripe" },
      }}
    >
      <Inner
        method={props.method}
        language={props.language}
        country={props.country}
        canPay={props.canPay}
        onNeedBuyerInfo={props.onNeedBuyerInfo}
        onBeforePay={props.onBeforePay}
        onUnavailable={props.onUnavailable}
        quote={quote}
      />
    </Elements>
  );
}
