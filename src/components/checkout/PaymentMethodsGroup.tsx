import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Building2, Banknote, Loader2, Lock, Smartphone, Copy, Check, MessageCircle, Wallet } from "lucide-react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { useCheckoutPruebaStore, calcTotals, itemPrice } from "@/stores/checkoutPruebaStore";
import { useRegionTier } from "@/hooks/useRegionTier";
import { useLocalCurrency } from "@/hooks/useLocalCurrency";

import { isBuyerValid, BUYER_ERRORS_EVENT } from "@/components/checkout/BuyerInfoForm";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nContext";
import { getCheckoutUI } from "@/i18n/checkoutUI";
import { PayPalButtons } from "@/components/checkout/PayPalButtons";

type Method = "card" | "paypal" | "transfer" | "cash" | "yape";
const YAPE_PHONE = "972119741";
const YAPE_NAME = "Carmen Aliaga Manuel";
const WHATSAPP_URL = "https://wa.link/unpa9n";

export function PaymentMethodsGroup() {
  const navigate = useNavigate();
  const { items, buyer, coupon, couponPercent } = useCheckoutPruebaStore();
  const region = useRegionTier();
  const { language } = useI18n();
  const t = getCheckoutUI(language);
  const { total } = calcTotals(items, couponPercent, region.tier);
  const totalUsd = total.toFixed(2);
  const local = useLocalCurrency(total);
  // Badge principal: SIEMPRE en moneda local del país (USD, CAD, EUR, MXN, ARS, PEN, etc.)
  const priceBadge = local.loading ? `USD $${totalUsd}` : local.formatted;
  const localBadge = "";


  const [selected, setSelected] = useState<Method | null>(null);
  const [mpLoading, setMpLoading] = useState<Method | null>(null);
  const [showStripe, setShowStripe] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [stripeRetryKey, setStripeRetryKey] = useState(0);
  const [stripeFrameMounted, setStripeFrameMounted] = useState(false);
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
      const { data, error } = await supabase.functions.invoke("create-checkout-prueba", {
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
      });
      if (error || !data?.clientSecret) throw new Error(error?.message || t.errorPayment);
      supabase.from("email_contacts").upsert({
        email: s.buyer.email.trim().toLowerCase(),
        name: s.buyer.fullName.trim(),
        source: "checkout-prueba-1",
        metadata: { phone: s.buyer.phone ?? "", processor: "stripe" },
      }, { onConflict: "email,source" }).then(() => {});
      return data.clientSecret;
    } catch (err) {
      const message = err instanceof Error ? err.message : t.errorPayment;
      setStripeError(message);
      throw err;
    } finally {
      setStripeLoading(false);
    }
    // Depend only on region.tier/country — buyer/items are read fresh from
    // the store inside the callback, so the reference stays stable across
    // typing and avoids remounting the EmbeddedCheckoutProvider (blank screen).
  }, [region.tier, region.country]);

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

      const { data, error } = await supabase.functions.invoke("create-mercadopago-preference", {
        body: {
          orderId: `ilr-prueba-${Date.now()}`,
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
      });
      if (error || !data?.init_point) throw new Error(error?.message || t.mpError);
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

  const retryStripe = () => {
    setStripeError(null);
    setStripeLoading(false);
    setStripeFrameMounted(false);
    setStripeRetryKey((k) => k + 1);
  };

  useEffect(() => {
    if (!(showStripe && selected === "card")) return;
    setStripeFrameMounted(false);
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
    const timeout = window.setTimeout(() => {
      if (!markMounted()) {
        setStripeError(
          language === "en"
            ? "The secure card form is taking too long to open."
            : language === "pt"
              ? "O formulário seguro de cartão está demorando para abrir."
              : language === "fr"
                ? "Le formulaire sécurisé de carte met trop de temps à s’ouvrir."
                : "El formulario seguro de tarjeta está tardando demasiado en abrir.",
        );
      }
    }, 25000);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, [showStripe, selected, stripeRetryKey, language]);

  const handleManualPaid = () => {
    const s = useCheckoutPruebaStore.getState();
    supabase.from("email_contacts").upsert({
      email: s.buyer.email.trim().toLowerCase(),
      name: s.buyer.fullName.trim(),
      source: "checkout-prueba-1",
      metadata: { phone: s.buyer.phone ?? "", processor: "manual", paymentType: "yape_plin" },
    }, { onConflict: "email,source" }).then(() => {});
    navigate("/checkouts/pendiente-manual");
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
  const cardBrandsByCountry = (c: string): string[] => {
    // Base universal
    const base = ["Visa", "Mastercard", "Amex", "Apple Pay", "Google Pay", "Link"];
    // USA / Canadá
    if (["US", "CA"].includes(c)) return [...base, "Discover"];
    // Europa (Cash App no aplica; añadimos wallets locales relevantes)
    if (["ES","FR","DE","IT","PT","NL","BE","IE","GB","UK","AT","FI","LU","DK","SE","NO","PL","CH"].includes(c)) {
      return ["Visa", "Mastercard", "Amex", "Apple Pay", "Google Pay", "Link", "Klarna"];
    }
    // Asia / Angloparlantes (AU/NZ/SG/HK/JP)
    if (["AU","NZ","SG","HK","JP","KR"].includes(c)) return base;
    return base;
  };
  const cardBrands = cardBrandsByCountry(country);
  const cardSubtitle = isPeru
    ? t.cardSubtitlePeru(localBadge)
    : t.cardSubtitleGlobal(local.currency || (language === "en" ? "your local currency" : language === "pt" ? "sua moeda local" : language === "fr" ? "votre monnaie locale" : "tu moneda local"), localBadge);

  const allMethods: { id: Method; icon: typeof CreditCard; title: string; sub: string; badge?: string }[] = [
    { id: "card", icon: CreditCard, title: isPeru ? t.cardTitlePeru : t.cardTitleGlobal, sub: cardSubtitle, badge: "Stripe" },
    { id: "paypal", icon: Wallet, title: "PayPal", sub: language === "en" ? "Pay with your PayPal balance or linked card." : language === "pt" ? "Pague com seu saldo PayPal ou cartão vinculado." : language === "fr" ? "Payez avec votre solde PayPal ou carte liée." : "Paga con tu saldo PayPal o tarjeta vinculada.", badge: priceBadge },
    { id: "transfer", icon: Building2, title: t.bankTransfer, sub: t.bankTransferSub(localBadge), badge: priceBadge },
    { id: "cash", icon: Banknote, title: t.cashPayment, sub: t.cashPaymentSub(localBadge), badge: priceBadge },
    { id: "yape", icon: Smartphone, title: t.yapePlin, sub: t.yapePlinSub, badge: priceBadge },
  ];
  // PayPal disponible en todo el mundo EXCEPTO Perú (allí solo rails locales + Stripe).
  const methods = isPeru
    ? allMethods.filter((m) => m.id !== "paypal")
    : allMethods.filter((m) => m.id === "card" || m.id === "paypal");

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

  const isFree = total <= 0 && items.length > 0;
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

      {!isFree && methods.map((m) => {
        const isSelected = valid && selected === m.id;
        const isLoading = mpLoading === m.id;
        const Icon = m.icon;
        return (
          <div
            key={m.id}
            className={cn(
              "rounded-xl border overflow-hidden transition-colors",
              isSelected
                ? "border-neutral-400 bg-neutral-100 dark:bg-neutral-800/60"
                : "border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/40",
            )}
          >
            <button
              type="button"
              onClick={() => handleSelect(m.id)}
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
                <div className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">{m.sub}</div>
              </div>
              <div className={cn(
                "w-4 h-4 rounded-full border-2 shrink-0 transition-colors",
                isSelected
                  ? "border-neutral-700 bg-neutral-700"
                  : "border-neutral-300 dark:border-neutral-600",
              )} />
            </button>

            {/* Strip visual de marcas — visible SIEMPRE en la tarjeta de "card",
                también cuando el embed aún no se abrió. Da confianza inmediata
                al reconocer Visa/Mastercard/Apple Pay/etc. */}
            {m.id === "card" && (
              <div className="border-t border-neutral-200 dark:border-neutral-700 bg-white/60 dark:bg-neutral-900/60 px-3 sm:px-4 py-2.5 flex flex-wrap items-center gap-1.5">
                {cardBrands.map((b) => (
                  <span
                    key={b}
                    className="text-[10px] font-semibold px-2 py-1 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 shadow-sm"
                  >
                    {b}
                  </span>
                ))}
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 ml-auto whitespace-nowrap">
                  {t.autoActivatesByCountry}
                </span>
              </div>
            )}

            {m.id === "card" && isSelected && showStripe && stripePromise && (
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
                  {(stripeLoading || !stripeFrameMounted) && !stripeError && (
                    <div className="absolute inset-0 z-10 bg-white dark:bg-neutral-950 px-4 py-6">
                      <div className="flex items-center justify-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {language === "en"
                          ? "Opening the secure Stripe form…"
                          : language === "pt"
                            ? "Abrindo o formulário seguro da Stripe…"
                            : language === "fr"
                              ? "Ouverture du formulaire sécurisé Stripe…"
                              : "Abriendo el formulario seguro de Stripe…"}
                      </div>
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
                  )}
                  {stripeError && (
                    <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                      <p className="font-semibold">
                        {language === "en" ? "Stripe did not load." : language === "pt" ? "Stripe não carregou." : language === "fr" ? "Stripe n’a pas chargé." : "Stripe no cargó."}
                      </p>
                      <p className="mt-1 text-xs">{stripeError}</p>
                      <button
                        type="button"
                        onClick={retryStripe}
                        className="mt-3 inline-flex items-center gap-2 rounded-md bg-red-700 px-3 py-2 text-xs font-semibold text-white hover:bg-red-800"
                      >
                        <Loader2 className="w-3.5 h-3.5" />
                        {language === "en" ? "Try again" : language === "pt" ? "Tentar novamente" : language === "fr" ? "Réessayer" : "Intentar de nuevo"}
                      </button>
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
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{local.loading ? `USD $${totalUsd}` : local.formatted}</p>
                  <p className="text-[11px] text-neutral-500 mt-1">{t.sendEquivalentSoles}</p>
                </div>

                <ol className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1.5 list-decimal list-inside">
                  <li>{t.yapeStep1}</li>
                  <li>{t.yapeStep2(totalUsd, YAPE_PHONE, YAPE_NAME)}</li>
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

