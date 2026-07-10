import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { XCircle, MessageCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nContext";
import { getCheckoutStrings } from "@/i18n/checkoutStatus";

export default function CheckoutFailure() {
  const [sp] = useSearchParams();
  const status = sp.get("status") || sp.get("collection_status");
  const paymentId = sp.get("payment_id") || sp.get("collection_id");
  const { language } = useI18n();
  const t = getCheckoutStrings(language);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{t.metaFailure}</title>
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
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
          <XCircle className="w-11 h-11 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-3xl font-bold">{t.paymentNotCompleted}</h1>
        <p className="text-muted-foreground">{t.failureDesc}</p>

        {(status || paymentId) && (
          <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 text-left space-y-1">
            {status && <div>{t.paymentStatus}: <code>{status}</code></div>}
            {paymentId && <div>{t.paymentId}: <code className="break-all">{paymentId}</code></div>}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild size="lg" className="gap-2">
            <Link to="/checkouts/prueba-1"><RefreshCcw className="w-4 h-4" /> {t.tryAgain}</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <a href="https://wa.me/112512724704" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-4 h-4" /> {t.contactSupport}
            </a>
          </Button>
        </div>
      </main>
    </div>
  );
}
