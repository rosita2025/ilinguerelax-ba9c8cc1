import React, { useEffect, useMemo, useState } from "react";
import { Elements, ExpressCheckoutElement, LinkAuthenticationElement, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Loader2, Lock } from "lucide-react";
import type { StripeExpressCheckoutElementConfirmEvent } from "@stripe/stripe-js";
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
  /** Abre la página completa de Stripe (checkout.stripe.com) como alternativa si el formulario da error. */
  onHostedFallback?: () => void;
  hostedLoading?: boolean;
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
  onHostedFallback,
  hostedLoading,
  refreshing,
  currencyToggle,
}: Omit<Props, "currency"> & { quote: Quote; refreshing?: boolean; currencyToggle?: React.ReactNode }) => {
  const lang = (["es", "en", "pt", "fr", "it"].includes(language) ? language : "es") as Lang;
  const t = COPY[lang];
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);

  // Al agregar/quitar un upsell el formulario NO se recarga: solo se actualiza el monto.
  useEffect(() => {
    if (!elements) return;
    try { elements.update({ amount: quote.amount, currency: quote.currency }); } catch { /* el siguiente cambio lo corrige */ }
  }, [elements, quote.amount, quote.currency]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Detalle técnico (código de Stripe / de la función) para poder diagnosticar el error real.
  const [detail, setDetail] = useState<string | null>(null);
  const [tab, setTab] = useState<"card" | "link">("card");
  const [linkOk, setLinkOk] = useState<boolean | null>(null);

  // Si el formulario no carga (error de Stripe o sin respuesta), se vuelve al formulario anterior.
  useEffect(() => {
    if (ready) return;
    const id = window.setTimeout(() => onUnavailable?.(), 15000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const runPayment = async (source: "payment-element" | "express-checkout", linkEvent?: StripeExpressCheckoutElementConfirmEvent) => {
    if (!stripe || !elements || busy) return;
    if (source === "payment-element" && !canPay) {
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
      const email = (linkEvent?.billingDetails?.email || s.buyer.email).trim();
      const name = (linkEvent?.billingDetails?.name || s.buyer.fullName).trim();
      if (!email) {
        setError(t.error);
        return;
      }
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
        const fe = fnError as { edgeDetail?: string; status?: number; message?: string } | null;
        const dd = data as { reason?: string; error?: string } | null;
        setDetail([fe?.status, dd?.reason, dd?.error, fe?.edgeDetail || fe?.message].filter(Boolean).join(" · ").slice(0, 200) || "create-intent");
        setError(mapStripeError(fnError, lang).message || t.error);
        return;
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret: data.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkouts/return?session_id=${encodeURIComponent(data.paymentIntentId)}`,
          ...(source === "payment-element"
            ? { payment_method_data: { billing_details: { name: name || undefined, email, phone: (s.buyer.phone ?? "").trim() || undefined } } }
            : {}),
        },
      });

      // Si todo sale bien, Stripe redirige solo a return_url (no llegamos aquí).
      if (confirmError) {
        console.error("[payment-element] confirm failed", confirmError);
        setDetail([confirmError.type, confirmError.code, confirmError.decline_code, confirmError.message].filter(Boolean).join(" · ").slice(0, 200));
        const mapped = mapStripeError(confirmError, lang);
        // Si no reconocemos el error, se muestra el mensaje real de Stripe en vez de uno genérico.
        setError(mapped.code === "unknown" ? confirmError.message || mapped.message || t.error : mapped.message || confirmError.message || t.error);
      }
    } catch (err) {
      console.error("[payment-element] unexpected error", err);
      const ex = err as { name?: string; type?: string; code?: string; message?: string };
      setDetail(["excepción", ex?.name, ex?.type, ex?.code, ex?.message].filter(Boolean).join(" · ").slice(0, 200));
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
      <div className="grid gap-2">
        <label className="grid gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {{ es: "Nombre en la tarjeta", en: "Name on card", pt: "Nome no cartão", fr: "Nom sur la carte", it: "Nome sulla carta" }[lang]}
          <input
            type="text"
            autoComplete="cc-name"
            placeholder={contactLabels[0]}
            value={buyer.fullName}
            onChange={(e) => setBuyer({ fullName: e.target.value })}
            className={inputCls}
          />
        </label>
        {/* Como el ejemplo de Stripe: correo arriba; si el cliente ya usó Link, se ofrece su tarjeta guardada. */}
        <LinkAuthenticationElement
          options={{ defaultValues: { email: buyer.email } }}
          onChange={(e) => {
            const v = e.value?.email;
            if (typeof v === "string" && v && v !== buyer.email) setBuyer({ email: v });
          }}
        />
      </div>
      {!ready && (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {t.loading}
        </div>
      )}
      {currencyToggle}
      {(!method || method === "card") && (
        <div role="tablist" aria-label="Método de pago" className="grid grid-cols-2 gap-2">
          {([["card", { es: "Crédito o débito", en: "Credit or debit", pt: "Crédito ou débito", fr: "Crédit ou débit", it: "Credito o debito" }[lang]], ["link", "Link"]] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`h-11 rounded-md border text-sm font-semibold transition ${tab === id ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200" : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {tab === "link" && (!method || method === "card") && (
        <div className="space-y-2">
          <ExpressCheckoutElement
            options={{
              buttonHeight: 48,
              emailRequired: true,
              paymentMethods: { link: "auto", applePay: "never", googlePay: "never", amazonPay: "never", paypal: "never" },
            }}
            onReady={(e) => setLinkOk(!!e.availablePaymentMethods?.link)}
            onConfirm={(e) => { void runPayment("express-checkout", e); }}
          />
          {linkOk === false && (
            <p className="text-sm text-muted-foreground">
              {{ es: "Link no está disponible para este pago. Elige Tarjeta.", en: "Link isn't available for this payment. Choose Card.", pt: "O Link não está disponível para este pagamento. Escolha Cartão.", fr: "Link n'est pas disponible pour ce paiement. Choisissez Carte.", it: "Link non è disponibile per questo pagamento. Scegli Carta." }[lang]}
            </p>
          )}
        </div>
      )}
      <div className={tab === "link" && (!method || method === "card") ? "hidden" : ready ? "" : "h-0 overflow-hidden opacity-0"}>
        <PaymentElement
          options={{
            layout: { type: "tabs", defaultCollapsed: false },
            // Solo dos opciones: Tarjeta y Link. Apple Pay / Google Pay quedan en "Pago rápido" (arriba de la página).
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
          {detail && <p className="mt-1 break-words text-[11px] text-muted-foreground">Ref: {detail}</p>}
          <SupportWhatsApp variant="error" language={lang} country={country} method={method === "card" ? "card" : method} amountLabel={formatMinor(quote.amount, quote.currency, language)} error={detail ? `${error} (${detail})` : error} />
        </div>
      )}

      <button
        type="button"
        onClick={handlePay}
        hidden={tab === "link" && (!method || method === "card")}
        disabled={!ready || busy || !stripe || refreshing}
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
  // Tarjeta: el cliente puede pagar en su moneda local o en dólares (útil si su banco no acepta la moneda local).
  const [payUsd, setPayUsd] = useState(false);
  const localCode = String(currency || "USD").toUpperCase();
  const canChooseCurrency = (!props.method || props.method === "card") && localCode !== "USD";
  const quoteStoreKey = `pe_quote_v1:${country}:${props.method === "crypto" || (canChooseCurrency && payUsd) ? "USD" : String(currency || "USD")}:${coupon ?? ""}:${items.map((i) => `${i.id}x${i.quantity}`).join(",")}`;
  // Último monto conocido para esta misma compra: el formulario aparece al instante y el monto se confirma enseguida.
  const [quote, setQuote] = useState<Quote | null>(() => {
    try {
      const raw = sessionStorage.getItem(quoteStoreKey);
      const q = raw ? (JSON.parse(raw) as Quote) : null;
      return q && q.amount > 0 && q.currency ? q : null;
    } catch {
      return null;
    }
  });
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const stripePromise = useMemo(() => {
    try {
      return getStripe();
    } catch {
      return null;
    }
  }, []);

  // Stablecoins (USDC) solo se cobran en dólares; el resto, en la moneda local.
  const quoteCurrency = props.method === "crypto" || (canChooseCurrency && payUsd) ? "USD" : String(currency || "USD");
  const signature = JSON.stringify({ items: items.map((i) => [i.id, i.quantity]), coupon, currency: quoteCurrency, country });

  useEffect(() => {
    setFailed(false);
    if (!stripePromise || items.length === 0 || country.length !== 2) return;
    let cancelled = false;
    // El formulario anterior se queda en pantalla mientras llega el monto nuevo.
    setRefreshing(true);
    (async () => {
      const q = await fetchStripeQuote({ items, currency: quoteCurrency, country, couponCode: coupon });
      if (cancelled) return;
      setRefreshing(false);
      if (!q) {
        setFailed(true);
        return;
      }
      setQuote(q);
      try { sessionStorage.setItem(quoteStoreKey, JSON.stringify(q)); } catch { /* sin almacenamiento */ }
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

  // Precio de la otra moneda, solo para mostrarlo en el botón (no cambia lo que se cobra).
  const [altQuote, setAltQuote] = useState<Quote | null>(null);
  const altCurrency = payUsd ? localCode : "USD";
  useEffect(() => {
    if (!canChooseCurrency || !stripePromise || items.length === 0 || country.length !== 2) return;
    let cancelled = false;
    void fetchStripeQuote({ items, currency: altCurrency, country, couponCode: coupon }).then((q) => {
      if (!cancelled && q) setAltQuote(q);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, altCurrency, canChooseCurrency]);

  if (unavailable) return null;
  if (!quote) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  const locale = (["es", "en", "pt", "fr", "it"].includes(props.language) ? props.language : "es") as "es" | "en" | "pt" | "fr" | "it";

  const currencyToggle = canChooseCurrency ? (
    <div role="group" aria-label="Moneda" className="grid grid-cols-2 gap-2">
      {[{ usd: false, code: localCode }, { usd: true, code: "USD" }].map((o) => {
        const q = o.usd === payUsd ? quote : altQuote;
        const amount = q && q.currency.toUpperCase() === o.code ? formatMinor(q.amount, q.currency, props.language) : "";
        return (
        <button
          key={o.code}
          type="button"
          onClick={() => setPayUsd(o.usd)}
          aria-pressed={payUsd === o.usd}
          className={`flex h-12 flex-col items-center justify-center rounded-md border text-sm font-semibold leading-tight transition ${payUsd === o.usd ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200" : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"}`}
        >
          <span>{amount || o.code}</span>
          {amount && <span className="text-[11px] font-medium opacity-70">{o.code}</span>}
        </button>
        );
      })}
    </div>
  ) : null;

  return (
    <Elements
      key={props.method ?? "card"}
      stripe={stripePromise}
      options={{
        mode: "payment",
        amount: quote.amount,
        currency: quote.currency,
        ...(props.method && props.method !== "card" ? {} : { setupFutureUsage: "off_session" as const }),
        // Este formulario maneja solo tarjeta de crédito/débito; las billeteras rápidas van arriba.
        paymentMethodTypes: props.method && props.method !== "card" ? [props.method] : ["card", "link"],
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
        onHostedFallback={props.onHostedFallback}
        hostedLoading={props.hostedLoading}
        refreshing={refreshing}
        currencyToggle={currencyToggle}
        quote={quote}
      />
    </Elements>
  );
}
