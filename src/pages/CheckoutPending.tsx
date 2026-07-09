import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Clock, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutPending() {
  const [sp] = useSearchParams();
  const paymentId = sp.get("payment_id") || sp.get("collection_id");
  const status = sp.get("status") || sp.get("collection_status");

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Payment pending · ILINGUE RELAX</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <header className="border-b bg-background/95">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link to="/" className="text-xl font-bold tracking-tight" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            ILINGUE <span className="text-primary">RELAX</span>
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
          <Clock className="w-11 h-11 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-3xl font-bold">Payment pending</h1>
        <p className="text-muted-foreground">
          Your payment is being processed (PagoEfectivo, bank transfer, or another offline method).
          We'll email you the moment it's confirmed — usually within 1-24 hours.
        </p>

        <div className="rounded-xl border bg-card p-4 text-left text-sm space-y-2">
          <div className="flex gap-3">
            <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="font-medium">Confirmation email</div>
              <div className="text-muted-foreground text-xs">You'll receive your download link automatically after confirmation.</div>
            </div>
          </div>
          <div className="flex gap-3">
            <MessageCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="font-medium">Faster? Send us the receipt</div>
              <div className="text-muted-foreground text-xs">
                Message on{" "}
                <a href="https://wa.me/15752160934" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  WhatsApp +1 575 216 0934
                </a>
              </div>
            </div>
          </div>
        </div>

        {(status || paymentId) && (
          <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 text-left space-y-1">
            {status && <div>Status: <code>{status}</code></div>}
            {paymentId && <div>Payment ID: <code className="break-all">{paymentId}</code></div>}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild size="lg"><Link to="/">Back to home</Link></Button>
          <Button asChild variant="outline" size="lg">
            <a href="https://wa.me/15752160934" target="_blank" rel="noopener noreferrer">WhatsApp support</a>
          </Button>
        </div>
      </main>
    </div>
  );
}
