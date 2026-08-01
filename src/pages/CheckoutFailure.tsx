import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { XCircle, MessageCircle, RefreshCcw, ShieldAlert, Clock, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nContext";
import { getCheckoutStrings } from "@/i18n/checkoutStatus";
import { mapStripeError, type Lang as StripeLang } from "@/lib/stripeErrorMap";
import { isDlocalCode, mapDlocalStatus } from "@/lib/dlocalErrorMap";

export default function CheckoutFailure() {
  const [sp] = useSearchParams();
  const status = sp.get("status") || sp.get("collection_status");
  const paymentId = sp.get("payment_id") || sp.get("collection_id");
  const order = sp.get("order");
  const reason = sp.get("reason");
  const { language } = useI18n();
  const t = getCheckoutStrings(language);

  // dLocal: estado real de la transacción traducido a un mensaje claro.
  const dlocal = isDlocalCode(reason) ? mapDlocalStatus(reason, language) : null;
  // Stripe / 3DS.
  const stripe = !dlocal && reason ? mapStripeError(reason, language as StripeLang) : null;

  const mapped = dlocal ?? stripe;
  const soft = dlocal ? dlocal.tone === "pending" : stripe?.code?.startsWith("3ds");
  const retryable = mapped?.retryable ?? true;

  const statusLabel =
    status === "rejected"
      ? (language === "en" ? "Declined by the processor" : language === "pt" ? "Recusado pelo processador" : language === "fr" ? "Refusé par le processeur" : "Rechazado por el procesador")
      : status === "unknown"
      ? (language === "en" ? "Awaiting confirmation" : language === "pt" ? "Aguardando confirmação" : language === "fr" ? "En attente de confirmation" : "En verificación")
      : status;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{mapped?.title || t.metaFailure}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <header className="border-b bg-background/95">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link to="/" className="text-xl font-bold tracking-tight" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            iLingue <span className="text-primary">Relax</span>
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-16 text-center space-y-5">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${soft ? "bg-amber-100 dark:bg-amber-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
          {soft ? (
            dlocal ? <Clock className="w-11 h-11 text-amber-600 dark:text-amber-400" />
                   : <ShieldAlert className="w-11 h-11 text-amber-600 dark:text-amber-400" />
          ) : (
            <XCircle className="w-11 h-11 text-red-600 dark:text-red-400" />
          )}
        </div>
        <h1 className="text-3xl font-bold">{mapped?.title || t.paymentNotCompleted}</h1>
        <p className="text-muted-foreground">{mapped?.message || t.failureDesc}</p>

        {mapped?.instructions && mapped.instructions.length > 0 && (
          <ol className="mx-auto max-w-sm text-left list-decimal ml-6 space-y-1 text-sm text-muted-foreground">
            {mapped.instructions.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        )}

        {(statusLabel || paymentId || order || reason) && (
          <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 text-left space-y-1">
            {statusLabel && <div>{t.paymentStatus}: <code>{statusLabel}</code></div>}
            {order && <div>{language === "en" ? "Order" : language === "pt" ? "Pedido" : language === "fr" ? "Commande" : "Pedido"}: <code className="break-all">{order}</code></div>}
            {reason && <div>Code: <code>{reason}</code></div>}
            {paymentId && <div>{t.paymentId}: <code className="break-all">{paymentId}</code></div>}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          {retryable && (
            <Button asChild size="lg" className="gap-2">
              <Link to="/checkouts"><RefreshCcw className="w-4 h-4" /> {t.tryAgain}</Link>
            </Button>
          )}
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link to="/mi-pedido">
              <PackageSearch className="w-4 h-4" />
              {language === "en" ? "Track my order" : language === "pt" ? "Ver meu pedido" : language === "fr" ? "Suivre ma commande" : "Ver mi pedido"}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="gap-2">
            <a href="https://wa.me/112512724704" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-4 h-4" /> {t.contactSupport}
            </a>
          </Button>
        </div>
      </main>
    </div>
  );
}
