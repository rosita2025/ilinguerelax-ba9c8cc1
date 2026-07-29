import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Clock, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nContext";
import { getCheckoutStrings } from "@/i18n/checkoutStatus";

export default function CheckoutPending() {
  const [sp] = useSearchParams();
  const paymentId = sp.get("payment_id") || sp.get("collection_id");
  const status = sp.get("status") || sp.get("collection_status");
  const { language } = useI18n();
  const t = getCheckoutStrings(language);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{t.metaPending}</title>
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
        <h1 className="text-3xl font-bold">{t.paymentPending}</h1>
        <p className="text-muted-foreground">{t.pendingDesc}</p>

        <div className="rounded-xl border bg-card p-4 text-left text-sm space-y-2">
          <div className="flex gap-3">
            <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="font-medium">{t.confirmationEmail}</div>
              <div className="text-muted-foreground text-xs">{t.confirmationEmailDesc}</div>
            </div>
          </div>
          <div className="flex gap-3">
            <MessageCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="font-medium">{t.fasterReceipt}</div>
              <div className="text-muted-foreground text-xs">
                {t.fasterReceiptDesc}{" "}
                <a href="https://wa.me/112512724704" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  WhatsApp +1 251 272 4704
                </a>
              </div>
            </div>
          </div>
        </div>

        {(status || paymentId) && (
          <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 text-left space-y-1">
            {status && <div>{t.paymentStatus}: <code>{status}</code></div>}
            {paymentId && <div>{t.paymentId}: <code className="break-all">{paymentId}</code></div>}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild size="lg">
            <Link to={`/mi-pedido${sp.get("external_reference") ? `?order=${encodeURIComponent(sp.get("external_reference")!)}` : ""}`}>
              Ver estado de mi pedido
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg"><Link to="/">{t.backHome}</Link></Button>
          <Button asChild variant="outline" size="lg">
            <a href="https://wa.me/112512724704" target="_blank" rel="noopener noreferrer">{t.whatsappSupport}</a>
          </Button>
        </div>

      </main>
    </div>
  );
}
