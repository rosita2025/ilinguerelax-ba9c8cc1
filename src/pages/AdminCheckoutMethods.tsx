import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import AdminNav from "@/components/admin/AdminNav";
import { adminInvoke } from "@/lib/adminInvoke";
import { invalidateCheckoutMethodsCache } from "@/hooks/useCheckoutMethodsConfig";
import { toast } from "sonner";
import { Lock, Plus, Trash2, Pencil, CreditCard, Banknote, Wallet, Smartphone, Eye, ShieldCheck, Building2, Zap, ArrowUp, ArrowDown, Save, Loader2 } from "lucide-react";

type Region = {
  code: string; name: string; flag?: string | null; currency: string;
  gateway?: string | null; description?: string | null;
  country_codes: string[]; enabled: boolean; sort_order: number;
};
type Method = {
  id: string; region_code: string; method_key: string; label: string;
  note?: string | null; icon: string; enabled: boolean; sort_order: number;
};

const ICONS: Record<string, any> = { CreditCard, Banknote, Wallet, Smartphone, Building2 };

const COUNTRY_LIST: { code: string; name: string; flag: string }[] = [
  { code: "*", name: "Global (fallback)", flag: "🌐" },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸" },
  { code: "CA", name: "Canadá", flag: "🇨🇦" },
  { code: "MX", name: "México", flag: "🇲🇽" },
  { code: "BR", name: "Brasil", flag: "🇧🇷" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "PE", name: "Perú", flag: "🇵🇪" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
  { code: "PA", name: "Panamá", flag: "🇵🇦" },
  { code: "DO", name: "R. Dominicana", flag: "🇩🇴" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹" },
  { code: "HN", name: "Honduras", flag: "🇭🇳" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮" },
  { code: "CU", name: "Cuba", flag: "🇨🇺" },
  { code: "ES", name: "España", flag: "🇪🇸" },
  { code: "FR", name: "Francia", flag: "🇫🇷" },
  { code: "DE", name: "Alemania", flag: "🇩🇪" },
  { code: "IT", name: "Italia", flag: "🇮🇹" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "NL", name: "Países Bajos", flag: "🇳🇱" },
  { code: "BE", name: "Bélgica", flag: "🇧🇪" },
  { code: "GB", name: "Reino Unido", flag: "🇬🇧" },
  { code: "IE", name: "Irlanda", flag: "🇮🇪" },
  { code: "CH", name: "Suiza", flag: "🇨🇭" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "SE", name: "Suecia", flag: "🇸🇪" },
  { code: "NO", name: "Noruega", flag: "🇳🇴" },
  { code: "DK", name: "Dinamarca", flag: "🇩🇰" },
  { code: "FI", name: "Finlandia", flag: "🇫🇮" },
  { code: "PL", name: "Polonia", flag: "🇵🇱" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "NZ", name: "Nueva Zelanda", flag: "🇳🇿" },
  { code: "JP", name: "Japón", flag: "🇯🇵" },
  { code: "KR", name: "Corea del Sur", flag: "🇰🇷" },
  { code: "SG", name: "Singapur", flag: "🇸🇬" },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "AE", name: "Emiratos", flag: "🇦🇪" },
  { code: "ZA", name: "Sudáfrica", flag: "🇿🇦" },
];

// Métodos válidos por país (mismo mapa que usa Auto Stripe en el backend).
const STRIPE_LOCAL_BY_COUNTRY: Record<string, string[]> = {
  US: ["stripe_cashapp", "stripe_us_bank_account", "stripe_affirm", "stripe_klarna", "stripe_afterpay_clearpay", "stripe_amazon_pay", "stripe_zip", "stripe_paypal"],
  CA: ["stripe_acss_debit", "stripe_klarna", "stripe_afterpay_clearpay", "stripe_paypal"],
  MX: ["stripe_oxxo", "stripe_paypal"],
  BR: ["stripe_boleto", "stripe_pix", "stripe_paypal"],
  PE: ["stripe_paypal"],
  DE: ["stripe_sepa_debit", "stripe_giropay", "stripe_sofort", "stripe_klarna", "stripe_amazon_pay", "stripe_paypal"],
  AT: ["stripe_sepa_debit", "stripe_eps", "stripe_sofort", "stripe_klarna", "stripe_paypal"],
  NL: ["stripe_sepa_debit", "stripe_ideal", "stripe_klarna", "stripe_paypal"],
  BE: ["stripe_sepa_debit", "stripe_bancontact", "stripe_klarna", "stripe_paypal"],
  FR: ["stripe_sepa_debit", "stripe_klarna", "stripe_revolut_pay", "stripe_paypal"],
  ES: ["stripe_sepa_debit", "stripe_klarna", "stripe_revolut_pay", "stripe_paypal"],
  IT: ["stripe_sepa_debit", "stripe_klarna", "stripe_revolut_pay", "stripe_satispay", "stripe_paypal"],
  PT: ["stripe_sepa_debit", "stripe_multibanco", "stripe_mb_way", "stripe_paypal"],
  IE: ["stripe_sepa_debit", "stripe_klarna", "stripe_paypal"],
  FI: ["stripe_sepa_debit", "stripe_klarna", "stripe_mobilepay", "stripe_paypal"],
  PL: ["stripe_p24", "stripe_blik", "stripe_klarna", "stripe_paypal"],
  GB: ["stripe_bacs_debit", "stripe_klarna", "stripe_afterpay_clearpay", "stripe_amazon_pay", "stripe_revolut_pay", "stripe_paypal"],
  CH: ["stripe_twint", "stripe_klarna", "stripe_revolut_pay", "stripe_paypal"],
  SE: ["stripe_klarna", "stripe_paypal"],
  NO: ["stripe_klarna", "stripe_paypal"],
  DK: ["stripe_mobilepay", "stripe_klarna", "stripe_paypal"],
  AU: ["stripe_au_becs_debit", "stripe_afterpay_clearpay", "stripe_zip", "stripe_paypal", "stripe_amazon_pay"],
  NZ: ["stripe_afterpay_clearpay", "stripe_paypal"],
  JP: ["stripe_konbini", "stripe_paypal"],
  KR: ["stripe_kakao_pay", "stripe_naver_pay", "stripe_payco", "stripe_samsung_pay", "stripe_paypal"],
  SG: ["stripe_paynow", "stripe_grabpay", "stripe_alipay", "stripe_paypal"],
  MY: ["stripe_fpx", "stripe_grabpay", "stripe_paypal"],
  HK: ["stripe_alipay", "stripe_wechat_pay", "stripe_paypal"],
  TH: ["stripe_promptpay", "stripe_paypal"],
  IN: ["stripe_paypal"],
};

const QUICK_METHODS: { key: string; label: string; note: string; icon: string }[] = [
  { key: "stripe_card", label: "Tarjeta débito/crédito", note: "Visa · Mastercard · Amex · Apple Pay · Google Pay", icon: "CreditCard" },
  { key: "stripe_link", label: "Link (Stripe)", note: "1-click checkout", icon: "Wallet" },
  { key: "stripe_paypal", label: "PayPal (vía Stripe)", note: "Cuenta PayPal", icon: "Wallet" },
  { key: "stripe_cashapp", label: "Cash App Pay", note: "USA", icon: "Smartphone" },
  { key: "stripe_us_bank_account", label: "Transferencia ACH", note: "USA", icon: "Building2" },
  { key: "stripe_affirm", label: "Affirm", note: "USA · a plazos", icon: "CreditCard" },
  { key: "stripe_klarna", label: "Klarna", note: "Pago a plazos", icon: "CreditCard" },
  { key: "stripe_afterpay_clearpay", label: "Afterpay / Clearpay", note: "AU · NZ · UK · US", icon: "CreditCard" },
  { key: "stripe_amazon_pay", label: "Amazon Pay", note: "Cuenta Amazon", icon: "Wallet" },
  { key: "stripe_revolut_pay", label: "Revolut Pay", note: "UE / UK", icon: "Wallet" },
  { key: "stripe_zip", label: "Zip", note: "AU · US", icon: "CreditCard" },
  { key: "stripe_acss_debit", label: "Débito bancario CA", note: "Canadá", icon: "Banknote" },
  { key: "stripe_sepa_debit", label: "SEPA Débito", note: "Zona euro", icon: "Building2" },
  { key: "stripe_ideal", label: "iDEAL", note: "Países Bajos", icon: "Banknote" },
  { key: "stripe_bancontact", label: "Bancontact", note: "Bélgica", icon: "Banknote" },
  { key: "stripe_giropay", label: "Giropay", note: "Alemania", icon: "Building2" },
  { key: "stripe_sofort", label: "Sofort", note: "DE · AT", icon: "Building2" },
  { key: "stripe_eps", label: "EPS", note: "Austria", icon: "Building2" },
  { key: "stripe_p24", label: "Przelewy24", note: "Polonia", icon: "Building2" },
  { key: "stripe_blik", label: "BLIK", note: "Polonia", icon: "Smartphone" },
  { key: "stripe_bacs_debit", label: "Bacs Débito", note: "Reino Unido", icon: "Banknote" },
  { key: "stripe_multibanco", label: "Multibanco", note: "Portugal", icon: "Banknote" },
  { key: "stripe_mb_way", label: "MB WAY", note: "Portugal", icon: "Smartphone" },
  { key: "stripe_mobilepay", label: "MobilePay", note: "DK · FI", icon: "Smartphone" },
  { key: "stripe_twint", label: "TWINT", note: "Suiza", icon: "Smartphone" },
  { key: "stripe_satispay", label: "Satispay", note: "Italia", icon: "Smartphone" },
  
  { key: "stripe_oxxo", label: "OXXO", note: "México · efectivo", icon: "Banknote" },
  { key: "stripe_boleto", label: "Boleto", note: "Brasil", icon: "Banknote" },
  { key: "stripe_pix", label: "Pix", note: "Brasil", icon: "Smartphone" },
  { key: "stripe_au_becs_debit", label: "BECS Débito AU", note: "Australia", icon: "Banknote" },
  { key: "stripe_konbini", label: "Konbini", note: "Japón", icon: "Banknote" },
  { key: "stripe_paynow", label: "PayNow", note: "Singapur", icon: "Smartphone" },
  { key: "stripe_promptpay", label: "PromptPay", note: "Tailandia", icon: "Smartphone" },
  { key: "stripe_fpx", label: "FPX", note: "Malasia", icon: "Building2" },
  { key: "stripe_grabpay", label: "GrabPay", note: "SG · MY", icon: "Smartphone" },
  { key: "stripe_alipay", label: "Alipay", note: "Asia", icon: "Smartphone" },
  { key: "stripe_wechat_pay", label: "WeChat Pay", note: "China", icon: "Smartphone" },
  { key: "stripe_kakao_pay", label: "Kakao Pay", note: "Corea", icon: "Smartphone" },
  { key: "stripe_naver_pay", label: "Naver Pay", note: "Corea", icon: "Smartphone" },
  { key: "paypal", label: "PayPal", note: "Global", icon: "Wallet" },
];

// Devuelve solo los método_key válidos para los países ISO de la región.
// Tarjeta, Link y PayPal siempre están disponibles.
function methodsForRegion(countryCodes: string[]): Set<string> {
  const out = new Set<string>(["stripe_card", "stripe_link", "paypal"]);
  for (const raw of countryCodes) {
    const cc = String(raw || "").toUpperCase();
    if (!cc || cc === "*") continue;
    (STRIPE_LOCAL_BY_COUNTRY[cc] || []).forEach(k => out.add(k));
  }
  return out;
}


const PREVIEW_SKU = "1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion";

const emptyRegion = (): Region => ({
  code: "", name: "", flag: "🌐", currency: "USD",
  gateway: "Stripe", description: "", country_codes: [], enabled: true, sort_order: 99,
});
const emptyMethod = (region_code: string): Method => ({
  id: "", region_code, method_key: "", label: "",
  note: "", icon: "CreditCard", enabled: true, sort_order: 99,
});

export default function AdminCheckoutMethods() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [methods, setMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionEdit, setRegionEdit] = useState<Region | null>(null);
  const [methodEdit, setMethodEdit] = useState<Method | null>(null);
  const [savingRegion, setSavingRegion] = useState<string | null>(null);
  const [savingDialog, setSavingDialog] = useState(false);

  async function load() {
    invalidateCheckoutMethodsCache();
    setLoading(true);
    const { data, error } = await adminInvoke<any>("manage-checkout-methods", { body: { action: "list" } });
    if (error || data?.error) { toast.error(error?.message || data?.error); setLoading(false); return; }
    setRegions(data.regions || []);
    setMethods(data.methods || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function saveRegion(r: Region, opts: { fromDialog?: boolean } = {}) {
    const code = r.code.trim().toUpperCase();
    if (!code) return toast.error("Código requerido");
    if (!/^[A-Z0-9_-]{1,32}$/.test(code)) return toast.error("Código inválido (A-Z, 0-9, _-)");
    if (!r.name.trim()) return toast.error("Nombre requerido");
    if (!r.currency.trim()) return toast.error("Moneda requerida");

    if (opts.fromDialog) setSavingDialog(true); else setSavingRegion(code);
    // Optimistic UI: reflect changes immediately in the card grid.
    const payload: Region = { ...r, code };
    setRegions(prev => {
      const idx = prev.findIndex(x => x.code === code);
      if (idx < 0) return [...prev, payload].sort((a, b) => a.sort_order - b.sort_order);
      const next = prev.slice(); next[idx] = payload; return next;
    });
    try {
      const { data, error } = await adminInvoke<any>("manage-checkout-methods", {
        body: { action: "save_region", region: payload },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      toast.success("✅ Región guardada");
      if (opts.fromDialog) setRegionEdit(null);
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Error al guardar");
      await load();
    } finally {
      setSavingDialog(false);
      setSavingRegion(null);
    }
  }
  async function deleteRegion(code: string) {
    if (!confirm(`Eliminar región ${code} y sus métodos?`)) return;
    const { data, error } = await adminInvoke<any>("manage-checkout-methods", {
      body: { action: "delete_region", code },
    });
    if (error || data?.error) return toast.error(error?.message || data?.error);
    toast.success("Eliminada"); load();
  }
  async function saveMethod(m: Method) {
    if (!m.method_key.trim()) return toast.error("Clave requerida");
    if (!/^[a-z0-9_]{1,48}$/.test(m.method_key)) return toast.error("Clave inválida (a-z, 0-9, _)");
    if (!m.label.trim()) return toast.error("Etiqueta requerida");
    setSavingDialog(true);
    try {
      const { data, error } = await adminInvoke<any>("manage-checkout-methods", {
        body: { action: "save_method", method: m },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      toast.success("✅ Método guardado");
      setMethodEdit(null);
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Error al guardar");
    } finally {
      setSavingDialog(false);
    }
  }
  async function deleteMethod(id: string) {
    if (!confirm("Eliminar método?")) return;
    const { data, error } = await adminInvoke<any>("manage-checkout-methods", {
      body: { action: "delete_method", id },
    });
    if (error || data?.error) return toast.error(error?.message || data?.error);
    toast.success("Eliminado"); load();
  }
  async function toggleMethod(m: Method) {
    setMethods(prev => prev.map(x => x.id === m.id ? { ...x, enabled: !m.enabled } : x));
    const { data, error } = await adminInvoke<any>("manage-checkout-methods", {
      body: { action: "toggle_method", id: m.id, enabled: !m.enabled },
    });
    if (error || data?.error) { toast.error(error?.message || data?.error); load(); }
  }
  async function autofillStripe(code: string) {
    if (!confirm(`Auto-rellenar métodos Stripe disponibles según los países de ${code}?\nNo borra métodos existentes; solo añade o actualiza los de Stripe.`)) return;
    const { data, error } = await adminInvoke<any>("manage-checkout-methods", {
      body: { action: "autofill_stripe", code },
    });
    if (error || data?.error) return toast.error(error?.message || data?.error);
    toast.success(`Añadidos ${data.added} métodos Stripe`);
    load();
  }

  async function syncAllStripe() {
    if (!confirm("Sincronizar TODAS las regiones Stripe con la matriz oficial de métodos por país?\nRefresca Klarna/Affirm/Link/SEPA/Bancontact/Pix/etc. según los países ISO. No borra métodos manuales.")) return;
    const t = toast.loading("Sincronizando con Stripe…");
    const { data, error } = await adminInvoke<any>("manage-checkout-methods", {
      body: { action: "sync_all_stripe" },
    });
    toast.dismiss(t);
    if (error || data?.error) return toast.error(error?.message || data?.error);
    toast.success(`✓ ${data.regions?.length || 0} regiones sincronizadas (${data.upserted} métodos)`);
    load();
  }



  async function quickAdd(region_code: string, q: typeof QUICK_METHODS[number]) {
    const existing = methods.find(m => m.region_code === region_code && m.method_key === q.key);
    if (existing) return toast.info(`${q.label} ya está agregado`);
    const m: Method = {
      id: "", region_code, method_key: q.key, label: q.label,
      note: q.note, icon: q.icon, enabled: true,
      sort_order: methods.filter(x => x.region_code === region_code).length + 1,
    };
    const { data, error } = await adminInvoke<any>("manage-checkout-methods", {
      body: { action: "save_method", method: m },
    });
    if (error || data?.error) return toast.error(error?.message || data?.error);
    toast.success(`+ ${q.label}`); load();
  }

  async function reorderMethod(m: Method, dir: -1 | 1) {
    const siblings = methods
      .filter(x => x.region_code === m.region_code)
      .sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label));
    const idx = siblings.findIndex(x => x.id === m.id);
    const targetIdx = idx + dir;
    if (idx < 0 || targetIdx < 0 || targetIdx >= siblings.length) return;
    const other = siblings[targetIdx];
    // Optimistic swap
    setMethods(prev => prev.map(x => {
      if (x.id === m.id) return { ...x, sort_order: other.sort_order };
      if (x.id === other.id) return { ...x, sort_order: m.sort_order };
      return x;
    }));
    const [r1, r2] = await Promise.all([
      adminInvoke<any>("manage-checkout-methods", { body: { action: "save_method", method: { ...m, sort_order: other.sort_order } } }),
      adminInvoke<any>("manage-checkout-methods", { body: { action: "save_method", method: { ...other, sort_order: m.sort_order } } }),
    ]);
    if (r1.error || r1.data?.error || r2.error || r2.data?.error) {
      toast.error("No se pudo reordenar");
      load();
    }
  }



  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background py-10 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <header className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <Lock className="w-3.5 h-3.5" /> Vista privada · solo admin
            </div>
            <h1 className="text-3xl font-bold">Métodos de pago por región</h1>
            <p className="text-muted-foreground text-sm">
              Configura qué métodos aparecen en cada país/región según la IP del comprador.
              El cliente <strong>no</strong> ve esta página.
            </p>
          </header>

          <Card className="p-4 border-primary/30 bg-primary/5 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold mr-2">Vista previa checkout:</span>
            <Button asChild size="sm">
              <a href={`/checkout/${PREVIEW_SKU}?country=PE`} target="_blank" rel="noreferrer">🇵🇪 Perú</a>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <a href={`/checkout/${PREVIEW_SKU}?country=US`} target="_blank" rel="noreferrer">🇺🇸 USA (Stripe)</a>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <a href={`/checkout/${PREVIEW_SKU}?country=DE`} target="_blank" rel="noreferrer">🌎 Global (Stripe)</a>
            </Button>
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="outline" onClick={syncAllStripe}>
                <Zap className="w-4 h-4 mr-1" /> Sincronizar Stripe
              </Button>
              <Button size="sm" onClick={() => setRegionEdit(emptyRegion())}>
                <Plus className="w-4 h-4 mr-1" /> Nueva región
              </Button>
            </div>
          </Card>

          {loading && <Card className="p-8 text-center text-muted-foreground">Cargando…</Card>}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {regions.map((r) => {
              const rms = methods
                .filter(m => m.region_code === r.code)
                .sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label));
              return (
                <Card key={r.code} className={`p-5 border-2 ${r.enabled ? "border-primary/40" : "border-muted opacity-60"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <span className="text-2xl">{r.flag || "🌐"}</span> {r.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.currency} · {r.gateway || "—"}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Países: {r.country_codes.length ? r.country_codes.join(", ") : "—"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge variant="outline" className="text-[10px]">{r.code}</Badge>
                      <div className="flex gap-1">
                        <Button size="sm" variant="default" className="h-7 px-2" onClick={() => saveRegion(r)} disabled={savingRegion === r.code}>
                          {savingRegion === r.code ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                          Guardar
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setRegionEdit(r)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteRegion(r.code)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {r.description && <p className="text-xs text-muted-foreground mb-3">{r.description}</p>}

                  {(() => {
                    const previewCountry = (r.country_codes.find(c => c && c !== "*") || "").toUpperCase();
                    const isCore = r.code === "PE" || r.code === "US" || r.code === "GLOBAL" || r.code === "*";
                    return (
                      <div className="mb-3 flex flex-wrap items-center gap-2 p-2 rounded border border-dashed bg-muted/30">
                        <Button
                          asChild={!!previewCountry}
                          disabled={!previewCountry}
                          size="sm"
                          variant={isCore ? "outline" : "default"}
                          className="h-8"
                        >
                          {previewCountry ? (
                            <a
                              href={`/checkout/${PREVIEW_SKU}?country=${previewCountry}&preview_region=${r.code}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              Vista previa ({previewCountry})
                            </a>
                          ) : (
                            <span><Eye className="w-3.5 h-3.5 mr-1 inline" />Agrega un país ISO</span>
                          )}
                        </Button>
                        {isCore ? (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-primary" /> Región base — no se toca
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">
                            Aislado · no afecta Perú ni Global
                          </span>
                        )}
                      </div>
                    );
                  })()}


                  <div className="space-y-1.5">
                    {rms.map((m, idx) => {
                      const Icon = ICONS[m.icon] || CreditCard;
                      const isFirst = idx === 0;
                      const isLast = idx === rms.length - 1;
                      return (
                        <div key={m.id} className={`flex items-center gap-2 text-sm p-2 rounded border ${m.enabled ? "bg-background" : "bg-muted/50 opacity-60"}`}>
                          <div className="flex flex-col shrink-0">
                            <button
                              type="button"
                              disabled={isFirst}
                              onClick={() => reorderMethod(m, -1)}
                              className="p-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Subir"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={isLast}
                              onClick={() => reorderMethod(m, 1)}
                              className="p-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Bajar"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                          <Badge variant="outline" className="text-[10px] tabular-nums px-1.5 py-0 shrink-0" title="Prioridad">
                            {idx + 1}
                          </Badge>
                          <Icon className="w-4 h-4 text-foreground/70 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium leading-tight truncate">{m.label}</div>
                            {m.note && <div className="text-[11px] text-muted-foreground truncate">{m.note}</div>}
                          </div>
                          <Switch checked={m.enabled} onCheckedChange={() => toggleMethod(m)} />
                          <Button size="icon" variant="ghost" onClick={() => setMethodEdit(m)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteMethod(m.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                    {(() => {
                      const valid = methodsForRegion(r.country_codes);
                      const available = QUICK_METHODS.filter(q => valid.has(q.key));
                      const countryList = r.country_codes.filter(c => c && c !== "*").join(", ") || "—";
                      return (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-[11px] font-medium text-muted-foreground mb-1.5">
                            Métodos Stripe disponibles en <span className="text-foreground">{countryList}</span>:
                          </p>
                          {available.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground italic">
                              Agrega países ISO a esta región para ver métodos disponibles.
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {available.map(q => {
                                const already = rms.some(m => m.method_key === q.key);
                                return (
                                  <button
                                    key={q.key}
                                    type="button"
                                    disabled={already}
                                    onClick={() => quickAdd(r.code, q)}
                                    className={`text-[11px] px-2 py-1 rounded border ${already ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed" : "bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary"}`}
                                    title={q.note}
                                  >
                                    {already ? "✓ " : "+ "}{q.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}




                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="p-4 bg-muted/40 text-xs text-muted-foreground space-y-1">
            <p><strong>Detección:</strong> IP del comprador vía ipapi.co → se busca el código de país en <code>country_codes</code> de cada región. La región con código <code>*</code> es el fallback global.</p>
            <p><strong>Nota técnica:</strong> desactivar un método aquí lo oculta de la UI del checkout. Para Stripe, los métodos habilitados se pasan como <code>payment_method_types</code> a la sesión.</p>
            <p><strong>⚡ Auto Stripe:</strong> según los países ISO de la región, añade automáticamente los métodos que Stripe soporta ahí: tarjeta + Link + wallets siempre; y locales por país (OXXO en MX, Cash App + ACH en US, SEPA en zona euro, iDEAL en NL, Bancontact en BE, Boleto/Pix en BR, Klarna/Affirm donde aplique, etc.). No borra los métodos manuales que ya tengas.</p>
          </Card>
        </div>
      </main>

      {/* Region editor */}
      <Dialog open={!!regionEdit} onOpenChange={(o) => !o && setRegionEdit(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{regionEdit?.code ? "Editar región" : "Nueva región"}</DialogTitle></DialogHeader>
          {regionEdit && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Código (único, MAYÚS)</Label>
                  <Input value={regionEdit.code} onChange={(e) => setRegionEdit({ ...regionEdit, code: e.target.value.toUpperCase() })} placeholder="MX" />
                </div>
                <div>
                  <Label>Bandera (emoji)</Label>
                  <Input value={regionEdit.flag || ""} onChange={(e) => setRegionEdit({ ...regionEdit, flag: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Nombre</Label>
                <Input value={regionEdit.name} onChange={(e) => setRegionEdit({ ...regionEdit, name: e.target.value })} placeholder="México" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Moneda</Label>
                  <Input value={regionEdit.currency} onChange={(e) => setRegionEdit({ ...regionEdit, currency: e.target.value })} placeholder="MXN" />
                </div>
                <div>
                  <Label>Proveedor de pago</Label>
                  <select
                    className="w-full border rounded h-10 px-2 bg-background"
                    value={regionEdit.gateway || "Stripe"}
                    onChange={(e) => setRegionEdit({ ...regionEdit, gateway: e.target.value })}
                  >
                    <option value="Stripe">Stripe (tarjeta + locales)</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Stripe+PayPal">Stripe + PayPal</option>
                    <option value="MercadoPago">Mercado Pago</option>
                    <option value="Manual">Manual (Yape/Plin/otros)</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Países (click para agregar/quitar)</Label>
                <div className="flex flex-wrap gap-1 mt-1 p-2 border rounded max-h-40 overflow-auto bg-muted/20">
                  {COUNTRY_LIST.map(c => {
                    const active = regionEdit.country_codes.includes(c.code);
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          const set = new Set(regionEdit.country_codes);
                          if (active) set.delete(c.code); else set.add(c.code);
                          setRegionEdit({ ...regionEdit, country_codes: Array.from(set) });
                        }}
                        className={`text-[11px] px-2 py-1 rounded border ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}
                        title={c.name}
                      >
                        {c.flag} {c.code}
                      </button>
                    );
                  })}
                </div>
                <Input
                  className="mt-2"
                  value={regionEdit.country_codes.join(",")}
                  onChange={(e) => setRegionEdit({ ...regionEdit, country_codes: e.target.value.split(",").map(s => s.trim().toUpperCase()).filter(Boolean) })}
                  placeholder="MX,GT,HN o * para fallback global"
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea rows={2} value={regionEdit.description || ""} onChange={(e) => setRegionEdit({ ...regionEdit, description: e.target.value })} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={regionEdit.enabled} onCheckedChange={(v) => setRegionEdit({ ...regionEdit, enabled: v })} />
                  <Label>Activa</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Orden</Label>
                  <Input type="number" className="w-20" value={regionEdit.sort_order}
                    onChange={(e) => setRegionEdit({ ...regionEdit, sort_order: Number(e.target.value) })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRegionEdit(null)}>Cancelar</Button>
            <Button onClick={() => regionEdit && saveRegion(regionEdit)}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Method editor */}
      <Dialog open={!!methodEdit} onOpenChange={(o) => !o && setMethodEdit(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{methodEdit?.id ? "Editar método" : "Nuevo método"}</DialogTitle></DialogHeader>
          {methodEdit && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Región</Label>
                  <Input value={methodEdit.region_code} disabled />
                </div>
                <div>
                  <Label>Clave (a-z, _)</Label>
                  <Input value={methodEdit.method_key}
                    onChange={(e) => setMethodEdit({ ...methodEdit, method_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                    placeholder="stripe_oxxo" />
                </div>
              </div>
              <div>
                <Label>Etiqueta</Label>
                <Input value={methodEdit.label} onChange={(e) => setMethodEdit({ ...methodEdit, label: e.target.value })} placeholder="OXXO" />
              </div>
              <div>
                <Label>Nota</Label>
                <Input value={methodEdit.note || ""} onChange={(e) => setMethodEdit({ ...methodEdit, note: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Icono</Label>
                  <select className="w-full border rounded h-10 px-2 bg-background" value={methodEdit.icon}
                    onChange={(e) => setMethodEdit({ ...methodEdit, icon: e.target.value })}>
                    {Object.keys(ICONS).map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Orden</Label>
                  <Input type="number" value={methodEdit.sort_order}
                    onChange={(e) => setMethodEdit({ ...methodEdit, sort_order: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={methodEdit.enabled} onCheckedChange={(v) => setMethodEdit({ ...methodEdit, enabled: v })} />
                <Label>Activo</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMethodEdit(null)}>Cancelar</Button>
            <Button onClick={() => methodEdit && saveMethod(methodEdit)}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
