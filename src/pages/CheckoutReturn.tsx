import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutReturn() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        <h1 className="text-2xl font-bold">¡Pago completado!</h1>
        {sessionId ? (
          <p className="text-sm text-muted-foreground break-all">
            Session ID: <code className="bg-muted px-1 py-0.5 rounded">{sessionId}</code>
          </p>
        ) : (
          <p className="text-muted-foreground">No hay información de sesión.</p>
        )}
        <div className="flex gap-2 justify-center">
          <Button asChild variant="outline">
            <Link to="/checkouts">Nueva prueba</Link>
          </Button>
          <Button asChild>
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
