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
import AdminCheckoutPreview from "@/components/admin/AdminCheckoutPreview";
import { adminInvoke } from "@/lib/adminInvoke";
import { invalidateCheckoutMethodsCache } from "@/hooks/useCheckoutMethodsConfig";
import { toast } from "sonner";
import { Lock, Plus, Trash2, Pencil, CreditCard, Banknote, Wallet, Smartphone, Eye, ShieldCheck, Building2, ArrowUp, ArrowDown, Save, Loader2 } from "lucide-react";
import { DLOCAL_COVERAGE, dlocalRails, getDlocalCountry, type DlocalKind } from "@/lib/dlocalCoverage";

/**
 * Etiquetas reales de dLocal Go por país, tomadas de /admin/dlocal.
 * Se usan como descripción de los métodos dLocal en /admin/checkout-methods
 * para que ambos paneles (y el checkout) muestren siempre lo mismo.
 */
const DLOCAL_KIND_BY_KEY: Record<string, DlocalKind> = {
  dlocal_transfer: "transfer",
  dlocal_bank: "transfer",
  dlocal: "transfer",
  dlocal_go: "transfer",
  dlocal_cash: "cash",
  dlocal_ticket: "cash",
  dlocal_wallet: "wallet",
  dlocal_mercadopago: "wallet",
};

export function dlocalNoteForCountries(methodKey: string, countryCodes: string[]): string | null {
  const kind = DLOCAL_KIND_BY_KEY[methodKey];
  if (!kind) return null;
  const codes = (countryCodes.length ? countryCodes : DLOCAL_COVERAGE.map((c) => c.code))
    .map((c) => c.toUpperCase())
    .filter((c) => !!getDlocalCountry(c));
  if (!codes.length) return null;
  const parts = codes
    .map((code) => {
      const c = getDlocalCountry(code)!;
      const rails = dlocalRails(code, kind);
      if (!rails.length) return null;
      const soon =
        (kind === "transfer" && c.transferComingSoon) ||
        (kind === "cash" && c.cashComingSoon) ||
        (kind === "wallet" && c.walletComingSoon);
      return `${c.flag} ${code}: ${rails.join(", ")}${soon ? " (muy pronto)" : ""}`;
    })
    .filter(Boolean) as string[];
  if (!parts.length) return null;
  return `dLocal Go · ${parts.join(" — ")}`;
}

/**
 * Etiqueta (título) del método dLocal según la cobertura real por país.
 * Ej.: BO → "Billetera digital (QR)", AR/MX → "Billetera digital".
 */
export function dlocalLabelForCountries(methodKey: string, countryCodes: string[]): string | null {
  const kind = DLOCAL_KIND_BY_KEY[methodKey];
  if (!kind) return null;
  if (kind === "transfer") return "Transferencia bancaria";
  if (kind === "cash") return "Pago en efectivo";
  const codes = countryCodes.map((c) => c.toUpperCase()).filter((c) => !!getDlocalCountry(c));
  const labels = Array.from(
    new Set(codes.map((c) => getDlocalCountry(c)!.walletLabel || "Billetera digital")),
  );
  return labels.length === 1 ? labels[0] : "Billetera digital";
}

/**
 * ¿La cobertura real de /admin/dlocal soporta este método en la región?
 * Devuelve null si el método no es de dLocal (no se sincroniza).
 * true  = hay rails activos (y no "muy pronto") en al menos un país de la región.
 * false = ningún país de la región tiene ese rail activo → debe quedar desactivado.
 */
export function dlocalCoverageEnabled(methodKey: string, countryCodes: string[]): boolean | null {
  const kind = DLOCAL_KIND_BY_KEY[methodKey];
  if (!kind) return null;
  const codes = (countryCodes.length ? countryCodes : DLOCAL_COVERAGE.map((c) => c.code))
    .map((c) => c.toUpperCase())
    .filter((c) => !!getDlocalCountry(c));
  if (!codes.length) return false;
  return codes.some((code) => {
    const c = getDlocalCountry(code)!;
    const soon =
      (kind === "transfer" && c.transferComingSoon) ||
      (kind === "cash" && c.cashComingSoon) ||
      (kind === "wallet" && c.walletComingSoon);
    return !soon && dlocalRails(code, kind).length > 0;
  });
}




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
  { code: "PR", name: "Puerto Rico", flag: "🇵🇷" },
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

type CheckoutMethodDef = {
  key: string;
  label: string;
  note: string;
  icon: string;
  regions?: ("PE" | "US" | "GLOBAL")[];
  countryCodes?: string[];
  baseStripe?: boolean;
};

const CHECKOUT_METHODS: CheckoutMethodDef[] = [
  { key: "stripe_card", label: "Stripe — tarjeta / wallets", note: "Tarjeta, Apple Pay, Google Pay y Link dentro de Stripe", icon: "CreditCard", regions: ["PE", "US", "GLOBAL"] },
  { key: "stripe_link", label: "Link (Stripe)", note: "Autocompletado con 1 clic de Stripe", icon: "Wallet", baseStripe: true },
  { key: "stripe_apple_pay", label: "Apple Pay", note: "iPhone / Safari", icon: "Smartphone", baseStripe: true },
  { key: "stripe_google_pay", label: "Google Pay", note: "Android / Chrome", icon: "Smartphone", baseStripe: true },
  { key: "stripe_us_bank_account", label: "Stripe — ACH transferencia", note: "Transferencia bancaria de USA dentro de Stripe", icon: "Building2", regions: ["US"] },
  { key: "stripe_cashapp", label: "Stripe — Cash App Pay", note: "Cash App para compradores de Estados Unidos dentro de Stripe", icon: "Smartphone", regions: ["US"] },
  { key: "stripe_klarna", label: "Stripe — Klarna (Pay in 4)", note: "Paga en 4 cuotas sin interés (USA/UE)", icon: "Wallet", regions: ["US", "GLOBAL"] },
  { key: "stripe_affirm", label: "Affirm", note: "Compra ahora, paga después", icon: "CreditCard", countryCodes: ["US", "*"] },
  { key: "stripe_afterpay_clearpay", label: "Afterpay / Clearpay", note: "Paga en 4", icon: "CreditCard", countryCodes: ["US", "CA", "GB", "AU", "NZ"] },
  { key: "stripe_paypal", label: "PayPal (vía Stripe)", note: "PayPal procesado por Stripe", icon: "Wallet", countryCodes: ["*", "US", "CA", "MX", "BR", "AR", "CL", "CO", "PE", "UY", "DE", "AT", "NL", "BE", "FR", "ES", "IT", "PT", "IE", "GB", "CH", "NO", "SE", "DK", "AU", "NZ", "JP", "KR", "SG", "HK", "IN", "AE", "ZA"] },
  { key: "stripe_oxxo", label: "OXXO", note: "Voucher efectivo México", icon: "Banknote", countryCodes: ["MX"] },
  { key: "stripe_boleto", label: "Boleto", note: "Voucher bancario Brasil", icon: "Banknote", countryCodes: ["BR"] },
  { key: "stripe_pix", label: "Pix", note: "Transferencia instantánea Brasil", icon: "Smartphone", countryCodes: ["BR"] },
  { key: "stripe_sepa_debit", label: "SEPA débito directo", note: "Zona euro", icon: "Banknote", countryCodes: ["DE", "AT", "NL", "BE", "FR", "ES", "IT", "PT", "IE", "FI"] },
  { key: "stripe_giropay", label: "Giropay", note: "Banca online Alemania", icon: "Building2", countryCodes: ["DE"] },
  { key: "stripe_sofort", label: "Sofort", note: "Transferencia instantánea DE/AT", icon: "Building2", countryCodes: ["DE", "AT"] },
  { key: "stripe_ideal", label: "iDEAL", note: "Banca online Países Bajos", icon: "Building2", countryCodes: ["NL"] },
  { key: "stripe_bancontact", label: "Bancontact", note: "Bélgica", icon: "Building2", countryCodes: ["BE"] },
  { key: "stripe_eps", label: "EPS", note: "Banca online Austria", icon: "Building2", countryCodes: ["AT"] },
  { key: "stripe_p24", label: "Przelewy24 (P24)", note: "Banca online Polonia", icon: "Building2", countryCodes: ["PL"] },
  { key: "stripe_blik", label: "BLIK", note: "Pago móvil Polonia", icon: "Smartphone", countryCodes: ["PL"] },
  { key: "stripe_multibanco", label: "Multibanco", note: "Portugal", icon: "Banknote", countryCodes: ["PT"] },
  { key: "stripe_mb_way", label: "MB WAY", note: "Pago móvil Portugal", icon: "Smartphone", countryCodes: ["PT"] },
  { key: "stripe_twint", label: "TWINT", note: "Suiza", icon: "Smartphone", countryCodes: ["CH"] },
  { key: "stripe_mobilepay", label: "MobilePay", note: "Dinamarca / Finlandia", icon: "Smartphone", countryCodes: ["DK", "FI"] },
  { key: "stripe_bacs_debit", label: "Bacs débito directo", note: "Reino Unido", icon: "Banknote", countryCodes: ["GB"] },
  { key: "stripe_acss_debit", label: "Débito bancario Canadá", note: "Débito preautorizado Canadá", icon: "Banknote", countryCodes: ["CA"] },
  { key: "stripe_alipay", label: "Alipay", note: "China / Asia", icon: "Smartphone", countryCodes: ["SG", "HK"] },
  { key: "stripe_wechat_pay", label: "WeChat Pay", note: "China", icon: "Smartphone", countryCodes: ["HK"] },
  { key: "stripe_grabpay", label: "GrabPay", note: "Sudeste asiático", icon: "Smartphone", countryCodes: ["SG"] },
  { key: "stripe_paynow", label: "PayNow", note: "Singapur", icon: "Smartphone", countryCodes: ["SG"] },
  { key: "stripe_konbini", label: "Konbini", note: "Tiendas de conveniencia Japón", icon: "Banknote", countryCodes: ["JP"] },
  { key: "paypal", label: "PayPal", note: "Botón separado de PayPal", icon: "Wallet", regions: ["PE", "US", "GLOBAL"] },
  { key: "mercadopago_transfer", label: "Mercado Pago — transferencia", note: "Banco / transferencia por Mercado Pago", icon: "Building2", regions: ["PE"] },
  { key: "mercadopago_cash", label: "Mercado Pago — efectivo", note: "PagoEfectivo / agentes disponibles", icon: "Banknote", regions: ["PE"] },
  { key: "yape_plin", label: "Yape / Plin", note: "Pago móvil manual Perú", icon: "Smartphone", regions: ["PE"] },
  { key: "binance_pay", label: "Binance Pay (USDT)", note: "Cripto manual · global · Verificación 1-24h", icon: "Wallet", regions: ["PE", "US", "GLOBAL"] },
  { key: "clabe_mx", label: "SPEI / CLABE (México)", note: "Transferencia manual MXN a CLABE mexicana · Verificación 1-24h", icon: "Building2", countryCodes: ["MX"] },
  { key: "dlocal_transfer", label: "Transferencia bancaria", note: "Transferencia bancaria local vía dLocal Go (SPEI MX, PSE CO, Pix BR, CBU AR, PagoEfectivo/transferencia PE…)", icon: "Building2", regions: ["PE", "GLOBAL"], countryCodes: ["AR", "BR", "CO", "EC", "MX", "PE", "UY", "BO", "CL", "CR", "GT", "PA", "PY"] },
  { key: "dlocal_cash", label: "Pago en efectivo", note: "Pago en efectivo/agentes vía dLocal Go (OXXO MX, Efecty CO, Boleto BR, Rapipago AR, PagoEfectivo PE…)", icon: "Banknote", regions: ["PE", "GLOBAL"], countryCodes: ["AR", "BR", "CO", "EC", "MX", "PE", "UY", "BO", "CL", "CR", "GT", "PA", "PY"] },
  { key: "dlocal_wallet", label: "Billetera digital", note: "Billeteras digitales locales vía dLocal Go (Yape/Plin PE, Nequi CO, MACH CL, PicPay BR…)", icon: "Smartphone", countryCodes: ["BO", "BR", "CL", "CO", "CR", "EC", "GT", "PA", "PE", "PY", "UY"] },
  { key: "dlocal_mercadopago", label: "Billetera digital (Mercado Pago)", note: "Mercado Pago y billeteras locales vía dLocal Go (Ualá/MODO AR, Spin by OXXO MX)", icon: "Wallet", countryCodes: ["AR", "MX"] },
  { key: "hotmart_1click", label: "Hotmart (1 clic)", note: "Redirige al enlace de Hotmart del producto según el país. Precio y moneda gestionados por Hotmart.", icon: "CreditCard", regions: ["PE", "US", "GLOBAL"] },
];


const CHECKOUT_METHOD_KEYS = new Set(CHECKOUT_METHODS.map(m => m.key));

function isCheckoutMethod(m: Method) {
  return CHECKOUT_METHOD_KEYS.has(m.method_key);
}

function availableMethodsForRegion(region: Region) {
  const isPeru = region.code === "PE" || region.country_codes.includes("PE");
  const isUs = region.code === "US" || region.country_codes.includes("US");
  const family = isPeru ? "PE" : isUs ? "US" : "GLOBAL";
  const codes = new Set(region.country_codes.map(c => c.toUpperCase()));
  const stripeGateway = String(region.gateway || "Stripe").toLowerCase().includes("stripe");
  return CHECKOUT_METHODS.filter(m => {
    if (m.baseStripe) return stripeGateway;
    if (m.regions?.includes(family)) return true;
    if (!m.countryCodes?.length) return false;
    if (m.countryCodes.includes("*") && (codes.size === 0 || codes.has("*"))) return true;
    return m.countryCodes.some(c => codes.has(c));
  });
}


const PREVIEW_SKU = "1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion";

const emptyRegion = (): Region => ({
  code: "", name: "", flag: "🌐", currency: "USD",
  gateway: "Stripe", description: "", country_codes: [], enabled: true, sort_order: 99,
});
export default function AdminCheckoutMethods() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [methods, setMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionEdit, setRegionEdit] = useState<Region | null>(null);
  const [methodEdit, setMethodEdit] = useState<Method | null>(null);
  const [savingRegion, setSavingRegion] = useState<string | null>(null);
  const [savingDialog, setSavingDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const PAGE_SIZE = isMobile ? 2 : 5;
  const [search, setSearch] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterGateway, setFilterGateway] = useState("");
  const [syncingDlocal, setSyncingDlocal] = useState(false);


  async function load() {
    invalidateCheckoutMethodsCache();
    setLoading(true);
    const { data, error } = await adminInvoke<any>("manage-checkout-methods", { body: { action: "list" } });
    if (error || data?.error) { toast.error(error?.message || data?.error); setLoading(false); return; }
    const regs: Region[] = data.regions || [];
    const mets: Method[] = data.methods || [];
    setRegions(regs);
    setMethods(mets);
    setLoading(false);
    void syncDlocalCoverage(regs, mets);
  }

  /**
   * Sincroniza automáticamente los métodos dLocal de /admin/checkout-methods
   * con la cobertura activa/desactivada de /admin/dlocal, para todos los países.
   */
  async function syncDlocalCoverage(regs: Region[], mets: Method[]) {
    const byCode = new Map(regs.map((r) => [r.code, r]));
    const pending = mets.filter((m) => {
      const r = byCode.get(m.region_code);
      if (!r || !m.id) return false;
      const should = dlocalCoverageEnabled(m.method_key, r.country_codes || []);
      return should !== null && should !== m.enabled;
    });
    if (!pending.length) return;
    const results: string[] = [];
    for (const m of pending) {
      const r = byCode.get(m.region_code)!;
      const should = dlocalCoverageEnabled(m.method_key, r.country_codes || [])!;
      const { data, error } = await adminInvoke<any>("manage-checkout-methods", {
        body: { action: "toggle_method", id: m.id, enabled: should },
      });
      if (error || data?.error) continue;
      setMethods((prev) => prev.map((x) => (x.id === m.id ? { ...x, enabled: should } : x)));
      results.push(`${r.flag || ""} ${r.code} · ${m.label} ${should ? "activado" : "desactivado"}`);
    }
    if (results.length) {
      invalidateCheckoutMethodsCache();
      toast.success(`🔄 Sincronizado con /admin/dlocal (${results.length})`, {
        description: results.slice(0, 6).join(" — "),
        duration: 8000,
      });
    }
  }

  /**
   * Botón manual: reescribe las etiquetas/notas de TODOS los métodos dLocal
   * usando la cobertura activa de /admin/dlocal y sincroniza activado/desactivado.
   * Reporta cambios aplicados y errores.
   */
  async function syncDlocalLabels() {
    setSyncingDlocal(true);
    const byCode = new Map(regions.map((r) => [r.code, r]));
    const changed: string[] = [];
    const errors: string[] = [];
    let checked = 0;
    try {
      for (const m of methods) {
        const r = byCode.get(m.region_code);
        if (!r || !m.id) continue;
        const note = dlocalNoteForCountries(m.method_key, r.country_codes || []);
        if (note === null) continue; // no es método dLocal
        checked++;
        const should = dlocalCoverageEnabled(m.method_key, r.country_codes || []);
        const label = dlocalLabelForCountries(m.method_key, r.country_codes || []) || m.label;
        const needsNote = (m.note || "") !== note;
        const needsLabel = (m.label || "") !== label;
        const needsEnabled = should !== null && should !== m.enabled;
        if (!needsNote && !needsLabel && !needsEnabled) continue;
        const payload: Method = { ...m, label, note, enabled: should ?? m.enabled };
        const { data, error } = await adminInvoke<any>("manage-checkout-methods", {
          body: { action: "save_method", method: payload },
        });
        if (error || data?.error) {
          errors.push(`${r.code} · ${m.label}: ${error?.message || data?.error}`);
          continue;
        }
        setMethods((prev) => prev.map((x) => (x.id === m.id ? payload : x)));
        changed.push(
          `${r.flag || ""} ${r.code} · ${m.label}${needsNote ? " (etiquetas)" : ""}${
            needsEnabled ? (payload.enabled ? " (activado)" : " (desactivado)") : ""
          }`,
        );
      }
      invalidateCheckoutMethodsCache();
      if (errors.length) {
        toast.error(`⚠️ ${errors.length} error(es) al sincronizar`, {
          description: errors.slice(0, 5).join(" — "),
          duration: 12000,
        });
      }
      if (changed.length) {
        toast.success(`🔄 ${changed.length} de ${checked} métodos dLocal actualizados`, {
          description: changed.slice(0, 8).join(" — "),
          duration: 10000,
        });
      } else if (!errors.length) {
        toast.success(`✅ Todo al día: ${checked} métodos dLocal ya coinciden con /admin/dlocal`);
      }
    } finally {
      setSyncingDlocal(false);
    }
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
      const added = Number(data?.autofilled || 0);
      toast.success(
        added > 0
          ? `✅ Región ${code} guardada · ${added} métodos Stripe auto-agregados según país`
          : `✅ Región ${code} guardada correctamente`
      );
      if (opts.fromDialog) setRegionEdit(null);
      invalidateCheckoutMethodsCache();
      await load();
    } catch (e) {
      toast.error(`❌ Error al guardar región ${code}: ${(e as Error).message || "desconocido"}`, {
        action: { label: "Reintentar", onClick: () => saveRegion(r, opts) },
        duration: 10000,
      });
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
  async function duplicateRegion(r: Region) {
    const target = prompt(`Duplicar región "${r.name}" (${r.code}) a otro país.\n\nCódigo ISO destino (ej: AR, CO, CL, BR):`, "")?.trim().toUpperCase();
    if (!target) return;
    if (target === r.code) return toast.error("El destino no puede ser igual al origen");
    if (regions.some(x => x.code === target)) return toast.error(`Ya existe una región ${target}`);
    const meta = COUNTRY_LIST.find(c => c.code === target);
    const newRegion: Region = {
      ...r,
      code: target,
      name: meta?.name || target,
      flag: meta?.flag || r.flag,
      country_codes: [target],
      sort_order: (regions.reduce((mx, x) => Math.max(mx, x.sort_order), 0) || 0) + 1,
    };
    const src = methods.filter(m => m.region_code === r.code);
    setSavingRegion(target);
    try {
      const { data: rd, error: re } = await adminInvoke<any>("manage-checkout-methods", {
        body: { action: "save_region", region: newRegion },
      });
      if (re || rd?.error) throw new Error(re?.message || rd?.error);
      let copied = 0;
      for (const m of src) {
        const payload = { ...m, id: undefined, region_code: target };
        const { data: md, error: me } = await adminInvoke<any>("manage-checkout-methods", {
          body: { action: "save_method", method: payload },
        });
        if (!me && !md?.error) copied++;
      }
      toast.success(`✅ Región ${target} duplicada · ${copied}/${src.length} métodos copiados`);
      invalidateCheckoutMethodsCache();
      await load();
    } catch (e) {
      toast.error(`❌ No se pudo duplicar: ${(e as Error).message || "error"}`);
      await load();
    } finally {
      setSavingRegion(null);
    }
  }
  async function saveMethod(m: Method) {
    const method_key = m.method_key.trim().toLowerCase();
    const label = m.label.trim();
    if (!method_key) return toast.error("Tipo de método requerido");
    if (!/^[a-z0-9_]{1,48}$/.test(method_key)) return toast.error("method_key inválido (a-z, 0-9, _)");
    if (!label) return toast.error("Etiqueta requerida");
    const payload = { ...m, method_key, label, sort_order: Number(m.sort_order || 0) };
    setSavingDialog(true);
    setMethods(prev => {
      const idx = prev.findIndex(x => x.id && x.id === payload.id);
      if (idx >= 0) {
        const next = prev.slice(); next[idx] = payload; return next;
      }
      const byKey = prev.findIndex(x => x.region_code === payload.region_code && x.method_key === payload.method_key);
      if (byKey >= 0) {
        const next = prev.slice(); next[byKey] = { ...next[byKey], ...payload, id: next[byKey].id }; return next;
      }
      return [...prev, payload];
    });
    try {
      const { data, error } = await adminInvoke<any>("manage-checkout-methods", {
        body: { action: "save_method", method: payload },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      toast.success("✅ Método guardado");
      setMethodEdit(null);
      invalidateCheckoutMethodsCache();
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Error al guardar");
      await load();
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
    toast.success("Eliminado"); invalidateCheckoutMethodsCache(); load();
  }
  async function toggleMethod(m: Method) {
    const nextEnabled = !m.enabled;
    setMethods(prev => prev.map(x => x.id === m.id ? { ...x, enabled: nextEnabled } : x));
    const { data, error } = await adminInvoke<any>("manage-checkout-methods", {
      body: { action: "toggle_method", id: m.id, enabled: nextEnabled },
    });
    if (error || data?.error) {
      // Revert optimistic change
      setMethods(prev => prev.map(x => x.id === m.id ? { ...x, enabled: m.enabled } : x));
      toast.error(`❌ ${m.label}: ${error?.message || data?.error || "no se pudo actualizar"}`, {
        action: { label: "Reintentar", onClick: () => toggleMethod(m) },
        duration: 10000,
      });
      return;
    }
    toast.success(`${nextEnabled ? "✅" : "⏸️"} ${m.label} ${nextEnabled ? "activado" : "desactivado"}`);
    invalidateCheckoutMethodsCache();
  }



  async function quickAdd(region_code: string, q: typeof CHECKOUT_METHODS[number]) {
    const existing = methods.find(m => m.region_code === region_code && m.method_key === q.key);
    if (existing) {
      const prevEnabled = existing.enabled;
      const nextEnabled = !prevEnabled;
      setMethods(prev => prev.map(x => x.id === existing.id ? { ...x, enabled: nextEnabled } : x));
      const { data, error } = await adminInvoke<any>("manage-checkout-methods", {
        body: { action: "toggle_method", id: existing.id, enabled: nextEnabled },
      });
      if (error || data?.error) {
        setMethods(prev => prev.map(x => x.id === existing.id ? { ...x, enabled: prevEnabled } : x));
        toast.error(`❌ ${q.label}: ${error?.message || data?.error}`, {
          action: { label: "Reintentar", onClick: () => quickAdd(region_code, q) },
          duration: 10000,
        });
        return;
      }
      toast.success(`${nextEnabled ? "✅" : "⏸️"} ${q.label} ${nextEnabled ? "activado" : "desactivado"}`);
      invalidateCheckoutMethodsCache();
      return;
    }
    const m: Method = {
      id: "", region_code, method_key: q.key, label: q.label,
      note: dlocalNoteForCountries(q.key, (regions.find(r => r.code === region_code)?.country_codes) || []) || q.note, icon: q.icon, enabled: true,
      sort_order: methods.filter(x => x.region_code === region_code).length + 1,
    };
    const { data, error } = await adminInvoke<any>("manage-checkout-methods", {
      body: { action: "save_method", method: m },
    });
    if (error || data?.error) {
      toast.error(`❌ ${q.label}: ${error?.message || data?.error}`, {
        action: { label: "Reintentar", onClick: () => quickAdd(region_code, q) },
        duration: 10000,
      });
      return;
    }
    toast.success(`+ ${q.label}`); invalidateCheckoutMethodsCache(); load();
  }

  async function reorderMethod(m: Method, dir: -1 | 1) {
    const siblings = methods
      .filter(x => x.region_code === m.region_code)
      .sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label));
    const idx = siblings.findIndex(x => x.id === m.id);
    const targetIdx = idx + dir;
    if (idx < 0 || targetIdx < 0 || targetIdx >= siblings.length) return;

    // Move the item and re-index the whole list sequentially. Swapping the two
    // sort_order values alone fails whenever siblings share the same value
    // (e.g. every method saved with 0/1), which made "mover hacia abajo" look broken.
    const ordered = [...siblings];
    const [moved] = ordered.splice(idx, 1);
    ordered.splice(targetIdx, 0, moved);

    const nextOrder = new Map<string, number>();
    ordered.forEach((x, i) => nextOrder.set(x.id, i + 1));

    // Optimistic update
    setMethods(prev => prev.map(x =>
      nextOrder.has(x.id) ? { ...x, sort_order: nextOrder.get(x.id)! } : x
    ));

    // Persist only the rows whose position actually changed
    const changed = ordered.filter(x => x.sort_order !== nextOrder.get(x.id));
    const results = await Promise.all(
      changed.map(x => adminInvoke<any>("manage-checkout-methods", {
        body: { action: "save_method", method: { ...x, sort_order: nextOrder.get(x.id)! } },
      }))
    );
    if (results.some(r => r.error || r.data?.error)) {
      toast.error("No se pudo reordenar");
      load();
      return;
    }
    invalidateCheckoutMethodsCache();
  }




  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background py-4 sm:py-10 px-3 sm:px-4">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
          <header className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <Lock className="w-3.5 h-3.5" /> Vista privada · solo admin
            </div>
            <h1 className="text-xl sm:text-3xl font-bold leading-tight">Métodos de pago por región</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Configura qué métodos aparecen en cada país/región según la IP del comprador.
              El cliente <strong>no</strong> ve esta página.
            </p>
          </header>

          <Card className="p-3 sm:p-4 border-primary/30 bg-primary/5">
            <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 sm:justify-end">
              <Button size="sm" variant="outline" className="h-9 w-full sm:w-auto" onClick={async () => {
                if (!confirm("Auto-rellenar métodos Stripe oficiales para TODAS las regiones Stripe? (upsert — no borra métodos manuales)")) return;
                const { data, error } = await adminInvoke<any>("manage-checkout-methods", { body: { action: "sync_all_stripe" } });
                if (error || data?.error) return toast.error(error?.message || data?.error);
                toast.success(`✅ ${data.regions?.length || 0} regiones sincronizadas (${data.upserted} métodos)`);
                invalidateCheckoutMethodsCache(); load();
              }}>
                ⚡ Auto Stripe (todas)
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-9 w-full sm:w-auto"
                disabled={syncingDlocal || loading}
                onClick={syncDlocalLabels}
                title="Reescribe las etiquetas de los métodos dLocal usando la cobertura activa de /admin/dlocal"
              >
                {syncingDlocal ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                🔄 Sincronizar etiquetas dLocal
              </Button>
              <Button size="sm" className="h-9 w-full sm:w-auto" onClick={() => setRegionEdit(emptyRegion())}>

                <Plus className="w-4 h-4 mr-1" /> Nueva región
              </Button>
            </div>
          </Card>

          <AdminCheckoutPreview regions={regions} methods={methods} />


          {loading && <Card className="p-8 text-center text-muted-foreground">Cargando…</Card>}

          {(() => {
            const q = search.trim().toLowerCase();
            const fc = filterCountry.trim().toUpperCase();
            const fg = filterGateway.trim().toLowerCase();
            const filteredRegions = regions.filter(r => {
              if (fg && !(r.gateway || "").toLowerCase().includes(fg)) return false;
              if (fc && !r.country_codes.map(c => c.toUpperCase()).includes(fc)) return false;
              if (q) {
                const inRegion =
                  r.name.toLowerCase().includes(q) ||
                  r.code.toLowerCase().includes(q) ||
                  (r.gateway || "").toLowerCase().includes(q) ||
                  r.country_codes.some(c => c.toLowerCase().includes(q));
                const inMethods = methods.some(m =>
                  m.region_code === r.code &&
                  (m.label.toLowerCase().includes(q) || m.method_key.toLowerCase().includes(q))
                );
                if (!inRegion && !inMethods) return false;
              }
              return true;
            });
            const gateways = Array.from(new Set(regions.map(r => r.gateway).filter(Boolean))) as string[];
            const totalPages = Math.max(1, Math.ceil(filteredRegions.length / PAGE_SIZE));
            const currentPage = Math.min(page, totalPages);
            const start = (currentPage - 1) * PAGE_SIZE;
            const pageRegions = filteredRegions.slice(start, start + PAGE_SIZE);
            const hasFilters = !!(q || fc || fg);
            return (
              <>
                <Card className="p-3 sm:p-4 space-y-2">
                  <div className="grid gap-2 sm:grid-cols-[1fr_180px_200px_auto]">
                    <Input
                      placeholder="🔍 Buscar región, método, país…"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      className="h-9"
                    />
                    <Input
                      placeholder="País ISO (ej: MX, US)"
                      value={filterCountry}
                      onChange={(e) => { setFilterCountry(e.target.value.toUpperCase()); setPage(1); }}
                      maxLength={3}
                      className="h-9 uppercase"
                    />
                    <select
                      value={filterGateway}
                      onChange={(e) => { setFilterGateway(e.target.value); setPage(1); }}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      <option value="">Todos los gateways</option>
                      {gateways.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9"
                      disabled={!hasFilters}
                      onClick={() => { setSearch(""); setFilterCountry(""); setFilterGateway(""); setPage(1); }}
                    >
                      Limpiar
                    </Button>
                  </div>
                  {hasFilters && (
                    <p className="text-[11px] text-muted-foreground">
                      {filteredRegions.length} de {regions.length} regiones coinciden
                    </p>
                  )}
                </Card>

                {filteredRegions.length === 0 && !loading && (
                  <Card className="p-6 text-center text-sm text-muted-foreground">
                    Sin resultados para los filtros actuales.
                  </Card>
                )}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {pageRegions.map((r) => {
                    const rms = methods
                      .filter(m => m.region_code === r.code)
                      .sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label));
              return (
                <Card key={r.code} className={`p-3 sm:p-5 border-2 ${r.enabled ? "border-primary/40" : "border-muted opacity-60"}`}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 leading-tight">
                        <span className="text-xl sm:text-2xl">{r.flag || "🌐"}</span>
                        <span className="truncate">{r.name}</span>
                      </h3>
                      <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                        {r.currency} · {r.gateway || "—"}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 break-words">
                        Países: {r.country_codes.length ? r.country_codes.join(", ") : "—"}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{r.code}</Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 mb-3">
                    <Button size="sm" variant="default" className="h-8 px-2 text-xs" onClick={() => saveRegion(r)} disabled={savingRegion === r.code}>
                      {savingRegion === r.code ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                      Guardar
                    </Button>
                    <Button size="sm" variant="secondary" className="h-8 px-2 text-xs" title="Auto-rellenar métodos Stripe oficiales" onClick={async () => {
                      const { data, error } = await adminInvoke<any>("manage-checkout-methods", { body: { action: "autofill_stripe", code: r.code } });
                      if (error || data?.error) return toast.error(error?.message || data?.error);
                      toast.success(`✅ ${data.added} métodos Stripe`);
                      invalidateCheckoutMethodsCache(); load();
                    }}>
                      ⚡ Auto Stripe
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={() => setRegionEdit(r)}>
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 px-2 text-xs" title="Duplicar esta región y sus métodos a otro país" onClick={() => duplicateRegion(r)} disabled={savingRegion === r.code}>
                      📋 Duplicar
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 px-2 text-xs text-destructive hover:text-destructive" onClick={() => deleteRegion(r.code)}>
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar
                    </Button>
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
                              href={`/checkouts/${PREVIEW_SKU}?country=${previewCountry}&preview_region=${r.code}`}
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

                  <div className="mb-3 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] text-muted-foreground">
                    En USA puedes activar Stripe tarjeta, Stripe ACH y Stripe Cash App como filas visibles. Las tres abren el formulario seguro de Stripe.
                  </div>


                  <div className="space-y-1.5">
                    {rms.map((m, idx) => {
                      const Icon = ICONS[m.icon] || CreditCard;
                      const isFirst = idx === 0;
                      const isLast = idx === rms.length - 1;
                      // Los métodos dLocal muestran SIEMPRE las etiquetas reales
                      // por país tomadas de /admin/dlocal (una sola fuente de verdad).
                      const dlNote = dlocalNoteForCountries(m.method_key, r.country_codes || []);
                      return (
                        <div key={m.id} className={`text-sm p-2 rounded border ${m.enabled ? "bg-background" : "bg-muted/50 opacity-60"}`}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-foreground/70 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium leading-tight text-xs sm:text-sm">{m.label}</div>
                              {(dlNote || m.note) && <div className="text-[10px] sm:text-[11px] text-muted-foreground line-clamp-2 sm:truncate" title={dlNote || m.note || ""}>{dlNote || m.note}</div>}
                            </div>

                            <Switch checked={m.enabled} onCheckedChange={() => toggleMethod(m)} className="shrink-0" />
                          </div>
                          <div className="mt-1.5 flex items-center justify-between gap-1 pl-6">
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                disabled={isFirst}
                                onClick={() => reorderMethod(m, -1)}
                                className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Subir"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={isLast}
                                onClick={() => reorderMethod(m, 1)}
                                className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Bajar"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <Badge variant="outline" className="text-[10px] tabular-nums px-1.5 py-0 ml-1" title="Prioridad">
                                #{idx + 1}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setMethodEdit(m)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => deleteMethod(m.id)}>
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {(() => {
                      const available = availableMethodsForRegion(r);
                      return (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-[11px] font-medium text-muted-foreground mb-1.5">
                            Métodos reales del checkout:
                          </p>
                          {available.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground italic">
                              Agrega países ISO a esta región para ver métodos disponibles.
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {available.map(q => {
                                const already = rms.some(m => m.method_key === q.key);
                                const existing = rms.find(m => m.method_key === q.key);
                                const canReactivate = !!existing && !existing.enabled;
                                const isActive = !!existing && existing.enabled;
                                return (
                                  <button
                                    key={q.key}
                                    type="button"
                                    aria-pressed={isActive}
                                    onClick={() => quickAdd(r.code, q)}
                                    className={`text-[11px] px-2 py-1 rounded border ${isActive ? "bg-primary text-primary-foreground border-primary" : canReactivate ? "bg-background border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground" : "bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary"}`}
                                    title={dlocalNoteForCountries(q.key, r.country_codes || []) || q.note}
                                  >
                                    {canReactivate ? "Activar " : isActive ? "✓ " : "+ "}{q.label}
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
                {totalPages > 1 && (
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-xs text-muted-foreground">
                      Página {currentPage} de {totalPages} · {filteredRegions.length} regiones
                    </p>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" className="h-8" disabled={currentPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                        ← Anterior
                      </Button>
                      {Array.from({ length: totalPages }).map((_, i) => {
                        const n = i + 1;
                        return (
                          <Button key={n} size="sm" variant={n === currentPage ? "default" : "ghost"} className="h-8 w-8 p-0" onClick={() => setPage(n)}>
                            {n}
                          </Button>
                        );
                      })}
                      <Button size="sm" variant="outline" className="h-8" disabled={currentPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                        Siguiente →
                      </Button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          <Card className="p-4 bg-muted/40 text-xs text-muted-foreground space-y-1">
            <p><strong>Detección:</strong> IP del comprador vía ipapi.co → se busca el código de país en <code>country_codes</code> de cada región. La región con código <code>*</code> es el fallback global.</p>
            <p><strong>Métodos:</strong> esta pantalla controla las filas reales del checkout. En USA, ACH y Cash App aparecen como opciones visibles de Stripe.</p>
          </Card>
        </div>
      </main>

      {/* Region editor */}
      <Dialog open={!!regionEdit} onOpenChange={(o) => !o && setRegionEdit(null)}>
        <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto w-[calc(100vw-1.5rem)] sm:w-full">
          <DialogHeader><DialogTitle>{regionEdit?.code ? "Editar región" : "Nueva región"}</DialogTitle></DialogHeader>
          {regionEdit && (
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_84px] sm:grid-cols-[1fr_120px] gap-3">
                <div>
                  <Label>Nombre</Label>
                  <Input value={regionEdit.name} onChange={(e) => setRegionEdit({ ...regionEdit, name: e.target.value })} placeholder="Alemania" />
                </div>
                <div>
                  <Label>Bandera</Label>
                  <Input value={regionEdit.flag || ""} onChange={(e) => setRegionEdit({ ...regionEdit, flag: e.target.value })} placeholder="🇩🇪" />
                </div>
              </div>
              <div>
                <Label>Proveedor de pago</Label>
                <select
                  className="w-full border rounded h-10 px-2 bg-background"
                  value={regionEdit.gateway || "Stripe"}
                  onChange={(e) => setRegionEdit({ ...regionEdit, gateway: e.target.value })}
                >
                  <option value="Stripe">Stripe</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Stripe+PayPal">Stripe + PayPal</option>
                  <option value="MercadoPago">Mercado Pago</option>
                  <option value="Manual">Manual (Yape/Plin)</option>
                </select>
              </div>
              <div>
                <Label>Países (click para agregar/quitar)</Label>
                {(() => {
                  // Countries already taken by OTHER regions — hidden to avoid duplicates.
                  const takenByOthers = new Map<string, { code: string; name: string; flag: string | null }>();
                  for (const r of regions) {
                    if (r.code === regionEdit.code) continue;
                    for (const cc of r.country_codes || []) {
                      if (cc === "*") continue;
                      takenByOthers.set(cc, { code: r.code, name: r.name, flag: r.flag });
                    }
                  }
                  const available = COUNTRY_LIST.filter(c => !takenByOthers.has(c.code));
                  const taken = COUNTRY_LIST.filter(c => takenByOthers.has(c.code));
                  return (
                    <>
                      <div className="flex flex-wrap gap-1 mt-1 p-2 border rounded max-h-40 overflow-auto bg-muted/20">
                        {available.map(c => {
                          const active = regionEdit.country_codes.includes(c.code);
                          return (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                const set = new Set(regionEdit.country_codes);
                                if (active) set.delete(c.code); else set.add(c.code);
                                const nextCountries = Array.from(set);
                                const isNew = !regions.some(r => r.code === regionEdit.code);
                                const patch: Partial<Region> = { country_codes: nextCountries };
                                if (isNew && nextCountries.length > 0) {
                                  const first = COUNTRY_LIST.find(x => x.code === nextCountries[0]);
                                  if (first) {
                                    patch.code = first.code;
                                    if (!regionEdit.flag) patch.flag = first.flag;
                                    if (!regionEdit.name || regionEdit.name === regionEdit.code) patch.name = first.name;
                                  }
                                }
                                setRegionEdit({ ...regionEdit, ...patch });
                              }}
                              className={`text-[11px] px-2 py-1 rounded border ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}
                              title={c.name}
                            >
                              {c.flag} {c.code}
                            </button>
                          );
                        })}
                        {available.length === 0 && (
                          <p className="text-[11px] text-muted-foreground p-1">Todos los países ya están asignados a otras regiones.</p>
                        )}
                      </div>
                      {taken.length > 0 && (
                        <details className="mt-2">
                          <summary className="text-[11px] text-muted-foreground cursor-pointer">
                            {taken.length} país(es) ya asignados a otras regiones (ocultos)
                          </summary>
                          <div className="flex flex-wrap gap-1 mt-1 p-2 border rounded bg-muted/10 opacity-60">
                            {taken.map(c => {
                              const owner = takenByOthers.get(c.code)!;
                              return (
                                <span
                                  key={c.code}
                                  className="text-[11px] px-2 py-1 rounded border bg-background text-muted-foreground line-through"
                                  title={`${c.name} → ya en región ${owner.name} (${owner.code})`}
                                >
                                  {c.flag} {c.code}
                                </span>
                              );
                            })}
                          </div>
                        </details>
                      )}
                    </>
                  );
                })()}
                <p className="text-[11px] text-muted-foreground mt-1">
                  El código de región se asigna automáticamente según el país seleccionado
                  {regionEdit.code ? <> — actual: <code className="font-mono">{regionEdit.code}</code></> : null}.
                  Moneda: <strong>USD</strong> (Stripe convierte a la moneda local del comprador en el checkout).
                </p>
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
            <Button onClick={() => regionEdit && saveRegion(regionEdit, { fromDialog: true })} disabled={savingDialog}>
              {savingDialog ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Method editor */}
      <Dialog open={!!methodEdit} onOpenChange={(o) => !o && setMethodEdit(null)}>
        <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto w-[calc(100vw-1.5rem)] sm:w-full">
          <DialogHeader><DialogTitle>{methodEdit?.id ? "Editar método" : "Nuevo método"}</DialogTitle></DialogHeader>
          {methodEdit && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Región</Label>
                  <Input value={methodEdit.region_code} disabled />
                </div>
                <div>
                  <Label>Tipo real</Label>
                  <select
                    className="w-full border rounded h-10 px-2 bg-background"
                    value={methodEdit.method_key}
                    onChange={(e) => {
                      const q = CHECKOUT_METHODS.find(x => x.key === e.target.value);
                      setMethodEdit({
                        ...methodEdit,
                        method_key: e.target.value,
                        label: methodEdit.label || q?.label || "",
                        note: methodEdit.note || q?.note || "",
                        icon: q?.icon || methodEdit.icon,
                      });
                    }}
                  >
                    <option value="">Seleccionar…</option>
                    {availableMethodsForRegion(regions.find(r => r.code === methodEdit.region_code) || emptyRegion()).map(q => (
                      <option key={q.key} value={q.key}>{q.label}</option>
                    ))}
                  </select>
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
            <Button onClick={() => methodEdit && saveMethod(methodEdit)} disabled={savingDialog}>
              {savingDialog ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
