import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useI18n } from "@/i18n/I18nContext";
import { getCheckoutUI } from "@/i18n/checkoutUI";
import { PayPalButtons } from "@/components/checkout/PayPalButtons";
import { mapStripeError, type MappedStripeError, type Lang as StripeLang } from "@/lib/stripeErrorMap";
import { invokeWithRetry } from "@/lib/invokeWithRetry";
import { trackPaymentError } from "@/hooks/useMetaPixel";
import { trackAbandonedCheckoutNow } from "@/hooks/useAbandonedCheckoutTracker";


type Method = "card" | "stripe_ach" | "stripe_cashapp" | "stripe_klarna" | "paypal" | "transfer" | "cash" | "yape" | "binance" | "clabe" | "hotmart";

const STRIPE_METHODS: Method[] = ["card", "stripe_ach", "stripe_cashapp", "stripe_klarna"];
const isStripeMethod = (m: Method | null | undefined): boolean => !!m && (STRIPE_METHODS as string[]).includes(m);

interface HotmartCountryPrice { amount: number; currency: string }
interface HotmartConfig {
  fallbackUrl: string | null;
  urlsByCountry: Record<string, string>;
  pricesByCountry: Record<string, HotmartCountryPrice>;
}



const visaLogo = "/__l5e/assets-v1/a96d5ad9-136a-425a-970a-b7889b8bdc30/visa.svg";
const mastercardLogo = "/__l5e/assets-v1/94d65183-1752-495e-ac5b-70ec4cba62b2/mastercard.svg";
const applePayLogo = "/__l5e/assets-v1/a38f0d22-72e4-4393-ace6-856f1b5379e6/apple-pay.svg";


function LogoBadge({ src, alt, bg = "#ffffff" }: { src: string; alt: string; bg?: string }) {
  return (
    <span
      className="inline-flex items-center justify-center h-6 w-9 rounded-md border border-neutral-200 dark:border-neutral-700 shadow-sm shrink-0"
      style={{ background: bg }}
    >
      <img src={src} alt={alt} className="max-h-4 max-w-[28px] object-contain" />
    </span>
  );
}

function LinkBadge() {
  return (
    <span
      className="inline-flex items-center justify-center h-6 w-9 rounded-md border border-neutral-200 dark:border-neutral-700 shadow-sm shrink-0"
      style={{ background: "#00D66F" }}
    >
      <span className="text-[10px] font-bold tracking-tight leading-none" style={{ color: "#0A2540" }}>
        Link
      </span>
    </span>
  );
}

function BankBadge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span
      className="inline-flex items-center justify-center h-6 px-2 rounded-md border border-neutral-200 dark:border-neutral-700 shadow-sm text-[10px] font-bold tracking-tight leading-none shrink-0"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  );
}





const YAPE_PHONE = "972119741";
const YAPE_NAME = "Carmen Aliaga";
const WHATSAPP_URL = "https://wa.link/unpa9n";

const CLABE_NUMBER = "646180546709905176";
const CLABE_HOLDER = "Carmen Rosa Aliaga Domínguez";
const CLABE_BANK = "STP (Sistema de Transferencias y Pagos)";

// Binance Pay values are loaded from `binance_pay_configs` via `useBinancePayConfig`.
// See admin panel at /admin/binance-config.


type MethodBadge = { label: string; bg: string; color: string };
type PaymentMethodRow = { id: Method; methodKey?: string; icon: typeof CreditCard; title: string; sub: string; badge?: string; badges?: MethodBadge[] };

const STRIPE_VISIBLE_METHODS: Record<string, Omit<PaymentMethodRow, "id" | "methodKey" | "badge">> = {
  stripe_apple_pay: {
    icon: Smartphone,
    title: "Apple Pay",
    sub: "Paga con Touch ID / Face ID desde tu iPhone, iPad o Mac (Safari).",
    badges: [{ label: " Pay", bg: "#000000", color: "#ffffff" }],
  },
  stripe_google_pay: {
    icon: Smartphone,
    title: "Google Pay",
    sub: "Paga con tu cuenta Google desde Android o Chrome.",
    badges: [{ label: "G Pay", bg: "#ffffff", color: "#1F2937" }],
  },
  stripe_oxxo: {
    icon: Banknote,
    title: "OXXO",
    sub: "Paga en efectivo en tiendas OXXO dentro del formulario seguro de Stripe.",
    badges: [{ label: "OXXO", bg: "#E31E24", color: "#ffffff" }],
  },
  stripe_boleto: {
    icon: Banknote,
    title: "Boleto",
    sub: "Voucher bancario para Brasil dentro de Stripe.",
    badges: [{ label: "Boleto", bg: "#1F2937", color: "#ffffff" }],
  },
  stripe_pix: {
    icon: Smartphone,
    title: "Pix",
    sub: "Transferencia instantánea para Brasil dentro de Stripe.",
    badges: [{ label: "Pix", bg: "#32BCAD", color: "#06211F" }],
  },
  stripe_ideal: {
    icon: Building2,
    title: "iDEAL",
    sub: "Banca online de Países Bajos dentro de Stripe.",
    badges: [{ label: "iDEAL", bg: "#CC0066", color: "#ffffff" }],
  },
  stripe_bancontact: {
    icon: Building2,
    title: "Bancontact",
    sub: "Pago local de Bélgica dentro de Stripe.",
    badges: [{ label: "Bancontact", bg: "#005498", color: "#ffffff" }],
  },
  stripe_sepa_debit: {
    icon: Banknote,
    title: "SEPA débito directo",
    sub: "Débito bancario para zona euro dentro de Stripe.",
    badges: [{ label: "SEPA", bg: "#003399", color: "#ffffff" }],
  },
  stripe_giropay: {
    icon: Building2,
    title: "Giropay",
    sub: "Banca online de Alemania dentro de Stripe.",
    badges: [{ label: "Giropay", bg: "#0B5AA6", color: "#ffffff" }],
  },
  stripe_sofort: {
    icon: Building2,
    title: "Sofort",
    sub: "Transferencia instantánea dentro de Stripe.",
    badges: [{ label: "Sofort", bg: "#EE3423", color: "#ffffff" }],
  },
  stripe_eps: {
    icon: Building2,
    title: "EPS",
    sub: "Banca online de Austria dentro de Stripe.",
    badges: [{ label: "EPS", bg: "#C8102E", color: "#ffffff" }],
  },
  stripe_p24: {
    icon: Building2,
    title: "Przelewy24 (P24)",
    sub: "Banca online de Polonia dentro de Stripe.",
    badges: [{ label: "P24", bg: "#D71920", color: "#ffffff" }],
  },
  stripe_blik: {
    icon: Smartphone,
    title: "BLIK",
    sub: "Pago móvil de Polonia dentro de Stripe.",
    badges: [{ label: "BLIK", bg: "#111827", color: "#ffffff" }],
  },
  stripe_multibanco: {
    icon: Banknote,
    title: "Multibanco",
    sub: "Pago local de Portugal dentro de Stripe.",
    badges: [{ label: "Multibanco", bg: "#1F4E79", color: "#ffffff" }],
  },
  stripe_mb_way: {
    icon: Smartphone,
    title: "MB WAY",
    sub: "Pago móvil de Portugal dentro de Stripe.",
    badges: [{ label: "MB WAY", bg: "#00A3E0", color: "#001B2D" }],
  },
  stripe_twint: {
    icon: Smartphone,
    title: "TWINT",
    sub: "Pago móvil de Suiza dentro de Stripe.",
    badges: [{ label: "TWINT", bg: "#FF5A00", color: "#ffffff" }],
  },
  stripe_mobilepay: {
    icon: Smartphone,
    title: "MobilePay",
    sub: "Pago móvil de Dinamarca/Finlandia dentro de Stripe.",
    badges: [{ label: "MobilePay", bg: "#5A78FF", color: "#ffffff" }],
  },
  stripe_bacs_debit: {
    icon: Banknote,
    title: "Bacs débito directo",
    sub: "Débito bancario de Reino Unido dentro de Stripe.",
    badges: [{ label: "Bacs", bg: "#1F2937", color: "#ffffff" }],
  },
  stripe_acss_debit: {
    icon: Banknote,
    title: "Débito bancario Canadá",
    sub: "Débito preautorizado de Canadá dentro de Stripe.",
    badges: [{ label: "ACSS", bg: "#D80621", color: "#ffffff" }],
  },
  stripe_afterpay_clearpay: {
    icon: CreditCard,
    title: "Afterpay / Clearpay",
    sub: "Compra ahora y paga en cuotas dentro de Stripe.",
    badges: [{ label: "Afterpay", bg: "#B2FCE4", color: "#0A0A0A" }],
  },
  stripe_affirm: {
    icon: CreditCard,
    title: "Affirm",
    sub: "Compra ahora y paga después dentro de Stripe.",
    badges: [{ label: "Affirm", bg: "#4A4AF4", color: "#ffffff" }],
  },
  stripe_paypal: {
    icon: Wallet,
    title: "PayPal (Stripe)",
    sub: "PayPal procesado dentro del formulario seguro de Stripe.",
    badges: [{ label: "PayPal", bg: "#003087", color: "#ffffff" }],
  },
  stripe_alipay: {
    icon: Smartphone,
    title: "Alipay",
    sub: "Pago local de Asia dentro de Stripe.",
    badges: [{ label: "Alipay", bg: "#1677FF", color: "#ffffff" }],
  },
  stripe_wechat_pay: {
    icon: Smartphone,
    title: "WeChat Pay",
    sub: "Pago local de China dentro de Stripe.",
    badges: [{ label: "WeChat", bg: "#07C160", color: "#001B0A" }],
  },
  stripe_grabpay: {
    icon: Smartphone,
    title: "GrabPay",
    sub: "Pago local del sudeste asiático dentro de Stripe.",
    badges: [{ label: "GrabPay", bg: "#00B14F", color: "#ffffff" }],
  },
  stripe_paynow: {
    icon: Smartphone,
    title: "PayNow",
    sub: "Pago local de Singapur dentro de Stripe.",
    badges: [{ label: "PayNow", bg: "#7B1FA2", color: "#ffffff" }],
  },
  stripe_konbini: {
    icon: Banknote,
    title: "Konbini",
    sub: "Pago en tiendas de conveniencia de Japón dentro de Stripe.",
    badges: [{ label: "Konbini", bg: "#D32F2F", color: "#ffffff" }],
  },
};

export function PaymentMethodsGroup({ parentSku }: { parentSku?: string | null } = {}) {
  const navigate = useNavigate();
  const { items, buyer, coupon, couponPercent } = useCheckoutPruebaStore();
  const region = useRegionTier();
  const { language } = useI18n();
  const t = getCheckoutUI(language);
  const { total } = calcTotals(items, couponPercent, region.tier);
  const penTotals = calcTotalsPen(items, couponPercent, region.country || "");
  const totalUsd = total.toFixed(2);
  const local = useLocalCurrency(total);
  const overridesFor = useSkuOverridesResolver();
  const localItemsSum = sumItemsLocal(
    items.map((i) => ({ id: i.id, usd: itemPrice(i, region.tier), quantity: i.quantity || 1 })),
    region.country || "",
    overridesFor,
  );
  const localTotalAmount = localItemsSum.amount * (1 - (couponPercent || 0) / 100);
  const localFormatted = local.loading || local.isUsd ? local.formatted : formatLocalDirect(localTotalAmount, region.country || "");
  const penBadge = penTotals ? formatPen(penTotals.total) : null;
  // Badge principal: SIEMPRE en moneda local del país (USD, CAD, EUR, MXN, ARS, PEN, etc.)
  const priceBadge = penBadge ?? (local.loading ? `USD $${totalUsd}` : localFormatted);
  const localBadge = "";


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
  }, [parentSku]);


  const redirectingRef = useRef(false);
  const stripeAnchorRef = useRef<HTMLDivElement | null>(null);
  const stripeContainerRef = useRef<HTMLDivElement | null>(null);
  const valid = isBuyerValid(buyer);

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
    });
  }, [language, region.country]);

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    const s = useCheckoutPruebaStore.getState();
    if (!isBuyerValid(s.buyer)) throw new Error(t.completeYourData);
    await captureAbandonedCheckout(selected || "stripe", true);
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
      const { data, error } = await invokeWithRetry<{ clientSecret?: string }>("create-checkout-prueba", {
        body: {
          environment: getStripeEnvironment(),
          items: s.items.map((i) => ({
            id: i.id, name: i.name, price: itemPrice(i, region.tier),
            quantity: i.quantity, image: toAbsUrl(i.image), description: i.description,
          })),
          currency: "usd",
          stripePaymentMethod: selected === "stripe_ach" ? "us_bank_account" : selected === "stripe_cashapp" ? "cashapp" : selected === "stripe_klarna" ? "klarna" : "card",
          couponPercent: s.couponPercent,
          couponCode: s.coupon ?? undefined,
          contact: {
            email: s.buyer.email.trim(),
            phone: (s.buyer.phone ?? "").slice(0, 20) || "+10000000000",
            firstName, lastName,
            country: (region.country || localStorage.getItem("ilr_country") || "PE").toUpperCase().slice(0, 2),
          },
          returnUrl: `${window.location.origin}/checkouts/return?session_id={CHECKOUT_SESSION_ID}`,
        },
      }, { attempts: 3, baseDelayMs: 500 });
      if (error || !data?.clientSecret) throw new Error((error as { message?: string } | null)?.message || t.errorPayment);

      supabase.from("email_contacts").upsert({
        email: s.buyer.email.trim().toLowerCase(),
        name: s.buyer.fullName.trim(),
        source: "checkout-prueba-1",
        metadata: { phone: s.buyer.phone ?? "", processor: "stripe" },
      }, { onConflict: "email,source" }).then(() => {});
      return data.clientSecret;
    } catch (err) {
      setStripeError(mapStripeError(err, language as StripeLang));
      try {
        const s2 = useCheckoutPruebaStore.getState();
        const totals = calcTotals(s2.items, s2.couponPercent, region.tier);
        trackPaymentError({
          provider: selected === "card" ? "stripe_card" : String(selected),
          skus: s2.items.map((i) => i.id),
          reason: err instanceof Error ? err.message : String(err),
          value: totals.total,
          currency: "USD",
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
      await captureAbandonedCheckout(`mercadopago_${paymentType}`, true);
      supabase.from("email_contacts").upsert({
        email: s.buyer.email.trim().toLowerCase(),
        name: s.buyer.fullName.trim(),
        source: "checkout-prueba-1",
        metadata: { phone: s.buyer.phone ?? "", processor: "mercadopago", paymentType },
      }, { onConflict: "email,source" }).then(() => {});

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
          // Mercado Pago aplica el tipo de cambio local automáticamente (USD → moneda del comprador).
          expectedTotalUsd: Number(totals.total.toFixed(2)),
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
          currency: "USD",
        });
      } catch { /* noop */ }
      toast({
        title: t.mpError,
        description: err instanceof Error ? err.message : t.tryAgain,
        variant: "destructive",
      });
    }
  };

  const redirectToHotmart = useCallback(async () => {
    const c = (region.country || "").toUpperCase();
    const url = hotmartCfg.urlsByCountry[c] || hotmartCfg.fallbackUrl || null;
    if (!url) return;
    if (!valid) { requestBuyerInfo(); return; }
    if (redirectingRef.current) return;
    redirectingRef.current = true;
    try {
      await captureAbandonedCheckout("hotmart", true);
    } catch { /* noop */ }
    window.location.assign(url);
  }, [hotmartCfg, region.country, valid, captureAbandonedCheckout]);



  const handleSelect = (m: Method) => {
    if (!valid) { requestBuyerInfo(); return; }
    void captureAbandonedCheckout(m, true);
    if (m !== selected) setShowStripe(false);
    setSelected(m);
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
    if (!selected) {
      toast({ title: t.selectMethod, variant: "destructive" });
      return;
    }
    await captureAbandonedCheckout(selected, true);
    if (selected === "hotmart") { await redirectToHotmart(); return; }
    if (["card", "stripe_ach", "stripe_cashapp", "stripe_klarna"].includes(selected)) { setShowStripe(true); return; }
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
        amount_local: penTotals ? penTotals.total : (local.loading ? null : Number(local.amount ?? totalUsd)),
        currency_local: penTotals ? "PEN" : (local.currency || "USD"),
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
          amount: penTotals ? penTotals.total : (local.loading ? Number(totalUsd) : Number(local.amount ?? totalUsd)),
          currency: penTotals ? "PEN" : (local.currency || "USD"),
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
          amount: penTotals ? penTotals.total : (local.loading ? Number(totalUsd) : Number(local.amount ?? totalUsd)),
          currency: penTotals ? "PEN" : (local.currency || "USD"),
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
  const hotmartPriceLabel = hotmartResolvedPrice
    ? `${hotmartResolvedPrice.currency} ${hotmartResolvedPrice.amount.toLocaleString()}`
    : `USD $${totalUsd}`;

  const enabledStripeKeys = new Set(methodsConfig.enabledMethodKeys.filter((k) => k.startsWith("stripe_")));
  const primaryCardBadges: MethodBadge[] = [
    { label: "Visa", bg: "#ffffff", color: "#1F2937" },
    { label: "Mastercard", bg: "#ffffff", color: "#1F2937" },
    ...(enabledStripeKeys.has("stripe_link") ? [{ label: "Link", bg: "#00D66F", color: "#0A2540" }] : []),
  ];
  const dynamicStripeRows: PaymentMethodRow[] = methodsConfig.enabledMethodKeys
    .filter((key) => !!STRIPE_VISIBLE_METHODS[key] && key !== "stripe_link")
    .map((key) => ({ id: "card", methodKey: key, badge: "Stripe", ...STRIPE_VISIBLE_METHODS[key] }));
  const allMethods: PaymentMethodRow[] = [
    { id: "card", icon: CreditCard, title: isPeru ? t.cardTitlePeru : t.cardTitleGlobal, sub: cardSubtitle, badge: "Stripe" },
    ...dynamicStripeRows,
    { id: "stripe_ach", icon: Building2, title: "Transferencia bancaria ACH", sub: "Paga desde una cuenta bancaria de Estados Unidos dentro de Stripe.", badge: "Stripe" },
    { id: "stripe_cashapp", icon: Smartphone, title: "Cash App Pay", sub: "Paga con Cash App dentro del formulario seguro de Stripe.", badge: "Stripe" },
    { id: "stripe_klarna", icon: Wallet, title: "Klarna — Paga en 4", sub: "Divide tu compra en 4 cuotas sin interés dentro de Stripe.", badge: "Stripe" },
    { id: "paypal", icon: Wallet, title: "PayPal", sub: language === "en" ? "Pay with your PayPal balance or linked card." : language === "pt" ? "Pague com seu saldo PayPal ou cartão vinculado." : language === "fr" ? "Payez avec votre solde PayPal ou carte liée." : "Paga con tu saldo PayPal o tarjeta vinculada.", badge: priceBadge },
    { id: "transfer", icon: Building2, title: t.bankTransfer, sub: t.bankTransferSub(localBadge), badge: priceBadge },
    { id: "cash", icon: Banknote, title: t.cashPayment, sub: t.cashPaymentSub(localBadge), badge: priceBadge },
    { id: "yape", icon: Smartphone, title: t.yapePlin, sub: t.yapePlinSub, badge: priceBadge },
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
      badge: `USD $${totalUsd}`,
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
      badge: priceBadge,
    },
    {
      id: "hotmart",
      icon: CreditCard,
      title: language === "en" ? "Hotmart (1-click)"
        : language === "pt" ? "Hotmart (1 clique)"
        : language === "fr" ? "Hotmart (1 clic)"
        : "Hotmart (1 clic)",
      sub: language === "en"
        ? `Pay ${hotmartPriceLabel} on Hotmart (local taxes included). Redirects in 1 click.`
        : language === "pt"
        ? `Pague ${hotmartPriceLabel} na Hotmart (impostos locais incluídos). Redireciona em 1 clique.`
        : language === "fr"
        ? `Payez ${hotmartPriceLabel} sur Hotmart (taxes locales incluses). Redirige en 1 clic.`
        : `Paga ${hotmartPriceLabel} en Hotmart (incluye impuestos locales). Te redirige en 1 clic.`,
      badge: hotmartPriceLabel,
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
        if (m.id === "transfer") return methodsConfig.transfer;
        if (m.id === "cash") return methodsConfig.cash;
        if (m.id === "yape") return methodsConfig.yape;
        if (m.id === "binance") return methodsConfig.binance;
        if (m.id === "clabe") return methodsConfig.clabe && country === "MX";
        if (m.id === "hotmart") return methodsConfig.hotmart && !!hotmartResolvedUrl;


        return true;
      })
    : [];
  // Aplica el orden configurado en /admin/checkout-methods (según sort_order
  // más bajo de cada familia en la región activa).
  const familyOf = (id: Method) => id === "card" ? "stripe" : id === "stripe_ach" ? "stripeAch" : id === "stripe_cashapp" ? "stripeCashApp" : id === "stripe_klarna" ? "stripeKlarna" : id;
  const orderIndex = (id: Method) => {
    const fam = familyOf(id);
    const i = methodsConfig.familyOrder.indexOf(fam as FamilyKey);
    return i === -1 ? 99 : i;
  };
  const orderedByAdmin = [...filteredByAdmin].sort((a, b) => orderIndex(a.id) - orderIndex(b.id));
  // Si el admin configuró explícitamente la región (methodsConfig.loaded con
  // regionCode), respetamos exactamente lo que habilitó, sin forzar el filtro
  // legacy card+paypal fuera de Perú. Perú siempre oculta paypal directo.
  const methods = isPeru
    ? orderedByAdmin.filter((m) => m.id !== "paypal")
    : methodsConfig.loaded && methodsConfig.regionCode
      ? orderedByAdmin
      : orderedByAdmin.filter((m) => m.id === "card" || m.id === "paypal" || m.id === "binance" || (m.id === "clabe" && country === "MX"));
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
      await supabase.functions.invoke("send-order-confirmation", {
        body: {
          customerEmail: s.buyer.email.trim(),
          customerName: s.buyer.fullName.trim(),
          orderId,
          total: 0,
          currency: "USD",
          paymentProvider: "free-coupon",
          items: s.items.map((i) => ({
            id: i.id, name: i.name, quantity: i.quantity,
            price: itemPrice(i, region.tier), image: i.image,
          })),
        },
      });
      supabase.from("email_contacts").upsert({
        email: s.buyer.email.trim().toLowerCase(),
        name: s.buyer.fullName.trim(),
        source: "checkout-prueba-1",
        metadata: { processor: "free-coupon", coupon: s.coupon ?? "" },
      }, { onConflict: "email,source" }).then(() => {});
    } catch (e) {
      console.error("free order confirmation failed", e);
    } finally {
      navigate(`/checkouts/success?session_id=${encodeURIComponent(orderId)}&status=approved&external_reference=${encodeURIComponent(orderId)}`);
    }
  };

  return (
    <div id="payment-methods" ref={methodsAnchorRef} className="space-y-3 scroll-mt-24">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {isFree ? (language === "en" ? "Free order" : language === "pt" ? "Pedido grátis" : language === "fr" ? "Commande gratuite" : "Pedido gratis") : (isPeru ? t.choosePaymentMethod : t.cardPayment)}
      </h2>

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

      {!isFree && !isInvalidZero && methods.map((m, idx) => {
        const primaryCardTitle = isPeru ? t.cardTitlePeru : t.cardTitleGlobal;
        const isStripeRow = ["card", "stripe_ach", "stripe_cashapp", "stripe_klarna"].includes(m.id);
        const isPrimaryCard = m.id === "card" && m.title === primaryCardTitle;
        // For USA extra rows (Cash App, US Bank) — highlight only the clicked one.
        const rowKey = `${m.id}-${m.title}`;
        const isSelected = valid && selected === m.id && (!isStripeRow || selectedCardRow === rowKey);
        const isLoading = mpLoading === m.id;
        const Icon = m.icon;
        return (
          <div
            key={rowKey}
            data-method-row={m.id}
            className={cn(
              "rounded-xl border overflow-hidden transition-colors scroll-mt-24",
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
                "w-full text-left p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3 transition-colors",
                isSelected
                  ? "bg-neutral-200/60 dark:bg-neutral-800"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800/60",
                !valid && "cursor-not-allowed",
              )}
            >
              <div className={cn(
                "w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0",
                isSelected
                  ? "bg-neutral-700 text-white"
                  : "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200",
              )}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm flex items-center gap-2 flex-wrap text-neutral-800 dark:text-neutral-100">
                  <span className="min-w-0 break-words">{m.title}</span>
                  {m.badge && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                      {m.badge}
                    </span>
                  )}
                </div>
                {isPrimaryCard ? (
                  <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                    {primaryCardBadges.map((badge) => {
                      if (badge.label === "Visa") return <LogoBadge key={badge.label} src={visaLogo} alt="Visa" />;
                      if (badge.label === "Mastercard") return <LogoBadge key={badge.label} src={mastercardLogo} alt="Mastercard" />;
                      if (badge.label === "Apple Pay") return <LogoBadge key={badge.label} src={applePayLogo} alt="Apple Pay" bg="#000000" />;
                      if (badge.label === "Link") return <LinkBadge key={badge.label} />;
                      return <BankBadge key={badge.label} {...badge} />;
                    })}
                  </div>
                ) : null}

                {isPrimaryCard ? null : m.id === "stripe_ach" ? (
                  <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                    <BankBadge label="ACH" bg="#0F766E" color="#ffffff" />
                    <BankBadge label="US Bank" bg="#1F2937" color="#ffffff" />
                  </div>
                ) : m.id === "stripe_cashapp" ? (
                  <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                    <BankBadge label="Cash App" bg="#00D632" color="#001B0A" />
                  </div>
                ) : m.id === "stripe_klarna" ? (
                  <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                    <BankBadge label="Klarna" bg="#FFA8CD" color="#0A0A0A" />
                    <BankBadge label="4 cuotas" bg="#1F2937" color="#ffffff" />
                  </div>
                ) : m.badges?.length ? (
                  <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                    {m.badges.map((badge) => <BankBadge key={badge.label} {...badge} />)}
                  </div>
                ) : m.id === "transfer" ? (
                  <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                    <BankBadge label="BCP" bg="#00447C" color="#FF9E1B" />
                    <BankBadge label="BBVA" bg="#004481" color="#ffffff" />
                    <BankBadge label="Interbank" bg="#00953B" color="#ffffff" />
                    <BankBadge label="Scotiabank" bg="#EC111A" color="#ffffff" />
                  </div>
                ) : m.id === "cash" ? (
                  <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                    <BankBadge label="PagoEfectivo" bg="#EC0928" color="#ffffff" />
                    <BankBadge label="Western Union" bg="#FFDD00" color="#000000" />
                  </div>
                ) : m.id === "yape" ? (
                  <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                    <BankBadge label="Yape" bg="#742282" color="#ffffff" />
                    <BankBadge label="Plin" bg="#00BFB3" color="#ffffff" />
                  </div>
                ) : m.id === "binance" ? (
                  <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                    <BankBadge label="Binance" bg="#F0B90B" color="#0A0A0A" />
                    <BankBadge label="USDT" bg="#26A17B" color="#ffffff" />
                    <BankBadge label="Pay ID" bg="#1F2937" color="#ffffff" />
                  </div>
                ) : m.id === "clabe" ? (
                  <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                    <BankBadge label="SPEI" bg="#0A2540" color="#ffffff" />
                    <BankBadge label="CLABE" bg="#006341" color="#ffffff" />
                    <BankBadge label="MXN" bg="#ffffff" color="#0A2540" />
                  </div>
                ) : (
                  <div className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">{m.sub}</div>
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
                <div ref={stripeContainerRef} className="relative min-h-[560px] sm:min-h-[500px] bg-white dark:bg-neutral-950 -mx-px">
                  {(stripeLoading || !stripeFrameMounted) && !stripeError && (() => {
                    const isEn = language === "en";
                    const isPt = language === "pt";
                    const isFr = language === "fr";
                    const status =
                      stripeElapsed < 15
                        ? (isEn ? "Opening the secure Stripe form…"
                          : isPt ? "Abrindo o formulário seguro da Stripe…"
                          : isFr ? "Ouverture du formulaire sécurisé Stripe…"
                          : "Abriendo el formulario seguro de Stripe…")
                        : stripeElapsed < 45
                        ? (isEn ? "Still loading… secure connection with Stripe."
                          : isPt ? "Ainda carregando… conexão segura com a Stripe."
                          : isFr ? "Chargement en cours… connexion sécurisée avec Stripe."
                          : "Aún cargando… conexión segura con Stripe.")
                        : stripeElapsed < 75
                        ? (isEn ? "Taking longer than usual. Retrying automatically…"
                          : isPt ? "Está demorando mais que o normal. Tentando novamente…"
                          : isFr ? "Cela prend plus de temps que d’habitude. Nouvelle tentative…"
                          : "Está tardando más de lo normal. Reintentando automáticamente…")
                        : (isEn ? "Almost there… if it doesn't open in a few seconds you can retry."
                          : isPt ? "Quase lá… se não abrir em poucos segundos, você pode tentar de novo."
                          : isFr ? "Presque prêt… si rien ne s’ouvre, tu pourras réessayer."
                          : "Casi listo… si no abre en unos segundos, podrás reintentar.");
                    return (
                      <div className="absolute inset-0 z-10 bg-white dark:bg-neutral-950 px-4 py-6">
                        <div className="flex items-center justify-center gap-2 text-sm text-neutral-700 dark:text-neutral-200 font-medium">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{status}</span>
                        </div>
                        {stripeElapsed >= 5 && (
                          <div className="mt-1 text-center text-[11px] text-neutral-500 dark:text-neutral-400">
                            {stripeElapsed}s
                          </div>
                        )}
                        {stripeElapsed >= 30 && (
                          <div className="mt-3 flex justify-center">
                            <button
                              type="button"
                              onClick={retryStripe}
                              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                            >
                              <Loader2 className="w-3.5 h-3.5" />
                              {isEn ? "Retry now" : isPt ? "Tentar agora" : isFr ? "Réessayer" : "Reintentar ahora"}
                            </button>
                          </div>
                        )}
                        <div className="mx-auto mt-6 max-w-md space-y-3">
                          <div className="h-11 rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
                          <div className="h-11 rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
                          <div className="grid grid-cols-2 gap-3">
                            <div className="h-11 rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
                            <div className="h-11 rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
                          </div>
                          <div className="h-12 rounded-lg bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                        </div>
                      </div>
                    );
                  })()}
                  {stripeError && (
                    <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                      <p className="font-semibold">{stripeError.title}</p>
                      <p className="mt-1 text-xs">{stripeError.message}</p>
                      {stripeError.instructions && stripeError.instructions.length > 0 && (
                        <ol className="mt-2 ml-4 list-decimal space-y-0.5 text-xs">
                          {stripeError.instructions.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      )}
                      <p className="mt-1 text-[10px] opacity-70">
                        {language === "en" ? "Code" : language === "pt" ? "Código" : language === "fr" ? "Code" : "Código"}: {stripeError.code}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {stripeError.retryable && (
                          <button
                            type="button"
                            onClick={retryStripe}
                            className="inline-flex items-center gap-2 rounded-md bg-red-700 px-3 py-2 text-xs font-semibold text-white hover:bg-red-800"
                          >
                            <Loader2 className="w-3.5 h-3.5" />
                            {language === "en" ? "Try again" : language === "pt" ? "Tentar novamente" : language === "fr" ? "Réessayer" : "Intentar de nuevo"}
                          </button>
                        )}
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
                  <EmbeddedCheckoutProvider key={stripeRetryKey} stripe={stripePromise} options={stripeOptions}>
                    <EmbeddedCheckout />
                  </EmbeddedCheckoutProvider>
                </div>
              </div>
            )}


            {m.id === "yape" && isSelected && (
              <div className="border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-4 space-y-4">
                <div className="text-center space-y-1">
                  <p className="text-xs uppercase tracking-wider text-neutral-500">{t.sendPaymentTo}</p>
                  <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{YAPE_NAME}</p>
                  <button
                    type="button"
                    onClick={copyPhone}
                    className="inline-flex items-center gap-2 text-xl font-mono font-bold text-primary hover:opacity-80 transition"
                  >
                    {YAPE_PHONE}
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <p className="text-[11px] text-neutral-500">{copied ? t.copied : t.tapToCopy}</p>
                </div>

                <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800/60 p-3 text-center">
                  <p className="text-xs text-neutral-500">{t.amountToPay}</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{penBadge ?? (local.loading ? `USD $${totalUsd}` : local.formatted)}</p>
                  <p className="text-[11px] text-neutral-500 mt-1">{t.sendEquivalentSoles}</p>
                </div>

                <ol className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1.5 list-decimal list-inside">
                  <li>{t.yapeStep1}</li>
                  <li>{t.yapeStep2(penBadge ?? (local.loading ? `USD $${totalUsd}` : local.formatted), YAPE_PHONE, YAPE_NAME)}</li>
                  <li>{t.yapeStep3}</li>
                  <li>{t.yapeStep4}</li>
                </ol>

                <button
                  type="button"
                  onClick={handleManualPaid}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  {t.alreadyPaid}
                </button>

                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full text-xs text-[#25D366] hover:underline"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> {t.sendReceiptWA}
                </a>

                <p className="text-[11px] text-center text-neutral-500 leading-relaxed">{t.yapeVerifiedBy}</p>
              </div>
            )}

            {m.id === "binance" && isSelected && (
              <div className="border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-4 space-y-4">
                <div className="text-center space-y-1">
                  <p className="text-xs uppercase tracking-wider text-neutral-500">
                    {language === "en" ? "Send payment to" : language === "pt" ? "Enviar pagamento para" : language === "fr" ? "Envoyer le paiement à" : "Envía el pago a"}
                  </p>
                  <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{binanceCfg.holder_name}</p>
                  <p className="text-[11px] text-neutral-500">{binanceCfg.network}</p>
                </div>

                <div className="flex justify-center">
                  <img
                    src={binanceCfg.qr_url}
                    alt="Binance Pay QR"
                    className="w-48 h-48 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white object-contain p-2"
                    loading="lazy"
                  />
                </div>

                {binanceCfg.pay_id && (
                  <div className="rounded-lg bg-[#F0B90B]/10 border border-[#F0B90B]/40 p-3 space-y-1 text-center">
                    <p className="text-[11px] uppercase tracking-wider text-neutral-500">Binance Pay ID</p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(binanceCfg.pay_id).catch(() => {});
                        toast({ description: t.copied });
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 text-xl font-mono font-bold text-[#a37800] dark:text-[#F0B90B] hover:opacity-80 transition"
                    >
                      <span>{binanceCfg.pay_id}</span>
                      <Copy className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                )}

                <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800/60 p-3 space-y-1.5">
                  <p className="text-[11px] uppercase tracking-wider text-neutral-500 text-center">
                    {language === "en" ? "Wallet address" : language === "pt" ? "Endereço da carteira" : language === "fr" ? "Adresse du portefeuille" : "Dirección de wallet"}
                  </p>
                  <button
                    type="button"
                    onClick={copyBinance}
                    className="w-full inline-flex items-center justify-center gap-2 text-sm font-mono font-semibold text-primary hover:opacity-80 transition break-all px-2"
                  >
                    <span className="break-all">{binanceCfg.address}</span>
                    {copiedBinance ? <Check className="w-4 h-4 text-green-600 shrink-0" /> : <Copy className="w-4 h-4 shrink-0" />}
                  </button>
                  <p className="text-[11px] text-neutral-500 text-center">{copiedBinance ? t.copied : (language === "en" ? "Tap to copy" : language === "pt" ? "Toque para copiar" : language === "fr" ? "Touchez pour copier" : "Toca para copiar")}</p>
                </div>


                <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800/60 p-3 text-center">
                  <p className="text-xs text-neutral-500">{t.amountToPay}</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">USD ${totalUsd}</p>
                  <p className="text-[11px] text-neutral-500 mt-1">USDT · Binance Pay</p>
                </div>

                <ol className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1.5 list-decimal list-inside">
                  <li>{language === "en" ? "Open your Binance app and go to Pay / Send." : language === "pt" ? "Abra o app Binance e vá em Pay / Enviar." : language === "fr" ? "Ouvre l'app Binance et va dans Pay / Envoyer." : "Abre tu app Binance y ve a Pay / Enviar."}</li>
                  <li>{language === "en" ? `Scan the QR or paste the Pay ID and send USD $${totalUsd} in USDT.` : language === "pt" ? `Escaneie o QR ou cole o Pay ID e envie USD $${totalUsd} em USDT.` : language === "fr" ? `Scanne le QR ou colle le Pay ID et envoie USD $${totalUsd} en USDT.` : `Escanea el QR o pega el Pay ID y envía USD $${totalUsd} en USDT.`}</li>
                  <li>{language === "en" ? "Save the transaction screenshot." : language === "pt" ? "Salve a captura da transação." : language === "fr" ? "Sauvegarde la capture de la transaction." : "Guarda la captura de la transacción."}</li>
                  <li>{language === "en" ? 'Press "I paid" and send us the receipt on WhatsApp.' : language === "pt" ? 'Pressione "Já paguei" e envie o comprovante pelo WhatsApp.' : language === "fr" ? "Appuie sur \"J'ai payé\" et envoie-nous le reçu par WhatsApp." : 'Presiona "Ya pagué" y envíanos el comprobante por WhatsApp.'}</li>
                </ol>

                <button
                  type="button"
                  onClick={handleBinancePaid}
                  className="w-full bg-[#F0B90B] hover:bg-[#d9a409] text-neutral-900 font-semibold py-3 rounded-xl transition-colors"
                >
                  {t.alreadyPaid}
                </button>

                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full text-xs text-[#25D366] hover:underline"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> {t.sendReceiptWA}
                </a>

                <p className="text-[11px] text-center text-neutral-500 leading-relaxed">{t.yapeVerifiedBy}</p>
              </div>
            )}

            {m.id === "clabe" && isSelected && (
              <div className="border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-4 space-y-4">
                <div className="text-center space-y-1">
                  <p className="text-xs uppercase tracking-wider text-neutral-500">
                    {language === "en" ? "Transfer to CLABE (Mexico)" : language === "pt" ? "Transferência para CLABE (México)" : language === "fr" ? "Virement vers CLABE (Mexique)" : "Transferencia a CLABE (México)"}
                  </p>
                  <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{CLABE_HOLDER}</p>
                  <p className="text-[11px] text-neutral-500">{CLABE_BANK}</p>
                </div>

                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3 space-y-1.5">
                  <p className="text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300 text-center">CLABE</p>
                  <button
                    type="button"
                    onClick={copyClabe}
                    className="w-full inline-flex items-center justify-center gap-2 text-lg font-mono font-bold text-emerald-900 dark:text-emerald-200 hover:opacity-80 transition"
                  >
                    <span className="tracking-wider">{CLABE_NUMBER}</span>
                    {copiedClabe ? <Check className="w-4 h-4 text-green-600 shrink-0" /> : <Copy className="w-4 h-4 shrink-0" />}
                  </button>
                  <p className="text-[11px] text-neutral-500 text-center">{copiedClabe ? t.copied : (language === "en" ? "Tap to copy the 18-digit CLABE" : language === "pt" ? "Toque para copiar a CLABE de 18 dígitos" : language === "fr" ? "Touchez pour copier la CLABE (18 chiffres)" : "Toca para copiar la CLABE de 18 dígitos")}</p>
                </div>

                <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800/60 p-3 text-center">
                  <p className="text-xs text-neutral-500">{t.amountToPay}</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    {local.loading || local.isUsd ? `USD $${totalUsd}` : local.formatted}
                  </p>
                  {!local.isUsd && !local.loading && (
                    <p className="text-[11px] text-neutral-500 mt-1">≈ USD ${totalUsd}</p>
                  )}
                </div>

                <ol className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1.5 list-decimal list-inside">
                  <li>{language === "en" ? "Open your Mexican bank app (BBVA, Banorte, Santander, etc.) and go to SPEI transfer." : language === "pt" ? "Abra o app do seu banco mexicano (BBVA, Banorte, Santander etc.) e vá em transferência SPEI." : language === "fr" ? "Ouvre l'app de ta banque mexicaine (BBVA, Banorte, Santander, etc.) et va au virement SPEI." : "Abre la app de tu banco mexicano (BBVA, Banorte, Santander, etc.) y ve a transferencia SPEI."}</li>
                  <li>{language === "en" ? `Paste the CLABE ${CLABE_NUMBER} and send the exact amount in MXN.` : language === "pt" ? `Cole a CLABE ${CLABE_NUMBER} e envie o valor exato em MXN.` : language === "fr" ? `Colle la CLABE ${CLABE_NUMBER} et envoie le montant exact en MXN.` : `Pega la CLABE ${CLABE_NUMBER} y envía el monto exacto en MXN.`}</li>
                  <li>{language === "en" ? "Save the transfer receipt screenshot." : language === "pt" ? "Salve a captura do comprovante." : language === "fr" ? "Sauvegarde la capture du reçu." : "Guarda la captura del comprobante."}</li>
                  <li>{language === "en" ? 'Press "I paid" and send us the receipt on WhatsApp.' : language === "pt" ? 'Pressione "Já paguei" e envie o comprovante pelo WhatsApp.' : language === "fr" ? "Appuie sur \"J'ai payé\" et envoie-nous le reçu par WhatsApp." : 'Presiona "Ya pagué" y envíanos el comprobante por WhatsApp.'}</li>
                </ol>

                <button
                  type="button"
                  onClick={handleClabePaid}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  {t.alreadyPaid}
                </button>

                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full text-xs text-[#25D366] hover:underline"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> {t.sendReceiptWA}
                </a>

                <p className="text-[11px] text-center text-neutral-500 leading-relaxed">{t.yapeVerifiedBy}</p>
              </div>
            )}




            {m.id === "paypal" && isSelected && (
              <div className="border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-4 space-y-3">
                <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800/60 p-3 text-center">
                  <p className="text-xs text-neutral-500">{t.amountToPay}</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    {local.loading || local.isUsd ? `USD $${totalUsd}` : local.formatted}
                  </p>
                  {!local.isUsd && !local.loading && (
                    <p className="text-[11px] text-neutral-500 mt-1">≈ USD ${totalUsd}</p>
                  )}
                </div>
                <PayPalButtons
                  amountUsd={Number(totalUsd)}
                  localCurrency={local.currency}
                  localAmount={local.amount}
                  description={items.map((i) => i.name).join(" + ").slice(0, 120) || "ILINGUE RELAX"}
                  buyerEmail={buyer.email.trim() || undefined}
                  buyerName={buyer.fullName.trim() || undefined}
                  buyerPhone={buyer.phone || undefined}
                  buyerCountry={(region.country || "").toUpperCase() || undefined}
                  skus={items.map((i) => i.id)}
                  onApproved={(orderId) => {
                    supabase.from("email_contacts").upsert({
                      email: buyer.email.trim().toLowerCase(),
                      name: buyer.fullName.trim(),
                      source: "checkout-prueba-1",
                      metadata: { phone: buyer.phone ?? "", processor: "paypal", orderId },
                    }, { onConflict: "email,source" }).then(() => {});
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
                        currency: "USD",
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
        );
      })}

      {!valid && (
        <p className="text-xs text-center text-muted-foreground pt-2">
          {t.enableMethods}
        </p>
      )}

      {selected !== "yape" && selected !== "binance" && selected !== "paypal" && !(selected && ["card", "stripe_ach", "stripe_cashapp", "stripe_klarna"].includes(selected) && showStripe) && (
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
              ? "Continue to payment"
              : language === "pt"
                ? "Continuar para pagamento"
                : language === "fr"
                  ? "Continuer vers le paiement"
                  : "Continuar de Pago"}</>
          ) : (
            <><Lock className="w-4 h-4" /> {t.buyNow}</>
          )}
        </button>
      )}
    </div>
  );
}

