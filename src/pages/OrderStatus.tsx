import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Clock,
  CheckCircle2,
  PackageCheck,
  Search,
  Loader2,
  AlertCircle,
  CreditCard,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface TimelineItem {
  event: string;
  status: string | null;
  method: string | null;
  reference: string | null;
  detail: string | null;
  amount: number | null;
  currency: string | null;
  provider: string | null;
  createdAt: string;
}

interface OrderStatusResult {
  found: boolean;
  orderNumber?: string;
  stage?: "pending" | "paid" | "delivered";
  method?: string | null;
  amount?: number | null;
  currency?: string | null;
  createdAt?: string | null;
  deliveredAt?: string | null;
  timeline?: TimelineItem[];
}

const EVENT_LABEL: Record<string, string> = {
  order_created: "Pedido creado",
  payment_instructions: "Instrucciones de pago generadas (cupón / QR / enlace)",
  payment_pending: "Pago pendiente de confirmación",
  payment_paid: "Pago confirmado",
  payment_failed: "Pago rechazado o cancelado",
  delivery_sent: "Entrega digital enviada por correo",
  delivery_failed: "Error al enviar la entrega digital",
};

const STAGES = [
  { key: "pending", label: "Pendiente", icon: Clock },
  { key: "paid", label: "Pagado", icon: CheckCircle2 },
  { key: "delivered", label: "Entregado", icon: PackageCheck },
] as const;

function formatDate(value?: string | null) {
  if (!value) return "";
  try {
    const formatted = new Date(value).toLocaleString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Lima",
    });
    return `${formatted} (hora Perú, GMT-5)`;
  } catch {
    return value;
  }
}


export default function OrderStatus() {
  const [sp] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(sp.get("order") ?? "");
  const [email, setEmail] = useState(sp.get("email") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OrderStatusResult | null>(null);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("order-status", {
        body: { orderNumber: orderNumber.trim(), email: email.trim() },
      });
      if (fnError) {
        const ctx = (fnError as { context?: Response }).context;
        if (ctx?.status === 429) {
          setError("Demasiados intentos. Espera unos minutos e inténtalo de nuevo.");
          return;
        }
        throw fnError;
      }
      const res = data as OrderStatusResult;
      if (!res?.found) {
        setError(
          "No encontramos un pedido con ese número y correo. El estado solo se muestra al correo exacto usado en la compra. Revisa tu correo de confirmación o escríbenos por WhatsApp.",
        );
      } else {
        setResult(res);
      }
    } catch {

      setError("No pudimos consultar el pedido. Intenta de nuevo en unos segundos.");
    } finally {
      setLoading(false);
    }
  };

  const stageIndex = result?.stage ? STAGES.findIndex((s) => s.key === result.stage) : -1;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Estado de mi pedido | ILINGUE RELAX</title>
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

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold">Estado de mi pedido</h1>
          <p className="text-sm text-muted-foreground">
            Ingresa tu número de pedido y el correo que usaste al comprar para ver si tu pago está
            pendiente, pagado o ya entregado.
          </p>
        </div>

        <form onSubmit={search} className="rounded-xl border bg-card p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="order">Número de pedido</Label>
              <Input
                id="order"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="ILR-DL-XXXXXX"
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
                <Search className="w-4 h-4 mr-2" /> Ver estado
              </>
            )}
          </Button>
        </form>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {result?.found && (
          <div className="space-y-6">
            <div className="rounded-xl border bg-card p-5 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-muted-foreground">Pedido</div>
                  <div className="font-semibold">{result.orderNumber}</div>
                </div>
              </div>


              <div className="flex items-center">
                {STAGES.map((s, i) => {
                  const Icon = s.icon;
                  const active = i <= stageIndex;
                  return (
                    <div key={s.key} className="flex-1 flex items-center">
                      <div className="flex flex-col items-center gap-1 flex-1">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                            active
                              ? "bg-primary/10 border-primary text-primary"
                              : "bg-muted border-border text-muted-foreground"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span
                          className={`text-xs ${active ? "font-medium text-foreground" : "text-muted-foreground"}`}
                        >
                          {s.label}
                        </span>
                      </div>
                      {i < STAGES.length - 1 && (
                        <div className={`h-0.5 flex-1 ${i < stageIndex ? "bg-primary" : "bg-border"}`} />
                      )}
                    </div>
                  );
                })}
              </div>

              {result.method && (
                <div className="flex items-center gap-2 text-sm rounded-lg bg-muted/40 p-3">
                  <CreditCard className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">Método de pago:</span>
                  <span className="font-medium">{result.method}</span>
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-card p-5">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-semibold">Historial del pedido</h2>
                <span className="text-xs text-muted-foreground">
                  Horas en zona horaria de Perú (GMT-5)
                </span>
              </div>
              <ol className="relative">
                {(result.timeline ?? []).map((t, i) => {
                  const meta = EVENT_META[t.event] ?? {
                    icon: Clock,
                    tone: "text-muted-foreground",
                    ring: "border-border bg-muted",
                  };
                  const Icon = meta.icon;
                  const isLast = i === (result.timeline?.length ?? 0) - 1;
                  return (
                    <li key={`${t.event}-${i}`} className="relative flex gap-4 pb-6 last:pb-0">
                      {!isLast && (
                        <span className="absolute left-[15px] top-9 bottom-0 w-px bg-border" aria-hidden />
                      )}
                      <div
                        className={`relative z-10 w-8 h-8 shrink-0 rounded-full border-2 flex items-center justify-center ${meta.ring}`}
                      >
                        <Icon className={`w-4 h-4 ${meta.tone}`} />
                      </div>
                      <div className="min-w-0 flex-1 rounded-lg bg-muted/30 px-3 py-2">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-medium">{EVENT_LABEL[t.event] ?? t.event}</span>
                          {isLast && (
                            <span className="text-[10px] uppercase tracking-wide rounded-full bg-primary/10 text-primary px-2 py-0.5">
                              Último estado
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{formatDate(t.createdAt)}</div>
                        {t.detail && <div className="text-xs text-muted-foreground mt-1">{t.detail}</div>}
                        {(t.method || t.reference) && (
                          <div className="text-[11px] text-muted-foreground mt-1 flex flex-wrap gap-x-3">
                            {t.method && <span>Método: {t.method}</span>}
                            {t.reference && <span>Ref: {t.reference}</span>}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
                {(result.timeline ?? []).length === 0 && (
                  <li className="text-sm text-muted-foreground">
                    Aún no hay eventos registrados para este pedido.
                  </li>
                )}
              </ol>

            </div>
          </div>
        )}

        <div className="rounded-xl border bg-card p-4 flex gap-3 text-sm">
          <MessageCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">¿Necesitas ayuda con tu pedido?</div>
            <div className="text-muted-foreground text-xs">
              Escríbenos a{" "}
              <a href="mailto:hola@ilinguerelax.com" className="text-primary underline">
                hola@ilinguerelax.com
              </a>{" "}
              o por{" "}
              <a
                href="https://wa.me/112512724704"
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
