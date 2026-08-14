import { useEffect, useState } from "react";
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
  Package,
  Download,
  Gift,
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
  outcome?: "approved" | "rejected" | "processing";
  abandoned?: boolean;

  provider?: string | null;
  method?: string | null;
  amount?: number | null;
  currency?: string | null;
  createdAt?: string | null;
  deliveredAt?: string | null;
  timeline?: TimelineItem[];
  tracking_number?: string | null;
  shipping_provider?: string | null;
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

const EVENT_META: Record<
  string,
  { icon: typeof Clock; tone: string; ring: string }
> = {
  order_created: { icon: Package, tone: "text-muted-foreground", ring: "border-border bg-muted" },
  payment_instructions: { icon: CreditCard, tone: "text-primary", ring: "border-primary/40 bg-primary/10" },
  payment_pending: { icon: Clock, tone: "text-amber-600", ring: "border-amber-400/50 bg-amber-100/50" },
  payment_paid: { icon: CheckCircle2, tone: "text-primary", ring: "border-primary bg-primary/10" },
  payment_failed: { icon: AlertCircle, tone: "text-destructive", ring: "border-destructive/50 bg-destructive/10" },
  delivery_sent: { icon: PackageCheck, tone: "text-primary", ring: "border-primary bg-primary/10" },
  delivery_failed: { icon: AlertCircle, tone: "text-destructive", ring: "border-destructive/50 bg-destructive/10" },
};

// Nombre claro del método/pasarela para el cliente: Stripe, Mercado Pago,
// dLocal (transferencia / efectivo / billetera), Yape, Plin, SPEI México,
// transferencia bancaria, Binance Pay y PayPal.
const METHOD_RULES: Array<[RegExp, string]> = [
  [/yape/i, "Yape"],
  [/plin/i, "Plin"],
  [/yape_plin|yape\s*\/\s*plin/i, "Yape / Plin"],
  [/binance/i, "Binance Pay (USDT)"],
  [/spei|clabe/i, "Transferencia SPEI (México)"],
  [/oxxo/i, "Pago en efectivo OXXO (México)"],
  [/pix/i, "PIX (Brasil)"],
  [/nequi/i, "Nequi (Colombia)"],
  [/pse/i, "PSE (Colombia)"],
  [/paypal/i, "PayPal"],
  [/stripe|card|tarjeta|credit|debit|visa|master/i, "Tarjeta de crédito o débito (Stripe)"],
  [/mercado[\s_-]?pago|mercadopago|^mp_/i, "Mercado Pago"],
  [/dlocal.*(transfer|bank)|transfer.*dlocal/i, "Transferencia bancaria (dLocal Go)"],
  [/dlocal.*(cash|efectivo)|cash.*dlocal|ticket/i, "Pago en efectivo (dLocal Go)"],
  [/dlocal.*(wallet|billetera)|wallet/i, "Billetera digital (dLocal Go)"],
  [/dlocal/i, "dLocal Go"],
  [/bank_transfer|transferencia|transfer/i, "Transferencia bancaria"],
  [/efectivo|cash/i, "Pago en efectivo"],
  [/manual/i, "Pago manual verificado por el equipo"],
  [/email/i, "Entrega por correo"],
];

function methodLabel(raw?: string | null): string | null {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value) return null;
  for (const [re, label] of METHOD_RULES) if (re.test(value)) return label;
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatAmount(amount?: number | null, currency?: string | null): string | null {
  if (amount == null || Number.isNaN(Number(amount))) return null;
  const cur = (currency || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("es-PE", { style: "currency", currency: cur }).format(Number(amount));
  } catch {
    return `${cur} ${Number(amount).toFixed(2)}`;
  }
}

const OUTCOME_UI = {
  approved: {
    label: "Pago aprobado",
    text: "Tu pago fue confirmado. Si tu compra es digital, revisa tu correo (incluida la carpeta de spam o promociones).",
    box: "border-primary/40 bg-primary/5",
    tone: "text-primary",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Pago rechazado",
    text: "El pago no se completó y no se te cobró nada. Puedes volver a intentarlo con otro método o escribirnos.",
    box: "border-destructive/40 bg-destructive/5",
    tone: "text-destructive",
    icon: AlertCircle,
  },
  abandoned: {
    label: "Pago no completado",
    text: "Abriste la pasarela de pago pero no llegaste a completarla, así que no se te cobró nada. Puedes volver a comprar cuando quieras o escribirnos si necesitas ayuda.",
    box: "border-destructive/30 bg-muted",
    tone: "text-muted-foreground",
    icon: AlertCircle,
  },
  processing: {
    label: "Pago en proceso",
    text: "Estamos esperando la confirmación del pago (transferencias, efectivo y pagos manuales pueden tardar unas horas). Esta página se actualiza sola.",
    box: "border-amber-400/50 bg-amber-100/40",
    tone: "text-amber-600",
    icon: Clock,
  },
} as const;


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
  const token = (sp.get("t") ?? "").trim();
  const [orderNumber, setOrderNumber] = useState(sp.get("order") ?? "");
  const [email, setEmail] = useState(sp.get("email") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OrderStatusResult | null>(null);
  const [lastBody, setLastBody] = useState<Record<string, string> | null>(null);

  const lookup = async (body: Record<string, string>, silent = false): Promise<boolean> => {
    if (!silent) {
      setError(null);
      setResult(null);
      setLoading(true);
    }
    try {
      const { data, error: fnError } = await supabase.functions.invoke("order-status", { body });
      if (fnError) {
        const ctx = (fnError as { context?: Response }).context;
        if (ctx?.status === 429) {
          if (!silent) setError("Demasiados intentos. Espera unos minutos e inténtalo de nuevo.");
          return false;
        }
        throw fnError;
      }
      const res = data as OrderStatusResult;
      if (!res?.found) {
        if (!silent) {
          setError(
            body.token
              ? "Este enlace de pedido ya no es válido. Busca el correo de entrega o escríbenos por WhatsApp."
              : "No encontramos un pedido con ese número y correo. El estado solo se muestra al correo exacto usado en la compra. Revisa tu correo de confirmación o escríbenos por WhatsApp.",
          );
        }
        return false;
      }
      setResult(res);
      setLastBody(body);
      return true;
    } catch {
      if (!silent) setError("No pudimos consultar el pedido. Intenta de nuevo en unos segundos.");
      return false;
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Acceso directo con el token del correo de entrega: /mi-pedido?t=<token>
  useEffect(() => {
    if (token) void lookup({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Transferencias, efectivo y pagos manuales se confirman más tarde por webhook:
  // mientras el pago esté en proceso refrescamos solos cada 15 s.
  useEffect(() => {
    if (!lastBody || result?.outcome !== "processing") return;
    const id = setInterval(() => void lookup(lastBody, true), 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastBody, result?.outcome]);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const ref = orderNumber.trim();
    const mail = email.trim();
    // Un solo campo visible: probamos como número de pedido y, si no, como referencia del pago.
    const looksLikeOrder = /^[A-Za-z0-9\-_]+$/.test(ref);
    const ok = looksLikeOrder ? await lookup({ orderNumber: ref, email: mail }) : false;
    if (!ok) await lookup({ transactionId: ref, email: mail });
  };




  const stageIndex = result?.stage ? STAGES.findIndex((s) => s.key === result.stage) : -1;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Estado de mi pedido | iLingue Relax</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <header className="border-b bg-background/95">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            to="/"
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            iLingue <span className="text-primary">Relax</span>
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
            {result.stage === "paid" && (
              <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-500/5 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-emerald-600" />
                  <h2 className="font-semibold text-emerald-900 dark:text-emerald-100">
                    Tu material digital ya está disponible
                  </h2>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <strong>1. Digital:</strong> Se envió un correo con tus enlaces de descarga.
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    <strong>2. Físico:</strong> En preparación. Te avisaremos cuando se envíe.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 gap-1.5">
                    <a href="/mi-descarga">
                      <Download className="w-3.5 h-3.5" /> Acceder a mis descargas
                    </a>
                  </Button>
                </div>
              </div>
            )}

            <div className="rounded-xl border bg-card p-5 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-muted-foreground">Pedido</div>
                  <div className="font-semibold">{result.orderNumber}</div>
                </div>
              </div>


              {result.outcome && (() => {
                const key = result.outcome === "rejected" && result.abandoned ? "abandoned" : result.outcome;
                const ui = OUTCOME_UI[key];

                const Icon = ui.icon;
                return (
                  <div className={`rounded-lg border p-3 flex gap-3 ${ui.box}`}>
                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${ui.tone}`} />
                    <div className="min-w-0">
                      <div className={`text-sm font-semibold ${ui.tone}`}>{ui.label}</div>
                      <p className="text-xs text-muted-foreground mt-0.5 break-words">{ui.text}</p>
                    </div>
                  </div>
                );
              })()}

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

              <div className="grid gap-2 sm:grid-cols-2">
                {methodLabel(result.method) && (
                  <div className="flex items-center gap-2 text-sm rounded-lg bg-muted/40 p-3">
                    <CreditCard className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-muted-foreground shrink-0">Método:</span>
                    <span className="font-medium break-words">{methodLabel(result.method)}</span>
                  </div>
                )}
                {formatAmount(result.amount, result.currency) && (
                  <div className="flex items-center gap-2 text-sm rounded-lg bg-muted/40 p-3">
                    <Package className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-muted-foreground shrink-0">Importe:</span>
                    <span className="font-medium">{formatAmount(result.amount, result.currency)}</span>
                  </div>
                )}
              </div>
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
                        {t.detail && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {t.detail}
                            {t.detail.toLowerCase().includes("amazon") && (
                              <div className="mt-2 p-2 rounded bg-primary/5 border border-primary/20">
                                <span className="text-primary font-medium">Seguimiento de Amazon disponible</span>
                              </div>
                            )}
                          </div>
                        )}

                        {(t.method || t.reference) && (
                          <div className="text-[11px] text-muted-foreground mt-1 flex flex-wrap gap-x-3">
                            {t.method && <span>Método: {methodLabel(t.method)}</span>}
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
