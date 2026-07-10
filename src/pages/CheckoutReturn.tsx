import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { getCheckoutStrings } from "@/i18n/checkoutStatus";

/**
 * Stripe Embedded Checkout return_url lands here with ?session_id=cs_xxx.
 * We normalize to /checkouts/success so the Shopify-style thank-you page
 * is the single confirmation surface (matches Mercado Pago success_url).
 */
export default function CheckoutReturn() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = sp.get("session_id");
  const { language } = useI18n();
  const t = getCheckoutStrings(language);

  useEffect(() => {
    const params = new URLSearchParams();
    if (sessionId) params.set("session_id", sessionId);
    params.set("status", "approved");
    navigate(`/checkouts/success?${params.toString()}`, { replace: true });
  }, [sessionId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Helmet>
        <title>{t.metaReturn}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="text-center space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">{t.confirmingPayment}</p>
      </div>
    </div>
  );
}
