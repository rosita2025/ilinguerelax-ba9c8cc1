import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import AdminNav from "@/components/admin/AdminNav";
import { CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";

// Reference: which methods appear per buyer country (from Stripe docs).
// Only methods currently supported by Stripe are listed.
const COUNTRY_METHODS: Record<string, { flag: string; name: string; currencies: string[]; methods: string[] }> = {
  DE: { flag: "🇩🇪", name: "Alemania", currencies: ["EUR"], methods: ["card", "link", "sepa_debit", "giropay", "sofort", "klarna", "paypal", "apple_pay", "google_pay"] },
  GB: { flag: "🇬🇧", name: "Reino Unido", currencies: ["GBP", "USD", "EUR"], methods: ["card", "link", "bacs_debit", "klarna", "afterpay_clearpay", "paypal", "revolut_pay", "apple_pay", "google_pay"] },
  JP: { flag: "🇯🇵", name: "Japón", currencies: ["JPY", "USD"], methods: ["card", "link", "konbini", "apple_pay", "google_pay"] },
  US: { flag: "🇺🇸", name: "Estados Unidos", currencies: ["USD"], methods: ["card", "link", "us_bank_account", "cashapp", "klarna", "afterpay_clearpay", "paypal", "apple_pay", "google_pay"] },
  CA: { flag: "🇨🇦", name: "Canadá", currencies: ["CAD", "USD"], methods: ["card", "link", "acss_debit", "klarna", "afterpay_clearpay", "paypal", "apple_pay", "google_pay"] },
  AU: { flag: "🇦🇺", name: "Australia", currencies: ["AUD", "USD"], methods: ["card", "link", "au_becs_debit", "afterpay_clearpay", "paypal", "apple_pay", "google_pay"] },
  NL: { flag: "🇳🇱", name: "Países Bajos", currencies: ["EUR"], methods: ["card", "link", "ideal", "sepa_debit", "klarna", "paypal", "apple_pay", "google_pay"] },
  BE: { flag: "🇧🇪", name: "Bélgica", currencies: ["EUR"], methods: ["card", "link", "bancontact", "sepa_debit", "klarna", "paypal", "apple_pay", "google_pay"] },
  FR: { flag: "🇫🇷", name: "Francia", currencies: ["EUR"], methods: ["card", "link", "sepa_debit", "klarna", "paypal", "apple_pay", "google_pay"] },
  IT: { flag: "🇮🇹", name: "Italia", currencies: ["EUR"], methods: ["card", "link", "sepa_debit", "satispay", "klarna", "paypal", "apple_pay", "google_pay"] },
  ES: { flag: "🇪🇸", name: "España", currencies: ["EUR"], methods: ["card", "link", "sepa_debit", "klarna", "paypal", "apple_pay", "google_pay"] },
  PT: { flag: "🇵🇹", name: "Portugal", currencies: ["EUR"], methods: ["card", "link", "sepa_debit", "mb_way", "multibanco", "paypal", "apple_pay", "google_pay"] },
  PL: { flag: "🇵🇱", name: "Polonia", currencies: ["PLN", "EUR"], methods: ["card", "link", "p24", "blik", "klarna", "paypal", "apple_pay", "google_pay"] },
  MX: { flag: "🇲🇽", name: "México", currencies: ["MXN", "USD"], methods: ["card", "link", "oxxo", "paypal"] },
  BR: { flag: "🇧🇷", name: "Brasil", currencies: ["BRL", "USD"], methods: ["card", "link", "pix", "boleto"] },
  SG: { flag: "🇸🇬", name: "Singapur", currencies: ["SGD", "USD"], methods: ["card", "link", "paynow", "grabpay", "apple_pay", "google_pay"] },
  MY: { flag: "🇲🇾", name: "Malasia", currencies: ["MYR", "USD"], methods: ["card", "link", "fpx", "grabpay"] },
  HK: { flag: "🇭🇰", name: "Hong Kong", currencies: ["HKD", "USD"], methods: ["card", "link", "alipay", "wechat_pay", "apple_pay", "google_pay"] },
};

const METHOD_LABELS: Record<string, string> = {
  card: "Tarjeta", link: "Link", paypal: "PayPal", klarna: "Klarna",
  afterpay_clearpay: "Afterpay/Clearpay", cashapp: "Cash App", apple_pay: "Apple Pay",
  google_pay: "Google Pay", sepa_debit: "SEPA", ideal: "iDEAL", bancontact: "Bancontact",
  giropay: "Giropay", sofort: "SOFORT", eps: "EPS", p24: "Przelewy24", blik: "BLIK",
  mb_way: "MB WAY", multibanco: "Multibanco", satispay: "Satispay", revolut_pay: "Revolut Pay",
  bacs_debit: "Bacs Debit", us_bank_account: "ACH", acss_debit: "Débito preautorizado (CA)",
  au_becs_debit: "BECS (AU)", konbini: "Konbini", oxxo: "OXXO", pix: "Pix", boleto: "Boleto",
  paynow: "PayNow", grabpay: "GrabPay", fpx: "FPX", alipay: "Alipay", wechat_pay: "WeChat Pay",
};

interface Config {
  id: string; name: string; is_default: boolean; active: boolean;
  enabled: string[]; disabled: string[];
}

const AdminCheckoutMethods = () => {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("list-payment-methods");
      if (error) throw error;
      setConfigs(data?.configurations || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const defaultCfg = configs.find(c => c.is_default) || configs[0];
  const enabledSet = new Set(defaultCfg?.enabled || []);

  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background py-10 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Métodos de pago Stripe por país</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Lo que verá cada comprador en el iframe según su país. En <span className="text-emerald-600 font-medium">verde</span>: ya activado en tu Stripe. En gris: disponible pero apagado en tu Dashboard.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refrescar
            </Button>
          </header>

          <Card className="p-5 border-primary/30 bg-primary/5">
            <h2 className="font-semibold mb-1">Vista previa de checkout (editor / desarrollador)</h2>
            <p className="text-xs text-muted-foreground mb-3">
              Abre los checkouts reales para revisar Stripe, PayPal, Mercado Pago, Yape y Plin sin romper nada. No borres estas páginas — quedan como referencia oficial.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="default">
                <a href="/checkout/1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion?region=PE" target="_blank" rel="noreferrer">
                  🇵🇪 Checkout Perú (PEN · Yape/Plin/MP)
                </a>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <a href="/checkout/1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion?region=GLOBAL" target="_blank" rel="noreferrer">
                  🌎 Checkout Global (USD · Stripe/PayPal)
                </a>
              </Button>
              <Button asChild size="sm" variant="outline">
                <a href="/checkout/100-mapas-mentales-para-aprender-coreano-hangul-c1?region=GLOBAL" target="_blank" rel="noreferrer">
                  🇰🇷 Coreano (Global)
                </a>
              </Button>
            </div>
          </Card>

          {error && (
            <Card className="p-4 border-amber-300 bg-amber-50 text-amber-900 text-sm">
              <div className="font-medium mb-1">No pudimos leer los métodos activos de Stripe ahora mismo</div>
              <div className="text-xs opacity-80">{error}</div>
              <div className="text-xs mt-2">La tabla de referencia por país sigue funcionando abajo. Los checkouts de Perú y Global no se ven afectados.</div>
            </Card>
          )}

          {loading && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Cargando…</div>}

          {defaultCfg && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-semibold">Configuración activa: {defaultCfg.name}</h2>
                  <p className="text-xs text-muted-foreground">Modo sandbox · {defaultCfg.enabled.length} métodos activados</p>
                </div>
                <Badge variant="secondary">{defaultCfg.id}</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {defaultCfg.enabled.map(m => (
                  <Badge key={m} className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                    ✓ {METHOD_LABELS[m] || m}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(COUNTRY_METHODS).map(([code, info]) => {
              const activeCount = info.methods.filter(m => enabledSet.has(m)).length;
              return (
                <Card key={code} className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <span className="text-2xl">{info.flag}</span> {info.name}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {activeCount}/{info.methods.length}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Monedas: {info.currencies.join(", ")}</p>
                  <ul className="space-y-1.5 text-sm">
                    {info.methods.map(m => {
                      const on = enabledSet.has(m);
                      return (
                        <li key={m} className="flex items-center gap-2">
                          {on
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            : <XCircle className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
                          <span className={on ? "" : "text-muted-foreground line-through"}>
                            {METHOD_LABELS[m] || m}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              );
            })}
          </div>

          <Card className="p-5 bg-muted/40 text-sm">
            <p className="font-medium mb-1">¿Cómo activar más métodos?</p>
            <p className="text-muted-foreground">
              Dashboard de Stripe → Settings → Payment methods → edita "Default — Lovable Labs Incorporated" y activa los que quieras. Los cambios se ven aquí al refrescar.
            </p>
          </Card>
        </div>
      </main>
    </>
  );
};

export default AdminCheckoutMethods;
