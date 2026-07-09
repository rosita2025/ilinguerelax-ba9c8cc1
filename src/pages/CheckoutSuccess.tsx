import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccess() {
  const [sp] = useSearchParams();
  const paymentId = sp.get("payment_id") || sp.get("collection_id");
  const status = sp.get("status") || sp.get("collection_status");
  const externalRef = sp.get("external_reference");
  const preferenceId = sp.get("preference_id");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        <h1 className="text-2xl font-bold">¡Pago aprobado!</h1>
        <p className="text-muted-foreground">Recibirás un correo con los detalles de tu compra.</p>
        <div className="text-xs text-muted-foreground space-y-1 bg-muted/40 rounded-md p-3 text-left">
          {paymentId && <div>Payment ID: <code>{paymentId}</code></div>}
          {status && <div>Estado: <code>{status}</code></div>}
          {preferenceId && <div>Preference: <code className="break-all">{preferenceId}</code></div>}
          {externalRef && <div>Ref: <code>{externalRef}</code></div>}
        </div>
        <div className="flex gap-2 justify-center">
          <Button asChild variant="outline"><Link to="/checkouts/prueba-1">Nueva prueba</Link></Button>
          <Button asChild><Link to="/">Volver al inicio</Link></Button>
        </div>
      </div>
    </div>
  );
}
