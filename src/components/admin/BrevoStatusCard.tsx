import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { adminInvoke } from "@/lib/adminInvoke";
import { useAdminKey } from "./AdminGate";
import { Mail, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";


interface BrevoStatus {
  account: {
    emailsLeft: number | null;
    planType: string | null;
    planEndDate: string | null;
    error: string | null;
  };
  stats: {
    delivered: number;
    hardBounces: number;
    softBounces: number;
    error: string | null;
  };
}

export const BrevoStatusCard = () => {
  const { adminKey } = useAdminKey();
  const [status, setStatus] = useState<BrevoStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    if (!adminKey) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await adminInvoke<BrevoStatus>("brevo-account-stats", {
        body: { adminKey, days: 7 }
      });



      if (error) throw error;
      setStatus(data);
    } catch (err) {
      console.error("Error fetching Brevo status:", err);
      toast.error("Error al cargar estado de Brevo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminKey) fetchStatus();
  }, [adminKey]);


  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="h-20 bg-muted/50 rounded-t-lg" />
        <CardContent className="h-32 bg-muted/20" />
      </Card>
    );
  }

  const emailsLeft = status?.account?.emailsLeft;
  const isLowCredits = emailsLeft !== null && emailsLeft < 50;
  // Brevo responde «access_denied» al pedir el plan/créditos cuando la clave (o el conector) no tiene permiso para esa consulta.
  // Los envíos y las estadísticas siguen funcionando: se muestra un aviso claro en lugar del error crudo.
  const denied = (e?: string | null) => !!e && /access_denied|access denied/i.test(e);
  const accountDenied = denied(status?.account?.error);
  const accountError = !accountDenied ? status?.account?.error : null;
  const statsDenied = denied(status?.stats?.error);
  const hasError = accountError || (!statsDenied ? status?.stats?.error : null);

  return (
    <Card className={isLowCredits ? "border-amber-500/50" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">Estado de Brevo (Email)</CardTitle>
        <Mail className={`h-4 w-4 ${isLowCredits ? "text-amber-500" : "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              {emailsLeft !== null ? emailsLeft.toLocaleString() : "---"}
            </div>
            <Badge variant={isLowCredits ? "destructive" : "outline"}>
              {status?.account?.planType || "Plan"}
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground">
            {accountDenied ? "No se puede leer el plan ni los créditos con esta clave de Brevo." : "Créditos restantes para envíos transaccionales."}
          </p>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Entregados (7d)</div>
              <div className="text-sm font-semibold">{status?.stats?.delivered || 0}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Rebotes (7d)</div>
              <div className="text-sm font-semibold text-rose-500">
                {(status?.stats?.hardBounces || 0) + (status?.stats?.softBounces || 0)}
              </div>
            </div>
          </div>

          {(accountDenied || statsDenied) && (
            <div className="flex items-start gap-2 p-2 mt-2 text-xs text-amber-800 bg-amber-50 rounded border border-amber-200">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
              <span className="break-words">
                Brevo negó el permiso de lectura ({accountDenied ? "plan y créditos" : "estadísticas"}). Los correos se siguen enviando con normalidad. Mira tus créditos en app.brevo.com → Planes, o crea una clave API nueva en Brevo (SMTP y API → Claves API) y guárdala como <b>BREVO_API_KEY</b>.
              </span>
            </div>
          )}

          {hasError && (
            <div className="flex items-start gap-2 p-2 mt-2 text-xs text-rose-500 bg-rose-50 rounded border border-rose-100">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
              <span className="break-words min-w-0">{String(hasError).slice(0, 200)}</span>
            </div>
          )}

          {!hasError && !accountDenied && !isLowCredits && emailsLeft !== null && (
            <div className="flex items-center gap-2 p-2 mt-2 text-xs text-emerald-600 bg-emerald-50 rounded border border-emerald-100">
              <CheckCircle2 className="h-3 w-3 shrink-0" />
              <span>Conexión activa y créditos disponibles</span>
            </div>
          )}

          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full h-7 text-xs gap-1 opacity-70 hover:opacity-100"
            onClick={fetchStatus}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
