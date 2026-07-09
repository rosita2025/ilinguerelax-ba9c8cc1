import { useSearchParams, Link } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutFailure() {
  const [sp] = useSearchParams();
  const status = sp.get("status") || sp.get("collection_status");
  const paymentId = sp.get("payment_id") || sp.get("collection_id");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <XCircle className="w-16 h-16 text-destructive mx-auto" />
        <h1 className="text-2xl font-bold">Pago no completado</h1>
        <p className="text-muted-foreground">
          Tu pago fue rechazado o cancelado. Puedes intentarlo de nuevo con otro método.
        </p>
        {(status || paymentId) && (
          <div className="text-xs text-muted-foreground bg-muted/40 rounded-md p-3 text-left space-y-1">
            {status && <div>Estado: <code>{status}</code></div>}
            {paymentId && <div>Payment ID: <code>{paymentId}</code></div>}
          </div>
        )}
        <div className="flex gap-2 justify-center">
          <Button asChild><Link to="/checkouts/prueba-1">Reintentar pago</Link></Button>
          <Button asChild variant="outline"><Link to="/">Inicio</Link></Button>
        </div>
      </div>
    </div>
  );
}
