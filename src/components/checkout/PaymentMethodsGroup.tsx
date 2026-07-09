import { useEffect, useRef, useState } from "react";
import { CreditCard, Building2, Smartphone, Loader2, Lock } from "lucide-react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { useCheckoutPruebaStore, calcTotals, itemPrice } from "@/stores/checkoutPruebaStore";
import { useRegionTier } from "@/hooks/useRegionTier";
import { isBuyerValid, BUYER_ERRORS_EVENT } from "@/components/checkout/BuyerInfoForm";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Method = "card" | "transfer" | "yape";
const USD_TO_PEN = 3.75;

export function PaymentMethodsGroup() {
  const { items, buyer, coupon, couponPercent } = useCheckoutPruebaStore();
  const region = useRegionTier();
  const { total } = calcTotals(items, couponPercent, region.tier);
  const totalPen = (total * USD_TO_PEN).toFixed(2);

  const [selected, setSelected] = useState<Method | null>(null);
  const [mpLoading, setMpLoading] = useState<Method | null>(null);
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
      if (selected === "card") setSelected(null);
    }
  }, [cartSignature, selected]);

  const fetchClientSecret = async (): Promise<string> => {
    const s = useCheckoutPruebaStore.getState();
    if (!isBuyerValid(s.buyer)) throw new Error("Completa tus datos");
    const parts = s.buyer.fullName.trim().split(/\s+/);
    const firstName = parts[0].slice(0, 50);
    const lastName = (parts.slice(1).join(" ") || parts[0]).slice(0, 50);
    const { data, error } = await supabase.functions.invoke("create-checkout-prueba", {
      body: {
        environment: getStripeEnvironment(),
        items: s.items.map((i) => ({
          id: i.id, name: i.name, price: itemPrice(i, region.tier),
          quantity: i.quantity, image: i.image, description: i.description,
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
  };

  const requestBuyerInfo = () => {
    window.dispatchEvent(new Event(BUYER_ERRORS_EVENT));
    toast({
      title: "Completa tus datos primero",
      description: "Ingresa tu nombre y correo para continuar con el pago.",
      variant: "destructive",
    });
  };

  const payMercado = async (paymentType: "yape" | "transfer") => {
    if (!valid) { requestBuyerInfo(); return; }
    if (redirectingRef.current) return;
    const s = useCheckoutPruebaStore.getState();
    const totals = calcTotals(s.items, s.couponPercent, region.tier);
    redirectingRef.current = true;
    setMpLoading(paymentType === "yape" ? "yape" : "transfer");
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
          items: s.items.map((i) => ({
            id: i.id, name: i.name, price: itemPrice(i, region.tier),
            quantity: i.quantity, image: i.image, description: i.description,
          })),
          couponPercent: s.couponPercent,
          couponCode: s.coupon ?? undefined,
          payerEmail: s.buyer.email.trim(),
          payerName: s.buyer.fullName.trim(),
          payerPhone: s.buyer.phone ?? undefined,
          usdToPen: USD_TO_PEN,
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
    if (m === "yape") payMercado("yape");
    if (m === "transfer") payMercado("transfer");
  };

  const methods: { id: Method; icon: typeof CreditCard; title: string; sub: string; badge?: string }[] = [
    { id: "card", icon: CreditCard, title: "Tarjeta de crédito o débito", sub: "Visa · Mastercard · Amex · PayPal · Apple Pay · Google Pay", badge: "Stripe" },
    { id: "transfer", icon: Building2, title: "Transferencias bancarias", sub: "BCP · BBVA · Interbank · Scotiabank y más", badge: `S/ ${totalPen}` },
    { id: "yape", icon: Smartphone, title: "Yape o Plin", sub: "Paga escaneando el QR desde tu app", badge: `S/ ${totalPen}` },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Elige tu método de pago
      </h2>

      {methods.map((m) => {
        const isSelected = valid && selected === m.id;
        const isLoading = mpLoading === m.id;
        const Icon = m.icon;
        return (
          <div key={m.id} className="rounded-xl border bg-background overflow-hidden">
            <button
              type="button"
              onClick={() => handleSelect(m.id)}
              disabled={isLoading}
              aria-disabled={!valid}
              className={cn(
                "w-full text-left p-4 flex items-center gap-3 transition-colors",
                isSelected ? "bg-primary/5" : "hover:bg-muted/40",
                !valid && "cursor-not-allowed",
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-primary",
              )}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm flex items-center gap-2">
                  {m.title}
                  {m.badge && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {m.badge}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">{m.sub}</div>
              </div>
              <div className={cn(
                "w-4 h-4 rounded-full border-2 shrink-0",
                isSelected ? "border-primary bg-primary" : "border-muted-foreground/30",
              )} />
            </button>

            {m.id === "card" && isSelected && stripePromise && (
              <div className="border-t bg-muted/20">
                <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
                  <Lock className="w-3.5 h-3.5" /> Pago procesado de forma segura por Stripe
                </div>
                <div className="min-h-[500px] bg-background">
                  <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
                    <EmbeddedCheckout />
                  </EmbeddedCheckoutProvider>
                </div>
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
    </div>
  );
}
