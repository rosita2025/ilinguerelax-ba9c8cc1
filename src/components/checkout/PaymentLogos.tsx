import React from "react";

const VISA = "/__l5e/assets-v1/a96d5ad9-136a-425a-970a-b7889b8bdc30/visa.svg";
const MASTERCARD = "/__l5e/assets-v1/94d65183-1752-495e-ac5b-70ec4cba62b2/mastercard.svg";
const APPLE_PAY = "/__l5e/assets-v1/a38f0d22-72e4-4393-ace6-856f1b5379e6/apple-pay.svg";
const PAYPAL = "https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg";

export function PaymentLogos({ className = "" }: { className?: string }) {
  const logos = [
    { src: VISA, alt: "Visa" },
    { src: MASTERCARD, alt: "Mastercard" },
    { src: APPLE_PAY, alt: "Apple Pay" },
    { src: PAYPAL, alt: "PayPal" },
  ];

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {logos.map((logo, idx) => (
        <div 
          key={idx}
          className="h-6 px-1.5 bg-white border border-border rounded flex items-center justify-center overflow-hidden"
        >
          <img 
            src={logo.src} 
            alt={logo.alt} 
            className="h-4 w-auto object-contain grayscale-[0.5] hover:grayscale-0 transition-all"
          />
        </div>
      ))}
      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest ml-1">
        & more
      </div>
    </div>
  );
}
