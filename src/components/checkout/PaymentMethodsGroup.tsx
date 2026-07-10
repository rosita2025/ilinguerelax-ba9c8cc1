import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Building2, Banknote, Loader2, Lock, Smartphone, Copy, Check, MessageCircle } from "lucide-react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { useCheckoutPruebaStore, calcTotals, itemPrice } from "@/stores/checkoutPruebaStore";
import { useRegionTier } from "@/hooks/useRegionTier";
import { useLocalCurrency } from "@/hooks/useLocalCurrency";

import { isBuyerValid, BUYER_ERRORS_EVENT } from "@/components/checkout/BuyerInfoForm";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Method = "card" | "transfer" | "cash" | "yape";
const YAPE_PHONE = "972119741";
const YAPE_NAME = "Carmen Aliaga Manuel";
const WHATSAPP_URL = "https://wa.link/unpa9n";

export function PaymentMethodsGroup() {
  const navigate = useNavigate();
  const { items, buyer, coupon, couponPercent } = useCheckoutPruebaStore();
  const region = useRegionTier();
  const { total } = calcTotals(items, couponPercent, region.tier);
  const totalUsd = total.toFixed(2);
  const local = useLocalCurrency(total);
  // Badge principal: moneda local si el país no usa USD; si usa USD, muestra USD.
  const priceBadge = local.loading
    ? `USD $${totalUsd}`
    : local.isUsd
      ? `USD $${totalUsd}`
      : `${local.formatted} · USD $${totalUsd}`;
  const localBadge = !local.isUsd && !local.loading ? ` · ≈ ${local.formatted}` : "";


  const [selected, setSelected] = useState<Method | null>(null);
  const [mpLoading, setMpLoading] = useState<Method | null>(null);
  const [showStripe, setShowStripe] = useState(false);
  const [copied, setCopied] = useState(false);
  const redirectingRef = useRef(false);
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
    if (!isBuyerValid(s.buyer)) throw new Error("Completa tus datos");
    const parts = s.buyer.fullName.trim().split(/\s+/);
    const firstName = parts[0].slice(0, 50);
    const lastName = (parts.slice(1).join(" ") || parts[0]).slice(0, 50);
    const toAbsUrl = (u?: string) => {
      if (!u) return undefined;
      if (/^https?:\/\//i.test(u)) return u;
      try { return new URL(u, window.location.origin).toString(); } catch { return undefined; }
    };
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
    if (error || !data?.clientSecret) throw new Error(error?.message || "Error de pago");
    supabase.from("email_contacts").upsert({
      email: s.buyer.email.trim().toLowerCase(),
      name: s.buyer.fullName.trim(),
      source: "checkout-prueba-1",
      metadata: { phone: s.buyer.phone ?? "", processor: "stripe" },
    }, { onConflict: "email,source" }).then(() => {});
    return data.clientSecret;
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
      title: "Completa tus datos primero",
      description: "Ingresa tu nombre y correo para continuar con el pago.",
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
      if (error || !data?.init_point) throw new Error(error?.message || "No se pudo crear la preferencia");
      window.location.assign(data.init_point);
    } catch (err) {
      redirectingRef.current = false;
      setMpLoading(null);
      toast({
        title: "Error Mercado Pago",
        description: err instanceof Error ? err.message : "Intenta de nuevo",
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
      toast({ title: "Selecciona un método de pago", variant: "destructive" });
      return;
    }
    if (selected === "card") { setShowStripe(true); return; }
    if (selected === "transfer") { payMercado("transfer"); return; }
    if (selected === "cash") { payMercado("cash"); return; }
    // yape → user uses "Ya pagué" button in the manual panel
  };

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
    ? `Visa · Mastercard · Amex · Apple Pay · Link · Cobro en tu moneda local${localBadge}`
    : `Débito o crédito · Apple Pay · Google Pay · Link · Cobro en ${local.currency || "tu moneda local"}${localBadge}`;

  const allMethods: { id: Method; icon: typeof CreditCard; title: string; sub: string; badge?: string }[] = [
    { id: "card", icon: CreditCard, title: isPeru ? "Tarjeta, Apple Pay o Link" : "Tarjeta débito o crédito", sub: cardSubtitle, badge: "Stripe" },
    { id: "transfer", icon: Building2, title: "Transferencia bancaria", sub: `BCP · BBVA · Interbank · Scotiabank · Conversión automática${localBadge}`, badge: priceBadge },
    { id: "cash", icon: Banknote, title: "Pago en efectivo", sub: `PagoEfectivo · Western Union · Tambo · Kasnet${localBadge}`, badge: priceBadge },
    { id: "yape", icon: Smartphone, title: "Yape o Plin", sub: "Pago manual · Verificación 1-24h por Supervisora Rosa", badge: priceBadge },
  ];
  const methods = isPeru ? allMethods : allMethods.filter((m) => m.id === "card");

  // Fuera de Perú solo hay un método (Stripe). Auto-seleccionarlo y auto-abrir
  // el formulario embebido en cuanto el comprador completa sus datos, para
  // reducir clics y maximizar conversión (adultos mayores, jóvenes, adultos).
  useEffect(() => {
    if (!isPeru) {
      if (selected !== "card") setSelected("card");
      if (valid && stripePromise && !showStripe) setShowStripe(true);
    }
  }, [isPeru, selected, valid, stripePromise, showStripe]);


  const wasValidRef = useRef(valid);
  const methodsAnchorRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!wasValidRef.current && valid) {
      methodsAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    wasValidRef.current = valid;
  }, [valid]);

  return (
    <div id="payment-methods" ref={methodsAnchorRef} className="space-y-3 scroll-mt-24">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {isPeru ? "Elige tu método de pago" : "Pago con tarjeta"}
      </h2>

      {methods.map((m) => {
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

            {m.id === "card" && isSelected && showStripe && stripePromise && (
              <div className="border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950">
                <div className="flex items-center gap-2 px-4 py-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <Lock className="w-3.5 h-3.5" /> Pago procesado de forma segura por Stripe
                </div>
                <div className="min-h-[560px] sm:min-h-[500px] bg-white dark:bg-neutral-950 -mx-px">
                  <EmbeddedCheckoutProvider stripe={stripePromise} options={stripeOptions}>
                    <EmbeddedCheckout />
                  </EmbeddedCheckoutProvider>
                </div>
              </div>
            )}

            {m.id === "yape" && isSelected && (
              <div className="border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-4 space-y-4">
                <div className="text-center space-y-1">
                  <p className="text-xs uppercase tracking-wider text-neutral-500">Envía el pago a</p>
                  <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{YAPE_NAME}</p>
                  <button
                    type="button"
                    onClick={copyPhone}
                    className="inline-flex items-center gap-2 text-xl font-mono font-bold text-primary hover:opacity-80 transition"
                  >
                    {YAPE_PHONE}
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <p className="text-[11px] text-neutral-500">{copied ? "¡Copiado!" : "Toca para copiar el número"}</p>
                </div>

                <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800/60 p-3 text-center">
                  <p className="text-xs text-neutral-500">Monto a pagar</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">USD ${totalUsd}</p>
                  <p className="text-[11px] text-neutral-500 mt-1">Envía el equivalente en soles al tipo de cambio del día.</p>
                </div>

                <ol className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1.5 list-decimal list-inside">
                  <li>Abre tu app de <strong>Yape</strong> o <strong>Plin</strong>.</li>
                  <li>Envía el equivalente de <strong>USD ${totalUsd}</strong> en soles al número <strong>{YAPE_PHONE}</strong> ({YAPE_NAME}).</li>
                  <li>Guarda la captura del comprobante.</li>
                  <li>Presiona <strong>“Ya pagué”</strong> y envíanos el comprobante por WhatsApp.</li>
                </ol>

                <button
                  type="button"
                  onClick={handleManualPaid}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Ya pagué → Enviar comprobante
                </button>

                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full text-xs text-[#25D366] hover:underline"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Enviar comprobante directo por WhatsApp
                </a>

                <p className="text-[11px] text-center text-neutral-500 leading-relaxed">
                  Nuestra <strong>Supervisora Rosa</strong> revisa los pagos manualmente desde Perú.
                  Recibirás tu producto en <strong>1 a 24 horas</strong> tras confirmar el comprobante.
                </p>
              </div>
            )}
          </div>
        );
      })}

      {!valid && (
        <p className="text-xs text-center text-muted-foreground pt-2">
          👆 Completa tu nombre y correo arriba para habilitar los métodos de pago.
        </p>
      )}

      {selected !== "yape" && !(selected === "card" && showStripe) && (
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
            <><Loader2 className="w-5 h-5 animate-spin" /> Redirigiendo…</>
          ) : (
            <><Lock className="w-4 h-4" /> Comprar ahora</>
          )}
        </button>
      )}
    </div>
  );
}

