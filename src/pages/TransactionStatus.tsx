// Pantalla pública de estado de una transacción.
// El cliente entra con el ID de transacción (o su número de pedido) + el correo
// de la compra y ve si el pago fue APROBADO, RECHAZADO o está EN PROCESO.
// La página se refresca sola cada 8 s mientras el pago sigue en proceso, así que
// en cuanto el webhook del proveedor (Stripe / dLocal / Mercado Pago / PayPal)
// actualiza el pedido, el resultado cambia solo, sin recargar.
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type Outcome = "approved" | "rejected" | "processing";

interface TimelineItem {
  event: string;
  status: string | null;
  method: string | null;
  reference: string | null;
  createdAt: string;
}

interface StatusResult {
  found: boolean;
  orderNumber?: string;
  outcome?: Outcome;
  stage?: "pending" | "paid" | "delivered";
  method?: string | null;
  amount?: number | null;
  currency?: string | null;
  provider?: string | null;
  createdAt?: string | null;
  timeline?: TimelineItem[];
}

const EVENT_LABEL: Record<string, string> = {
  order_created: "Pedido creado",
  payment_instructions: "Instrucciones de pago generadas",
  payment_pending: "Pago pendiente de confirmación",
  payment_paid: "Pago aprobado",
  payment_failed: "Pago rechazado o cancelado",
  delivery_sent: "Entrega digital enviada por correo",
  delivery_failed: "Error al enviar la entrega digital",
};

const OUTCOME_UI: Record<
  Outcome,
  { label: string; description: string; icon: typeof Clock; box: string; tone: string }
> = {
  approved: {
    label: "Pago aprobado",
    description:
      "Tu pago fue confirmado. La entrega digital se envía al correo de la compra (revisa también spam o promociones).",
    icon: CheckCircle2,
    box: "border-primary/40 bg-primary/5",
    tone: "text-primary",
  },
  rejected: {
    label: "Pago rechazado",
    description:
      "El proveedor no aprobó esta transacción. No se te cobró nada: puedes intentar de nuevo con otro método de pago.",
    icon: XCircle,
    box: "border-destructive/40 bg-destructive/5",
    tone: "text-destructive",
  },
  processing: {
    label: "Pago en proceso",
    description:
      "Estamos esperando la confirmación del proveedor. Esta pantalla se actualiza sola en cuanto llegue la notificación.",
    icon: Clock,
    box: "border-amber-400/50 bg-amber-50/60 dark:bg-amber-500/10",
    tone: "text-amber-600",
  },
};

function formatDate(value?: string | null) {
  if (!value) return "";
  try {
    return `${new Date(value).toLocaleString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Lima",
    })} (hora Perú)`;
  } catch {
    return value;
  }
}

export default function TransactionStatus() {
  const [sp] = useSearchParams();
  const [txId, setTxId] = useState(sp.get("id") ?? sp.get("tx") ?? sp.get("order") ?? "");
  const [email, setEmail] = useState(sp.get("email") ?? "");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StatusResult | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const creds = useRef<{ transactionId: string; email: string } | null>(null);

  const lookup = useCallback(async (body: { transactionId: string; email: string }, silent = false) => {
    if (!body.transactionId || !body.email) return;
    silent ? setRefreshing(true) : setLoading(true);
    if (!silent) {
      setError(null);
      setResult(null);
    }
    try {
      const { data, error: fnError } = await supabase.functions.invoke("order-status", { body });
      if (fnError) {
        const ctx = (fnError as { context?: Response }).context;
        if (ctx?.status === 429) {
          setError("Demasiados intentos. Espera unos minutos e inténtalo de nuevo.");
          return;
        }
        throw fnError;
      }
      const res = data as StatusResult;
      setLastCheck(new Date());
      if (!res?.found) {
        if (!silent) {
          setError(
            "No encontramos una transacción con esos datos. Verifica el ID y usa el mismo correo con el que compraste.",
          );
        }
        return;
      }
      creds.current = body;
      setResult(res);
      setError(null);
    } catch {
      if (!silent) setError("No pudimos consultar la transacción. Intenta de nuevo en unos segundos.");
    } finally {
      silent ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  // Consulta automática cuando el proveedor nos devuelve con ?id= y ?email=
  useEffect(() => {
    const id = (sp.get("id") ?? sp.get("tx") ?? sp.get("order") ?? "").trim();
    const mail = (sp.get("email") ?? "").trim();
    if (id && mail) void lookup({ transactionId: id, email: mail });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actualización automática mientras el webhook aún no confirma el pago.
  useEffect(() => {
    if (!result?.found || result.outcome !== "processing") return;
    const t = setInterval(() => {
      if (creds.current) void lookup(creds.current, true);
    }, 8000);
    return () => clearInterval(t);
  }, [result?.found, result?.outcome, lookup]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await lookup({ transactionId: txId.trim(), email: email.trim() });
  };

  const ui = result?.outcome ? OUTCOME_UI[result.outcome] : null;
  const OutcomeIcon = ui?.icon ?? Clock;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Helmet>
        <title>Estado de mi transacción | ILINGUE RELAX</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <header className="border-b bg-background/95">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            to="/"
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            ILINGUE <span className="text-primary">RELAX</span>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-10 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold">Estado de mi transacción</h1>
          <p className="text-sm text-muted-foreground">
            Ingresa el ID de la transacción (o tu número de pedido) y el correo que usaste al pagar.
            Verás si tu pago fue aprobado, rechazado o sigue en proceso.
          </p>
        </div>

        <form onSubmit={submit} className="rounded-xl border bg-card p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="tx">ID de transacción o pedido</Label>
              <Input
                id="tx"
                value={txId}
                onChange={(e) => setTxId(e.target.value)}
                placeholder="Ej. D-4-xxxx o ILR-DL-XXXXXX"
                required
                minLength={4}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo de la compra</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Consultando…
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" /> Ver resultado
              </>
            )}
          </Button>
        </form>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p className="break-words">{error}</p>
          </div>
        )}

        {result?.found && ui && (
          <div className="space-y-5">
            <div className={`rounded-xl border p-5 space-y-3 ${ui.box}`}>
              <div className="flex items-start gap-3">
                <OutcomeIcon className={`w-7 h-7 shrink-0 ${ui.tone}`} />
                <div className="min-w-0">
                  <div className={`text-lg font-bold ${ui.tone}`}>{ui.label}</div>
                  <p className="text-sm text-muted-foreground mt-1">{ui.description}</p>
                </div>
              </div>

              <dl className="grid gap-2 sm:grid-cols-2 text-sm pt-2 border-t">
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">Pedido</dt>
                  <dd className="font-medium break-all">{result.orderNumber}</dd>
                </div>
                {result.method && (
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">Método</dt>
                    <dd className="font-medium break-words flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-primary shrink-0" />
                      {result.method}
                    </dd>
                  </div>
                )}
                {result.amount != null && (
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">Importe</dt>
                    <dd className="font-medium">
                      {result.amount} {result.currency ?? "USD"}
                    </dd>
                  </div>
                )}
                {result.createdAt && (
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">Inicio</dt>
                    <dd className="font-medium break-words">{formatDate(result.createdAt)}</dd>
                  </div>
                )}
              </dl>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={refreshing}
                  onClick={() => creds.current && lookup(creds.current, true)}
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                  Actualizar
                </Button>
                {result.outcome === "processing" && (
                  <span className="text-xs text-muted-foreground">
                    Se actualiza solo cada 8 s{lastCheck ? ` · última consulta ${lastCheck.toLocaleTimeString("es-PE")}` : ""}
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-xl border bg-card p-5">
              <h2 className="font-semibold mb-4">Historial de la transacción</h2>
              <ol className="space-y-3">
                {(result.timeline ?? []).map((t, i) => (
                  <li key={`${t.event}-${i}`} className="flex gap-3">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" aria-hidden />
                    <div className="min-w-0">
                      <div className="text-sm font-medium break-words">
                        {EVENT_LABEL[t.event] ?? t.event}
                      </div>
                      <div className="text-xs text-muted-foreground break-words">
                        {formatDate(t.createdAt)}
                        {t.reference ? ` · Ref: ${t.reference}` : ""}
                      </div>
                    </div>
                  </li>
                ))}
                {(result.timeline ?? []).length === 0 && (
                  <li className="text-sm text-muted-foreground">Aún no hay eventos registrados.</li>
                )}
              </ol>
            </div>

            <div className="text-sm">
              <Link to={`/mi-pedido?order=${encodeURIComponent(result.orderNumber ?? "")}`} className="text-primary underline">
                Ver el detalle completo del pedido →
              </Link>
            </div>
          </div>
        )}

        <div className="rounded-xl border bg-card p-4 flex gap-3 text-sm">
          <MessageCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="font-medium">¿Tu pago no aparece?</div>
            <div className="text-muted-foreground text-xs break-words">
              Escríbenos a{" "}
              <a href="mailto:hola@ilinguerelax.com" className="text-primary underline">
                hola@ilinguerelax.com
              </a>{" "}
              o por{" "}
              <a
                href="https://wa.me/12512724704"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                WhatsApp +1 251 272 4704
              </a>
              .
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
