import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CheckCircle2, Mail, MessageCircle, ShoppingBag, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCheckoutPruebaStore, calcTotals, itemPrice } from "@/stores/checkoutPruebaStore";
import { useRegionTier } from "@/hooks/useRegionTier";

export default function CheckoutSuccess() {
  const [sp] = useSearchParams();
  const paymentId = sp.get("payment_id") || sp.get("collection_id") || sp.get("session_id");
  const status = sp.get("status") || sp.get("collection_status") || "approved";
  const externalRef = sp.get("external_reference") || sp.get("preference_id");

  const { items, buyer, couponPercent, coupon, clear } = useCheckoutPruebaStore();
  const region = useRegionTier();
  const { subtotal, discount, total } = calcTotals(items, couponPercent, region.tier);

  // Snapshot cart before clearing (Shopify-style: order confirmation shows what was bought)
  useEffect(() => {
    const timer = setTimeout(() => clear(), 500);
    return () => clearTimeout(timer);
  }, [clear]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Thanks for your purchase · ILINGUE RELAX</title>
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
            {paymentId ? `Order #${String(paymentId).slice(-8).toUpperCase()}` : "Order confirmed"}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold">Thanks{buyer.fullName ? `, ${buyer.fullName.split(" ")[0]}` : ""}!</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your order is confirmed. We've sent a confirmation email {buyer.email && <>to <strong>{buyer.email}</strong></>} with your download links and receipt.
          </p>
        </section>

        {/* What's next */}
        <section className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-base">What's next?</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3">
              <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Check your inbox</div>
                <div className="text-muted-foreground">Your download links arrive in 1-5 minutes. Check spam if you don't see it.</div>
              </div>
            </li>
            <li className="flex gap-3">
              <Package className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Access your product</div>
                <div className="text-muted-foreground">Follow the link in the email to unlock your materials.</div>
              </div>
            </li>
            <li className="flex gap-3">
              <MessageCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Need help?</div>
                <div className="text-muted-foreground">
                  Message us on{" "}
                  <a
                    href="https://wa.me/15752160934"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    WhatsApp +1 575 216 0934
                  </a>
                </div>
              </div>
            </li>
          </ul>
        </section>

        {/* Order summary */}
        {items.length > 0 && (
          <section className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="font-semibold text-base">Order summary</h2>
            <ul className="divide-y">
              {items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-3">
                  <img src={i.image} alt={i.name} className="w-14 h-14 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{i.name}</div>
                    <div className="text-xs text-muted-foreground">Qty {i.quantity}</div>
                  </div>
                  <div className="text-sm font-medium">${(itemPrice(i, region.tier) * i.quantity).toFixed(2)}</div>
                </li>
              ))}
            </ul>
            <div className="space-y-1 text-sm border-t pt-3">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount {coupon && `(${coupon})`}</span><span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1">
                <span>Total paid</span><span>${total.toFixed(2)} USD</span>
              </div>
            </div>
          </section>
        )}

        {/* Payment reference */}
        {(paymentId || externalRef) && (
          <details className="rounded-lg border bg-muted/30 p-3 text-xs">
            <summary className="cursor-pointer text-muted-foreground font-medium">Payment reference</summary>
            <div className="mt-2 space-y-1 text-muted-foreground">
              {paymentId && <div>ID: <code className="break-all">{paymentId}</code></div>}
              {status && <div>Status: <code>{status}</code></div>}
              {externalRef && <div>Ref: <code className="break-all">{externalRef}</code></div>}
            </div>
          </details>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild size="lg" className="gap-2">
            <Link to="/"><ShoppingBag className="w-4 h-4" /> Continue shopping</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="https://wa.me/15752160934" target="_blank" rel="noopener noreferrer">Contact support</a>
          </Button>
        </div>
      </main>
    </div>
  );
}
