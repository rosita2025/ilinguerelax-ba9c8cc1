import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { getCheckoutStrings } from "@/i18n/checkoutStatus";
import { invokeWithRetry } from "@/lib/invokeWithRetry";
import { readDlocalPending, clearDlocalPending } from "@/lib/dlocalPending";
import { dlocalCodeFromStatus } from "@/lib/dlocalErrorMap";

/**
 * Pantalla puente del checkout.
 *
 * · Stripe Embedded Checkout vuelve aquí con ?session_id=cs_xxx (+ redirect_status).
 * · dLocal Go vuelve aquí con ?provider=dlocal&order=ILR-DL-xxx tanto si aprobó
 *   como si rechazó la transacción. En ese caso consultamos el estado REAL del
 *   pago en el backend y enrutamos a éxito / pendiente / fallo con un mensaje
 *   claro, en vez de dejar al comprador en la pantalla de error de dLocal.
 */
export default function CheckoutReturn() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = sp.get("session_id");
  const { language } = useI18n();
  const t = getCheckoutStrings(language);
  const isDlocal = (sp.get("provider") || "").toLowerCase() === "dlocal";
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!isDlocal) return;
    const timer = window.setTimeout(() => setSlow(true), 4000);
    return () => window.clearTimeout(timer);
  }, [isDlocal]);

  // ---- dLocal Go ---------------------------------------------------------
  useEffect(() => {
    if (!isDlocal) return;
    let cancelled = false;

    const go = (path: string) => { if (!cancelled) navigate(path, { replace: true }); };

    (async () => {
      const pending = readDlocalPending();
      const orderId = sp.get("order") || pending?.orderId || "";
      const email = pending?.email || "";
      const params = new URLSearchParams();
      if (orderId) params.set("order", orderId);
      params.set("provider", "dlocal");

      // Sin datos suficientes para consultar: nunca damos por aprobado.
      if (!orderId || !email) {
        params.set("status", "unknown");
        params.set("reason", "dlocal_unknown");
        go(`/checkouts/failure?${params.toString()}`);
        return;
      }

      const { data } = await invokeWithRetry<{
        found?: boolean;
        status?: "paid" | "pending" | "rejected" | "unknown";
        rawStatus?: string;
      }>("dlocal-payment-status", { body: { orderId, email } }, { attempts: 2, baseDelayMs: 600 });

      const status = data?.found ? data.status : "unknown";

      if (status === "paid") {
        clearDlocalPending();
        params.set("status", "approved");
        go(`/checkouts/success?${params.toString()}`);
        return;
      }
      if (status === "pending") {
        params.set("status", "pending");
        params.set("reason", "dlocal_pending");
        go(`/checkouts/pending?${params.toString()}`);
        return;
      }

      params.set("status", status === "rejected" ? "rejected" : "unknown");
      params.set("reason", dlocalCodeFromStatus(status, data?.rawStatus));
      go(`/checkouts/failure?${params.toString()}`);
    })();

    return () => { cancelled = true; };
  }, [isDlocal, sp, navigate]);

  // ---- Stripe ------------------------------------------------------------
  useEffect(() => {
    if (isDlocal) return;
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
  }, [sessionId, navigate, sp, isDlocal]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Helmet>
        <title>{t.metaReturn}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="text-center space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">{t.confirmingPayment}</p>
        {slow && (
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            {language === "en"
              ? "Checking the transaction status with the payment processor…"
              : language === "pt"
              ? "Verificando o status da transação com o processador…"
              : language === "fr"
              ? "Vérification du statut auprès du processeur…"
              : "Verificando el estado de la transacción con el procesador de pagos…"}
          </p>
        )}
      </div>
    </div>
  );
}
