import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Building2, Banknote, Loader2, Lock, Smartphone, Copy, Check, MessageCircle, Wallet } from "lucide-react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { useCheckoutPruebaStore, calcTotals, itemPrice, calcTotalsPen, formatPen } from "@/stores/checkoutStore";
import { useRegionTier } from "@/hooks/useRegionTier";
import { useLocalCurrency } from "@/hooks/useLocalCurrency";

import { isBuyerValid, BUYER_ERRORS_EVENT } from "@/components/checkout/BuyerInfoForm";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nContext";
import { getCheckoutUI } from "@/i18n/checkoutUI";
import { PayPalButtons } from "@/components/checkout/PayPalButtons";
import { mapStripeError, type MappedStripeError, type Lang as StripeLang } from "@/lib/stripeErrorMap";
import { invokeWithRetry } from "@/lib/invokeWithRetry";


type Method = "card" | "paypal" | "transfer" | "cash" | "yape";

const visaLogo = "/__l5e/assets-v1/a96d5ad9-136a-425a-970a-b7889b8bdc30/visa.svg";
const mastercardLogo = "/__l5e/assets-v1/94d65183-1752-495e-ac5b-70ec4cba62b2/mastercard.svg";
const applePayLogo = "/__l5e/assets-v1/a38f0d22-72e4-4393-ace6-856f1b5379e6/apple-pay.svg";


function LogoBadge({ src, alt, bg = "#ffffff" }: { src: string; alt: string; bg?: string }) {
  return (
    <span
      className="inline-flex items-center justify-center h-6 w-9 rounded-md border border-neutral-200 dark:border-neutral-700 shadow-sm shrink-0"
      style={{ background: bg }}
    >
      <img src={src} alt={alt} className="max-h-4 max-w-[28px] object-contain" />
    </span>
  );
}

function LinkBadge() {
  return (
    <span
      className="inline-flex items-center justify-center h-6 w-9 rounded-md border border-neutral-200 dark:border-neutral-700 shadow-sm shrink-0"
      style={{ background: "#00D66F" }}
    >
      <span className="text-[10px] font-bold tracking-tight leading-none" style={{ color: "#0A2540" }}>
        Link
      </span>
    </span>
  );
}

function BankBadge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span
      className="inline-flex items-center justify-center h-6 px-2 rounded-md border border-neutral-200 dark:border-neutral-700 shadow-sm text-[10px] font-bold tracking-tight leading-none shrink-0"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  );
}





const YAPE_PHONE = "972119741";
const YAPE_NAME = "Carmen Aliaga";
const WHATSAPP_URL = "https://wa.link/unpa9n";

export function PaymentMethodsGroup() {
  const navigate = useNavigate();
  const { items, buyer, coupon, couponPercent } = useCheckoutPruebaStore();
  const region = useRegionTier();
  const { language } = useI18n();
  const t = getCheckoutUI(language);
  const { total } = calcTotals(items, couponPercent, region.tier);
  const penTotals = calcTotalsPen(items, couponPercent, region.country || "");
  const totalUsd = total.toFixed(2);
  const local = useLocalCurrency(total);
  const penBadge = penTotals ? formatPen(penTotals.total) : null;
  // Badge principal: SIEMPRE en moneda local del país (USD, CAD, EUR, MXN, ARS, PEN, etc.)
  const priceBadge = penBadge ?? (local.loading ? `USD $${totalUsd}` : local.formatted);
  const localBadge = "";


  const [selected, setSelected] = useState<Method | null>(null);
  const [selectedCardRow, setSelectedCardRow] = useState<string | null>(null);
  const [mpLoading, setMpLoading] = useState<Method | null>(null);
  const [showStripe, setShowStripe] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState<MappedStripeError | null>(null);
  const [stripeRetryKey, setStripeRetryKey] = useState(0);
  const [stripeFrameMounted, setStripeFrameMounted] = useState(false);
  const [stripeElapsed, setStripeElapsed] = useState(0);
  const [stripeAutoRetried, setStripeAutoRetried] = useState(false);
  const [copied, setCopied] = useState(false);
  const redirectingRef = useRef(false);
  const stripeAnchorRef = useRef<HTMLDivElement | null>(null);
  const stripeContainerRef = useRef<HTMLDivElement | null>(null);
  const valid = isBuyerValid(buyer);

  const stripePromise = (() => {
    try { return getStripe(); } catch { return null; }
  })();

  useEffect(() => {
    const reset = () => { redirectingRef.current = false; setMpLoading(null); };
    window.addEventListener("pageshow", reset);
    window.addEventListener("focus", reset);
    return () => {
      window.removeEventListener("pageshow", reset);
      window.removeEventListener("focus", reset);
    };
  }, []);

  const cartSignature = JSON.stringify({
    items: items.map((i) => ({ id: i.id, price: itemPrice(i, region.tier), q: i.quantity })),
    coupon, couponPercent, tier: region.tier,
  });
  const prevSig = useRef(cartSignature);
  useEffect(() => {
    if (prevSig.current !== cartSignature) {
      prevSig.current = cartSignature;
      if (selected === "card") setShowStripe(false);
    }
  }, [cartSignature, selected]);

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    const s = useCheckoutPruebaStore.getState();
    if (!isBuyerValid(s.buyer)) throw new Error(t.completeYourData);
    setStripeLoading(true);
    setStripeError(null);
    const parts = s.buyer.fullName.trim().split(/\s+/);
    const firstName = parts[0].slice(0, 50);
    const lastName = (parts.slice(1).join(" ") || parts[0]).slice(0, 50);
    const toAbsUrl = (u?: string) => {
      if (!u) return undefined;
      if (/^https?:\/\//i.test(u)) return u;
      try { return new URL(u, window.location.origin).toString(); } catch { return undefined; }
    };
    try {
      const { data, error } = await invokeWithRetry<{ clientSecret?: string }>("create-checkout-prueba", {
        body: {
          environment: getStripeEnvironment(),
          items: s.items.map((i) => ({
            id: i.id, name: i.name, price: itemPrice(i, region.tier),
            quantity: i.quantity, image: toAbsUrl(i.image), description: i.description,
          })),
          currency: "usd",
          couponPercent: s.couponPercent,
          couponCode: s.coupon ?? undefined,
          contact: {
            email: s.buyer.email.trim(),
            phone: (s.buyer.phone ?? "").slice(0, 20) || "+10000000000",
            firstName, lastName,
            country: (region.country || localStorage.getItem("ilr_country") || "PE").toUpperCase().slice(0, 2),
          },
          returnUrl: `${window.location.origin}/checkouts/return?session_id={CHECKOUT_SESSION_ID}`,
        },
      }, { attempts: 3, baseDelayMs: 500 });
      if (error || !data?.clientSecret) throw new Error((error as { message?: string } | null)?.message || t.errorPayment);

      supabase.from("email_contacts").upsert({
        email: s.buyer.email.trim().toLowerCase(),
        name: s.buyer.fullName.trim(),
        source: "checkout-prueba-1",
        metadata: { phone: s.buyer.phone ?? "", processor: "stripe" },
      }, { onConflict: "email,source" }).then(() => {});
      return data.clientSecret;
    } catch (err) {
      setStripeError(mapStripeError(err, language as StripeLang));
      throw err;
    } finally {
      setStripeLoading(false);
    }
    // Depend only on region.tier/country — buyer/items are read fresh from
    // the store inside the callback, so the reference stays stable across
    // typing and avoids remounting the EmbeddedCheckoutProvider (blank screen).
  }, [region.tier, region.country, language, t.completeYourData, t.errorPayment]);

  // Memoize the options object per cart signature. A new object reference on
  // every render forces Stripe to remount the iframe → blank/duplicated form.
  const stripeOptions = useMemo(() => ({ fetchClientSecret }), [fetchClientSecret]);

  const requestBuyerInfo = () => {
    window.dispatchEvent(new Event(BUYER_ERRORS_EVENT));
    toast({
      title: t.completeDataFirst,
      description: t.completeDataFirstDesc,
      variant: "destructive",
    });
  };

  const payMercado = async (paymentType: "cash" | "transfer") => {
    if (!valid) { requestBuyerInfo(); return; }
    if (redirectingRef.current) return;
    const s = useCheckoutPruebaStore.getState();
    const totals = calcTotals(s.items, s.couponPercent, region.tier);
    redirectingRef.current = true;
    setMpLoading(paymentType);
    try {
      supabase.from("email_contacts").upsert({
        email: s.buyer.email.trim().toLowerCase(),
        name: s.buyer.fullName.trim(),
        source: "checkout-prueba-1",
        metadata: { phone: s.buyer.phone ?? "", processor: "mercadopago", paymentType },
      }, { onConflict: "email,source" }).then(() => {});

      const { data, error } = await invokeWithRetry<{ init_point?: string }>("create-mercadopago-preference", {
        body: {
          orderId: `ILR-MP-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          items: s.items.map((i) => {
            const abs = i.image && /^https?:\/\//i.test(i.image)
              ? i.image
              : (() => { try { return i.image ? new URL(i.image, window.location.origin).toString() : undefined; } catch { return undefined; } })();
            return { id: i.id, name: i.name, price: itemPrice(i, region.tier), quantity: i.quantity, image: abs, description: i.description };
          }),
          couponPercent: s.couponPercent,
          couponCode: s.coupon ?? undefined,
          payerEmail: s.buyer.email.trim(),
          payerName: s.buyer.fullName.trim(),
          payerPhone: s.buyer.phone ?? undefined,
          // Mercado Pago aplica el tipo de cambio local automáticamente (USD → moneda del comprador).
          expectedTotalUsd: Number(totals.total.toFixed(2)),
          returnUrl: `${window.location.origin}/checkouts/return`,
          successUrl: `${window.location.origin}/checkouts/success`,
          failureUrl: `${window.location.origin}/checkouts/failure`,
          pendingUrl: `${window.location.origin}/checkouts/pending`,
          autoReturn: "approved",
          paymentType,
        },
      }, { attempts: 3, baseDelayMs: 500 });
      if (error || !data?.init_point) throw new Error((error as { message?: string } | null)?.message || t.mpError);

      window.location.assign(data.init_point);
    } catch (err) {
      redirectingRef.current = false;
      setMpLoading(null);
      toast({
        title: t.mpError,
        description: err instanceof Error ? err.message : t.tryAgain,
        variant: "destructive",
      });
    }
  };

  const handleSelect = (m: Method) => {
    if (!valid) { requestBuyerInfo(); return; }
    setSelected(m);
    if (m !== "card") setShowStripe(false);
  };

  const handleBuyNow = () => {
    if (!valid) { requestBuyerInfo(); return; }
    if (!selected) {
      toast({ title: t.selectMethod, variant: "destructive" });
      return;
    }
    if (selected === "card") { setShowStripe(true); return; }
    if (selected === "transfer") { payMercado("transfer"); return; }
    if (selected === "cash") { payMercado("cash"); return; }
    // yape → user uses "Ya pagué" button in the manual panel
  };

  const retryStripe = useCallback(() => {
    setStripeError(null);
    setStripeLoading(false);
    setStripeFrameMounted(false);
    setStripeElapsed(0);
    setStripeRetryKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!(showStripe && selected === "card")) return;
    setStripeFrameMounted(false);
    setStripeElapsed(0);
    const container = stripeContainerRef.current;
    if (!container) return;

    const markMounted = () => {
      if (container.querySelector('iframe[name="embedded-checkout"]')) {
        setStripeFrameMounted(true);
        return true;
      }
      return false;
    };

    if (markMounted()) return;
    const observer = new MutationObserver(markMounted);
    observer.observe(container, { childList: true, subtree: true });

    const startedAt = Date.now();
    const tick = window.setInterval(() => {
      const s = Math.floor((Date.now() - startedAt) / 1000);
      setStripeElapsed(s);
      // Auto-retry silently once at 45s if the iframe never mounted
      if (s === 45 && !stripeAutoRetried) {
        setStripeAutoRetried(true);
        setStripeRetryKey((k) => k + 1);
      }
      // Hard failure at 90s → show retry UI
      if (s >= 90) {
        window.clearInterval(tick);
        if (!container.querySelector('iframe[name="embedded-checkout"]')) {
          setStripeError(mapStripeError(new Error("timeout: took too long to open"), language as StripeLang));
        }
      }
    }, 1000);

    return () => {
      observer.disconnect();
      window.clearInterval(tick);
    };
  }, [showStripe, selected, stripeRetryKey, language, stripeAutoRetried]);

  const handleManualPaid = async () => {
    const s = useCheckoutPruebaStore.getState();
    const orderNumber = `ILR-YP-${Math.floor(1000 + Math.random() * 9000)}`;
    const amountText = penBadge ?? (local.loading ? `USD $${totalUsd}` : local.formatted);
    const productList = s.items.map((i) => `• ${i.name} x${i.quantity}`).join("\n");
    const msg =
      `Hola! 👋 Acabo de pagar por Yape/Plin.\n\n` +
      `📦 Orden: ${orderNumber}\n` +
      `👤 Nombre: ${s.buyer.fullName.trim()}\n` +
      `📧 Email: ${s.buyer.email.trim()}\n` +
      `💰 Monto: ${amountText}\n\n` +
      `Productos:\n${productList}\n\n` +
      `Adjunto captura del pago. Gracias!`;
    const waUrl = `https://wa.me/12512724704?text=${encodeURIComponent(msg)}`;

    // Guardar en base de datos para que Rosa lo vea en el admin
    try {
      await supabase.from("manual_payments").insert({
        order_number: orderNumber,
        buyer_name: s.buyer.fullName.trim(),
        buyer_email: s.buyer.email.trim().toLowerCase(),
        buyer_phone: s.buyer.phone ?? null,
        buyer_country: (region.country || "").toUpperCase() || null,
        amount_usd: Number(totalUsd),
        amount_local: penTotals ? penTotals.total : (local.loading ? null : Number(local.amount ?? totalUsd)),
        currency_local: penTotals ? "PEN" : (local.currency || "USD"),
        method: "yape_plin",
        items: s.items.map((i) => ({ sku: i.id, name: i.name, quantity: i.quantity, price: i.price })),
        status: "pending",
      });
    } catch (e) {
      console.warn("[manual_payments] insert failed", e);
    }

    // Notificar a Rosa (hola@ilinguerelax.com) con botón directo a WhatsApp del cliente
    supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "admin-manual-pending",
        idempotencyKey: `manual-pending-${orderNumber}`,
        templateData: {
          orderNumber,
          customerName: s.buyer.fullName.trim(),
          customerEmail: s.buyer.email.trim().toLowerCase(),
          customerPhone: s.buyer.phone ?? "",
          customerCountry: (region.country || "").toUpperCase(),
          productName: s.items.map((i) => i.name).join(" + "),
          amount: penTotals ? penTotals.total : (local.loading ? Number(totalUsd) : Number(local.amount ?? totalUsd)),
          currency: penTotals ? "PEN" : (local.currency || "USD"),
          method: "Yape/Plin",
          orderDate: new Date().toISOString(),
        },
      },
    }).catch((err) => console.warn("[admin-manual-pending] notify failed", err));

    // Confirmación al cliente — para no perder la orden si se cierra la página o se apaga la batería
    supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "customer-manual-pending",
        recipientEmail: s.buyer.email.trim().toLowerCase(),
        idempotencyKey: `customer-manual-pending-${orderNumber}`,
        templateData: {
          orderNumber,
          customerName: s.buyer.fullName.trim().split(" ")[0] || s.buyer.fullName.trim(),
          productName: s.items.map((i) => i.name).join(" + "),
          amount: penTotals ? penTotals.total : (local.loading ? Number(totalUsd) : Number(local.amount ?? totalUsd)),
          currency: penTotals ? "PEN" : (local.currency || "USD"),
          method: "Yape/Plin",
          orderDate: new Date().toISOString(),
        },
      },
    }).catch((err) => console.warn("[customer-manual-pending] notify failed", err));

    supabase.from("email_contacts").upsert({
      email: s.buyer.email.trim().toLowerCase(),
      name: s.buyer.fullName.trim(),
      source: "checkout-prueba-1",
      metadata: { phone: s.buyer.phone ?? "", processor: "manual", paymentType: "yape_plin", orderNumber },
    }, { onConflict: "email,source" }).then(() => {});

    window.open(waUrl, "_blank", "noopener,noreferrer");
    navigate(`/checkouts/pendiente-manual?order=${orderNumber}`);
  };



  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(YAPE_PHONE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* noop */ }
  };

  // Métodos locales de Perú (Mercado Pago transferencias/efectivo + Yape/Plin manual)
  // SOLO se muestran cuando el visitante está en Perú. Fuera de Perú, únicamente Stripe.
  const isPeru = (region.country || "").toUpperCase() === "PE";

  // Marcas de tarjeta / wallets visibles por región. Stripe activa el método real
  // automáticamente según el país del comprador; nosotros solo mostramos los
  // logos correctos para que el cliente reconozca sus opciones y confíe.
  const country = (region.country || "").toUpperCase();
  const cardBrandsByCountry = (_c: string): string[] => {
    // Solo mostramos las marcas principales para mantener el badge limpio.
    return ["Visa", "Mastercard", "Apple Pay", "Link"];
  };
  const cardBrands = cardBrandsByCountry(country);
  const cardSubtitle = isPeru
    ? t.cardSubtitlePeru(localBadge)
    : t.cardSubtitleGlobal(local.currency || (language === "en" ? "your local currency" : language === "pt" ? "sua moeda local" : language === "fr" ? "votre monnaie locale" : "tu moneda local"), localBadge);

  const isUsa = country === "US";
  const allMethods: { id: Method; icon: typeof CreditCard; title: string; sub: string; badge?: string }[] = [
    { id: "card", icon: CreditCard, title: isPeru ? t.cardTitlePeru : t.cardTitleGlobal, sub: cardSubtitle, badge: "Stripe" },
    { id: "paypal", icon: Wallet, title: "PayPal", sub: language === "en" ? "Pay with your PayPal balance or linked card." : language === "pt" ? "Pague com seu saldo PayPal ou cartão vinculado." : language === "fr" ? "Payez avec votre solde PayPal ou carte liée." : "Paga con tu saldo PayPal o tarjeta vinculada.", badge: priceBadge },
    { id: "transfer", icon: Building2, title: t.bankTransfer, sub: t.bankTransferSub(localBadge), badge: priceBadge },
    { id: "cash", icon: Banknote, title: t.cashPayment, sub: t.cashPaymentSub(localBadge), badge: priceBadge },
    { id: "yape", icon: Smartphone, title: t.yapePlin, sub: t.yapePlinSub, badge: priceBadge },
  ];
  // USA-only extra rows — visually separate Cash App and US Bank (ACH).
  // Both use id="card" so they open the same Stripe Embedded Checkout,
  // where Stripe surfaces the correct method automatically.
  const usaExtraMethods: typeof allMethods = isUsa ? [
    { id: "card", icon: Smartphone, title: "Cash App Pay", sub: "Pay instantly with your Cash App balance (US only).", badge: "Stripe" },
    { id: "card", icon: Building2, title: "US Bank (ACH)", sub: "Direct bank transfer from your US checking/savings account.", badge: "Stripe" },
  ] : [];
  // PayPal disponible en todo el mundo EXCEPTO Perú (allí solo rails locales + Stripe).
  const methods = isPeru
    ? allMethods.filter((m) => m.id !== "paypal")
    : [
        ...allMethods.filter((m) => m.id === "card"),
        ...usaExtraMethods,
        ...allMethods.filter((m) => m.id === "paypal"),
      ];


  // Fuera de Perú solo hay un método (Stripe). Auto-seleccionarlo y auto-abrir
  // el formulario embebido en cuanto el comprador completa sus datos, para
  // reducir clics y maximizar conversión (adultos mayores, jóvenes, adultos).
  useEffect(() => {
    if (!isPeru && !(total <= 0 && items.length > 0)) {
      if (selected !== "card") setSelected("card");
      if (valid && stripePromise && !showStripe) setShowStripe(true);
    }
  }, [isPeru, selected, valid, stripePromise, showStripe, total, items.length]);

  // Cuando se abre el iframe de Stripe, hacer scroll hasta él para que el
  // comprador VEA el formulario de tarjeta y no crea que "no pasó nada".
  useEffect(() => {
    if (showStripe && selected === "card") {
      const id = window.setTimeout(() => {
        stripeAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 250);
      return () => window.clearTimeout(id);
    }
  }, [showStripe, selected]);


  const wasValidRef = useRef(valid);
  const methodsAnchorRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!wasValidRef.current && valid) {
      methodsAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    wasValidRef.current = valid;
  }, [valid]);

  const isFree = total <= 0 && items.length > 0 && !!coupon && couponPercent >= 100;
  const isInvalidZero = total <= 0 && items.length > 0 && !isFree;
  const [freeLoading, setFreeLoading] = useState(false);
  const submitFreeOrder = async () => {
    if (!valid) { requestBuyerInfo(); return; }
    setFreeLoading(true);
    const s = useCheckoutPruebaStore.getState();
    const orderId = `ilr-free-${Date.now()}`;
    try {
      await supabase.functions.invoke("send-order-confirmation", {
        body: {
          customerEmail: s.buyer.email.trim(),
          customerName: s.buyer.fullName.trim(),
          orderId,
          total: 0,
          currency: "USD",
          paymentProvider: "free-coupon",
          items: s.items.map((i) => ({
            id: i.id, name: i.name, quantity: i.quantity,
            price: itemPrice(i, region.tier), image: i.image,
          })),
        },
      });
      supabase.from("email_contacts").upsert({
        email: s.buyer.email.trim().toLowerCase(),
        name: s.buyer.fullName.trim(),
        source: "checkout-prueba-1",
        metadata: { processor: "free-coupon", coupon: s.coupon ?? "" },
      }, { onConflict: "email,source" }).then(() => {});
    } catch (e) {
      console.error("free order confirmation failed", e);
    } finally {
      navigate(`/checkouts/success?session_id=${encodeURIComponent(orderId)}&status=approved&external_reference=${encodeURIComponent(orderId)}`);
    }
  };

  return (
    <div id="payment-methods" ref={methodsAnchorRef} className="space-y-3 scroll-mt-24">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {isFree ? (language === "en" ? "Free order" : language === "pt" ? "Pedido grátis" : language === "fr" ? "Commande gratuite" : "Pedido gratis") : (isPeru ? t.choosePaymentMethod : t.cardPayment)}
      </h2>

      {isFree && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-4 space-y-3">
          <p className="text-sm text-emerald-800 dark:text-emerald-200">
            {language === "en"
              ? "Your coupon covers 100% of the order. No payment is required — just confirm to receive your products by email."
              : language === "pt"
              ? "Seu cupom cobre 100% do pedido. Não é necessário pagar — confirme para receber seus produtos por email."
              : language === "fr"
              ? "Votre coupon couvre 100% de la commande. Aucun paiement requis — confirmez pour recevoir vos produits par email."
              : "Tu cupón cubre el 100% del pedido. No hay que pagar — confirma para recibir tus productos por correo."}
          </p>
          <button
            type="button"
            onClick={submitFreeOrder}
            disabled={freeLoading || !valid}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 disabled:opacity-60"
          >
            {freeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {language === "en" ? "Confirm free order" : language === "pt" ? "Confirmar pedido grátis" : language === "fr" ? "Confirmer la commande gratuite" : "Confirmar pedido gratis"}
          </button>
        </div>
      )}

      {isInvalidZero && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4">
          <p className="text-sm text-amber-900 dark:text-amber-100 font-medium">
            {language === "en"
              ? "The total cannot be $0. Please add a product before paying."
              : language === "pt"
              ? "O total não pode ser $0. Adicione um produto antes de pagar."
              : language === "fr"
              ? "Le total ne peut pas être $0. Ajoutez un produit avant de payer."
              : "El total no puede ser $0. Agrega un producto antes de pagar."}
          </p>
        </div>
      )}

      {!isFree && !isInvalidZero && methods.map((m, idx) => {
        const primaryCardTitle = isPeru ? t.cardTitlePeru : t.cardTitleGlobal;
        const isPrimaryCard = m.id === "card" && m.title === primaryCardTitle;
        // For USA extra rows (Cash App, US Bank) — highlight only the clicked one.
        const rowKey = `${m.id}-${m.title}`;
        const isSelected = valid && selected === m.id && (m.id !== "card" || selectedCardRow === rowKey);
        const isLoading = mpLoading === m.id;
        const Icon = m.icon;
        return (
          <div
            key={rowKey}
            className={cn(
              "rounded-xl border overflow-hidden transition-colors",
              isSelected
                ? "border-neutral-400 bg-neutral-100 dark:bg-neutral-800/60"
                : "border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/40",
            )}
          >
            <button
              type="button"
              onClick={() => { setSelectedCardRow(rowKey); handleSelect(m.id); }}
              disabled={isLoading}
              aria-disabled={!valid}
              className={cn(
                "w-full text-left p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3 transition-colors",
                isSelected
                  ? "bg-neutral-200/60 dark:bg-neutral-800"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800/60",
                !valid && "cursor-not-allowed",
              )}
            >
              <div className={cn(
                "w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0",
                isSelected
                  ? "bg-neutral-700 text-white"
                  : "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200",
              )}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm flex items-center gap-2 flex-wrap text-neutral-800 dark:text-neutral-100">
                  <span className="min-w-0 break-words">{m.title}</span>
                  {m.badge && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                      {m.badge}
                    </span>
                  )}
                </div>
                {isPrimaryCard ? (
                  <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                    <LogoBadge src={visaLogo} alt="Visa" />
                    <LogoBadge src={mastercardLogo} alt="Mastercard" />
                    <LogoBadge src={applePayLogo} alt="Apple Pay" bg="#000000" />
                    <LinkBadge />
                  </div>
                ) : m.id === "card" && m.title === "Cash App Pay" ? (
                  <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                    <BankBadge label="Cash App" bg="#00D64F" color="#000000" />
                  </div>
                ) : m.id === "card" && m.title === "US Bank (ACH)" ? (
                  <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                    <BankBadge label="ACH" bg="#0A2540" color="#ffffff" />
                    <BankBadge label="US Bank" bg="#eeeeee" color="#0A2540" />
                  </div>
                ) : null}
                {m.id === "card" ? null : m.id === "transfer" ? (
                  <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                    <BankBadge label="BCP" bg="#00447C" color="#FF9E1B" />
                    <BankBadge label="BBVA" bg="#004481" color="#ffffff" />
                    <BankBadge label="Interbank" bg="#00953B" color="#ffffff" />
                    <BankBadge label="Scotiabank" bg="#EC111A" color="#ffffff" />
                  </div>
                ) : m.id === "cash" ? (
                  <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                    <BankBadge label="PagoEfectivo" bg="#EC0928" color="#ffffff" />
                    <BankBadge label="Western Union" bg="#FFDD00" color="#000000" />
                  </div>
                ) : m.id === "yape" ? (
                  <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                    <BankBadge label="Yape" bg="#742282" color="#ffffff" />
                    <BankBadge label="Plin" bg="#00BFB3" color="#ffffff" />
                  </div>
                ) : (
                  <div className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">{m.sub}</div>
                )}

              </div>
              <div className={cn(
                "w-4 h-4 rounded-full border-2 shrink-0 transition-colors",
                isSelected
                  ? "border-neutral-700 bg-neutral-700"
                  : "border-neutral-300 dark:border-neutral-600",
              )} />
            </button>




            {isPrimaryCard && m.id === "card" && valid && selected === "card" && showStripe && stripePromise && (
              <div ref={stripeAnchorRef} className="border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 scroll-mt-24">
                {/* Aviso claro: falta 1 paso más (llenar tarjeta y pagar dentro de Stripe) */}
                <div className="px-3 sm:px-4 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 text-[12px] sm:text-sm text-amber-900 dark:text-amber-200 font-medium text-center">
                  ⬇️ {language === "en"
                    ? "Last step: enter your card and press Pay below."
                    : language === "pt"
                      ? "Último passo: digite seu cartão e toque em Pagar abaixo."
                      : language === "fr"
                        ? "Dernière étape : saisis ta carte et appuie sur Payer ci-dessous."
                        : "Último paso: ingresa tu tarjeta y pulsa Pagar aquí abajo."}
                </div>
                {/* Trust row encima del embed */}
                <div className="grid grid-cols-3 gap-1 px-3 sm:px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800 text-[10px] sm:text-[11px] text-neutral-600 dark:text-neutral-300">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-medium">{t.ssl256}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300 text-[8px] font-bold shrink-0">✓</span>
                    <span className="font-medium">{t.stripeVerified}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                    <span className="font-medium">{t.support24h}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <Lock className="w-3.5 h-3.5" /> {t.processedBy}
                </div>
                <div ref={stripeContainerRef} className="relative min-h-[560px] sm:min-h-[500px] bg-white dark:bg-neutral-950 -mx-px">
                  {(stripeLoading || !stripeFrameMounted) && !stripeError && (() => {
                    const isEn = language === "en";
                    const isPt = language === "pt";
                    const isFr = language === "fr";
                    const status =
                      stripeElapsed < 15
                        ? (isEn ? "Opening the secure Stripe form…"
                          : isPt ? "Abrindo o formulário seguro da Stripe…"
                          : isFr ? "Ouverture du formulaire sécurisé Stripe…"
                          : "Abriendo el formulario seguro de Stripe…")
                        : stripeElapsed < 45
                        ? (isEn ? "Still loading… secure connection with Stripe."
                          : isPt ? "Ainda carregando… conexão segura com a Stripe."
                          : isFr ? "Chargement en cours… connexion sécurisée avec Stripe."
                          : "Aún cargando… conexión segura con Stripe.")
                        : stripeElapsed < 75
                        ? (isEn ? "Taking longer than usual. Retrying automatically…"
                          : isPt ? "Está demorando mais que o normal. Tentando novamente…"
                          : isFr ? "Cela prend plus de temps que d’habitude. Nouvelle tentative…"
                          : "Está tardando más de lo normal. Reintentando automáticamente…")
                        : (isEn ? "Almost there… if it doesn't open in a few seconds you can retry."
                          : isPt ? "Quase lá… se não abrir em poucos segundos, você pode tentar de novo."
                          : isFr ? "Presque prêt… si rien ne s’ouvre, tu pourras réessayer."
                          : "Casi listo… si no abre en unos segundos, podrás reintentar.");
                    return (
                      <div className="absolute inset-0 z-10 bg-white dark:bg-neutral-950 px-4 py-6">
                        <div className="flex items-center justify-center gap-2 text-sm text-neutral-700 dark:text-neutral-200 font-medium">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{status}</span>
                        </div>
                        {stripeElapsed >= 5 && (
                          <div className="mt-1 text-center text-[11px] text-neutral-500 dark:text-neutral-400">
                            {stripeElapsed}s
                          </div>
                        )}
                        {stripeElapsed >= 30 && (
                          <div className="mt-3 flex justify-center">
                            <button
                              type="button"
                              onClick={retryStripe}
                              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                            >
                              <Loader2 className="w-3.5 h-3.5" />
                              {isEn ? "Retry now" : isPt ? "Tentar agora" : isFr ? "Réessayer" : "Reintentar ahora"}
                            </button>
                          </div>
                        )}
                        <div className="mx-auto mt-6 max-w-md space-y-3">
                          <div className="h-11 rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
                          <div className="h-11 rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
                          <div className="grid grid-cols-2 gap-3">
                            <div className="h-11 rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
                            <div className="h-11 rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
                          </div>
                          <div className="h-12 rounded-lg bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                        </div>
                      </div>
                    );
                  })()}
                  {stripeError && (
                    <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                      <p className="font-semibold">{stripeError.title}</p>
                      <p className="mt-1 text-xs">{stripeError.message}</p>
                      {stripeError.instructions && stripeError.instructions.length > 0 && (
                        <ol className="mt-2 ml-4 list-decimal space-y-0.5 text-xs">
                          {stripeError.instructions.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      )}
                      <p className="mt-1 text-[10px] opacity-70">
                        {language === "en" ? "Code" : language === "pt" ? "Código" : language === "fr" ? "Code" : "Código"}: {stripeError.code}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {stripeError.retryable && (
                          <button
                            type="button"
                            onClick={retryStripe}
                            className="inline-flex items-center gap-2 rounded-md bg-red-700 px-3 py-2 text-xs font-semibold text-white hover:bg-red-800"
                          >
                            <Loader2 className="w-3.5 h-3.5" />
                            {language === "en" ? "Try again" : language === "pt" ? "Tentar novamente" : language === "fr" ? "Réessayer" : "Intentar de nuevo"}
                          </button>
                        )}
                        <a
                          href={WHATSAPP_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-md bg-[#25D366] px-3 py-2 text-xs font-semibold text-white hover:bg-[#20b858]"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          {language === "en" ? "Contact us on WhatsApp" : language === "pt" ? "Fale conosco no WhatsApp" : language === "fr" ? "Contactez-nous sur WhatsApp" : "Escríbenos por WhatsApp"}
                        </a>
                      </div>
                    </div>
                  )}
                  <EmbeddedCheckoutProvider key={stripeRetryKey} stripe={stripePromise} options={stripeOptions}>
                    <EmbeddedCheckout />
                  </EmbeddedCheckoutProvider>
                </div>
              </div>
            )}


            {m.id === "yape" && isSelected && (
              <div className="border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-4 space-y-4">
                <div className="text-center space-y-1">
                  <p className="text-xs uppercase tracking-wider text-neutral-500">{t.sendPaymentTo}</p>
                  <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{YAPE_NAME}</p>
                  <button
                    type="button"
                    onClick={copyPhone}
                    className="inline-flex items-center gap-2 text-xl font-mono font-bold text-primary hover:opacity-80 transition"
                  >
                    {YAPE_PHONE}
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <p className="text-[11px] text-neutral-500">{copied ? t.copied : t.tapToCopy}</p>
                </div>

                <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800/60 p-3 text-center">
                  <p className="text-xs text-neutral-500">{t.amountToPay}</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{penBadge ?? (local.loading ? `USD $${totalUsd}` : local.formatted)}</p>
                  <p className="text-[11px] text-neutral-500 mt-1">{t.sendEquivalentSoles}</p>
                </div>

                <ol className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1.5 list-decimal list-inside">
                  <li>{t.yapeStep1}</li>
                  <li>{t.yapeStep2(penBadge ?? (local.loading ? `USD $${totalUsd}` : local.formatted), YAPE_PHONE, YAPE_NAME)}</li>
                  <li>{t.yapeStep3}</li>
                  <li>{t.yapeStep4}</li>
                </ol>

                <button
                  type="button"
                  onClick={handleManualPaid}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  {t.alreadyPaid}
                </button>

                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full text-xs text-[#25D366] hover:underline"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> {t.sendReceiptWA}
                </a>

                <p className="text-[11px] text-center text-neutral-500 leading-relaxed">{t.yapeVerifiedBy}</p>
              </div>
            )}

            {m.id === "paypal" && isSelected && (
              <div className="border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-4 space-y-3">
                <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800/60 p-3 text-center">
                  <p className="text-xs text-neutral-500">{t.amountToPay}</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    {local.loading || local.isUsd ? `USD $${totalUsd}` : local.formatted}
                  </p>
                  {!local.isUsd && !local.loading && (
                    <p className="text-[11px] text-neutral-500 mt-1">≈ USD ${totalUsd}</p>
                  )}
                </div>
                <PayPalButtons
                  amountUsd={Number(totalUsd)}
                  localCurrency={local.currency}
                  localAmount={local.amount}
                  description={items.map((i) => i.name).join(" + ").slice(0, 120) || "ILINGUE RELAX"}
                  buyerEmail={buyer.email.trim() || undefined}
                  buyerName={buyer.fullName.trim() || undefined}
                  buyerPhone={buyer.phone || undefined}
                  buyerCountry={(region.country || "").toUpperCase() || undefined}
                  skus={items.map((i) => i.id)}
                  onApproved={(orderId) => {
                    supabase.from("email_contacts").upsert({
                      email: buyer.email.trim().toLowerCase(),
                      name: buyer.fullName.trim(),
                      source: "checkout-prueba-1",
                      metadata: { phone: buyer.phone ?? "", processor: "paypal", orderId },
                    }, { onConflict: "email,source" }).then(() => {});
                    navigate(`/checkouts/success?paypal_order=${encodeURIComponent(orderId)}`);
                  }}
                />

                <p className="text-[11px] text-center text-neutral-500">
                  {language === "en" ? "Secure checkout by PayPal." : language === "pt" ? "Checkout seguro pelo PayPal." : language === "fr" ? "Paiement sécurisé par PayPal." : "Pago seguro procesado por PayPal."}
                </p>
              </div>
            )}
          </div>
        );
      })}

      {!valid && (
        <p className="text-xs text-center text-muted-foreground pt-2">
          {t.enableMethods}
        </p>
      )}

      {selected !== "yape" && selected !== "paypal" && !(selected === "card" && showStripe) && (
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!valid || !selected || mpLoading !== null}
          className={cn(
            "w-full mt-4 py-4 rounded-xl font-bold text-white text-base transition-colors",
            "bg-[hsl(142,72%,42%)] hover:bg-[hsl(142,72%,36%)]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "flex items-center justify-center gap-2",
          )}
        >
          {mpLoading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> {t.redirecting}</>
          ) : selected === "card" ? (
            <><Lock className="w-4 h-4" /> {language === "en"
              ? "Continue to payment"
              : language === "pt"
                ? "Continuar para pagamento"
                : language === "fr"
                  ? "Continuer vers le paiement"
                  : "Continuar de Pago"}</>
          ) : (
            <><Lock className="w-4 h-4" /> {t.buyNow}</>
          )}
        </button>
      )}
    </div>
  );
}

