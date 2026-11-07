import React, { useEffect, useMemo, useState } from "react";
import { Elements, LinkAuthenticationElement, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Loader2, Lock } from "lucide-react";
import type { StripeExpressCheckoutElementConfirmEvent } from "@stripe/stripe-js";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { invokeWithRetry } from "@/lib/invokeWithRetry";
import { fetchStripeQuote } from "@/lib/stripeQuote";
import { SupportWhatsApp } from "@/components/checkout/SupportWhatsApp";
import { getOrderRef } from "@/lib/support";
import { mapStripeError, type Lang } from "@/lib/stripeErrorMap";
import { trackPaymentError } from "@/hooks/useMetaPixel";
import { savesCardForFutureUse } from "@/lib/cardSaving";

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

const COPY: Record<Lang, { pay: string; paying: string; secure: string; error: string; loading: string; or: string; linkHint: string }> = {
  es: { pay: "Pagar", paying: "Procesando…", secure: "Pago seguro procesado por Stripe", error: "No se pudo completar el pago. Intenta de nuevo.", loading: "Cargando formulario de pago…", or: "o paga con tarjeta", linkHint: "Correo electrónico — con Link pagas más rápido con tu tarjeta guardada" },
  en: { pay: "Pay", paying: "Processing…", secure: "Secure payment processed by Stripe", error: "The payment could not be completed. Please try again.", loading: "Loading payment form…", or: "or pay with card", linkHint: "Email — with Link you pay faster using your saved card" },
  pt: { pay: "Pagar", paying: "Processando…", secure: "Pagamento seguro processado pela Stripe", error: "Não foi possível concluir o pagamento. Tente novamente.", loading: "Carregando formulário de pagamento…", or: "ou pague com cartão", linkHint: "E-mail — com o Link você paga mais rápido com seu cartão salvo" },
  fr: { pay: "Payer", paying: "Traitement…", secure: "Paiement sécurisé traité par Stripe", error: "Le paiement n'a pas pu être finalisé. Réessaie.", loading: "Chargement du formulaire de paiement…", or: "ou payez par carte", linkHint: "E-mail — avec Link, payez plus vite avec votre carte enregistrée" },
  it: { pay: "Paga", paying: "Elaborazione…", secure: "Pagamento sicuro elaborato da Stripe", error: "Non è stato possibile completare il pagamento. Riprova.", loading: "Caricamento del modulo di pagamento…", or: "o paga con carta", linkHint: "E-mail — con Link paghi più in fretta con la carta salvata" },
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
  /** Otros métodos del país (PayPal, Mercado Pago, Hotmart…) que se ofrecen si el banco rechaza la tarjeta. */
  alternatives?: { id: string; title: string }[];
  onPickAlternative?: (id: string) => void;
}

const DECLINE_CODES = new Set(["card_declined", "insufficient_funds", "expired_card", "3ds_failed", "processing"]);

const ALT_COPY: Record<Lang, string> = {
  es: "¿Tu banco rechazó la tarjeta? Prueba con otro método:",
  en: "Did your bank decline the card? Try another method:",
  pt: "Seu banco recusou o cartão? Tente outro método:",
  fr: "Ta banque a refusé la carte ? Essaie un autre moyen :",
  it: "La tua banca ha rifiutato la carta? Prova un altro metodo:",
};

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
  alternatives,
  onPickAlternative,
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
  // El banco rechazó la tarjeta: se ofrecen los otros métodos disponibles en el país.
  const [declined, setDeclined] = useState(false);

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
    setDeclined(false);
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
        trackPaymentError({ skus: s.items.map((i) => i.id), provider: "stripe", reason: `create_intent · ${country} · ${[fe?.status, dd?.reason, dd?.error, fe?.edgeDetail || fe?.message].filter(Boolean).join(" · ")}`, value: ZERO_DECIMAL.has(quote.currency.toLowerCase()) ? quote.amount : quote.amount / 100, currency: quote.currency });
        setError(mapStripeError(fnError, lang).message || t.error);
        return;
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret: data.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkouts/return?session_id=${encodeURIComponent(data.paymentIntentId)}`,
          ...(source === "payment-element"
            ? { payment_method_data: { billing_details: { name: name || undefined, email } } }
            : {}),
        },
      });

      // Si todo sale bien, Stripe redirige solo a return_url (no llegamos aquí).
      if (confirmError) {
        console.error("[payment-element] confirm failed", confirmError);
        setDetail([confirmError.type, confirmError.code, confirmError.decline_code, confirmError.message].filter(Boolean).join(" · ").slice(0, 200));
        const mapped = mapStripeError(confirmError, lang);
        setDeclined(DECLINE_CODES.has(mapped.code));
        // Se guarda el motivo real (código del banco/Stripe) y el ID del pago para verlo en /admin/payment-errors.
        trackPaymentError({
          skus: s.items.map((i) => i.id),
          provider: "stripe",
          reason: [confirmError.decline_code || confirmError.code || confirmError.type, country, data.paymentIntentId, confirmError.message].filter(Boolean).join(" · "),
          value: ZERO_DECIMAL.has(quote.currency.toLowerCase()) ? quote.amount : quote.amount / 100,
          currency: quote.currency,
        });
        // Si no reconocemos el error, se muestra el mensaje real de Stripe en vez de uno genérico.
        setError(mapped.code === "unknown" ? confirmError.message || mapped.message || t.error : mapped.message || confirmError.message || t.error);
      }
    } catch (err) {
      console.error("[payment-element] unexpected error", err);
      const ex = err as { name?: string; type?: string; code?: string; message?: string };
      setDetail(["excepción", ex?.name, ex?.type, ex?.code, ex?.message].filter(Boolean).join(" · ").slice(0, 200));
      // También se guarda en «Fallos de pago» (antes solo se mostraba en pantalla): así se ve qué pasó con Bizum, Klarna, etc.
      try {
        const st = useCheckoutPruebaStore.getState();
        trackPaymentError({
          skus: st.items.map((i) => i.id),
          provider: "stripe",
          reason: ["exception", method, country, ex?.name, ex?.type, ex?.code, ex?.message].filter(Boolean).join(" · ").slice(0, 300),
          value: ZERO_DECIMAL.has(quote.currency.toLowerCase()) ? quote.amount : quote.amount / 100,
          currency: quote.currency,
        });
      } catch { /* el registro no debe romper el pago */ }
      setError(mapStripeError(err, lang).message || t.error);
    } finally {
      setBusy(false);
    }
  };

  const handlePay = () => runPayment("payment-element");

  const s0 = useCheckoutPruebaStore.getState();
  const buyer = useCheckoutPruebaStore((st) => st.buyer);
  const setBuyer = useCheckoutPruebaStore((st) => st.setBuyer);
  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        {/* Como el ejemplo de Stripe: correo arriba; si el cliente ya usó Link, se ofrece su tarjeta guardada. */}
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{t.linkHint}</p>
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
      <div className={ready ? "" : "h-0 overflow-hidden opacity-0"}>
        <PaymentElement
          options={{
            layout: { type: "tabs", defaultCollapsed: false },
            // Solo dos opciones: Tarjeta y Link. Apple Pay / Google Pay quedan en "Pago rápido" (arriba de la página).
            wallets: { applePay: "never", googlePay: "never" },
            // Nombre y correo ya los tenemos arriba: no se vuelven a pedir. El teléfono se guarda en nuestro
            // sistema (seguimiento por WhatsApp) y NO se envía a Stripe como dato de la tarjeta.
            // phone en "auto": con "never" Stripe exige mandar el teléfono al pagar y lanza IntegrationError si el cliente no lo escribió (la tarjeta no lo pide).
            fields: { billingDetails: { name: "never", email: "never", phone: "auto" } },
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
          {declined && alternatives && alternatives.length > 0 && onPickAlternative && (
            <div className="mt-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 dark:border-neutral-700 dark:bg-neutral-900">
              <p className="mb-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200">{ALT_COPY[lang]}</p>
              <div className="flex flex-wrap gap-2">
                {alternatives.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onPickAlternative(a.id)}
                    className="rounded-md border border-emerald-600 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 dark:bg-neutral-950 dark:text-emerald-200 dark:hover:bg-emerald-950/30"
                  >
                    {a.title}
                  </button>
                ))}
              </div>
            </div>
          )}
          <SupportWhatsApp variant="error" language={lang} country={country} method={method === "card" ? "card" : method} amountLabel={formatMinor(quote.amount, quote.currency, language)} error={detail ? `${error} (${detail})` : error} />
        </div>
      )}

      <button
        type="button"
        onClick={handlePay}
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
        ...(props.method && props.method !== "card" || !savesCardForFutureUse(country) ? {} : { setupFutureUsage: "off_session" as const }),
        // Este formulario maneja solo tarjeta de crédito/débito; las billeteras rápidas van arriba.
        // Tarjeta: el pago se crea en el servidor con métodos automáticos, así que el formulario también debe ser automático
        // (si se fijan paymentMethodTypes aquí, Stripe rechaza la confirmación: "cannot be confirmed through the API configured with automatic payment methods").
        // Los métodos locales (Bizum, iDEAL…) sí se crean con su tipo fijo en el servidor.
        ...(props.method && props.method !== "card" ? { paymentMethodTypes: [props.method] } : {}),
        locale,
        // Etiquetas encima de cada campo (Número de tarjeta, Fecha de caducidad, Código de seguridad), como en el ejemplo de Stripe con Link.
        appearance: { theme: "stripe", labels: "above", variables: { spacingGridRow: "14px" } },
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
        alternatives={props.alternatives}
        onPickAlternative={props.onPickAlternative}
        refreshing={refreshing}
        currencyToggle={currencyToggle}
        quote={quote}
      />
    </Elements>
  );
}
