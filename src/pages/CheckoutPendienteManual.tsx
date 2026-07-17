import { Link, useSearchParams } from "react-router-dom";
import { Clock, MessageCircle, ShieldCheck, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { useState } from "react";

const WHATSAPP_FALLBACK = "https://wa.link/unpa9n";

export default function CheckoutPendienteManual() {
  const [params] = useSearchParams();
  const orderNumber = params.get("order") || "";
  const name = params.get("name") || "";
  const email = params.get("email") || "";
  const amount = params.get("amount") || "";
  const method = params.get("method") || "Yape/Plin/Binance";
  const products = params.get("products") || "";
  const [copied, setCopied] = useState(false);

  const copyOrder = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* noop */ }
  };

  const waMessage =
    `Hola! 👋 Acabo de pagar por ${method}.\n\n` +
    (orderNumber ? `📦 Orden: ${orderNumber}\n` : "") +
    (name ? `👤 Nombre: ${name}\n` : "") +
    (email ? `📧 Email: ${email}\n` : "") +
    (amount ? `💰 Monto: ${amount}\n` : "") +
    (method ? `💳 Método: ${method}\n` : "") +
    (products ? `\n🛒 Productos:\n${products.split(" | ").map((p) => `• ${p}`).join("\n")}\n` : "") +
    `\nAdjunto captura del pago. Gracias!`;

  const waUrl = orderNumber || name || amount
    ? `https://wa.me/12512724704?text=${encodeURIComponent(waMessage)}`
    : WHATSAPP_FALLBACK;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <Helmet>
        <title>Pago manual en revisión · ILINGUE RELAX</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="max-w-lg w-full text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold">¡Gracias! Tu pago está en revisión</h1>

        {orderNumber && (
          <div className="rounded-xl border bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Número de orden</p>
            <button
              type="button"
              onClick={copyOrder}
              className="mt-1 inline-flex items-center gap-2 text-xl font-mono font-bold text-primary hover:opacity-80"
            >
              {orderNumber}
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <p className="text-[11px] text-muted-foreground mt-1">
              {copied ? "¡Copiado! ✔" : "Toca para copiar — inclúyelo al contactarnos"}
            </p>
          </div>
        )}

        {(name || amount || method) && (
          <div className="rounded-xl border bg-card p-4 text-left text-sm space-y-1">
            {name && <p><span className="text-muted-foreground">Nombre:</span> <strong>{name}</strong></p>}
            {email && <p><span className="text-muted-foreground">Email:</span> {email}</p>}
            {amount && <p><span className="text-muted-foreground">Monto:</span> <strong>{amount}</strong></p>}
            {method && <p><span className="text-muted-foreground">Método:</span> {method}</p>}
          </div>
        )}

        <p className="text-muted-foreground">
          Nuestra <strong>Supervisora Rosa</strong> revisará tu pago desde Perú en las próximas
          <strong> 1 a 24 horas</strong>. Apenas lo confirmemos, te enviaremos tu material digital
          por correo electrónico.
        </p>

        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 text-left text-sm space-y-2">
          <p className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" /> Paso importante
          </p>
          <p className="text-amber-900/90 dark:text-amber-100/90">
            Por favor envíanos tu <strong>captura de pago</strong> (Yape, Plin o Binance Pay) por WhatsApp.
            Ya incluimos tus datos y número de orden en el mensaje — solo adjunta la captura.
          </p>
        </div>

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 w-full justify-center bg-[#25D366] hover:bg-[#20b358] text-white font-semibold py-3 rounded-xl transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          Enviar comprobante por WhatsApp
        </a>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
          <ShieldCheck className="w-3.5 h-3.5" /> Verificación manual segura desde Perú
        </div>

        <div className="flex gap-2 justify-center pt-2">
          <Button asChild variant="outline"><Link to="/checkouts">Volver al checkout</Link></Button>
          <Button asChild><Link to="/">Ir al inicio</Link></Button>
        </div>
      </div>
    </div>
  );
}
