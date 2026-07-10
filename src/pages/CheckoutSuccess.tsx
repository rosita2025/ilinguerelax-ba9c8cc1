import { useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CheckCircle2, Mail, MessageCircle, ShoppingBag, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCheckoutPruebaStore, calcTotals, itemPrice } from "@/stores/checkoutPruebaStore";
import { useRegionTier } from "@/hooks/useRegionTier";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n/I18nContext";
import { getCheckoutStrings } from "@/i18n/checkoutStatus";

export default function CheckoutSuccess() {
  const [sp] = useSearchParams();
  const paymentId = sp.get("payment_id") || sp.get("collection_id") || sp.get("session_id");
  const status = sp.get("status") || sp.get("collection_status") || "approved";
  const externalRef = sp.get("external_reference") || sp.get("preference_id");
  const paypalToken = sp.get("token") || sp.get("PayerID");
  const provider = sp.get("session_id")
    ? "stripe"
    : paypalToken
    ? "paypal"
    : sp.get("payment_id") || sp.get("collection_id")
    ? "mercadopago"
    : "unknown";

  const { items, buyer, couponPercent, coupon, clear } = useCheckoutPruebaStore();
  const region = useRegionTier();
  const { subtotal, discount, total } = calcTotals(items, couponPercent, region.tier);
  const sentRef = useRef(false);
  const { language } = useI18n();
  const t = getCheckoutStrings(language);

  // Gate: only real buyers from Stripe or PayPal should see the confirmation.
  // A visitor without a valid payment reference OR without buyer info in the
  // session store is treated as public/unknown and gets a neutral screen.
  const hasPaymentRef = Boolean(paymentId || externalRef || paypalToken);
  const hasBuyerContext = Boolean(buyer.email) && items.length > 0;
  const isVerifiedBuyer =
    hasPaymentRef &&
    hasBuyerContext &&
    (provider === "stripe" || provider === "paypal" || provider === "mercadopago") &&
    status !== "rejected" && status !== "failure";

  // Send confirmation email once, then clear the cart
  useEffect(() => {
    if (sentRef.current) return;
    if (!buyer.email || items.length === 0) return;
    const key = `order-email-sent:${paymentId || externalRef || buyer.email}`;
    if (sessionStorage.getItem(key)) {
      const t = setTimeout(() => clear(), 500);
      return () => clearTimeout(t);
    }
    sentRef.current = true;
    sessionStorage.setItem(key, "1");

    supabase.functions
      .invoke("send-order-confirmation", {
        body: {
          customerEmail: buyer.email,
          customerName: buyer.fullName,
          orderId: paymentId || externalRef || undefined,
          total,
          currency: "USD",
          paymentProvider: sp.get("session_id") ? "stripe" : sp.get("payment_id") ? "mercadopago" : "unknown",
          items: items.map((i) => ({
            id: i.id,
            name: i.name,
            quantity: i.quantity,
            price: itemPrice(i, region.tier),
            image: i.image,
          })),
        },
      })
      .catch((e) => console.error("send-order-confirmation failed", e))
      .finally(() => {
        setTimeout(() => clear(), 800);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{t.metaSuccess}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <header className="border-b bg-background/95">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            to="/"
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            ILINGUE <span className="text-primary">RELAX</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* Hero confirmation */}
        <section className="text-center space-y-3">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-11 h-11 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm text-muted-foreground uppercase tracking-wider">
            {paymentId ? `${t.orderNumber} #${String(paymentId).slice(-8).toUpperCase()}` : t.orderConfirmed}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold">
            {t.thanks(buyer.fullName ? buyer.fullName.split(" ")[0] : undefined)}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t.successIntro(buyer.email || undefined)}
          </p>
        </section>

        {/* What's next */}
        <section className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-base">{t.whatsNext}</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3">
              <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">{t.checkInbox}</div>
                <div className="text-muted-foreground">{t.checkInboxDesc}</div>
              </div>
            </li>
            <li className="flex gap-3">
              <Package className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">{t.accessProduct}</div>
                <div className="text-muted-foreground">{t.accessProductDesc}</div>
              </div>
            </li>
            <li className="flex gap-3">
              <MessageCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">{t.needHelp}</div>
                <div className="text-muted-foreground">
                  {t.messageUsOn}{" "}
                  <a
                    href="https://wa.me/112512724704"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    WhatsApp +1 251 272 4704
                  </a>
                </div>
              </div>
            </li>
          </ul>
        </section>

        {/* Order summary */}
        {items.length > 0 && (
          <section className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="font-semibold text-base">{t.orderSummary}</h2>
            <ul className="divide-y">
              {items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-3">
                  <img src={i.image} alt={i.name} className="w-14 h-14 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{i.name}</div>
                    <div className="text-xs text-muted-foreground">{t.qty} {i.quantity}</div>
                  </div>
                  <div className="text-sm font-medium">${(itemPrice(i, region.tier) * i.quantity).toFixed(2)}</div>
                </li>
              ))}
            </ul>
            <div className="space-y-1 text-sm border-t pt-3">
              <div className="flex justify-between text-muted-foreground">
                <span>{t.subtotal}</span><span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t.discount} {coupon && `(${coupon})`}</span><span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1">
                <span>{t.totalPaid}</span><span>${total.toFixed(2)} USD</span>
              </div>
            </div>
          </section>
        )}

        {/* Payment reference */}
        {(paymentId || externalRef) && (
          <details className="rounded-lg border bg-muted/30 p-3 text-xs">
            <summary className="cursor-pointer text-muted-foreground font-medium">{t.paymentReference}</summary>
            <div className="mt-2 space-y-1 text-muted-foreground">
              {paymentId && <div>{t.paymentId}: <code className="break-all">{paymentId}</code></div>}
              {status && <div>{t.paymentStatus}: <code>{status}</code></div>}
              {externalRef && <div>{t.paymentRef}: <code className="break-all">{externalRef}</code></div>}
            </div>
          </details>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild size="lg" className="gap-2">
            <Link to="/"><ShoppingBag className="w-4 h-4" /> {t.continueShopping}</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="https://wa.me/112512724704" target="_blank" rel="noopener noreferrer">{t.contactSupport}</a>
          </Button>
        </div>
      </main>
    </div>
  );
}
