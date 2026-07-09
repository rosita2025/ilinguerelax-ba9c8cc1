import { Link } from "react-router-dom";
import { Clock, MessageCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";

const WHATSAPP_URL = "https://wa.link/unpa9n";

export default function CheckoutPendienteManual() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <Helmet>
        <title>Manual payment pending verification · ILINGUE RELAX</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="max-w-lg w-full text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold">Thank you! Your manual payment is under review</h1>
        <p className="text-muted-foreground">
          Our <strong>Supervisor Rosa</strong> will review your payment receipt from Peru within
          the next <strong>1 to 24 hours</strong>. As soon as it is confirmed, we will send your
          product via WhatsApp.
        </p>

        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 text-left text-sm space-y-2">
          <p className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" /> Important step
          </p>
          <p className="text-amber-900/90 dark:text-amber-100/90">
            Please send us your <strong>payment receipt</strong> (Yape or Plin screenshot) via
            WhatsApp to speed up verification and receive your product as soon as possible.
          </p>
        </div>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 w-full justify-center bg-[#25D366] hover:bg-[#20b358] text-white font-semibold py-3 rounded-xl transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          Send receipt via WhatsApp
        </a>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
          <ShieldCheck className="w-3.5 h-3.5" /> Secure manual verification from Peru
        </div>

        <div className="flex gap-2 justify-center pt-2">
          <Button asChild variant="outline"><Link to="/checkouts/prueba-1">Back to checkout</Link></Button>
          <Button asChild><Link to="/">Go to home</Link></Button>
        </div>
      </div>
    </div>
  );
}
