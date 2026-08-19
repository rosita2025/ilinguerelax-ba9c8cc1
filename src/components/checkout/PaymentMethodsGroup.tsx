import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Building2, Banknote, Loader2, Lock, Smartphone, Copy, Check, MessageCircle, Wallet } from "lucide-react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { useCheckoutPruebaStore, calcTotals, itemPrice, calcTotalsPen, formatPen } from "@/stores/checkoutStore";
import { useRegionTier } from "@/hooks/useRegionTier";
import { useLocalCurrency, useSkuOverridesResolver, sumItemsLocal, formatLocalDirect } from "@/hooks/useLocalCurrency";
import { useCheckoutMethodsConfig, type FamilyKey } from "@/hooks/useCheckoutMethodsConfig";
import { useBinancePayConfig } from "@/hooks/useBinancePayConfig";

import { isBuyerValid, BUYER_ERRORS_EVENT } from "@/components/checkout/BuyerInfoForm";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nContext";
import { getCheckoutUI } from "@/i18n/checkoutUI";
import { formatCurrencyAmount, formatAmountLocalized, exchangeRates } from "@/i18n";
import { PayPalButtons } from "@/components/checkout/PayPalButtons";
import { mapStripeError, type MappedStripeError, type Lang as StripeLang } from "@/lib/stripeErrorMap";
import { invokeWithRetry } from "@/lib/invokeWithRetry";
import { trackPaymentError, trackHotmartEvent } from "@/hooks/useMetaPixel";
import { trackAbandonedCheckoutNow } from "@/hooks/useAbandonedCheckoutTracker";
import { usePurchaseTracking } from "@/hooks/usePurchaseTracking";
import hotmartLogo from "@/assets/hotmart-logo.png.asset.json";
import { DLOCAL_COUNTRY_CODES, dlocalSupports, dlocalRails, dlocalBadges, getDlocalCountry, validateDlocalMethod, isDlocalMethodId, auditDlocalCheckout, RESTRICTED_CURRENCY_COUNTRIES } from "@/lib/dlocalCoverage";
import { DlocalSmartFields } from "@/components/checkout/DlocalSmartFields";
import { mapDlocalStatus } from "@/lib/dlocalErrorMap";
import { saveDlocalPending, clearDlocalPending } from "@/lib/dlocalPending";
import { extractEdgeErrorMessage, looksTechnical } from "@/lib/edgeError";
import { getPaymentPayload } from "@/lib/paymentGatewayRouter";
import { useCountryTierRouting } from "@/hooks/useCountryTierRouting";
import { useCheckoutTotal } from "@/hooks/useCheckoutTotal";


type Method = "card" | "stripe_ach" | "stripe_cashapp" | "stripe_klarna" | "paypal" | "transfer" | "cash" | "yape" | "binance" | "clabe" | "hotmart" | "dlocal_transfer" | "dlocal_cash" | "dlocal_wallet" | "dlocal_card" | "hotmart_separator";

const STRIPE_METHODS: Method[] = ["card", "stripe_ach", "stripe_cashapp", "stripe_klarna"];
const isStripeMethod = (m: Method | null | undefined): boolean => !!m && (STRIPE_METHODS as string[]).includes(m);

interface HotmartCountryPrice { amount: number; currency: string }
interface HotmartConfig {
  fallbackUrl: string | null;
  urlsByCountry: Record<string, string>;
  pricesByCountry: Record<string, HotmartCountryPrice>;
}

interface PaymentMethodRow {
  id: Method;
  icon?: React.ElementType;
  title: string;
  sub: string;
  badge?: string | React.ReactNode;
  badges?: { label: string; bg: string; color: string }[];
  methodKey?: string;
  isSeparator?: boolean;
}

const visaLogo = "/__l5e/assets-v1/a96d5ad9-136a-425a-970a-b7889b8bdc30/visa.svg";
const mastercardLogo = "/__l5e/assets-v1/94d65183-1752-495e-ac5b-70ec4cba62b2/mastercard.svg";
const applePayLogo = "/__l5e/assets-v1/a38f0d22-72e4-4393-ace6-856f1b5379e6/apple-pay.svg";


function LogoBadge({ src, alt, bg = "#ffffff" }: { src: string; alt: string; bg?: string }) {
  return (
    <span
      className="inline-flex items-center justify-center h-4 w-7 rounded border border-neutral-200 dark:border-neutral-700 shrink-0"
      style={{ background: bg }}
    >
      <img src={src} alt={alt} className="max-h-2.5 max-w-[20px] object-contain grayscale opacity-60" />
    </span>
  );
}

function GooglePayBadge() {
  return (
    <span
      className="inline-flex items-center justify-center h-4 w-7 rounded border border-neutral-200 dark:border-neutral-700 shrink-0 bg-white"
      role="img"
      aria-label="Google Pay"
    >
      <span className="text-[8px] font-bold leading-none tracking-tight opacity-60 grayscale" aria-hidden="true">
        GPay
      </span>
    </span>
  );
}


function LinkBadge() {
  return (
    <span
      className="inline-flex items-center justify-center h-4 w-7 rounded border border-neutral-200 dark:border-neutral-700 shrink-0"
      style={{ background: "#f8fafc" }}
    >
      <span className="text-[8px] font-bold tracking-tight leading-none text-neutral-400" aria-hidden="true">
        Link
      </span>
    </span>
  );
}

function BankBadge({ label, bg }: { label: string; bg: string; color?: string }) {
  return (
    <span className="inline-flex items-center gap-1 h-4 px-1 rounded border border-neutral-200 bg-neutral-50/50 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-400 text-[8px] font-medium tracking-tight leading-none shrink-0">
      <span className="w-1 h-1 rounded-full shrink-0 opacity-60" style={{ background: bg }} aria-hidden="true" />
      {label}
    </span>
  );
}

/** Agrupación visual de métodos para reducir la saturación del checkout. */
type MethodSection = "cards" | "transfer" | "cash" | "wallet" | "other";

const SECTION_ORDER: MethodSection[] = ["cards", "transfer", "cash", "wallet", "other"];

function methodSection(id: string): MethodSection {
  if (["card", "dlocal_card", "stripe_klarna"].includes(id)) return "cards";
  if (["transfer", "stripe_ach", "dlocal_transfer", "clabe"].includes(id)) return "transfer";
  if (["cash", "dlocal_cash"].includes(id)) return "cash";
  if (["paypal", "yape", "binance", "dlocal_wallet", "stripe_cashapp"].includes(id)) return "wallet";
  return "other";
}

const SECTION_LABELS: Record<MethodSection, Record<string, string>> = {
  cards: { es: "Tarjetas", en: "Cards", pt: "Cartões", fr: "Cartes" },
  transfer: { es: "Transferencias bancarias", en: "Bank Transfers", pt: "Transferências bancárias", fr: "Virements bancaires" },
  cash: { es: "Pago en efectivo", en: "Cash Payments", pt: "Pagamento em dinheiro", fr: "Paiement en espèces" },
  wallet: { es: "Billeteras digitales", en: "Digital Wallets", pt: "Carteiras digitais", fr: "Portefeuilles numériques" },
  other: { es: "Otros métodos", en: "Other Methods", pt: "Outros métodos", fr: "Autres moyens" },
};

function sectionLabel(section: MethodSection, language: string) {
  return SECTION_LABELS[section][language] ?? SECTION_LABELS[section].es;
}





const YAPE_PHONE = "+51 972 119 741";
const YAPE_NAME = "Carmen Rosa Aliaga Domínguez";
const WHATSAPP_URL = "https://wa.me/12512724704";

const CLABE_NUMBER = "646180546709905176";
const CLABE_HOLDER = "Carmen Rosa Aliaga Domínguez";
const CLABE_BANK = "STP (Sistema de Transferencias y Pagos)";

// dLocal Go — moneda de cobro por país (cuando dLocal la soporta).
const DLOCAL_CURRENCY_BY_COUNTRY: Record<string, string> = {
  MX: "MXN", CO: "COP", BR: "BRL", AR: "ARS", CL: "CLP", PE: "PEN",
  UY: "UYU", EC: "USD", CR: "CRC", GT: "GTQ", PA: "USD", DO: "DOP",
  BO: "BOB", PY: "PYG", SV: "USD", HN: "HNL", NI: "NIO", PR: "USD",
  US: "USD",
};

// Rails locales de dLocal Go, separados por tipo (transferencia / efectivo).
// La cobertura real por país vive en src/lib/dlocalCoverage.ts
const DLOCAL_COUNTRIES = DLOCAL_COUNTRY_CODES;

// Binance Pay values are loaded from `binance_pay_configs` via `useBinancePayConfig`.
// See admin panel at /admin/binance-config.


type MethodBadge = { label: string; bg: string; color: string };


const getStripeVisibleMethods = (language: string): Record<string, Omit<PaymentMethodRow, "id" | "methodKey" | "badge">> => ({
  stripe_apple_pay: {
    icon: Smartphone,
    title: "Apple Pay",
    sub: language === "en" ? "Pay with Touch ID / Face ID from your iPhone, iPad or Mac (Safari)." : "Paga con Touch ID / Face ID desde tu iPhone, iPad o Mac (Safari).",
    badges: [{ label: " Pay", bg: "#000000", color: "#ffffff" }],
  },
  stripe_google_pay: {
    icon: Smartphone,
    title: "Google Pay",
    sub: language === "en" ? "Pay with your Google account from Android or Chrome." : "Paga con tu cuenta Google desde Android o Chrome.",
    badges: [{ label: "G Pay", bg: "#ffffff", color: "#1F2937" }],
  },
  stripe_oxxo: {
    icon: Banknote,
    title: "OXXO",
    sub: language === "en" ? "Pay at OXXO stores (Mexico) through Stripe's secure form." : "Paga en tiendas OXXO (México) dentro del formulario seguro de Stripe.",
    badges: [{ label: "OXXO", bg: "#E31E24", color: "#ffffff" }],
  },
  stripe_boleto: {
    icon: Banknote,
    title: "Boleto",
    sub: language === "en" ? "Bank voucher for Brazil inside Stripe." : "Voucher bancario para Brasil dentro de Stripe.",
    badges: [{ label: "Boleto", bg: "#1F2937", color: "#ffffff" }],
  },
  stripe_pix: {
    icon: Smartphone,
    title: "Pix",
    sub: language === "en" ? "Instant bank transfer for Brazil inside Stripe." : "Transferencia instantánea para Brasil dentro de Stripe.",
    badges: [{ label: "Pix", bg: "#32BCAD", color: "#06211F" }],
  },
  stripe_ideal: {
    icon: Building2,
    title: "iDEAL",
    sub: language === "en" ? "Online banking from Netherlands inside Stripe." : "Banca online de Países Bajos dentro de Stripe.",
    badges: [{ label: "iDEAL", bg: "#CC0066", color: "#ffffff" }],
  },
  stripe_bancontact: {
    icon: Building2,
    title: "Bancontact",
    sub: language === "en" ? "Local payment from Belgium inside Stripe." : "Pago local de Bélgica dentro de Stripe.",
    badges: [{ label: "Bancontact", bg: "#005498", color: "#ffffff" }],
  },
  stripe_sepa_debit: {
    icon: Banknote,
    title: "SEPA débito directo",
    sub: language === "en" ? "Bank debit for Eurozone inside Stripe." : "Débito bancario para zona euro dentro de Stripe.",
    badges: [{ label: "SEPA", bg: "#003399", color: "#ffffff" }],
  },
  stripe_giropay: {
    icon: Building2,
    title: "Giropay",
    sub: language === "en" ? "Online banking from Germany inside Stripe." : "Banca online de Alemania dentro de Stripe.",
    badges: [{ label: "Giropay", bg: "#0B5AA6", color: "#ffffff" }],
  },
  stripe_sofort: {
    icon: Building2,
    title: "Sofort",
    sub: language === "en" ? "Instant transfer inside Stripe." : "Transferencia instantánea dentro de Stripe.",
    badges: [{ label: "Sofort", bg: "#EE3423", color: "#ffffff" }],
  },
  stripe_eps: {
    icon: Building2,
    title: "EPS",
    sub: language === "en" ? "Online banking from Austria inside Stripe." : "Banca online de Austria dentro de Stripe.",
    badges: [{ label: "EPS", bg: "#C8102E", color: "#ffffff" }],
  },
  stripe_p24: {
    icon: Building2,
    title: "Przelewy24 (P24)",
    sub: language === "en" ? "Online banking from Poland inside Stripe." : "Banca online de Polonia dentro de Stripe.",
    badges: [{ label: "P24", bg: "#D71920", color: "#ffffff" }],
  },
  stripe_blik: {
    icon: Smartphone,
    title: "BLIK",
    sub: language === "en" ? "Mobile payment from Poland inside Stripe." : "Pago móvil de Polonia dentro de Stripe.",
    badges: [{ label: "BLIK", bg: "#111827", color: "#ffffff" }],
  },
  stripe_multibanco: {
    icon: Banknote,
    title: "Multibanco",
    sub: language === "en" ? "Local payment from Portugal inside Stripe." : "Pago local de Portugal dentro de Stripe.",
    badges: [{ label: "Multibanco", bg: "#1F4E79", color: "#ffffff" }],
  },
  stripe_mb_way: {
    icon: Smartphone,
    title: "MB WAY",
    sub: language === "en" ? "Mobile payment from Portugal inside Stripe." : "Pago móvil de Portugal dentro de Stripe.",
    badges: [{ label: "MB WAY", bg: "#00A3E0", color: "#001B2D" }],
  },
  stripe_twint: {
    icon: Smartphone,
    title: "TWINT",
    sub: language === "en" ? "Mobile payment from Switzerland inside Stripe." : "Pago móvil de Suiza dentro de Stripe.",
    badges: [{ label: "TWINT", bg: "#FF5A00", color: "#ffffff" }],
  },
  stripe_mobilepay: {
    icon: Smartphone,
    title: "MobilePay",
    sub: language === "en" ? "Mobile payment from Denmark/Finland inside Stripe." : "Pago móvil de Dinamarca/Finlandia dentro de Stripe.",
    badges: [{ label: "MobilePay", bg: "#5A78FF", color: "#ffffff" }],
  },
  stripe_bacs_debit: {
    icon: Banknote,
    title: "Bacs débito directo",
    sub: language === "en" ? "Bank debit from United Kingdom inside Stripe." : "Débito bancario de Reino Unido dentro de Stripe.",
    badges: [{ label: "Bacs", bg: "#1F2937", color: "#ffffff" }],
  },
  stripe_acss_debit: {
    icon: Banknote,
    title: language === "en" ? "Canada Bank Debit" : "Débito bancario Canadá",
    sub: language === "en" ? "Pre-authorized debit from Canada inside Stripe." : "Débito preautorizado de Canadá dentro de Stripe.",
    badges: [{ label: "ACSS", bg: "#D80621", color: "#ffffff" }],
  },
  stripe_afterpay_clearpay: {
    icon: CreditCard,
    title: "Afterpay / Clearpay",
    sub: language === "en" ? "Buy now and pay in installments inside Stripe." : "Compra ahora y paga en cuotas dentro de Stripe.",
    badges: [{ label: "Afterpay", bg: "#B2FCE4", color: "#0A0A0A" }],
  },
  stripe_affirm: {
    icon: CreditCard,
    title: "Affirm",
    sub: language === "en" ? "Buy now and pay later inside Stripe." : "Compra ahora y paga después dentro de Stripe.",
    badges: [{ label: "Affirm", bg: "#4A4AF4", color: "#ffffff" }],
  },
  stripe_paypal: {
    icon: Wallet,
    title: "PayPal (Stripe)",
    sub: language === "en" ? "PayPal processed within Stripe's secure form." : "PayPal procesado dentro del formulario seguro de Stripe.",
    badges: [{ label: "PayPal", bg: "#003087", color: "#ffffff" }],
  },
  stripe_alipay: {
    icon: Smartphone,
    title: "Alipay",
    sub: language === "en" ? "Local payment from Asia inside Stripe." : "Pago local de Asia dentro de Stripe.",
    badges: [{ label: "Alipay", bg: "#1677FF", color: "#ffffff" }],
  },
  stripe_wechat_pay: {
    icon: Smartphone,
    title: "WeChat Pay",
    sub: language === "en" ? "Local payment from China inside Stripe." : "Pago local de China dentro de Stripe.",
    badges: [{ label: "WeChat", bg: "#07C160", color: "#001B0A" }],
  },
  stripe_grabpay: {
    icon: Smartphone,
    title: "GrabPay",
    sub: language === "en" ? "Local payment from Southeast Asia inside Stripe." : "Pago local del sudeste asiático dentro de Stripe.",
    badges: [{ label: "GrabPay", bg: "#00B14F", color: "#ffffff" }],
  },
  stripe_paynow: {
    icon: Smartphone,
    title: "PayNow",
    sub: language === "en" ? "Local payment from Singapore inside Stripe." : "Pago local de Singapur dentro de Stripe.",
    badges: [{ label: "PayNow", bg: "#7B1FA2", color: "#ffffff" }],
  },
  stripe_konbini: {
    icon: Banknote,
    title: "Konbini",
    sub: language === "en" ? "Payment at convenience stores in Japan inside Stripe." : "Pago en tiendas de conveniencia de Japón dentro de Stripe.",
    badges: [{ label: "Konbini", bg: "#D32F2F", color: "#ffffff" }],
  },
});

export const PaymentMethodsGroup = memo(function PaymentMethodsGroup({ parentSku }: { parentSku?: string | null } = {}) {
  const navigate = useNavigate();
  const { items, buyer, coupon, couponPercent, selectedMethod, setSelectedMethod } = useCheckoutPruebaStore();
  const region = useRegionTier();
  const countryCode = (region.country || "").toUpperCase();
  const isLatam = ["AR", "BO", "BR", "CL", "CO", "CR", "DO", "EC", "SV", "GT", "HN", "MX", "PA", "PY", "PE", "PR", "UY"].includes(countryCode);
  const { language } = useI18n();
  const t = getCheckoutUI(language);
  const overridesFor = useSkuOverridesResolver();
  const shippingCostUSD = isLatam ? 9 : 8;

  const { 
    subtotalLocal, 
    discountLocal, 
    shippingLocal, 
    totalLocal, 
    currency 
  } = useCheckoutTotal(
    items, 
    couponPercent, 
    region.tier, 
    countryCode, 
    shippingCostUSD, 
    overridesFor
  );

  const totals = useMemo(() => calcTotals(items, couponPercent, region.tier), [items, couponPercent, region.tier]);
  const { total, subtotal } = totals;
  const shipping = items.some((i) => i.isPhysical) ? (subtotal >= 50 ? 0 : shippingCostUSD) : 0;
  const grandTotal = total + shipping;
  const totalUsd = useMemo(() => grandTotal.toFixed(2), [grandTotal]);
  
  const penTotals = calcTotalsPen(items, couponPercent, countryCode);
  const isRestricted = RESTRICTED_CURRENCY_COUNTRIES.has(countryCode);
  const local = useLocalCurrency(total); // For overrides and loading state
  void local;

  const [isFallingBackToUsd, setIsFallingBackToUsd] = useState(false);

  // Si el país tiene restricciones o se elige un método global,
  // forzamos el precio en USD para que coincida con el cobro real.
  const isGlobalGateway = selectedMethod && (
    selectedMethod.startsWith("stripe") || 
    selectedMethod.startsWith("dlocal") || 
    selectedMethod === "card" || 
    selectedMethod === "paypal" || 
    selectedMethod === "binance" ||
    selectedMethod === "clabe" ||
    selectedMethod === "yape" ||
    selectedMethod === "transfer"
  );
  
  const showUsdOnly = isFallingBackToUsd;
  const localTotalLabel = formatLocalDirect(totalLocal, countryCode);
  const currentUsdRef = totalLocal / (exchangeRates[currency] || 1);

  const penBadge = (penTotals && !isGlobalGateway) ? formatPen(penTotals.total + shippingLocal) : null;
  const isActuallyShowingLocal = !local.loading;
  
  // Badge principal: SIEMPRE en moneda local del país EXCEPTO en países restringidos (AR/HN) 
  // o cuando se usa un gateway global, donde se fuerza USD.
  const priceBadge = penBadge ?? localTotalLabel;
  // Usamos el usdReference calculado por sumItemsLocal que ya contempla el USD Regional.
  const usdSuffix = (isActuallyShowingLocal && !local.isUsd) 
    ? ` ≈ USD $${currentUsdRef.toFixed(2)}`
    : "";
  const finalPriceLabel = `${priceBadge}${usdSuffix}`;
  const localBadge = "";



  const { trackPurchase } = usePurchaseTracking();
  const [selected, setSelected] = useState<Method | null>(null);
  const [selectedCardRow, setSelectedCardRow] = useState<string | null>(null);
  const [mpLoading, setMpLoading] = useState<Method | null>(null);
  const [showStripe, setShowStripe] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState<MappedStripeError | null>(null);

  const [stripeRetryKey, setStripeRetryKey] = useState(0);
  const [stripeFrameMounted, setStripeFrameMounted] = useState(false);
  const [stripeElapsed, setStripeElapsed] = useState(0);
  const [stripeAutoRetried, setStripeAutoRetried] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedBinance, setCopiedBinance] = useState(false);
  const [copiedClabe, setCopiedClabe] = useState(false);
  const [hotmartCfg, setHotmartCfg] = useState<HotmartConfig>({ fallbackUrl: null, urlsByCountry: {}, pricesByCountry: {} });
  const [methodError, setMethodError] = useState<{ method: Method; message: string } | null>(null);
  const [cfgReload, setCfgReload] = useState(0);

  useEffect(() => {
    if (!parentSku) { setHotmartCfg({ fallbackUrl: null, urlsByCountry: {}, pricesByCountry: {} }); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("digital_products")
          .select("hotmart_url, hotmart_urls_by_country, hotmart_prices_by_country")
          .eq("sku", parentSku)
          .maybeSingle();
        if (cancelled || !data) return;
        const row = data as unknown as {
          hotmart_url: string | null;
          hotmart_urls_by_country: Record<string, string> | null;
          hotmart_prices_by_country: Record<string, HotmartCountryPrice> | null;
        };
        setHotmartCfg({
          fallbackUrl: row.hotmart_url,
          urlsByCountry: row.hotmart_urls_by_country ?? {},
          pricesByCountry: row.hotmart_prices_by_country ?? {},
        });
      } catch { /* noop */ }
    })();
    return () => { cancelled = true; };
  }, [parentSku, cfgReload]);


  const redirectingRef = useRef(false);
  const stripeAnchorRef = useRef<HTMLDivElement | null>(null);
  const stripeContainerRef = useRef<HTMLDivElement | null>(null);
  const hasPhysicalItems = items.some(i => i.isPhysical);
  const valid = isBuyerValid(buyer, hasPhysicalItems);

  const stripePromise = (() => {
    try { return getStripe(); } catch { return null; }
  })();

  useEffect(() => {
    const reset = () => { redirectingRef.current = false; setMpLoading(null); };
    window.addEventListener("pageshow", reset);
    window.addEventListener("focus", reset);
    return () => {
      window.removeEventListener("pageshow", reset);
      window.removeEventListener("focus", reset);
    };
  }, []);
  useEffect(() => {
    // Al cargar el checkout, nos aseguramos que el store y el estado local estén sincronizados
    if (selected) setSelectedMethod(selected);
  }, [selected, setSelectedMethod]);

  const cartSignature = JSON.stringify({
    items: items.map((i) => ({ id: i.id, price: itemPrice(i, region.tier), q: i.quantity })),
    coupon, couponPercent, tier: region.tier,
  });
  const prevSig = useRef(cartSignature);
  useEffect(() => {
    if (prevSig.current !== cartSignature) {
      prevSig.current = cartSignature;
      if (selected === "card") setShowStripe(false);
    }
  }, [cartSignature, selected]);

  const captureAbandonedCheckout = useCallback(async (paymentMethod?: string, force = false) => {
    const s = useCheckoutPruebaStore.getState();
    if (!isBuyerValid(s.buyer)) return false;
    return trackAbandonedCheckoutNow({
      email: s.buyer.email.trim().toLowerCase(),
      name: s.buyer.fullName.trim(),
      phone: s.buyer.phone ?? "",
      productType: s.items[0]?.id || "checkout",
      language,
      country: (region.country || localStorage.getItem("ilr_country") || "").toUpperCase().slice(0, 2),
      items: s.items,
      paymentMethod,
      force,
      currency: "USD", // Forzado a USD para Ads/Tracking
    });
  }, [language, region.country]);

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    const s = useCheckoutPruebaStore.getState();
    if (!isBuyerValid(s.buyer)) throw new Error(t.completeYourData);
    // No bloquea el checkout: la captura del carrito viaja en segundo plano.
    void captureAbandonedCheckout(selected || "stripe", true);
    setStripeLoading(true);
    setStripeError(null);
    const parts = s.buyer.fullName.trim().split(/\s+/);
    const firstName = parts[0].slice(0, 50);
    const lastName = (parts.slice(1).join(" ") || parts[0]).slice(0, 50);
    const toAbsUrl = (u?: string) => {
      if (!u) return undefined;
      if (/^https?:\/\//i.test(u)) return u;
      try { return new URL(u, window.location.origin).toString(); } catch { return undefined; }
    };
    try {
      const country = (region.country || localStorage.getItem("ilr_country") || "PE").toUpperCase().slice(0, 2);
      const initiallyRestricted = RESTRICTED_CURRENCY_COUNTRIES.has(country);

      const fetchSecret = async (retryForRestricted = false) => {
        const pricing = {
          priceUsd: currentUsdRef,
          currencyCode: currency,
          priceLabel: localTotalLabel,
          exchangeRate: totalLocal / currentUsdRef,
          finalPriceAmount: totalLocal,
        };

        const payload = getPaymentPayload(
          pricing,
          selected === "stripe_ach" ? "stripe" : selected === "stripe_cashapp" ? "stripe" : selected === "stripe_klarna" ? "stripe" : "stripe",
          country
        );

        const { data, error } = await invokeWithRetry<{ clientSecret?: string }>("create-checkout-prueba", {
          body: {
            environment: getStripeEnvironment(),
            items: s.items.map((i) => ({
              id: i.id, name: i.name, price: itemPrice(i, region.tier),
              quantity: i.quantity, image: toAbsUrl(i.image), description: i.description,
            })),
            currency: payload.currency,
            amount: payload.amount,
            stripePaymentMethod: selected === "stripe_ach" ? "us_bank_account" : selected === "stripe_cashapp" ? "cashapp" : selected === "stripe_klarna" ? "klarna" : "card",
            couponPercent: s.couponPercent,
            couponCode: s.coupon ?? undefined,
            contact: {
              email: s.buyer.email.trim(),
              phone: (s.buyer.phone ?? "").slice(0, 20) || "+10000000000",
              firstName, lastName,
              country,
            },
            returnUrl: `${window.location.origin}/checkouts/return?session_id={CHECKOUT_SESSION_ID}`,
            isRestrictedRetry: retryForRestricted || initiallyRestricted,
          },
        }, { attempts: 3, baseDelayMs: 500 });
        
        if (error || !data?.clientSecret) {
          const detail = (error as any)?.edgeDetail || (error as any)?.detail;
          const stripeReason = (data as any)?.reason || (error as any)?.reason;
          const msg = detail || (error as { message?: string } | null)?.message || t.errorPayment;
          
          console.error("[Stripe] Create session failed:", { error, data, stripeReason });

          // Fallback logic for currency restrictions
          const isCurrencyError = msg.toLowerCase().includes("currency") || 
                                 msg.toLowerCase().includes("adaptive pricing") ||
                                 (stripeReason || "").toLowerCase().includes("currency");

          if (isCurrencyError && !retryForRestricted && !initiallyRestricted) {
            console.warn("[Stripe] Fallback to USD triggered...");
            setIsFallingBackToUsd(true);
            return fetchSecret(true); // Recursive retry for restricted
          }
          
          throw new Error(msg);
        }
        return data.clientSecret;
      };

      const clientSecret = await fetchSecret();


      supabase.from("email_contacts").upsert({
        email: s.buyer.email.trim().toLowerCase(),
        name: s.buyer.fullName.trim(),
        source: "checkout-prueba-1",
        metadata: { phone: s.buyer.phone ?? "", processor: "stripe" },
      }, { onConflict: "email,source" }).then(() => {});
      return clientSecret;

    } catch (err) {
      const mapped = mapStripeError(err, language as StripeLang);
      setStripeError(mapped);
      
      // Auto-fallback UI if it's a currency error
      if (mapped.code === "currency_restricted" && !isFallingBackToUsd) {
        setIsFallingBackToUsd(true);
      }
      
      try {
        const s2 = useCheckoutPruebaStore.getState();
        const totals = calcTotals(s2.items, s2.couponPercent, region.tier);
        // Prioritize the detailed edge error attached by invokeWithRetry
        const edgeDetail = (err as any)?.edgeDetail;
        const detail = edgeDetail || await extractEdgeErrorMessage(err);
        const raw = err instanceof Error ? err.message : String(err);
        trackPaymentError({
          provider: selected === "card" ? "stripe_card" : String(selected),
          skus: s2.items.map((i) => i.id),
          reason: detail && !looksTechnical(detail) ? detail : (detail || raw),
          value: totals.total,
          currency: "USD", // Forzado a USD para Ads/Tracking
          content_name: `Stripe Error: ${detail || raw}`, // Incluimos el error en el tracking para el admin
        });
      } catch { /* noop */ }
      throw err;

    } finally {
      setStripeLoading(false);
    }
    // Depend only on region.tier/country — buyer/items are read fresh from
    // the store inside the callback, so the reference stays stable across
    // typing and avoids remounting the EmbeddedCheckoutProvider (blank screen).
  }, [region.tier, region.country, selected, language, t.completeYourData, t.errorPayment, captureAbandonedCheckout]);

  // Memoize the options object per cart signature. A new object reference on
  // every render forces Stripe to remount the iframe → blank/duplicated form.
  const stripeOptions = useMemo(() => ({ fetchClientSecret }), [fetchClientSecret]);

  const requestBuyerInfo = () => {
    window.dispatchEvent(new Event(BUYER_ERRORS_EVENT));
    toast({
      title: t.completeDataFirst,
      description: t.completeDataFirstDesc,
      variant: "destructive",
    });
  };

  const payMercado = async (paymentType: "cash" | "transfer") => {
    if (!valid) { requestBuyerInfo(); return; }
    if (redirectingRef.current) return;
    const s = useCheckoutPruebaStore.getState();
    const totals = calcTotals(s.items, s.couponPercent, region.tier);
    redirectingRef.current = true;
    setMpLoading(paymentType);
    try {
      void captureAbandonedCheckout(`mercadopago_${paymentType}`, true);
      void supabase.from("email_contacts").upsert({
        email: s.buyer.email.trim().toLowerCase(),
        name: s.buyer.fullName.trim(),
        source: "checkout-prueba-1",
        metadata: { phone: s.buyer.phone ?? "", processor: "mercadopago", paymentType },
      }, { onConflict: "email,source" }).then(() => {}, () => {});

      const pricing = {
        priceUsd: currentUsdRef,
        currencyCode: currency,
        priceLabel: localTotalLabel,
        exchangeRate: totalLocal / currentUsdRef,
        finalPriceAmount: totalLocal,
      };
      const payload = getPaymentPayload(pricing, "mercadopago", countryCode);

      const { data, error } = await invokeWithRetry<{ init_point?: string }>("create-mercadopago-preference", {
        body: {
          orderId: `ILR-MP-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          items: s.items.map((i) => {
            const abs = i.image && /^https?:\/\//i.test(i.image)
              ? i.image
              : (() => { try { return i.image ? new URL(i.image, window.location.origin).toString() : undefined; } catch { return undefined; } })();
            return { id: i.id, name: i.name, price: itemPrice(i, region.tier), quantity: i.quantity, image: abs, description: i.description };
          }),
          couponPercent: s.couponPercent,
          couponCode: s.coupon ?? undefined,
          payerEmail: s.buyer.email.trim(),
          payerName: s.buyer.fullName.trim(),
          payerPhone: s.buyer.phone ?? undefined,
          expectedTotalUsd: Number(currentUsdRef.toFixed(2)),
          currency: payload.currency,
          amount: Number(payload.amount),
          returnUrl: `${window.location.origin}/checkouts/return`,
          successUrl: `${window.location.origin}/checkouts/success`,
          failureUrl: `${window.location.origin}/checkouts/failure`,
          pendingUrl: `${window.location.origin}/checkouts/pending`,
          autoReturn: "approved",
          paymentType,
        },
      }, { attempts: 3, baseDelayMs: 500 });
      if (error || !data?.init_point) throw new Error((error as { message?: string } | null)?.message || t.mpError);

      window.location.assign(data.init_point);
    } catch (err) {
      redirectingRef.current = false;
      setMpLoading(null);
      try {
        const s3 = useCheckoutPruebaStore.getState();
        const totals = calcTotals(s3.items, s3.couponPercent, region.tier);
        trackPaymentError({
          provider: `mercadopago_${paymentType}`,
          skus: s3.items.map((i) => i.id),
          reason: err instanceof Error ? err.message : String(err),
          value: totals.total,
          currency: "USD", // Forzado a USD para Ads/Tracking
        });
      } catch { /* noop */ }
      setMethodError({
        method: paymentType === "transfer" ? "transfer" : "cash",
        message: err instanceof Error ? err.message : t.tryAgain,
      });
      toast({
        title: t.mpError,
        description: err instanceof Error ? err.message : t.tryAgain,
        variant: "destructive",
      });
    }
  };

  // dLocal Go — pagos locales de LatAm (OXXO/SPEI, PSE/Nequi, Pix, tarjetas).
  // Cobra en la moneda local del país cuando dLocal la soporta; si no, USD.
  const payDlocal = async (kind: "transfer" | "cash" | "wallet") => {
    const dlMethod: Method = kind === "cash" ? "dlocal_cash" : kind === "wallet" ? "dlocal_wallet" : "dlocal_transfer";
    if (!valid) { requestBuyerInfo(); return; }
    if (redirectingRef.current) return;
    const s = useCheckoutPruebaStore.getState();
    const totals = calcTotals(s.items, s.couponPercent, region.tier);
    const ctry = (region.country || localStorage.getItem("ilr_country") || "PE").toUpperCase().slice(0, 2);
    // Guardia final: nunca crear una orden con un método fuera de la cobertura
    // activa de /admin/dlocal para el país real del comprador.
    const coverage = validateDlocalMethod(ctry, dlMethod);
    if (!coverage.ok) {
      setSelected(null);
      setMethodError({ method: dlMethod, message: coverage.reason || "Método no disponible en tu país." });
      toast({
        title: "Método no disponible",
        description: coverage.reason || "Elige otro método de pago para tu país.",
        variant: "destructive",
      });
      return;
    }
    const pricing = {
      priceUsd: currentUsdRef,
      currencyCode: currency,
      priceLabel: localTotalLabel,
      exchangeRate: totalLocal / currentUsdRef,
      finalPriceAmount: totalLocal,
    };
    const payload = getPaymentPayload(pricing, "dlocal", ctry);
    const dlCurrency = payload.currency;
    const dlAmount = Number(payload.amount);
    redirectingRef.current = true;
    setMpLoading(dlMethod);
    const dlOrderId = `ILR-DL-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    try {
      // Auditoría y contactos NO bloquean la creación del pago: se disparan en
      // paralelo y el comprador se va al link de dLocal apenas esté listo.
      void captureAbandonedCheckout(dlMethod, true);
      // Guardamos el pedido en curso: si dLocal rechaza la transacción, la
      // pantalla de retorno puede consultar el estado real y mostrar un
      // mensaje claro en vez de dejar al comprador en un error sin salida.
      saveDlocalPending(dlOrderId, s.buyer.email.trim());
      void supabase.from("email_contacts").upsert({
        email: s.buyer.email.trim().toLowerCase(),
        name: s.buyer.fullName.trim(),
        source: "checkout-prueba-1",
        metadata: { phone: s.buyer.phone ?? "", processor: "dlocalgo" },
      }, { onConflict: "email,source" }).then(() => {}, () => {});

      const returnUrl = `${window.location.origin}/checkouts/return?provider=dlocal&order=${encodeURIComponent(dlOrderId)}`;
      const { data, error } = await invokeWithRetry<{ redirect_url?: string }>("dlocal-create-payment", {
        body: {
          orderId: dlOrderId,
          items: s.items.map((i) => ({ id: i.id, name: i.name, price: itemPrice(i, region.tier), quantity: i.quantity })),
          couponPercent: s.couponPercent,
          couponCode: s.coupon ?? undefined,
          payerEmail: s.buyer.email.trim(),
          payerName: s.buyer.fullName.trim(),
          payerPhone: s.buyer.phone ?? undefined,
          country: ctry,
          paymentType: kind,
          currency: dlCurrency,
          amount: Number(dlAmount.toFixed(2)),
          expectedTotalUsd: Number(totals.total.toFixed(2)),
          // Aprobado y rechazado vuelven al puente: ahí resolvemos el estado real.
          successUrl: returnUrl,
          backUrl: returnUrl,
        },
      }, { attempts: 3, baseDelayMs: 500 });
      if (error || !data?.redirect_url) {
        if ((error as any)?.is_provider_down || (error as any)?.provider_status === 502) {
          const downtime = mapDlocalStatus("dlocal_downtime", language);
          throw new Error(downtime.message);
        }
        const detail = await extractEdgeErrorMessage(error);
        throw new Error(detail || t.errorPayment);
      }
      window.location.assign(data.redirect_url);
    } catch (err) {
      redirectingRef.current = false;
      setMpLoading(null);
      clearDlocalPending();
      const rawReason = err instanceof Error ? err.message : String(err);
      try {
        trackPaymentError({
          provider: "dlocalgo",
          skus: s.items.map((i) => i.id),
          reason: rawReason,
          value: totals.total,
          currency: "USD", // Forzado a USD para Ads/Tracking
        });
      } catch { /* noop */ }
      // Mensaje claro + siguiente paso: nunca dejamos un error técnico crudo.
      const fallback = mapDlocalStatus("dlocal_create_failed", language);
      const friendly = looksTechnical(rawReason) ? fallback.message : rawReason;
      setMethodError({ method: dlMethod, message: friendly });
      toast({
        title: fallback.title,
        description: friendly,
        variant: "destructive",
      });
    }

  };

  const redirectToHotmart = useCallback(async () => {
    const c = (region.country || "").toUpperCase();
    const url = hotmartCfg.urlsByCountry[c] || hotmartCfg.fallbackUrl || null;
    if (!url) {
      setMethodError({
        method: "hotmart",
        message:
          language === "en" ? "We couldn't open the Hotmart checkout. Please try again."
          : language === "pt" ? "Não conseguimos abrir o checkout da Hotmart. Tente novamente."
          : language === "fr" ? "Impossible d'ouvrir le paiement Hotmart. Réessaie."
          : "No pudimos abrir el pago con Hotmart. Inténtalo de nuevo.",
      });
      return;
    }
    if (!valid) { requestBuyerInfo(); return; }
    if (redirectingRef.current) return;
    redirectingRef.current = true;
    // Guarda el carrito abandonado ANTES de redirigir a Hotmart para no perder al cliente.
    // Esperamos hasta 2s máx; si la red tarda más, redirigimos igual (la captura ya salió al servidor).
    try {
      await Promise.race([
        captureAbandonedCheckout("hotmart", true),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    } catch { /* noop */ }
    // Reemplaza la tienda por Hotmart en la misma pestaña (evita bloqueo de popups).
    window.location.replace(url);
  }, [hotmartCfg, region.country, valid, captureAbandonedCheckout, language, requestBuyerInfo]);



  const handleSelect = (m: Method) => {
    if (!valid) { requestBuyerInfo(); return; }
    if (isDlocalMethodId(m)) {
      const v = validateDlocalMethod(country, m);
      if (!v.ok) {
        setMethodError({ method: m, message: v.reason || "Método no disponible en tu país." });
        return;
      }
    }
    void captureAbandonedCheckout(m, true);
    if (m !== selected) setShowStripe(false);
    setSelected(m);
    setSelectedMethod(m);
    if (!["card", "stripe_ach", "stripe_cashapp", "stripe_klarna"].includes(m)) setShowStripe(false);
    // Hotmart: no redirige al seleccionar; espera al botón "Comprar ahora".
    // Al colapsar el iframe de Stripe la página se encoge y el scroll salta
    // hacia arriba. Reancla la vista sobre el método recién elegido (PayPal,
    // Binance, Yape…) para que el comprador siga viendo lo que tocó.
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        const el = document.querySelector<HTMLElement>(`[data-method-row="${m}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    }
  };


  const handleBuyNow = async () => {
    if (!valid) { requestBuyerInfo(); return; }
    
    // Validar Asia para productos físicos
    const isAsia = ["CN", "JP", "KR", "IN", "SG", "MY", "TH", "VN", "PH", "ID"].includes(countryCode);
    if (hasPhysicalItems && isAsia) {
      toast({
        title: language === "en" ? "Shipping Unavailable" : "Envío no disponible",
        description: `${t.shippingNoticeAsia} ${t.digitalAlternativeSuggest}`,
        variant: "destructive",
      });
      return;
    }

    if (!selected) {
      toast({ title: t.selectMethod, variant: "destructive" });
      return;
    }
    // Hotmart: guarda carrito abandonado y luego redirige (esperando máx 2s).
    if (selected === "hotmart") { await redirectToHotmart(); return; }
    // Cada método vuelve a capturar el carrito en segundo plano, así que aquí
    // no esperamos: el clic en "Continuar" ya no paga la espera de la auditoría.
    void captureAbandonedCheckout(selected, true);
    if (["card", "stripe_ach", "stripe_cashapp", "stripe_klarna"].includes(selected)) { setShowStripe(true); return; }
    if (selected === "dlocal_transfer") { await payDlocal("transfer"); return; }
    if (selected === "dlocal_cash") { await payDlocal("cash"); return; }
    if (selected === "dlocal_wallet") { await payDlocal("wallet"); return; }
    if (selected === "transfer") { payMercado("transfer"); return; }
    if (selected === "cash") { payMercado("cash"); return; }
    // yape → user uses "Ya pagué" button in the manual panel
  };

  const retryStripe = useCallback(() => {
    setStripeError(null);
    setStripeLoading(false);
    setStripeFrameMounted(false);
    setStripeElapsed(0);
    setStripeRetryKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!(showStripe && selected && ["card", "stripe_ach", "stripe_cashapp", "stripe_klarna"].includes(selected))) return;
    setStripeFrameMounted(false);
    setStripeElapsed(0);
    const container = stripeContainerRef.current;
    if (!container) return;

    const markMounted = () => {
      if (container.querySelector('iframe[name="embedded-checkout"]')) {
        setStripeFrameMounted(true);
        return true;
      }
      return false;
    };

    if (markMounted()) return;
    const observer = new MutationObserver(markMounted);
    observer.observe(container, { childList: true, subtree: true });

    const startedAt = Date.now();
    const tick = window.setInterval(() => {
      const s = Math.floor((Date.now() - startedAt) / 1000);
      setStripeElapsed(s);
      // Auto-retry silently once at 45s if the iframe never mounted
      if (s === 45 && !stripeAutoRetried) {
        setStripeAutoRetried(true);
        setStripeRetryKey((k) => k + 1);
      }
      // Hard failure at 90s → show retry UI
      if (s >= 90) {
        window.clearInterval(tick);
        if (!container.querySelector('iframe[name="embedded-checkout"]')) {
          setStripeError(mapStripeError(new Error("timeout: took too long to open"), language as StripeLang));
        }
      }
    }, 1000);

    return () => {
      observer.disconnect();
      window.clearInterval(tick);
    };
  }, [showStripe, selected, stripeRetryKey, language, stripeAutoRetried]);

  const handleManualPaid = async () => {
    if (!valid) { requestBuyerInfo(); return; }
    const s = useCheckoutPruebaStore.getState();
    const orderNumber = `ILR-YP-${Math.floor(1000 + Math.random() * 9000)}`;
    const amountText = penBadge ?? (local.loading ? `USD $${totalUsd}` : local.formatted);
    const productList = s.items.map((i) => `• ${i.name} x${i.quantity}`).join("\n");
    const msg =
      `Hola! 👋 Acabo de pagar por Yape/Plin.\n\n` +
      `📦 Orden: ${orderNumber}\n` +
      `👤 Nombre: ${s.buyer.fullName.trim()}\n` +
      `📧 Email: ${s.buyer.email.trim()}\n` +
      `💰 Monto: ${amountText}\n\n` +
      `Productos:\n${productList}\n\n` +
      `Adjunto captura del pago. Gracias!`;
    const waUrl = `https://wa.me/12512724704?text=${encodeURIComponent(msg)}`;

    // Guardar en base de datos para que Rosa lo vea en el admin
    try {
      await supabase.from("manual_payments").insert({
        order_number: orderNumber,
        buyer_name: s.buyer.fullName.trim(),
        buyer_email: s.buyer.email.trim().toLowerCase(),
        buyer_phone: s.buyer.phone ?? null,
        buyer_country: (region.country || "").toUpperCase() || null,
        amount_usd: Number(totalUsd),
        amount_local: penTotals ? penTotals.total : (local.loading || local.isUsd ? null : Number(totalLocal.toFixed(2))),
        currency_local: penTotals ? "PEN" : (currency || "USD"),
        method: "yape_plin",
        items: s.items.map((i) => ({ sku: i.id, name: i.name, quantity: i.quantity, price: i.price })),
        status: "pending",
      });
    } catch (e) {
      console.warn("[manual_payments] insert failed", e);
    }

    // Notificar a Rosa (hola@ilinguerelax.com) con botón directo a WhatsApp del cliente
    supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "admin-manual-pending",
        idempotencyKey: `manual-pending-${orderNumber}`,
        templateData: {
          orderNumber,
          customerName: s.buyer.fullName.trim(),
          customerEmail: s.buyer.email.trim().toLowerCase(),
          customerPhone: s.buyer.phone ?? "",
          customerCountry: (region.country || "").toUpperCase(),
          productName: s.items.map((i) => i.name).join(" + "),
          amount: penTotals ? penTotals.total : (local.loading || local.isUsd ? Number(totalUsd) : Number(totalLocal.toFixed(2))),
          currency: penTotals ? "PEN" : (currency || "USD"),
          method: "Yape/Plin",
          orderDate: new Date().toISOString(),
        },
      },
    }).catch((err) => console.warn("[admin-manual-pending] notify failed", err));

    // Confirmación al cliente — para no perder la orden si se cierra la página o se apaga la batería
    supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "customer-manual-pending",
        recipientEmail: s.buyer.email.trim().toLowerCase(),
        idempotencyKey: `customer-manual-pending-${orderNumber}`,
        templateData: {
          orderNumber,
          customerName: s.buyer.fullName.trim().split(" ")[0] || s.buyer.fullName.trim(),
          productName: s.items.map((i) => i.name).join(" + "),
          amount: penTotals ? penTotals.total : (local.loading || local.isUsd ? Number(totalUsd) : Number(totalLocal.toFixed(2))),
          currency: penTotals ? "PEN" : (currency || "USD"),
          amountUsd: Number(totalUsd),
          method: "Yape/Plin",
          orderDate: new Date().toISOString(),
        },
      },
    }).catch((err) => console.warn("[customer-manual-pending] notify failed", err));

    supabase.from("email_contacts").upsert({
      email: s.buyer.email.trim().toLowerCase(),
      name: s.buyer.fullName.trim(),
      source: "checkout-prueba-1",
      metadata: { phone: s.buyer.phone ?? "", processor: "manual", paymentType: "yape_plin", orderNumber },
    }, { onConflict: "email,source" }).then(() => {});

    window.open(waUrl, "_blank", "noopener,noreferrer");
    const q = new URLSearchParams({
      order: orderNumber,
      name: s.buyer.fullName.trim(),
      email: s.buyer.email.trim(),
      amount: amountText,
      method: "Yape/Plin",
      products: s.items.map((i) => `${i.name} x${i.quantity}`).join(" | "),
    }).toString();
    navigate(`/checkouts/pendiente-manual?${q}`);
  };



  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(YAPE_PHONE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* noop */ }
  };

  const copyBinance = async () => {
    try {
      await navigator.clipboard.writeText(binanceCfg.address);
      setCopiedBinance(true);
      setTimeout(() => setCopiedBinance(false), 1800);
    } catch { /* noop */ }
  };

  const handleBinancePaid = async () => {
    if (!valid) { requestBuyerInfo(); return; }
    const s = useCheckoutPruebaStore.getState();
    const orderNumber = `ILR-BN-${Math.floor(1000 + Math.random() * 9000)}`;
    const amountText = local.loading ? `USD $${totalUsd}` : local.formatted;
    const productList = s.items.map((i) => `• ${i.name} x${i.quantity}`).join("\n");
    const msg =
      `Hola! 👋 Acabo de pagar por Binance Pay.\n\n` +
      `📦 Orden: ${orderNumber}\n` +
      `👤 Nombre: ${s.buyer.fullName.trim()}\n` +
      `📧 Email: ${s.buyer.email.trim()}\n` +
      `💰 Monto: ${amountText} (USD $${totalUsd})\n` +
      `🔗 Red: ${binanceCfg.network}\n\n` +
      `Productos:\n${productList}\n\n` +
      `Adjunto captura del pago. Gracias!`;
    const waUrl = `https://wa.me/12512724704?text=${encodeURIComponent(msg)}`;

    try {
      await supabase.from("manual_payments").insert({
        order_number: orderNumber,
        buyer_name: s.buyer.fullName.trim(),
        buyer_email: s.buyer.email.trim().toLowerCase(),
        buyer_phone: s.buyer.phone ?? null,
        buyer_country: (region.country || "").toUpperCase() || null,
        amount_usd: Number(totalUsd),
        amount_local: local.loading ? null : Number(local.amount ?? totalUsd),
        currency_local: local.currency || "USD",
        method: "binance_pay",
        items: s.items.map((i) => ({ sku: i.id, name: i.name, quantity: i.quantity, price: i.price })),
        status: "pending",
      });
    } catch (e) {
      console.warn("[manual_payments] binance insert failed", e);
    }

    supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "admin-manual-pending",
        idempotencyKey: `manual-pending-${orderNumber}`,
        templateData: {
          orderNumber,
          customerName: s.buyer.fullName.trim(),
          customerEmail: s.buyer.email.trim().toLowerCase(),
          customerPhone: s.buyer.phone ?? "",
          customerCountry: (region.country || "").toUpperCase(),
          productName: s.items.map((i) => i.name).join(" + "),
          amount: local.loading ? Number(totalUsd) : Number(local.amount ?? totalUsd),
          currency: local.currency || "USD",
          method: "Binance Pay",
          orderDate: new Date().toISOString(),
        },
      },
    }).catch((err) => console.warn("[admin-manual-pending] binance notify failed", err));

    supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "customer-manual-pending",
        recipientEmail: s.buyer.email.trim().toLowerCase(),
        idempotencyKey: `customer-manual-pending-${orderNumber}`,
        templateData: {
          orderNumber,
          customerName: s.buyer.fullName.trim().split(" ")[0] || s.buyer.fullName.trim(),
          productName: s.items.map((i) => i.name).join(" + "),
          amount: local.loading ? Number(totalUsd) : Number(local.amount ?? totalUsd),
          currency: local.currency || "USD",
          amountUsd: Number(totalUsd),
          method: "Binance Pay",
          binancePayId: binanceCfg.pay_id,
          binanceAddress: binanceCfg.address,
          binanceNetwork: binanceCfg.network,
          orderDate: new Date().toISOString(),
        },
      },
    }).catch((err) => console.warn("[customer-manual-pending] binance notify failed", err));

    supabase.from("email_contacts").upsert({
      email: s.buyer.email.trim().toLowerCase(),
      name: s.buyer.fullName.trim(),
      source: "checkout-prueba-1",
      metadata: { phone: s.buyer.phone ?? "", processor: "manual", paymentType: "binance_pay", orderNumber },
    }, { onConflict: "email,source" }).then(() => {});

    window.open(waUrl, "_blank", "noopener,noreferrer");
    const q = new URLSearchParams({
      order: orderNumber,
      name: s.buyer.fullName.trim(),
      email: s.buyer.email.trim(),
      amount: `${amountText} (USD $${totalUsd})`,
      method: "Binance Pay",
      products: s.items.map((i) => `${i.name} x${i.quantity}`).join(" | "),
    }).toString();
    navigate(`/checkouts/pendiente-manual?${q}`);
  };

  const copyClabe = async () => {
    try {
      await navigator.clipboard.writeText(CLABE_NUMBER);
      setCopiedClabe(true);
      setTimeout(() => setCopiedClabe(false), 1800);
    } catch { /* noop */ }
  };

  const handleClabePaid = async () => {
    if (!valid) { requestBuyerInfo(); return; }
    const s = useCheckoutPruebaStore.getState();
    const orderNumber = `ILR-MX-${Math.floor(1000 + Math.random() * 9000)}`;
    const amountText = local.loading ? `USD $${totalUsd}` : local.formatted;
    const productList = s.items.map((i) => `• ${i.name} x${i.quantity}`).join("\n");
    const msg =
      `Hola! 👋 Acabo de pagar por SPEI / CLABE (México).\n\n` +
      `📦 Orden: ${orderNumber}\n` +
      `👤 Nombre: ${s.buyer.fullName.trim()}\n` +
      `📧 Email: ${s.buyer.email.trim()}\n` +
      `💰 Monto: ${amountText} (USD $${totalUsd})\n` +
      `🏦 CLABE: ${CLABE_NUMBER}\n` +
      `👤 Titular: ${CLABE_HOLDER}\n\n` +
      `Productos:\n${productList}\n\n` +
      `Adjunto captura del pago. Gracias!`;
    const waUrl = `https://wa.me/12512724704?text=${encodeURIComponent(msg)}`;

    try {
      await supabase.from("manual_payments").insert({
        order_number: orderNumber,
        buyer_name: s.buyer.fullName.trim(),
        buyer_email: s.buyer.email.trim().toLowerCase(),
        buyer_phone: s.buyer.phone ?? null,
        buyer_country: (region.country || "MX").toUpperCase() || null,
        amount_usd: Number(totalUsd),
        amount_local: local.loading ? null : Number(local.amount ?? totalUsd),
        currency_local: local.currency || "MXN",
        method: "clabe_mx",
        items: s.items.map((i) => ({ sku: i.id, name: i.name, quantity: i.quantity, price: i.price })),
        status: "pending",
      });
    } catch (e) {
      console.warn("[manual_payments] clabe insert failed", e);
    }

    supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "admin-manual-pending",
        idempotencyKey: `manual-pending-${orderNumber}`,
        templateData: {
          orderNumber,
          customerName: s.buyer.fullName.trim(),
          customerEmail: s.buyer.email.trim().toLowerCase(),
          customerPhone: s.buyer.phone ?? "",
          customerCountry: (region.country || "MX").toUpperCase(),
          productName: s.items.map((i) => i.name).join(" + "),
          amount: local.loading ? Number(totalUsd) : Number(local.amount ?? totalUsd),
          currency: local.currency || "MXN",
          method: "SPEI / CLABE (México)",
          orderDate: new Date().toISOString(),
        },
      },
    }).catch((err) => console.warn("[admin-manual-pending] clabe notify failed", err));

    supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "customer-manual-pending",
        recipientEmail: s.buyer.email.trim().toLowerCase(),
        idempotencyKey: `customer-manual-pending-${orderNumber}`,
        templateData: {
          orderNumber,
          customerName: s.buyer.fullName.trim().split(" ")[0] || s.buyer.fullName.trim(),
          productName: s.items.map((i) => i.name).join(" + "),
          amount: local.loading ? Number(totalUsd) : Number(local.amount ?? totalUsd),
          currency: local.currency || "MXN",
          amountUsd: Number(totalUsd),
          method: "SPEI / CLABE (México)",
          orderDate: new Date().toISOString(),
          clabeNumber: CLABE_NUMBER,
          clabeHolder: "Carmen Rosa Aliaga Domínguez",
          clabeBank: "STP (SPEI)",
        },
      },
    }).catch((err) => console.warn("[customer-manual-pending] clabe notify failed", err));

    supabase.from("email_contacts").upsert({
      email: s.buyer.email.trim().toLowerCase(),
      name: s.buyer.fullName.trim(),
      source: "checkout-prueba-1",
      metadata: { phone: s.buyer.phone ?? "", processor: "manual", paymentType: "clabe_mx", orderNumber },
    }, { onConflict: "email,source" }).then(() => {});

    window.open(waUrl, "_blank", "noopener,noreferrer");
    const q = new URLSearchParams({
      order: orderNumber,
      name: s.buyer.fullName.trim(),
      email: s.buyer.email.trim(),
      amount: `${amountText} (USD $${totalUsd})`,
      method: "SPEI / CLABE (México)",
      products: s.items.map((i) => `${i.name} x${i.quantity}`).join(" | "),
    }).toString();
    navigate(`/checkouts/pendiente-manual?${q}`);
  };






  // Métodos locales de Perú (Mercado Pago transferencias/efectivo + Yape/Plin manual)
  // SOLO se muestran cuando el visitante está en Perú. Fuera de Perú, únicamente Stripe.
  const isPeru = (region.country || "").toUpperCase() === "PE";

  // Marcas de tarjeta / wallets visibles por región. Stripe activa el método real
  // automáticamente según el país del comprador; nosotros solo mostramos los
  // logos correctos para que el cliente reconozca sus opciones y confíe.
  const country = (region.country || "").toUpperCase();
  const cardSubtitle = isPeru
    ? t.cardSubtitlePeru(localBadge)
    : t.cardSubtitleGlobal(local.currency || (language === "en" ? "your local currency" : language === "pt" ? "sua moeda local" : language === "fr" ? "votre monnaie locale" : "tu moneda local"), localBadge);

  const isUsa = country === "US";
  const methodsConfig = useCheckoutMethodsConfig(country);
  const binanceCfg = useBinancePayConfig(methodsConfig.regionCode);

  // Hotmart 1-clic: resuelve URL y precio local por país
  const hotmartResolvedUrl = hotmartCfg.urlsByCountry[country] || hotmartCfg.fallbackUrl || null;
  const hotmartResolvedPrice = hotmartCfg.pricesByCountry[country] || null;
  // Si el precio configurado está en USD, conviértelo a la moneda local del país (igual que el resto del checkout).
  const hotmartUsdForLocal = hotmartResolvedPrice && hotmartResolvedPrice.currency === "USD"
    ? hotmartResolvedPrice.amount
    : total;
  const hotmartLocal = useLocalCurrency(hotmartUsdForLocal);
  const hotmartPriceLabel = hotmartResolvedPrice
    ? (hotmartResolvedPrice.currency === "USD"
        ? (hotmartLocal.loading || hotmartLocal.isUsd
            ? `USD ${formatCurrencyAmount(hotmartResolvedPrice.amount, "USD")}`
            : hotmartLocal.formatted)
        : `${hotmartResolvedPrice.currency} ${formatAmountLocalized(hotmartResolvedPrice.amount, Number.isInteger(hotmartResolvedPrice.amount) ? 0 : 2)}`)
    : priceBadge;

  // Métodos locales reales que ofrece Hotmart en cada país (se muestran en la
  // tarjeta para que el comprador sepa que puede pagar con su rail habitual).
  const HOTMART_LOCAL_METHODS: Record<string, { es: string; en: string; pt: string; fr: string }> = {
    MX: {
      es: "OXXO, transferencia bancaria (SPEI) y tarjeta",
      en: "OXXO, bank transfer (SPEI) and card",
      pt: "OXXO, transferência bancária (SPEI) e cartão",
      fr: "OXXO, virement bancaire (SPEI) et carte",
    },
    AR: {
      es: "pago en efectivo (Rapipago / Pago Fácil) y tarjeta en cuotas",
      en: "cash payment (Rapipago / Pago Fácil) and card in installments",
      pt: "pagamento em dinheiro (Rapipago / Pago Fácil) e cartão parcelado",
      fr: "paiement en espèces (Rapipago / Pago Fácil) et carte en plusieurs fois",
    },
    CO: {
      es: "Nequi, PSE, Efecty y tarjeta",
      en: "Nequi, PSE, Efecty and card",
      pt: "Nequi, PSE, Efecty e cartão",
      fr: "Nequi, PSE, Efecty et carte",
    },
    BR: {
      es: "Pix, boleto y tarjeta",
      en: "Pix, boleto and card",
      pt: "Pix, boleto e cartão",
      fr: "Pix, boleto et carte",
    },
    PE: {
      es: "PagoEfectivo, transferencia y tarjeta",
      en: "PagoEfectivo, transfer and card",
      pt: "PagoEfectivo, transferência e cartão",
      fr: "PagoEfectivo, virement et carte",
    },
    CL: {
      es: "transferencia bancaria y tarjeta",
      en: "bank transfer and card",
      pt: "transferência bancária e cartão",
      fr: "virement bancaire et carte",
    },
  };
  // Etiquetas visuales de los rails locales que Hotmart ofrece en cada país.
  const HOTMART_BADGES: Record<string, MethodBadge[]> = {
    MX: [
      { label: "OXXO", bg: "#E31E24", color: "#ffffff" },
      { label: "SPEI", bg: "#0F766E", color: "#ffffff" },
      { label: "Mercado Pago", bg: "#00A6E0", color: "#00263A" },
      { label: "Visa/MC", bg: "#ffffff", color: "#1F2937" },
    ],
    AR: [
      { label: "Cupón de Pago", bg: "#E4002B", color: "#ffffff" },
      { label: "Mercado Pago", bg: "#00A6E0", color: "#00263A" },
      { label: "Rapipago", bg: "#F5A623", color: "#1F2937" },
      { label: "Cuotas", bg: "#1F2937", color: "#ffffff" },
    ],
    CO: [
      { label: "PSE", bg: "#0B5AA6", color: "#ffffff" },
      { label: "Baloto", bg: "#111827", color: "#F5D000" },
      { label: "Nequi", bg: "#200020", color: "#DA0081" },
      { label: "Efecty", bg: "#FFD400", color: "#1F2937" },
    ],
    BR: [
      { label: "Pix", bg: "#32BCAD", color: "#06211F" },
      { label: "Boleto Bancário", bg: "#1F2937", color: "#ffffff" },
      { label: "Débito Bancário", bg: "#374151", color: "#ffffff" },
    ],
    PE: [
      { label: "PagoEfectivo", bg: "#EC0928", color: "#ffffff" },
      { label: "Transferencia", bg: "#0F766E", color: "#ffffff" },
      { label: "Visa/MC", bg: "#ffffff", color: "#1F2937" },
    ],
    CL: [
      { label: "Sencillito", bg: "#111827", color: "#00C08B" },
      { label: "Transferencia", bg: "#0F766E", color: "#ffffff" },
      { label: "Visa/MC", bg: "#ffffff", color: "#1F2937" },
    ],
    PT: [
      { label: "Multibanco", bg: "#1F4E79", color: "#ffffff" },
      { label: "MB WAY", bg: "#00A3E0", color: "#001B2D" },
      { label: "Visa/MC", bg: "#ffffff", color: "#1F2937" },
    ],
    GB: [
      { label: "Direct Debit", bg: "#111827", color: "#ffffff" },
      { label: "Visa/MC", bg: "#ffffff", color: "#1F2937" },
    ],
    EC: [
      { label: "Transferencia", bg: "#0F766E", color: "#ffffff" },
      { label: "Visa/MC", bg: "#ffffff", color: "#1F2937" },
    ],
    UY: [
      { label: "Redpagos", bg: "#E4002B", color: "#ffffff" },
      { label: "Abitab", bg: "#F5A623", color: "#1F2937" },
      { label: "Visa/MC", bg: "#ffffff", color: "#1F2937" },
    ],
  };
  const SEPA_COUNTRIES = ["ES", "FR", "DE", "IT", "NL", "BE", "AT", "IE", "FI", "GR", "LU", "SK", "SI", "EE", "LV", "LT", "CY", "MT"];
  const hotmartBadges: MethodBadge[] = HOTMART_BADGES[country]
    ?? (SEPA_COUNTRIES.includes(country)
      ? [
          { label: "SEPA", bg: "#003399", color: "#ffffff" },
          { label: "Visa/MC", bg: "#ffffff", color: "#1F2937" },
          { label: "PayPal", bg: "#003087", color: "#ffffff" },
        ]
      : [
          { label: "Visa/MC", bg: "#ffffff", color: "#1F2937" },
          { label: "PayPal", bg: "#003087", color: "#ffffff" },
        ]);


  const hotmartMethodsHint = (() => {

    const entry = HOTMART_LOCAL_METHODS[country];
    if (!entry) return null;
    return entry[(language as "es" | "en" | "pt" | "fr")] ?? entry.es;
  })();
  const hotmartTaxNote = language === "en"
    ? "includes local taxes (10-20%)"
    : language === "pt"
    ? "inclui impostos locais (10-20%)"
    : language === "fr"
    ? "taxes locales incluses (10-20 %)"
    : "incluye impuestos locales (10-20%)";



  const enabledStripeKeys = new Set(methodsConfig.enabledMethodKeys.filter((k) => k.startsWith("stripe_")));
  const primaryCardBadges: MethodBadge[] = [
    { label: "Visa", bg: "#ffffff", color: "#1F2937" },
    { label: "Mastercard", bg: "#ffffff", color: "#1F2937" },
    { label: "Apple Pay", bg: "#000000", color: "#ffffff" },
    { label: "Google Pay", bg: "#ffffff", color: "#1F2937" },
    ...(enabledStripeKeys.has("stripe_link") ? [{ label: "Link", bg: "#00D66F", color: "#0A2540" }] : []),
  ];
  const STRIPE_VISIBLE_METHODS = getStripeVisibleMethods(language);
  const dynamicStripeRows: PaymentMethodRow[] = methodsConfig.enabledMethodKeys
    .filter((key) => !!STRIPE_VISIBLE_METHODS[key] && key !== "stripe_link")
    .map((key) => ({ id: "card", methodKey: key, badge: finalPriceLabel, ...STRIPE_VISIBLE_METHODS[key] }));
  const allMethods: PaymentMethodRow[] = [
    { 
      id: "card", 
      icon: CreditCard, 
      title: isPeru ? t.cardTitlePeru : t.cardTitleGlobal, 
      sub: isFallingBackToUsd 
        ? (language === "en" ? "Paying in USD for compatibility (International transaction)." : "Pagando en USD por compatibilidad (Transacción internacional).")
        : cardSubtitle, 
      badge: isFallingBackToUsd ? `USD $${totalUsd}` : finalPriceLabel 
    },

    ...dynamicStripeRows,
    { id: "stripe_ach", icon: Building2, title: language === "en" ? "ACH Bank Transfer" : "Transferencia bancaria ACH", sub: language === "en" ? "Pay from a US bank account inside Stripe." : "Paga desde una cuenta bancaria de Estados Unidos dentro de Stripe.", badge: finalPriceLabel },
    { id: "stripe_cashapp", icon: Smartphone, title: "Cash App Pay", sub: language === "en" ? "Pay with Cash App within Stripe's secure form." : "Paga con Cash App dentro del formulario seguro de Stripe.", badge: finalPriceLabel },
    { id: "stripe_klarna", icon: Wallet, title: language === "en" ? "Klarna — Pay in 4" : "Klarna — Paga en 4", sub: language === "en" ? "Split your purchase into 4 interest-free installments inside Stripe." : "Divide tu compra en 4 cuotas sin interés dentro de Stripe.", badge: finalPriceLabel },
    { id: "paypal", icon: Wallet, title: "PayPal", sub: language === "en" ? "Pay with your PayPal balance or linked card." : language === "pt" ? "Pague com seu saldo PayPal ou cartão vinculado." : language === "fr" ? "Payez avec votre solde PayPal ou carte liée." : "Paga con tu saldo PayPal o tarjeta vinculada.", badge: finalPriceLabel },
    { id: "transfer", icon: Building2, title: t.bankTransfer, sub: t.bankTransferSub(localBadge), badge: finalPriceLabel },
    { id: "cash", icon: Banknote, title: t.cashPayment, sub: t.cashPaymentSub(localBadge), badge: finalPriceLabel },
    { id: "yape", icon: Smartphone, title: t.yapePlin, sub: t.yapePlinSub, badge: finalPriceLabel },
    {
      id: "binance",
      icon: Wallet,
      title: language === "en" ? "Binance Pay (USDT · Crypto)"
        : language === "pt" ? "Binance Pay (USDT · Cripto)"
        : language === "fr" ? "Binance Pay (USDT · Crypto)"
        : "Binance Pay (USDT · Cripto)",
      sub: language === "en" ? "USDT / Binance Pay · 1-24h verification by Supervisor Rosa"
        : language === "pt" ? "USDT / Binance Pay · Verificação 1-24h pela Supervisora Rosa"
        : language === "fr" ? "USDT / Binance Pay · Vérification 1-24h par la Superviseure Rosa"
        : "USDT / Binance Pay · Verificación 1-24h por Supervisora Rosa",
      badge: finalPriceLabel,
    },
    {
      id: "clabe",
      icon: Building2,
      title: language === "en" ? "SPEI · Bank transfer (Mexico)"
        : language === "pt" ? "SPEI · Transferência bancária (México)"
        : language === "fr" ? "SPEI · Virement bancaire (Mexique)"
        : "SPEI · Transferencia bancaria (México)",
      sub: language === "en" ? "Transfer in MXN to a Mexican CLABE · 1-24h verification by Supervisor Rosa"
        : language === "pt" ? "Transferência em MXN para uma CLABE mexicana · Verificação 1-24h pela Supervisora Rosa"
        : language === "fr" ? "Virement en MXN vers une CLABE mexicaine · Vérification 1-24h par la Superviseure Rosa"
        : "Transferencia en MXN a CLABE mexicana · Verificación 1-24h por Supervisora Rosa",
      badge: finalPriceLabel,

    },
    {
      id: "dlocal_transfer",
      icon: Building2,
      title: language === "en" ? "Bank transfer"
        : language === "pt" ? "Transferência bancária"
        : language === "fr" ? "Virement bancaire"
        : "Transferencia bancaria",
      sub: (dlocalRails(country, "transfer").length
        ? `${dlocalRails(country, "transfer").join(" · ")} — `
        : "") + (language === "en" ? "Pay from your bank or wallet in local currency. Instant confirmation."
        : language === "pt" ? "Pague pelo seu banco ou carteira em moeda local. Confirmação imediata."
        : language === "fr" ? "Payez depuis votre banque en monnaie locale. Confirmation immédiate."
        : "Paga desde tu banco o billetera en moneda local. Confirmación inmediata."),
      badge: finalPriceLabel,

      badges: dlocalBadges(country, "transfer", 6).length
        ? dlocalBadges(country, "transfer", 6)
        : [{ label: "Transferencia", bg: "#0F766E", color: "#ffffff" }],
    },
    {
      id: "dlocal_cash",
      icon: Banknote,
      title: language === "en" ? "Cash payment"
        : language === "pt" ? "Pagamento em dinheiro"
        : language === "fr" ? "Paiement en espèces"
        : "Pago en efectivo",
      sub: (dlocalRails(country, "cash").length
        ? `${dlocalRails(country, "cash").join(" · ")} — `
        : "") + (language === "en" ? "Get a voucher and pay cash at a nearby store or agent."
        : language === "pt" ? "Gere um voucher e pague em dinheiro em uma loja ou agente."
        : language === "fr" ? "Recevez un bon et payez en espèces dans un point de vente."
        : "Genera un cupón y paga en efectivo en una tienda o agente cercano."),
      badge: finalPriceLabel,

      badges: dlocalBadges(country, "cash", 6).length
        ? dlocalBadges(country, "cash", 6)
        : [{ label: "Efectivo", bg: "#F5A623", color: "#1F2937" }],
    },
    {
      id: "dlocal_wallet",
      icon: Wallet,
      title: (getDlocalCountry(country)?.walletLabel
        ? `${getDlocalCountry(country)!.walletLabel}`
        : language === "en" ? "Digital wallet"
        : language === "pt" ? "Carteira digital"
        : language === "fr" ? "Portefeuille numérique"
        : "Billetera digital"),
      sub: (dlocalRails(country, "wallet").length
        ? `${dlocalRails(country, "wallet").join(" · ")} — `
        : "") + (language === "en" ? "Pay from your wallet app in local currency. Instant confirmation."
        : language === "pt" ? "Pague pela sua carteira digital em moeda local. Confirmação imediata."
        : language === "fr" ? "Payez depuis votre portefeuille en monnaie locale. Confirmation immédiate."
        : "Paga desde tu billetera digital en moneda local. Confirmación inmediata."),
      badge: finalPriceLabel,

      badges: dlocalBadges(country, "wallet", 6),
    },
    {
      id: "dlocal_card",
      icon: CreditCard,
      title: language === "en" ? "Debit / credit card"
        : language === "pt" ? "Cartão de débito / crédito"
        : language === "fr" ? "Carte bancaire"
        : "Tarjeta de débito / crédito",
      sub: language === "en" ? "Pay in local currency with your card. Secure fields by dLocal."
        : language === "pt" ? "Pague em moeda local com seu cartão. Campos seguros da dLocal."
        : language === "fr" ? "Payez en monnaie locale par carte. Champs sécurisés dLocal."
        : "Paga en tu moneda local con tu tarjeta. Campos seguros de dLocal.",
      badge: finalPriceLabel,

      badges: [
        { label: "Visa", bg: "#1A1F71", color: "#ffffff" },
        { label: "Mastercard", bg: "#EB001B", color: "#ffffff" },
      ],
    },
    {
      id: "hotmart_separator",
      title: "HOTMART",
      isSeparator: true,
      icon: CreditCard,
      sub: "",
      badge: "",
    },
    {
      id: "hotmart",
      icon: CreditCard,
      title: language === "en" ? "Hotmart (1-click)"
        : language === "pt" ? "Hotmart (1 clique)"
        : language === "fr" ? "Hotmart (1 clic)"
        : "Hotmart (1 clic)",
      sub: language === "en"
        ? `${hotmartPriceLabel} · ${hotmartTaxNote} · 1 click`
        : language === "pt"
        ? `${hotmartPriceLabel} · ${hotmartTaxNote} · 1 clique`
        : language === "fr"
        ? `${hotmartPriceLabel} · ${hotmartTaxNote} · 1 clic`
        : `${hotmartPriceLabel} · ${hotmartTaxNote} · 1 clic`,


      badge: hotmartPriceLabel,
      badges: hotmartBadges,

    },
  ];


  // Métodos habilitados dinámicamente desde /admin/checkout-methods.
  // Perú conserva sus rails locales (transfer/cash/yape) por defecto; el resto
  // del mundo cae en la región GLOBAL. Si el admin desactiva un método, aquí
  // deja de aparecer. Antes de cargar la config no mostramos opciones para
  // evitar que aparezcan fugazmente todos los métodos legacy.
  const filteredByAdmin = methodsConfig.loaded
    ? allMethods.filter((m) => {
        if (m.id === "card") {
          if (m.methodKey) return enabledStripeKeys.has(m.methodKey);
          return methodsConfig.regionCode && methodsConfig.enabledMethodKeys.length > 0
            ? enabledStripeKeys.has("stripe_card")
            : methodsConfig.stripe;
        }
        if (m.id === "stripe_ach") return isUsa && methodsConfig.stripeAch;
        if (m.id === "stripe_cashapp") return isUsa && methodsConfig.stripeCashApp;
        if (m.id === "stripe_klarna") return methodsConfig.stripeKlarna;
        if (m.id === "paypal") return methodsConfig.paypal;
        // Rails locales de Perú (transferencia BCP/Interbank, efectivo, Yape/Plin)
        // SOLO deben verse desde Perú. Un comprador en México no puede pagar a
        // cuentas peruanas: para MX el rail local es SPEI/CLABE.
        if (m.id === "transfer") return methodsConfig.transfer && isPeru;
        if (m.id === "cash") return methodsConfig.cash && isPeru;
        if (m.id === "yape") return methodsConfig.yape && isPeru;
        if (m.id === "binance") return methodsConfig.binance;
        if (m.id === "clabe") return country === "MX";

        // dLocal Go: solo se muestra el rail que realmente existe en el país del cliente.
        if (m.id === "dlocal_transfer") return methodsConfig.dlocalTransfer && dlocalSupports(country, "transfer") && !getDlocalCountry(country)?.transferComingSoon;
        if (m.id === "dlocal_cash") return methodsConfig.dlocalCash && dlocalSupports(country, "cash") && !getDlocalCountry(country)?.cashComingSoon;
        // Tarjeta dLocal DESACTIVADA. Billetera digital sigue activa.
        if (m.id === "dlocal_card") return false;
        if (m.id === "dlocal_wallet") return methodsConfig.dlocalWallet && dlocalSupports(country, "wallet") && !getDlocalCountry(country)?.walletComingSoon;



        if (m.id === "hotmart") return methodsConfig.hotmart && !!hotmartResolvedUrl;


        return true;
      })
    : [];
  // Aplica el orden configurado en /admin/checkout-methods (según sort_order
  // más bajo de cada familia en la región activa).
  const familyOf = (id: Method) => id === "card" ? "stripe" : id === "stripe_ach" ? "stripeAch" : id === "stripe_cashapp" ? "stripeCashApp" : id === "stripe_klarna" ? "stripeKlarna" : id === "dlocal_transfer" ? "dlocalTransfer" : id === "dlocal_cash" ? "dlocalCash" : id === "dlocal_wallet" ? "dlocalWallet" : id === "dlocal_card" ? "dlocalCard" : id;
  const orderIndex = (id: Method) => {
    const fam = familyOf(id);
    const i = methodsConfig.familyOrder.indexOf(fam as FamilyKey);
    return i === -1 ? 99 : i;
  };
  const sortedByAdmin = [...filteredByAdmin].sort((a, b) => orderIndex(a.id) - orderIndex(b.id));
  // Hotmart sube una posición: se muestra justo después de la tarjeta (Stripe)
  // para darle más visibilidad sin desplazar el método principal.
  const orderedByAdmin = (() => {
    const hIdx = sortedByAdmin.findIndex((m) => m.id === "hotmart");
    if (hIdx <= 1) return sortedByAdmin;
    const copy = [...sortedByAdmin];
    const [h] = copy.splice(hIdx, 1);
    copy.splice(1, 0, h);
    return copy;
  })();
  // Si el admin configuró explícitamente la región (methodsConfig.loaded con
  // regionCode), respetamos exactamente lo que habilitó, sin forzar el filtro
  // legacy card+paypal fuera de Perú. Perú siempre oculta paypal directo.
  const visibleMethods = orderedByAdmin.length > 0 ? orderedByAdmin : allMethods.filter(m => m.id === 'card' || m.id === 'hotmart');
  // Orden de secciones para que el checkout se lea de arriba a abajo sin saltos:
  // tarjetas → transferencias → efectivo → billeteras → otros (Hotmart al final).
  const methods = [...visibleMethods].sort(
    (a, b) => SECTION_ORDER.indexOf(methodSection(a.id)) - SECTION_ORDER.indexOf(methodSection(b.id)),
  );
  const stripeMethodAvailable = methods.some((m) => ["card", "stripe_ach", "stripe_cashapp", "stripe_klarna"].includes(m.id));




  // Fuera de Perú solo hay un método (Stripe). Auto-seleccionarlo y auto-abrir
  // el formulario embebido en cuanto el comprador completa sus datos, para
  // reducir clics y maximizar conversión (adultos mayores, jóvenes, adultos).
  useEffect(() => {
    if (!isPeru && stripeMethodAvailable && !(total <= 0 && items.length > 0)) {
      // Solo autoseleccionar Stripe si el comprador NO ha elegido ya otro
      // método explícitamente (ej: PayPal, Binance). Antes forzaba "card"
      // en cada render y borraba la selección de PayPal al hacer click.
      if (!selected) {
        setSelected("card");
        setSelectedCardRow(`card-${isPeru ? t.cardTitlePeru : t.cardTitleGlobal}`);
      }
      const isStripeSel = selected && ["card", "stripe_ach", "stripe_cashapp", "stripe_klarna"].includes(selected);
      if (isStripeSel && valid && stripePromise && !showStripe) setShowStripe(true);
    }
  }, [isPeru, stripeMethodAvailable, selected, valid, stripePromise, showStripe, total, items.length, t.cardTitlePeru, t.cardTitleGlobal]);

  // Validación automática: el método dLocal seleccionado y sus etiquetas deben
  // coincidir siempre con la cobertura activa de /admin/dlocal para el país
  // detectado. Si el país cambia y el método deja de estar cubierto, se
  // deselecciona automáticamente y se avisa al comprador.
  useEffect(() => {
    if (!methodsConfig.loaded) return;
    const shown = methods
      .filter((m) => isDlocalMethodId(m.id))
      .map((m) => ({ methodId: m.id as string, labels: (m.badges ?? []).map((b) => b.label) }));
    const problems = auditDlocalCheckout(country, shown);
    if (problems.length && import.meta.env.DEV) {
      console.warn("[dLocal] Cobertura desincronizada con /admin/dlocal:", problems);
    }
    if (selected && isDlocalMethodId(selected)) {
      const v = validateDlocalMethod(country, selected);
      const stillVisible = methods.some((m) => m.id === selected);
      if (!v.ok || !stillVisible) {
        setSelected(null);
        setMethodError({
          method: selected,
          message: v.reason || "Este método de pago no está disponible para tu país. Elige otro.",
        });
      }
    }
  }, [country, methods, methodsConfig.loaded, selected]);


  // Cuando se abre el iframe de Stripe, hacer scroll hasta él para que el
  // comprador VEA el formulario de tarjeta y no crea que "no pasó nada".
  useEffect(() => {
    if (showStripe && selected && ["card", "stripe_ach", "stripe_cashapp", "stripe_klarna"].includes(selected)) {
      const id = window.setTimeout(() => {
        stripeAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 250);
      return () => window.clearTimeout(id);
    }
  }, [showStripe, selected]);


  const wasValidRef = useRef(valid);
  const methodsAnchorRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!wasValidRef.current && valid) {
      methodsAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    wasValidRef.current = valid;
  }, [valid]);

  const isFree = total <= 0 && items.length > 0 && !!coupon && couponPercent >= 100;
  const isInvalidZero = total <= 0 && items.length > 0 && !isFree;
  const [freeLoading, setFreeLoading] = useState(false);
  const submitFreeOrder = async () => {
    if (!valid) { requestBuyerInfo(); return; }
    setFreeLoading(true);
    const s = useCheckoutPruebaStore.getState();
    const orderId = `ilr-free-${Date.now()}`;
    try {
      // El correo de confirmación/entrega ya NO se dispara desde el navegador:
      // la página de éxito resuelve el pedido con `order-delivery` (service-role)
      // y genera el enlace privado /mi-descarga?t=<token>.
      supabase.from("email_contacts").upsert({
        email: s.buyer.email.trim().toLowerCase(),
        name: s.buyer.fullName.trim(),
        source: "checkout-prueba-1",
        metadata: { processor: "free-coupon", coupon: s.coupon ?? "" },
      }, { onConflict: "email,source" }).then(() => {});

    } catch (e) {
      console.error("free order confirmation failed", e);
    } finally {
      trackPurchase(orderId, "mercadopago_cash");
      navigate(`/checkouts/success?session_id=${encodeURIComponent(orderId)}&status=approved&external_reference=${encodeURIComponent(orderId)}`);
    }
  };

  return (
    <div id="payment-methods" ref={methodsAnchorRef} className="space-y-2 scroll-mt-24">


      {isFree && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-4 space-y-3">
          <p className="text-sm text-emerald-800 dark:text-emerald-200">
            {language === "en"
              ? "Your coupon covers 100% of the order. No payment is required — just confirm to receive your products by email."
              : language === "pt"
              ? "Seu cupom cobre 100% do pedido. Não é necessário pagar — confirme para receber seus produtos por email."
              : language === "fr"
              ? "Votre coupon couvre 100% de la commande. Aucun paiement requis — confirmez pour recevoir vos produits par email."
              : "Tu cupón cubre el 100% del pedido. No hay que pagar — confirma para recibir tus productos por correo."}
          </p>
          <button
            type="button"
            onClick={submitFreeOrder}
            disabled={freeLoading || !valid}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 disabled:opacity-60"
          >
            {freeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {language === "en" ? "Confirm free order" : language === "pt" ? "Confirmar pedido grátis" : language === "fr" ? "Confirmer la commande gratuite" : "Confirmar pedido gratis"}
          </button>
        </div>
      )}

      {isInvalidZero && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4">
          <p className="text-sm text-amber-900 dark:text-amber-100 font-medium">
            {language === "en"
              ? "The total cannot be $0. Please add a product before paying."
              : language === "pt"
              ? "O total não pode ser $0. Adicione um produto antes de pagar."
              : language === "fr"
              ? "Le total ne peut pas être $0. Ajoutez un produit avant de payer."
              : "El total no puede ser $0. Agrega un producto antes de pagar."}
          </p>
        </div>
      )}

      {methodError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          <p className="font-semibold">
            {language === "en" ? "We couldn't open this payment method"
              : language === "pt" ? "Não conseguimos abrir este método de pagamento"
              : language === "fr" ? "Impossible d'ouvrir ce moyen de paiement"
              : "No pudimos abrir este método de pago"}
          </p>
          <p className="mt-1 text-xs">{methodError.message}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                const m = methodError.method;
                setMethodError(null);
                if (m === "hotmart") { setCfgReload((n) => n + 1); void redirectToHotmart(); }
                else if (m === "transfer") { payMercado("transfer"); }
                else if (m === "cash") { payMercado("cash"); }
              }}
              className="inline-flex items-center gap-2 rounded-md bg-red-700 px-3 py-2 text-xs font-semibold text-white hover:bg-red-800"
            >
              <Loader2 className="w-3.5 h-3.5" />
              {language === "en" ? "Try again" : language === "pt" ? "Tentar novamente" : language === "fr" ? "Réessayer" : "Intentar de nuevo"}
            </button>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-[#25D366] px-3 py-2 text-xs font-semibold text-white hover:bg-[#20b858]"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {language === "en" ? "Contact us on WhatsApp" : language === "pt" ? "Fale conosco no WhatsApp" : language === "fr" ? "Contactez-nous sur WhatsApp" : "Escríbenos por WhatsApp"}
            </a>
          </div>
        </div>
      )}



      {!isFree && !isInvalidZero && (
        <div className="flex items-center gap-2 mb-4 px-1">
          <Smartphone className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h3 className="font-bold text-neutral-800 dark:text-neutral-100 uppercase tracking-tight">
            {t.paymentMethod}
          </h3>
        </div>
      )}


      {!isFree && !isInvalidZero && methods.map((m, idx) => {
        const primaryCardTitle = isPeru ? t.cardTitlePeru : t.cardTitleGlobal;
        const isStripeRow = ["card", "stripe_ach", "stripe_cashapp", "stripe_klarna"].includes(m.id);
        const isPrimaryCard = m.id === "card" && m.title === primaryCardTitle;
        // For USA extra rows (Cash App, US Bank) — highlight only the clicked one.
        const rowKey = `${m.id}-${m.title}`;
        const isSelected = valid && selected === m.id && (!isStripeRow || selectedCardRow === rowKey);
        const isLoading = mpLoading === m.id;
        const Icon = m.icon;
        const section = methodSection(m.id);
        const prev = idx > 0 ? methods[idx - 1] : null;
        const showSectionHeader = !prev || methodSection(prev.id) !== section;
        if ((m as any).isSeparator) {
          return (
            <div key={rowKey} className="flex items-center gap-2 pt-1 mt-1 border-t border-neutral-200/70 dark:border-neutral-800 pt-2.5">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                {t.acceptedMethods}
              </span>
            </div>
          );
        }
        return (
          <React.Fragment key={rowKey}>
          {showSectionHeader && (
            <div className={cn(
              "flex items-center gap-2 pt-1",
              idx > 0 && "mt-1 border-t border-neutral-200/70 dark:border-neutral-800 pt-2.5",
            )}>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {sectionLabel(section, language)}
              </span>
            </div>
          )}
          <div
            data-method-row={m.id}
            className={cn(
              "rounded-lg border overflow-hidden transition-colors scroll-mt-24",
              isSelected
                ? "border-neutral-400 bg-neutral-100 dark:bg-neutral-800/60"
                : "border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/40",
            )}
          >
            <button
              type="button"
              onClick={() => { setSelectedCardRow(rowKey); handleSelect(m.id); }}
              disabled={isLoading}
              aria-disabled={!valid}
              className={cn(
                "w-full text-left flex items-center transition-colors",
                "focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl",
                m.id === "hotmart"
                  ? "px-3 pt-1.5 pb-2.5 sm:px-4 sm:pt-2 sm:pb-3 gap-2.5 sm:gap-3"
                  : "px-2.5 py-2 sm:px-3 sm:py-2.5 gap-2 sm:gap-2.5",
                isSelected
                  ? "bg-neutral-200/60 dark:bg-neutral-800"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800/60",
                !valid && "cursor-not-allowed",
              )}
            >
              {m.id !== "hotmart" && (
                <div className={cn(
                  "rounded-lg flex items-center justify-center shrink-0 w-8 h-8 sm:w-9 sm:h-9",
                  isSelected
                    ? "bg-neutral-700 text-white"
                    : "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200",
                )}>
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[13px] sm:text-sm flex items-center gap-2 flex-nowrap min-w-0 text-neutral-800 dark:text-neutral-100">
                  {m.id === "hotmart" ? (
                    <img src={hotmartLogo.url} alt="Hotmart" className="h-10 sm:h-12 w-auto object-contain -my-1" />
                  ) : (
                    <span className="min-w-0 truncate">{m.title}</span>
                  )}
                  {m.badge && (
                    <span className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0",
                      isSelected
                        ? "bg-neutral-800 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                        : "bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-100"
                    )}>
                      {m.badge}
                    </span>
                  )}
                </div>
                {isPrimaryCard ? (
                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                    {primaryCardBadges.map((badge) => {
                      if (badge.label === "Visa") return <LogoBadge key={badge.label} src={visaLogo} alt="Visa" />;
                      if (badge.label === "Mastercard") return <LogoBadge key={badge.label} src={mastercardLogo} alt="Mastercard" />;
                      if (badge.label === "Apple Pay") return <LogoBadge key={badge.label} src={applePayLogo} alt="Apple Pay" bg="#000000" />;
                      if (badge.label === "Google Pay") return <GooglePayBadge key={badge.label} />;
                      if (badge.label === "Link") return <LinkBadge key={badge.label} />;
                      return <BankBadge key={badge.label} {...badge} />;
                    })}
                  </div>
                ) : null}

                {isPrimaryCard ? null : m.id === "stripe_ach" ? (
                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                    <BankBadge label="ACH" bg="#0F766E" color="#ffffff" />
                    <BankBadge label="US Bank" bg="#1F2937" color="#ffffff" />
                  </div>
                ) : m.id === "stripe_cashapp" ? (
                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                    <BankBadge label="Cash App" bg="#00D632" color="#001B0A" />
                  </div>
                ) : m.id === "stripe_klarna" ? (
                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                    <BankBadge label="Klarna" bg="#FFA8CD" color="#0A0A0A" />
                    <BankBadge label="4 cuotas" bg="#1F2937" color="#ffffff" />
                  </div>
                ) : m.id === "hotmart" ? (
                  <div className="mt-1.5">
                    <div className="flex items-center gap-1 flex-wrap">
                      {(m.badges ?? []).map((badge) => <BankBadge key={badge.label} {...badge} />)}
                    </div>
                    <div className="mt-1 text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400">{m.sub}</div>
                  </div>

                ) : m.badges?.length ? (
                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                    {m.badges.map((badge) => <BankBadge key={badge.label} {...badge} />)}

                  </div>
                ) : m.id === "transfer" ? (
                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                    <BankBadge label="BCP" bg="#00447C" color="#FF9E1B" />
                    <BankBadge label="BBVA" bg="#004481" color="#ffffff" />
                    <BankBadge label="Interbank" bg="#00953B" color="#ffffff" />
                    <BankBadge label="Scotiabank" bg="#EC111A" color="#ffffff" />
                  </div>
                ) : m.id === "cash" ? (
                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                    <BankBadge label="PagoEfectivo" bg="#EC0928" color="#ffffff" />
                    <BankBadge label="Western Union" bg="#FFDD00" color="#000000" />
                  </div>
                ) : m.id === "yape" ? (
                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                    <BankBadge label="Yape" bg="#742282" color="#ffffff" />
                    <BankBadge label="Plin" bg="#00BFB3" color="#ffffff" />
                  </div>
                ) : m.id === "binance" ? (
                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                    <BankBadge label="Binance" bg="#F0B90B" color="#0A0A0A" />
                    <BankBadge label="USDT" bg="#26A17B" color="#ffffff" />
                    <BankBadge label="Pay ID" bg="#1F2937" color="#ffffff" />
                  </div>
                ) : m.id === "clabe" ? (
                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                    <BankBadge label="SPEI" bg="#0A2540" color="#ffffff" />
                    <BankBadge label="CLABE" bg="#006341" color="#ffffff" />
                    <BankBadge label="MXN" bg="#ffffff" color="#0A2540" />
                  </div>
                ) : (
                  <div className="text-[11px] leading-snug text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">{m.sub}</div>
                )}


              </div>
              <div className={cn(
                "w-4 h-4 rounded-full border-2 shrink-0 transition-colors",
                isSelected
                  ? "border-neutral-700 bg-neutral-700"
                  : "border-neutral-300 dark:border-neutral-600",
              )} />
            </button>




            {isStripeRow && valid && selected === m.id && selectedCardRow === rowKey && showStripe && stripePromise && (
              <div ref={stripeAnchorRef} className="border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 scroll-mt-24">
                {/* Aviso claro: falta 1 paso más (llenar tarjeta y pagar dentro de Stripe) */}
                <div className="px-3 sm:px-4 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 text-[12px] sm:text-sm text-amber-900 dark:text-amber-200 font-medium text-center">
                  ⬇️ {language === "en"
                    ? "Last step: complete payment securely below."
                    : language === "pt"
                      ? "Último passo: conclua o pagamento seguro abaixo."
                      : language === "fr"
                        ? "Dernière étape : termine le paiement sécurisé ci-dessous."
                        : "Último paso: completa el pago seguro aquí abajo."}
                </div>
                {/* Trust row encima del embed */}
                <div className="grid grid-cols-3 gap-1 px-3 sm:px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800 text-[10px] sm:text-[11px] text-neutral-600 dark:text-neutral-300">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-medium">{t.ssl256}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300 text-[8px] font-bold shrink-0">✓</span>
                    <span className="font-medium">{t.stripeVerified}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                    <span className="font-medium">{t.support24h}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <Lock className="w-3.5 h-3.5" /> {t.processedBy}
                </div>
                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  {isFallingBackToUsd && (
                    <Alert className="mb-4 bg-teal-50 border-teal-200 dark:bg-teal-950/30 dark:border-teal-900/50">
                      <AlertCircle className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      <AlertTitle className="text-teal-800 dark:text-teal-300 font-semibold">
                        {language === "en" ? `Optimized payment for ${countryCode}` : `Pago optimizado para ${countryCode}`}
                      </AlertTitle>
                      <AlertDescription className="text-teal-700 dark:text-teal-400 text-sm">
                        {language === "en" 
                          ? "Paying in USD to ensure international bank compatibility." 
                          : "Pagando en USD para garantizar la compatibilidad con tu banco internacional."}
                      </AlertDescription>
                    </Alert>
                  )}

                  {stripeError ? (
                    <div className="p-6 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30 flex flex-col items-center text-center gap-4">
                      <AlertCircle className="h-10 w-10 text-red-500" />
                      <div className="space-y-1">
                        <h3 className="font-bold text-red-900 dark:text-red-200 text-lg">{stripeError.title}</h3>
                        <p className="text-red-700 dark:text-red-300 text-sm max-w-xs">{stripeError.message}</p>
                      </div>
                      {stripeError.retryable && (
                        <Button 
                          onClick={stripeError.code === "currency_restricted" ? () => { setIsFallingBackToUsd(true); retryStripe(); } : retryStripe}
                          className="bg-red-600 hover:bg-red-700 text-white gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          {stripeError.code === "currency_restricted" ? "Intentar en USD" : t.tryAgain}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div ref={stripeContainerRef} className="relative min-h-[560px] sm:min-h-[500px] bg-white dark:bg-neutral-950 -mx-px">
                      {(stripeLoading || !stripeFrameMounted) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-neutral-900/80 z-10 rounded-xl backdrop-blur-sm">
                          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mb-3" />
                          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                            {stripeElapsed > 5 ? "Configurando conexión segura..." : "Abriendo formulario de Stripe..."}
                          </p>
                        </div>
                      )}
                      <EmbeddedCheckoutProvider stripe={stripePromise} options={stripeOptions}>
                        <EmbeddedCheckout />
                      </EmbeddedCheckoutProvider>
                    </div>
                  )}
                </div>
              </div>
            )}


            {m.id === "dlocal_card" && isSelected && (
              <div className="border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-4">
                <DlocalSmartFields
                  country={country}
                  currency={DLOCAL_CURRENCY_BY_COUNTRY[country] ?? "USD"}
                  amount={(DLOCAL_CURRENCY_BY_COUNTRY[country] ?? "USD") === "USD"
                    ? total
                    : (local.currency === (DLOCAL_CURRENCY_BY_COUNTRY[country] ?? "USD") ? local.amount : total)}
                  expectedTotalUsd={total}
                  items={items.map((i) => ({ id: i.id, name: i.name, price: itemPrice(i, region.tier), quantity: i.quantity }))}
                  couponPercent={couponPercent}
                  couponCode={coupon ?? undefined}
                  payerName={buyer.fullName}
                  payerEmail={buyer.email}
                  payerPhone={buyer.phone ?? undefined}
                  language={language}
                  onPaid={(orderId) => {
                    trackPurchase(orderId, "mercadopago_transfer");
                    navigate(`/checkouts/success?session_id=${encodeURIComponent(orderId)}&status=approved&external_reference=${encodeURIComponent(orderId)}`);
                  }}
                  onError={(message) => setMethodError({ method: "dlocal_card", message })}
                />
              </div>
            )}

            {m.id === "yape" && isSelected && (
              <div className="border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-4 space-y-4">
                <div className="bg-[#742282]/5 dark:bg-[#742282]/10 border border-[#742282]/20 dark:border-[#742282]/30 rounded-xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center gap-3 text-[#742282] dark:text-[#a356b1]">
                    <div className="w-10 h-10 rounded-full bg-[#742282]/10 dark:bg-[#742282]/20 flex items-center justify-center shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-base leading-tight">Yape o Plin (Perú)</p>
                      <p className="text-xs opacity-80">Pago inmediato sin comisiones</p>
                    </div>
                  </div>

                  <div className="space-y-3 bg-white/50 dark:bg-black/20 p-4 rounded-lg border border-[#742282]/10">
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-[#742282]/70 dark:text-[#a356b1]/70">Número de celular</p>
                      <button
                        type="button"
                        onClick={copyPhone}
                        className="inline-flex items-center gap-2 text-2xl font-mono font-bold text-[#742282] dark:text-[#c484d3] hover:opacity-80 transition"
                      >
                        {YAPE_PHONE}
                        {copied ? <Check className="w-5 h-5 text-emerald-600 shrink-0" /> : <Copy className="w-5 h-5 shrink-0" />}
                      </button>
                      <p className="text-[10px] text-neutral-500 mt-0.5">{copied ? t.copied : t.tapToCopy}</p>
                    </div>
                    
                    <div className="pt-3 border-t border-[#742282]/10 text-center">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-[#742282]/70 dark:text-[#a356b1]/70">Titular</p>
                      <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100">{YAPE_NAME}</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-white/50 dark:bg-black/20 p-3 text-center border border-[#742282]/10">
                    <p className="text-xs text-[#742282]/70 dark:text-[#a356b1]/70 uppercase tracking-wider font-bold">{t.amountToPay}</p>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                      {(() => {
                        const pricing = {
                          priceUsd: currentUsdRef,
                          currencyCode: currency,
                          priceLabel: localTotalLabel,
                          exchangeRate: totalLocal / currentUsdRef,
                          finalPriceAmount: totalLocal,
                        };
                        const payload = getPaymentPayload(pricing, "manual", countryCode);
                        return formatCurrencyAmount(Number(payload.amount), "PEN");
                      })()}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-1">{t.sendEquivalentSoles}</p>
                  </div>

                  <div className="flex items-start gap-3 bg-white/40 dark:bg-black/10 p-3 rounded-lg text-[13px] leading-relaxed text-[#742282]/90 dark:text-[#c484d3]/90 italic">
                    <MessageCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#25D366]" />
                    <p>
                      <strong>Importante:</strong> Envía tu captura de pantalla a <span className="font-bold">hola@ilinguerelax.com</span> o por WhatsApp para habilitar tu descarga al instante.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleManualPaid}
                  className="w-full bg-[#742282] hover:bg-[#5e1b69] text-white font-bold py-4 rounded-xl transition-colors shadow-lg"
                >
                  {t.alreadyPaid}
                </button>

                <p className="text-[11px] text-center text-neutral-500 leading-relaxed">{t.yapeVerifiedBy}</p>
              </div>
            )}

            {m.id === "binance" && isSelected && (
              <div className="border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-4 space-y-4">
                <div className="bg-[#F0B90B]/5 dark:bg-[#F0B90B]/10 border border-[#F0B90B]/20 dark:border-[#F0B90B]/30 rounded-xl p-4 sm:p-5 space-y-4 text-center">
                  <div className="flex flex-col items-center gap-2 text-[#b38a08] dark:text-[#F0B90B]">
                    <div className="w-12 h-12 rounded-full bg-[#F0B90B]/10 dark:bg-[#F0B90B]/20 flex items-center justify-center shrink-0 mb-1">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-lg leading-tight">Binance Pay / USDT</p>
                    <p className="text-xs opacity-80">Red: {binanceCfg.network} • {binanceCfg.holder_name}</p>
                  </div>

                  <div className="flex justify-center py-2">
                    <div className="relative group">
                      <img
                        src={binanceCfg.qr_url}
                        alt="Binance Pay QR"
                        className="w-44 h-44 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white object-contain p-2 shadow-sm"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-xl pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                    {binanceCfg.pay_id && (
                      <div className="rounded-lg bg-white/50 dark:bg-black/20 p-3 border border-[#F0B90B]/10">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-[#b38a08]/70">Binance Pay ID</p>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(binanceCfg.pay_id).catch(() => {});
                            toast({ description: t.copied });
                          }}
                          className="w-full inline-flex items-center justify-between gap-2 text-base font-mono font-bold text-neutral-900 dark:text-neutral-100 hover:opacity-80 transition"
                        >
                          <span>{binanceCfg.pay_id}</span>
                          <Copy className="w-3.5 h-3.5 shrink-0 opacity-50" />
                        </button>
                      </div>
                    )}

                    <div className="rounded-lg bg-white/50 dark:bg-black/20 p-3 border border-[#F0B90B]/10 overflow-hidden">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-[#b38a08]/70">Wallet Address</p>
                      <button
                        type="button"
                        onClick={copyBinance}
                        className="w-full inline-flex items-center justify-between gap-2 text-[13px] font-mono font-bold text-neutral-900 dark:text-neutral-100 hover:opacity-80 transition"
                      >
                        <span className="truncate">{binanceCfg.address.slice(0, 8)}...{binanceCfg.address.slice(-6)}</span>
                        {copiedBinance ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0 opacity-50" />}
                      </button>
                    </div>
                  </div>



                  <div className="rounded-lg bg-[#F0B90B]/10 p-3 text-center border border-[#F0B90B]/20">
                    <p className="text-xs text-[#b38a08] uppercase tracking-wider font-bold">{t.amountToPay}</p>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                      {(() => {
                        const pricing = {
                          priceUsd: currentUsdRef,
                          currencyCode: currency,
                          priceLabel: localTotalLabel,
                          exchangeRate: totalLocal / currentUsdRef,
                          finalPriceAmount: totalLocal,
                        };
                        const payload = getPaymentPayload(pricing, "binance", countryCode);
                        return `USD $${payload.amountUsdt || payload.amount}`;
                      })()}
                    </p>
                  </div>

                  <div className="flex items-start gap-3 bg-white/40 dark:bg-black/10 p-3 rounded-lg text-[13px] leading-relaxed text-[#b38a08] dark:text-[#F0B90B]/80 italic text-left">
                    <MessageCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#25D366]" />
                    <p>
                      <strong>{language === "en" ? "Important:" : "Importante:"}</strong> {language === "en" ? "Send your screenshot to " : "Envía tu captura de pantalla a "}<span className="font-bold">hola@ilinguerelax.com</span> {language === "en" ? "or via WhatsApp to validate your payment immediately." : "o por WhatsApp para validar tu pago de inmediato."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleBinancePaid}
                  className="w-full bg-[#F0B90B] hover:bg-[#d9a409] text-neutral-900 font-bold py-4 rounded-xl transition-colors shadow-lg"
                >
                  {t.alreadyPaid}
                </button>


                <p className="text-[11px] text-center text-neutral-500 leading-relaxed">{t.yapeVerifiedBy}</p>
              </div>
            )}

            {m.id === "clabe" && isSelected && (
              <div className="border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-4 space-y-4">
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center gap-3 text-amber-800 dark:text-amber-400">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-base leading-tight">Instrucciones de pago SPEI</p>
                      <p className="text-xs opacity-80">Transfiere desde tu app bancaria en México</p>
                    </div>
                  </div>

                  <div className="space-y-3 bg-white/50 dark:bg-black/20 p-4 rounded-lg border border-amber-100 dark:border-amber-900/20">
                    <div className="flex justify-between items-start gap-2 group">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-amber-700/70 dark:text-amber-500/50">Titular de la cuenta</p>
                        <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100">{CLABE_HOLDER}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-start gap-2 pt-2 border-t border-amber-100 dark:border-amber-900/10">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-amber-700/70 dark:text-amber-500/50">CLABE Interbancaria</p>
                        <p className="font-mono font-bold text-base tracking-wider text-neutral-900 dark:text-neutral-100">{CLABE_NUMBER}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-100 shrink-0"
                        onClick={() => {
                          navigator.clipboard.writeText(CLABE_NUMBER);
                          setCopiedClabe(true);
                          toast({ title: "CLABE copiada", description: "Pégala en tu app bancaria." });
                          setTimeout(() => setCopiedClabe(false), 2000);
                        }}
                      >
                        {copiedClabe ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>

                    <div className="pt-2 border-t border-amber-100 dark:border-amber-900/10">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-amber-700/70 dark:text-amber-500/50">{language === "en" ? "Receiving Bank" : "Banco Receptor"}</p>
                      <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100">{CLABE_BANK}</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-white/50 dark:bg-black/20 p-3 text-center border border-amber-100 dark:border-amber-900/10">
                    <p className="text-xs text-amber-700/70 dark:text-amber-500/50 uppercase tracking-wider font-bold">{t.amountToPay}</p>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                      {local.loading || local.isUsd ? `USD $${totalUsd}` : local.formatted}
                    </p>
                  </div>

                  <div className="flex items-start gap-3 bg-white/40 dark:bg-black/10 p-3 rounded-lg text-[13px] leading-relaxed text-amber-900/80 dark:text-amber-300/80 italic">
                    <MessageCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>
                      <strong>{language === "en" ? "Important:" : "Importante:"}</strong> {language === "en" ? "Send your transfer proof to " : "Envía tu comprobante de transferencia a "}<span className="font-bold">hola@ilinguerelax.com</span> {language === "en" ? "or via WhatsApp to validate your order immediately." : "o por WhatsApp para validar tu pedido inmediatamente."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClabePaid}
                  className="w-full bg-[#0A2540] hover:bg-[#081e33] text-white font-bold py-4 rounded-xl transition-colors shadow-lg"
                >
                  {t.alreadyPaid}
                </button>

                <p className="text-[11px] text-center text-neutral-500 leading-relaxed">{t.yapeVerifiedBy}</p>
              </div>
            )}




            {m.id === "paypal" && isSelected && (
              <div className="border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-4 space-y-3">
                <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800/60 p-3 text-center">
                  <p className="text-xs text-neutral-500">{t.amountToPay}</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    USD ${totalUsd}
                  </p>
                </div>
                <PayPalButtons
                  amountUsd={currentUsdRef}
                  localCurrency={countryCode === "PE" ? "PEN" : currency}
                  localAmount={countryCode === "PE" ? (penTotals?.total || totalLocal) : totalLocal}
                  description={items.map((i) => i.name).join(" + ").slice(0, 120) || "iLingue Relax"}
                  buyerEmail={buyer.email.trim() || undefined}
                  buyerName={buyer.fullName.trim() || undefined}
                  buyerPhone={buyer.phone || undefined}
                  buyerCountry={countryCode || undefined}
                  skus={items.map((i) => i.id)}
                  couponCode={coupon ?? undefined}
                  items={items.map(i => ({ id: i.id, quantity: i.quantity || 1, price: itemPrice(i, region.tier) }))}
                  onApproved={(orderId) => {
                    supabase.from("email_contacts").upsert({
                      email: buyer.email.trim().toLowerCase(),
                      name: buyer.fullName.trim(),
                      source: "checkout-prueba-1",
                      metadata: { phone: buyer.phone ?? "", processor: "paypal", orderId },
                    }, { onConflict: "email,source" }).then(() => {});
                    trackPurchase(orderId, "paypal");
                    navigate(`/checkouts/success?paypal_order=${encodeURIComponent(orderId)}`);
                  }}
                  onError={(err) => {
                    try {
                      const totals = calcTotals(items, couponPercent, region.tier);
                      trackPaymentError({
                        provider: "paypal",
                        skus: items.map((i) => i.id),
                        reason: err instanceof Error ? err.message : String(err),
                        value: totals.total,
                        currency: "USD", // Forzado a USD para Ads/Tracking
                      });
                    } catch { /* noop */ }
                  }}
                />

                <p className="text-[11px] text-center text-neutral-500">
                  {language === "en" ? "Secure checkout by PayPal." : language === "pt" ? "Checkout seguro pelo PayPal." : language === "fr" ? "Paiement sécurisé par PayPal." : "Pago seguro procesado por PayPal."}
                </p>
              </div>
            )}
          </div>
          </React.Fragment>
        );
      })}

      {!valid && (
        <p className="text-xs text-center text-muted-foreground pt-2">
          {t.enableMethods}
        </p>
      )}

      {selected !== "yape" && selected !== "binance" && selected !== "clabe" && selected !== "paypal" && selected !== "dlocal_card" && !(selected && ["card", "stripe_ach", "stripe_cashapp", "stripe_klarna"].includes(selected) && showStripe) && (
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!valid || !selected || mpLoading !== null}
          className={cn(
            "w-full mt-4 py-4 rounded-xl font-bold text-white text-base transition-colors",
            "bg-[hsl(142,72%,42%)] hover:bg-[hsl(142,72%,36%)]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "flex items-center justify-center gap-2",
          )}
        >
          {mpLoading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> {t.redirecting}</>
          ) : selected && ["card", "stripe_ach", "stripe_cashapp", "stripe_klarna"].includes(selected) ? (
            <><Lock className="w-4 h-4" /> {language === "en"
              ? `Checkout Securely · ${finalPriceLabel}`
              : language === "pt"
                ? `Continuar para pagamento · ${finalPriceLabel}`
                : language === "fr"
                  ? `Continuer vers le paiement · ${finalPriceLabel}`
                  : `Continuar de Pago · ${finalPriceLabel}`}</>
          ) : (
            <><Lock className="w-4 h-4" /> {selected === "hotmart" ? (language === "en" ? `Checkout with Hotmart · ${finalPriceLabel}` : `Pagar con Hotmart · ${finalPriceLabel}`) : `${t.buyNow} · ${finalPriceLabel}`}</>
          )}
        </button>
      )}
    </div>
  );
});

