import { useSearchParams, Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutPending() {
  const [sp] = useSearchParams();
  const paymentId = sp.get("payment_id") || sp.get("collection_id");
  const status = sp.get("status") || sp.get("collection_status");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <Clock className="w-16 h-16 text-amber-500 mx-auto" />
        <h1 className="text-2xl font-bold">Pago pendiente</h1>
        <p className="text-muted-foreground">
          Tu pago está siendo procesado (PagoEfectivo, transferencia u otro método offline).
          Te enviaremos un correo apenas se confirme.
        </p>
        {(status || paymentId) && (
          <div className="text-xs text-muted-foreground bg-muted/40 rounded-md p-3 text-left space-y-1">
            {status && <div>Estado: <code>{status}</code></div>}
            {paymentId && <div>Payment ID: <code>{paymentId}</code></div>}
          </div>
        )}
        <div className="flex gap-2 justify-center">
          <Button asChild variant="outline"><Link to="/checkouts/prueba-1">Volver</Link></Button>
          <Button asChild><Link to="/">Inicio</Link></Button>
        </div>
      </div>
    </div>
  );
}
