import { useMemo } from "react";
import { Lightbulb, CreditCard, MessageSquareText, FormInput, Wallet } from "lucide-react";

export interface ErrorRowLite {
  country: string | null;
  error_reason: string | null;
  provider: string | null;
}

type Kind = "method" | "copy" | "field" | "provider";

interface Suggestion {
  kind: Kind;
  text: string;
}

const KIND_META: Record<Kind, { label: string; icon: typeof CreditCard; className: string }> = {
  method: { label: "Método de pago", icon: CreditCard, className: "bg-primary/10 text-primary border-primary/30" },
  copy: { label: "Copy", icon: MessageSquareText, className: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  field: { label: "Campos", icon: FormInput, className: "bg-sky-500/10 text-sky-700 border-sky-500/30" },
  provider: { label: "Proveedor", icon: Wallet, className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
};

// Métodos alternativos locales por país (los que ya soporta el checkout).
const LOCAL_METHODS: Record<string, string> = {
  PE: "Yape / Plin (manual) y Mercado Pago",
  MX: "SPEI / CLABE, OXXO y Mercado Pago",
  CO: "Mercado Pago (PSE / Nequi)",
  AR: "Mercado Pago",
  CL: "Mercado Pago",
  BR: "Mercado Pago (Pix) y Hotmart",
  VE: "Binance Pay (USDT)",
  CU: "Binance Pay (USDT)",
  NI: "Binance Pay (USDT)",
  US: "Stripe",
  CA: "Stripe",
  ES: "Stripe y Hotmart",
};

const REASON_LABEL: Record<string, string> = {
  card_declined: "Tarjeta rechazada",
  insufficient_funds: "Fondos insuficientes",
  expired_card: "Tarjeta vencida",
  incorrect_cvc: "CVC incorrecto",
  incorrect_number: "Número de tarjeta incorrecto",
  processing_error: "Error de procesamiento",
  authentication_required: "Requiere 3D Secure",
  sin_motivo: "Sin motivo registrado",
  "HTTP 502": "Error 502 (Bad Gateway)",
  "HTTP 503": "Servicio No Disponible",
  "Network error": "Error de Red",
  "StripeInvalidRequestError": "Error de Configuración (Stripe)",
};

function suggestionsFor(reason: string, country: string): Suggestion[] {
  const local = LOCAL_METHODS[country];
  const out: Suggestion[] = [];

  // Recomendación específica para errores de infraestructura (502/503) o red
  if (reason.includes("502") || reason.includes("503") || reason.includes("Gateway") || reason.includes("Network")) {
    out.push({
      kind: "provider",
      text: `Downtime detectado en el proveedor. Si los errores persisten, considera priorizar otros métodos como ${local || "tarjeta"} temporalmente.`,
    });
    out.push({
      kind: "copy",
      text: "Asegúrate de que el checkout tenga reintentos automáticos configurados para absorber caídas temporales de la API.",
    });
    return out;
  }

  switch (reason) {
    case "card_declined":
    case "do_not_honor":
      out.push({
        kind: "method",
        text: local
          ? `Muestra primero ${local} en ${country}: el banco emisor está rechazando la tarjeta internacional.`
          : "Prioriza otro método sobre tarjeta: el banco emisor está rechazando el cargo internacional.",
      });
      out.push({ kind: "copy", text: "Añade el aviso «Si tu banco rechaza el pago, autoriza compras internacionales o usa otro método» debajo del formulario." });
      break;
    case "insufficient_funds":
      out.push({ kind: "method", text: local ? `Ofrece pago en moneda local con ${local} para evitar el recargo por conversión.` : "Ofrece pago en moneda local o transferencia manual." });
      out.push({ kind: "copy", text: "Refuerza el precio exacto en moneda local antes del botón de pago (evita sorpresas por tipo de cambio)." });
      break;
    case "expired_card":
    case "incorrect_number":
    case "incorrect_cvc":
      out.push({ kind: "field", text: "Activa validación en vivo de número, vencimiento y CVC con mensajes de error en el idioma del cliente." });
      out.push({ kind: "copy", text: "Indica junto al CVC dónde encontrarlo (3 dígitos al reverso) para reducir errores de tipeo." });
      break;
    case "authentication_required":
      out.push({ kind: "copy", text: "Avisa antes de pagar: «Tu banco te pedirá confirmar con un código (3D Secure). No cierres la ventana»." });
      out.push({ kind: "method", text: local ? `Deja visible ${local} como alternativa sin 3D Secure.` : "Deja visible otro método como alternativa sin 3D Secure." });
      break;
    case "processing_error":
      out.push({ kind: "provider", text: "Fallo del procesador: reintenta automáticamente una vez y ofrece cambiar de proveedor si vuelve a fallar." });
      break;
    case "sin_motivo":
      out.push({ kind: "provider", text: "Estos intentos no registran motivo: verifica que el checkout envíe `reason` y `provider` al log de eventos." });
      break;
    case "StripeInvalidRequestError":
      out.push({ kind: "provider", text: "Error de configuración en Stripe: forzamos el modo 'embedded' sin tipos de método explícitos para USD." });
      out.push({ kind: "method", text: local ? `Usa ${local} como alternativa segura mientras Stripe se estabiliza.` : "Usa un método alternativo." });
      break;
    default:
      out.push({ kind: "method", text: local ? `Prueba destacando ${local} para este país y compara la tasa de conversión.` : "Prueba reordenando los métodos de pago para este país." });
  }

  // Campos: pedir lo mínimo siempre ayuda.
  out.push({ kind: "field", text: "Mantén solo nombre y correo como campos obligatorios; cualquier campo extra aumenta el abandono." });
  return out;
}

function flagOf(cc?: string | null) {
  if (!cc || cc.length !== 2) return "🌐";
  return String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
}

export default function CheckoutRecommendations({ rows }: { rows: ErrorRowLite[] }) {
  const blocks = useMemo(() => {
    const byCountry = new Map<string, Map<string, number>>();
    for (const r of rows) {
      const cc = (r.country || "??").toUpperCase();
      const reason = r.error_reason || "sin_motivo";
      if (!byCountry.has(cc)) byCountry.set(cc, new Map());
      const m = byCountry.get(cc)!;
      m.set(reason, (m.get(reason) ?? 0) + 1);
    }
    return [...byCountry.entries()]
      .map(([country, reasons]) => {
        const total = [...reasons.values()].reduce((a, b) => a + b, 0);
        const [topReason, topCount] = [...reasons.entries()].sort((a, b) => b[1] - a[1])[0];
        return {
          country,
          total,
          topReason,
          topCount,
          share: total ? Math.round((topCount / total) * 100) : 0,
          suggestions: suggestionsFor(topReason, country),
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [rows]);

  return (
    <section className="border rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-muted/40 border-b">
        <h2 className="font-semibold flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Recomendaciones de checkout por país
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ajustes sugeridos según el motivo de rechazo más frecuente en cada país.
        </p>
      </div>

      {blocks.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground text-center">
          Sin fallos registrados: no hay ajustes que recomendar en este período.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-border">
          {blocks.map((b) => (
            <div key={b.country} className="bg-card p-3 sm:p-4 space-y-3">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
                <h3 className="font-semibold text-sm">
                  {flagOf(b.country)} {b.country}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {b.total} fallo{b.total === 1 ? "" : "s"}
                  </span>
                </h3>
                <span className="self-start text-xs rounded-full border px-2 py-0.5 bg-destructive/10 text-destructive border-destructive/30 break-words">
                  {REASON_LABEL[b.topReason] || b.topReason} · {b.share}%
                </span>
              </div>
              <ul className="space-y-2.5">
                {b.suggestions.map((s, i) => {
                  const meta = KIND_META[s.kind];
                  const Icon = meta.icon;
                  return (
                    <li key={i} className="flex flex-col gap-1 text-sm sm:flex-row sm:items-start sm:gap-2">
                      <span className={`inline-flex w-fit items-center gap-1 shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${meta.className}`}>
                        <Icon className="h-3 w-3" />
                        {meta.label}
                      </span>
                      <span className="text-muted-foreground leading-snug">{s.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

          ))}
        </div>
      )}
    </section>
  );
}
