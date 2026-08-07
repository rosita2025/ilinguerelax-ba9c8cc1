import React from "react";
import { useRegionTier } from "@/hooks/useRegionTier";

const VISA = "/__l5e/assets-v1/a96d5ad9-136a-425a-970a-b7889b8bdc30/visa.svg";
const MASTERCARD = "/__l5e/assets-v1/94d65183-1752-495e-ac5b-70ec4cba62b2/mastercard.svg";
const APPLE_PAY = "/__l5e/assets-v1/a38f0d22-72e4-4393-ace6-856f1b5379e6/apple-pay.svg";
const PAYPAL = "https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg";
const GOOGLE_PAY = "https://www.gstatic.com/instantbuy/images/mpay/google_pay_logo.svg";

export function PaymentLogos({ className = "" }: { className?: string }) {
  const region = useRegionTier();
  const country = (region.country || "").toUpperCase();

  const logos = [
    { src: VISA, alt: "Visa" },
    { src: MASTERCARD, alt: "Mastercard" },
    { src: APPLE_PAY, alt: "Apple Pay" },
    { src: GOOGLE_PAY, alt: "Google Pay" },
  ];

  // PayPal solo en USA/Global, no en países con dLocal obligatorio usualmente
  if (country === "US" || !["PE", "MX", "CO", "AR", "CL"].includes(country)) {
    logos.push({ src: PAYPAL, alt: "PayPal" });
  }

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {logos.map((logo, idx) => (
        <div 
          key={idx}
          className="h-5 px-1 bg-white border border-border rounded flex items-center justify-center overflow-hidden"
        >
          <img 
            src={logo.src} 
            alt={logo.alt} 
            className="h-3 w-auto object-contain grayscale-[0.3] hover:grayscale-0 transition-all"
          />
        </div>
      ))}
      
      {/* Indicadores de métodos locales */}
      <div className="flex gap-1 ml-0.5">
        {country === "PE" && (
          <span className="text-[9px] font-bold bg-[#6B1FA0] text-white px-1.5 py-0.5 rounded leading-none uppercase">Yape/Plin</span>
        )}
        {country === "MX" && (
          <span className="text-[9px] font-bold bg-[#E31E24] text-white px-1.5 py-0.5 rounded leading-none uppercase">OXXO/SPEI</span>
        )}
        {country === "CO" && (
          <span className="text-[9px] font-bold bg-[#0B5AA6] text-white px-1.5 py-0.5 rounded leading-none uppercase">PSE/Nequi</span>
        )}
        {country === "US" && (
          <span className="text-[9px] font-bold bg-[#00D632] text-white px-1.5 py-0.5 rounded leading-none uppercase">CashApp</span>
        )}
      </div>
    </div>
  );
}
