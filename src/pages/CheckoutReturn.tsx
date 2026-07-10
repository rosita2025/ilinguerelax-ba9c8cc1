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
    // Stripe appends `redirect_status` after 3DS/off-session redirects:
    // succeeded | failed | requires_action | canceled
    const redirectStatus = sp.get("redirect_status");
    const piStatus = sp.get("payment_intent_status");
    const failed3ds = redirectStatus === "failed" || piStatus === "requires_payment_method";
    const pending3ds = redirectStatus === "requires_action" || piStatus === "requires_action";
    const canceled3ds = redirectStatus === "canceled";

    if (failed3ds || canceled3ds) {
      params.set("status", "failure");
      params.set("reason", canceled3ds ? "3ds_canceled" : "3ds_failed");
      navigate(`/checkouts/failure?${params.toString()}`, { replace: true });
      return;
    }
    if (pending3ds) {
      params.set("status", "pending");
      params.set("reason", "3ds_required");
      navigate(`/checkouts/failure?${params.toString()}`, { replace: true });
      return;
    }
    params.set("status", "approved");
    navigate(`/checkouts/success?${params.toString()}`, { replace: true });
  }, [sessionId, navigate, sp]);

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
