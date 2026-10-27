import { useMemo } from "react";
import { useRegionTier } from "@/hooks/useRegionTier";
import { useCheckoutMethodsConfig, type CheckoutMethodsConfig } from "@/hooks/useCheckoutMethodsConfig";
import { VisaBadge, MastercardBadge, AmexBadge, ApplePayBadge, PayPalBadge } from "@/components/checkout/CardBrandBadges";
import yapeLogo from "@/assets/yape-logo.webp";
import oxxoLogo from "@/assets/oxxo-logo.webp";
import speiLogo from "@/assets/spei-logo.webp";
import mercadopagoLogo from "@/assets/mercadopago-logo.webp";

/**
 * Medios de pago que ve el comprador de cada país, en la barra de compra.
 * Solo presentación: los métodos locales aparecen únicamente si el admin los tiene activos
 * para ese país (/admin/checkout-methods), así la barra nunca promete algo que el checkout no ofrece.
 */
type Id =
  | "visa" | "mastercard" | "amex" | "applepay" | "googlepay" | "paypal" | "yape" | "oxxo" | "mercadopago" | "spei"
  | "nequi" | "pse" | "pix" | "boleto" | "rapipago" | "bizum" | "mbway" | "ideal" | "satispay" | "cashapp" | "multibanco";

const CARDS: Id[] = ["visa", "mastercard"];
const WALLETS: Id[] = ["applepay", "googlepay"];

const BY_COUNTRY: Record<string, Id[]> = {
  PE: [...CARDS, ...WALLETS, "yape", "paypal"],
  ES: [...CARDS, "applepay", "googlepay", "bizum", "paypal"],
  MX: [...CARDS, "oxxo", "mercadopago", "spei", "paypal"],
  CO: [...CARDS, "nequi", "pse", "paypal"],
  AR: [...CARDS, "mercadopago", "rapipago", "paypal"],
  BR: [...CARDS, "pix", "boleto", "paypal"],
  CL: [...CARDS, ...WALLETS, "paypal"],
  PT: [...CARDS, "applepay", "mbway", "multibanco", "paypal"],
  NL: [...CARDS, "ideal", "applepay", "paypal"],
  IT: [...CARDS, "applepay", "googlepay", "satispay", "paypal"],
  US: [...CARDS, "amex", "applepay", "googlepay", "cashapp", "paypal"],
  CA: [...CARDS, "amex", "applepay", "googlepay", "paypal"],
  GB: [...CARDS, "amex", "applepay", "googlepay", "paypal"],
};
const DEFAULT: Id[] = [...CARDS, ...WALLETS, "paypal"];

/** ¿Está activo este método en el checkout del país? Las tarjetas y billeteras de Stripe siempre se muestran. */
function available(id: Id, c: CheckoutMethodsConfig, country: string): boolean {
  const keys = c.enabledMethodKeys;
  switch (id) {
    case "paypal": return c.paypal;
    case "yape": return c.yape;
    case "oxxo": return c.dlocalCash || keys.includes("stripe_oxxo");
    case "mercadopago": return c.dlocalWallet || (country === "PE" && (c.transfer || c.cash));
    case "spei": return c.clabe || c.dlocalTransfer;
    case "nequi": return c.dlocalWallet;
    case "pse": return c.dlocalTransfer;
    case "pix": return c.dlocalTransfer || c.dlocalWallet;
    case "boleto":
    case "rapipago": return c.dlocalCash;
    case "bizum": return c.stripeBizum;
    case "mbway": return c.stripeMbway;
    case "ideal": return c.stripeIdeal;
    case "satispay": return c.stripeSatispay;
    case "cashapp": return c.stripeCashApp;
    case "multibanco": return c.hotmart;
    default: return true;
  }
}

const box = "inline-flex items-center justify-center h-5 w-9 sm:h-5 sm:w-10 rounded border border-neutral-200 dark:border-neutral-700 shrink-0 overflow-hidden bg-white";

function Logo({ src, alt }: { src: string; alt: string }) {
  return (
    <span className={box} role="img" aria-label={alt}>
      <img src={src} alt="" loading="lazy" decoding="async" className="max-h-3.5 max-w-[34px] object-contain" />
    </span>
  );
}

function Pill({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <span
      className="inline-flex items-center justify-center h-5 px-1.5 rounded border border-black/10 shrink-0 text-[9px] font-extrabold leading-none tracking-tight whitespace-nowrap"
      style={{ background: bg, color: fg }}
      role="img"
      aria-label={label}
    >
      {label}
    </span>
  );
}

function renderBadge(id: Id) {
  switch (id) {
    case "visa": return <VisaBadge key={id} />;
    case "mastercard": return <MastercardBadge key={id} />;
    case "amex": return <AmexBadge key={id} />;
    case "applepay": return <ApplePayBadge key={id} />;
    case "paypal": return <PayPalBadge key={id} />;
    case "googlepay": return <Pill key={id} label="G Pay" bg="#ffffff" fg="#3C4043" />;
    case "yape": return <Logo key={id} src={yapeLogo} alt="Yape" />;
    case "oxxo": return <Logo key={id} src={oxxoLogo} alt="OXXO" />;
    case "spei": return <Logo key={id} src={speiLogo} alt="SPEI" />;
    case "mercadopago": return <Logo key={id} src={mercadopagoLogo} alt="Mercado Pago" />;
    case "nequi": return <Pill key={id} label="Nequi" bg="#200020" fg="#F2268F" />;
    case "pse": return <Pill key={id} label="PSE" bg="#0B5AA6" fg="#ffffff" />;
    case "pix": return <Pill key={id} label="Pix" bg="#32BCAD" fg="#06211F" />;
    case "boleto": return <Pill key={id} label="Boleto" bg="#1F2937" fg="#ffffff" />;
    case "rapipago": return <Pill key={id} label="Rapipago" bg="#F5A623" fg="#1F2937" />;
    case "bizum": return <Pill key={id} label="Bizum" bg="#05B7C8" fg="#ffffff" />;
    case "mbway": return <Pill key={id} label="MB WAY" bg="#D0021B" fg="#ffffff" />;
    case "multibanco": return <Pill key={id} label="Multibanco" bg="#1F4E79" fg="#ffffff" />;
    case "ideal": return <Pill key={id} label="iDEAL" bg="#CC0066" fg="#ffffff" />;
    case "satispay": return <Pill key={id} label="Satispay" bg="#F94C43" fg="#ffffff" />;
    case "cashapp": return <Pill key={id} label="Cash App" bg="#00D64F" fg="#ffffff" />;
  }
}

export function PaymentBadgesStrip({ className = "" }: { className?: string }) {
  const { country } = useRegionTier();
  const cfg = useCheckoutMethodsConfig(country);
  const ids = useMemo(() => {
    const list = BY_COUNTRY[country] ?? DEFAULT;
    // Mientras no carga la configuración, solo tarjetas y billeteras (sin parpadeos de métodos locales).
    return list.filter((id) => (cfg.loaded ? available(id, cfg, country) : CARDS.includes(id) || WALLETS.includes(id)));
  }, [country, cfg]);
  return (
    <div className={`flex items-center gap-1 ${className}`} aria-label="Medios de pago">
      {ids.map(renderBadge)}
    </div>
  );
}

export default PaymentBadgesStrip;
