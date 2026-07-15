import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AdminNav from "@/components/admin/AdminNav";
import { Lock, CreditCard, Banknote, Wallet, Smartphone } from "lucide-react";

// Vista privada (solo admin) — muestra la diferencia real entre las 3 regiones
// que usa el checkout de iLingue Relax. Sin llamar APIs de Stripe.

type Method = { icon: any; label: string; note?: string };

const REGIONS: Array<{
  code: "PE" | "US" | "GLOBAL";
  flag: string;
  title: string;
  currency: string;
  gateway: string;
  color: string;
  description: string;
  methods: Method[];
}> = [
  {
    code: "PE",
    flag: "🇵🇪",
    title: "Perú",
    currency: "PEN (S/)",
    gateway: "Mercado Pago + Manual",
    color: "border-yellow-400/60 bg-yellow-50",
    description: "Compradores con IP peruana. Se muestran métodos locales en soles.",
    methods: [
      { icon: Smartphone, label: "Yape", note: "Manual, confirmamos nosotros" },
      { icon: Smartphone, label: "Plin", note: "Manual, confirmamos nosotros" },
      { icon: CreditCard, label: "Mercado Pago", note: "Tarjeta/PagoEfectivo/PagoFácil" },
      { icon: Banknote, label: "Transferencia BCP/Interbank", note: "Manual" },
    ],
  },
  {
    code: "US",
    flag: "🇺🇸",
    title: "Estados Unidos",
    currency: "USD ($)",
    gateway: "Stripe + PayPal",
    color: "border-blue-400/60 bg-blue-50",
    description: "Compradores con IP en USA. Stripe abre iframe con múltiples métodos + botón PayPal aparte.",
    methods: [
      { icon: CreditCard, label: "Tarjeta crédito/débito", note: "Visa, Mastercard, Amex, Discover" },
      { icon: Wallet, label: "Cash App Pay", note: "Solo USA con USD" },
      { icon: Banknote, label: "Transferencia ACH (us_bank_account)", note: "Stripe genera cuenta virtual" },
      { icon: Wallet, label: "Link (Stripe)", note: "One-click guardado" },
      { icon: Wallet, label: "PayPal", note: "Botón separado" },
    ],
  },
  {
    code: "GLOBAL",
    flag: "🌎",
    title: "Global (resto del mundo)",
    currency: "USD con conversión automática",
    gateway: "Stripe + PayPal",
    color: "border-emerald-400/60 bg-emerald-50",
    description: "Compradores fuera de USA/Perú. Stripe convierte automáticamente a moneda local (adaptive pricing).",
    methods: [
      { icon: CreditCard, label: "Tarjeta crédito/débito", note: "Global · adaptive pricing" },
      { icon: Banknote, label: "Transferencia internacional (customer_balance)", note: "Cuenta virtual por pago" },
      { icon: Wallet, label: "Link (Stripe)", note: "One-click guardado" },
      { icon: Wallet, label: "PayPal", note: "Botón separado" },
    ],
  },
];

const PREVIEW_SKU = "1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion";

const AdminCheckoutMethods = () => {
  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background py-10 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <header className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <Lock className="w-3.5 h-3.5" /> Vista privada · solo admin
            </div>
            <h1 className="text-3xl font-bold">Métodos de pago por región</h1>
            <p className="text-muted-foreground text-sm">
              Referencia interna: qué ve cada comprador según su país detectado por IP.
              El cliente <strong>no</strong> ve esta página — solo su checkout.
            </p>
          </header>

          <Card className="p-4 border-primary/30 bg-primary/5">
            <h2 className="font-semibold text-sm mb-2">Vista previa de checkout (abre en pestaña nueva)</h2>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="default">
                <a href={`/checkout/${PREVIEW_SKU}?region=PE`} target="_blank" rel="noreferrer">
                  🇵🇪 Ver checkout Perú
                </a>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <a href={`/checkout/${PREVIEW_SKU}?region=GLOBAL`} target="_blank" rel="noreferrer">
                  🌎 Ver checkout Global/USA
                </a>
              </Button>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {REGIONS.map((r) => (
              <Card key={r.code} className={`p-5 border-2 ${r.color}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <span className="text-2xl">{r.flag}</span> {r.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.currency}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{r.code}</Badge>
                </div>

                <div className="text-xs font-semibold text-foreground/80 mb-1">
                  Pasarela: <span className="font-normal">{r.gateway}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">{r.description}</p>

                <div className="space-y-2">
                  {r.methods.map((m) => {
                    const Icon = m.icon;
                    return (
                      <div key={m.label} className="flex items-start gap-2 text-sm">
                        <Icon className="w-4 h-4 mt-0.5 text-foreground/70 shrink-0" />
                        <div>
                          <div className="font-medium leading-tight">{m.label}</div>
                          {m.note && <div className="text-[11px] text-muted-foreground">{m.note}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-4 bg-muted/40 text-xs text-muted-foreground space-y-1">
            <p><strong>Detección de región:</strong> IP del comprador vía ipapi.co. PE → checkout Perú; US → Stripe con ACH + Cash App; resto → Stripe con transferencia internacional.</p>
            <p><strong>Efecty, OXXO, Boleto, Pix:</strong> requieren moneda local (COP/MXN/BRL) — no compatibles con USD, por eso no aparecen en Global.</p>
            <p><strong>Payouts:</strong> Stripe deposita el neto en la cuenta configurada. Yape/Plin llegan directo al número personal y se confirman manualmente desde <a href="/admin/orders" className="underline">/admin/orders</a>.</p>
          </Card>
        </div>
      </main>
    </>
  );
};

export default AdminCheckoutMethods;
