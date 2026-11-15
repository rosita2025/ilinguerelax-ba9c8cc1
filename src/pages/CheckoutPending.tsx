import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Clock, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nContext";
import { buildPaidSupportUrl, buildPendingSupportUrl } from "@/lib/support";
import { getCheckoutStrings } from "@/i18n/checkoutStatus";

export default function CheckoutPending() {
  const [sp] = useSearchParams();
  const paymentId = sp.get("payment_id") || sp.get("collection_id");
  const status = sp.get("status") || sp.get("collection_status");
  const { language } = useI18n();
  const t = getCheckoutStrings(language);
  const isPaypal = (sp.get("provider") || "").toLowerCase() === "paypal";
  // OXXO directo (Stripe): ficha creada con el nombre y el correo del checkout. Solo se acepta un enlace de Stripe.
  const rawOxxoUrl = sp.get("oxxo_url") || "";
  const oxxoUrl = /^https:\/\/[a-z0-9.-]*stripe\.com\//i.test(rawOxxoUrl) ? rawOxxoUrl : "";
  const oxxoRef = (sp.get("oxxo_ref") || "").replace(/[^0-9A-Za-z -]/g, "").slice(0, 60);
  const oxxoExp = sp.get("oxxo_exp") || "";
  // PayPal: "ya pagué". Transferencia/efectivo (Mercado Pago): "pago pendiente" con referencia, nombre, producto y monto.
  const supportUrl = isPaypal
    ? buildPaidSupportUrl({ language, orderNumber: sp.get("order"), method: "PayPal" })
    : buildPendingSupportUrl({ language, orderNumber: sp.get("order") || sp.get("external_reference") || undefined });

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{t.metaPending}</title>
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
        <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
          <Clock className="w-11 h-11 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-3xl font-bold">{t.paymentPending}</h1>
        <p className="text-muted-foreground">{t.pendingDesc}</p>

        {oxxoUrl && (
          <div className="rounded-xl border-2 border-primary/40 bg-card p-4 text-left space-y-3">
            <p className="text-sm text-muted-foreground">
              {language === "en"
                ? "Take this number to any OXXO store and pay in cash. Your access arrives by email as soon as OXXO confirms the payment."
                : "Lleva este número a cualquier tienda OXXO y paga en efectivo. Tu acceso llega por correo en cuanto OXXO confirme el pago."}
            </p>
            {oxxoRef && (
              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground">{language === "en" ? "Reference number" : "Número de referencia"}</div>
                <div className="font-mono text-xl font-bold tracking-wider break-all">{oxxoRef}</div>
              </div>
            )}
            <Button asChild size="lg" className="w-full">
              <a href={oxxoUrl} target="_blank" rel="noopener noreferrer">{language === "en" ? "View my slip with barcode" : "Ver mi ficha con código de barras"}</a>
            </Button>
            {oxxoExp && !Number.isNaN(new Date(oxxoExp).getTime()) && (
              <p className="text-xs text-muted-foreground">{language === "en" ? "Expires" : "Vence el"} {new Date(oxxoExp).toLocaleString(language === "en" ? "en-US" : "es-MX", { dateStyle: "long", timeStyle: "short" })}.</p>
            )}
          </div>
        )}

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
                <a href={supportUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
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
            <a href={supportUrl} target="_blank" rel="noopener noreferrer">{t.whatsappSupport}</a>
          </Button>
        </div>

      </main>
    </div>
  );
}
