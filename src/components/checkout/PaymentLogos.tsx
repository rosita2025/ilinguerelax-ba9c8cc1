import React from "react";
import { useRegionTier } from "@/hooks/useRegionTier";

const VISA = "/__l5e/assets-v1/a96d5ad9-136a-425a-970a-b7889b8bdc30/visa.svg";
const MASTERCARD = "/__l5e/assets-v1/94d65183-1752-495e-ac5b-70ec4cba62b2/mastercard.svg";
const APPLE_PAY = "/__l5e/assets-v1/a38f0d22-72e4-4393-ace6-856f1b5379e6/apple-pay.svg";
const PAYPAL = "https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg";
const GOOGLE_PAY = "https://www.gstatic.com/instantbuy/images/mpay/google_pay_logo.svg";

function LogoBadge({ src, alt, bg = "#ffffff" }: { src: string; alt: string; bg?: string }) {
  return (
    <span
      className="inline-flex items-center justify-center h-5 w-8 rounded-md border border-neutral-200 shadow-sm shrink-0 bg-white overflow-hidden"
    >
      <img src={src} alt={alt} className="max-h-3 max-w-[24px] object-contain grayscale-[0.2] hover:grayscale-0 transition-all" />
    </span>
  );
}

function TextBadge({ label, bg, color = "#ffffff" }: { label: string; bg: string; color?: string }) {
  return (
    <span 
      className="inline-flex items-center justify-center h-5 px-1.5 rounded-md text-[9px] font-bold tracking-tight leading-none uppercase shadow-sm"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  );
}

export function PaymentLogos({ className = "" }: { className?: string }) {
  const region = useRegionTier();
  const country = (region.country || "").toUpperCase();

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      <LogoBadge src={VISA} alt="Visa" />
      <LogoBadge src={MASTERCARD} alt="Mastercard" />
      <LogoBadge src={APPLE_PAY} alt="Apple Pay" />
      
      <span
        className="inline-flex items-center justify-center h-5 w-8 rounded-md border border-neutral-200 shadow-sm shrink-0 bg-white"
        role="img"
        aria-label="Google Pay"
      >
        <span className="text-[9px] font-bold leading-none tracking-tight" aria-hidden="true">
          <span style={{ color: "#4285F4" }}>G</span>
          <span style={{ color: "#5F6368" }}> Pay</span>
        </span>
      </span>

      {(country === "US" || !["PE", "MX", "CO", "AR", "CL"].includes(country)) && (
        <LogoBadge src={PAYPAL} alt="PayPal" />
      )}
      
      {/* Indicadores de métodos locales */}
      {country === "PE" && (
        <>
          <TextBadge label="Yape" bg="#6B1FA0" />
          <TextBadge label="Plin" bg="#00C2C7" color="#04252B" />
        </>
      )}
      {country === "MX" && (
        <>
          <TextBadge label="OXXO" bg="#E31E24" />
          <TextBadge label="SPEI" bg="#0F766E" />
        </>
      )}
      {country === "CO" && (
        <>
          <TextBadge label="PSE" bg="#0B5AA6" />
          <TextBadge label="Nequi" bg="#200020" color="#DA0081" />
        </>
      )}
      {country === "BR" && (
        <TextBadge label="Pix" bg="#32BCAD" color="#06211F" />
      )}
      {country === "US" && (
        <>
          <TextBadge label="CashApp" bg="#00D632" color="#000000" />
          <TextBadge label="Kunfu" bg="#111827" />
        </>
      )}
    </div>
  );
}