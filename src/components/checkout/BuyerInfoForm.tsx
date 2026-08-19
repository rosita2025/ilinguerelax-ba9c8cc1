import { useEffect, useState, useRef, useCallback } from "react";
import { User, Mail, CheckCircle2, AlertCircle, MapPin, Globe, Lock } from "lucide-react";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nContext";
import { getCheckoutUI } from "@/i18n/checkoutUI";
import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import { useRegionTier } from "@/hooks/useRegionTier";
import { trackAbandonedCheckoutNow } from "@/hooks/useAbandonedCheckoutTracker";
import { checkEmail } from "@/lib/emailGuard";

export function isBuyerValid(buyer: { fullName: string; email: string; address?: string; city?: string; zip?: string; country?: string; }, hasPhysicalItems = false) {
  const basicOk = buyer.fullName.trim().length >= 3 && checkEmail(buyer.email).ok;
  if (!hasPhysicalItems) return basicOk;
  return basicOk && (buyer.address || "").trim().length >= 8 && (buyer.city || "").trim().length >= 3 && (buyer.zip || "").trim().length >= 4 && (buyer.country || "").trim().length >= 1;
}

export const BUYER_FORM_ID = "buyer-info-form";
export const BUYER_ERRORS_EVENT = "checkout:showBuyerErrors";

export function BuyerInfoForm() {
  const { buyer, setBuyer, applyCoupon, coupon } = useCheckoutPruebaStore();
  const [localBuyer, setLocalBuyer] = useState(buyer);

  useEffect(() => {
    setLocalBuyer(buyer);
  }, [buyer]);

  const debouncedSetBuyer = useCallback((patch: Partial<typeof buyer>) => {
    setBuyer(patch);
    
    const newBuyer = { ...localBuyer, ...patch };
    const email = (newBuyer.email || "").trim();
    const check = email ? checkEmail(email) : null;
    const emailToSave = check?.ok ? check.email : "";
    try {
      const raw = localStorage.getItem("ilr_buyer");
      const prev = raw ? JSON.parse(raw) : {};
      localStorage.setItem("ilr_buyer", JSON.stringify({ ...prev, ...(emailToSave ? { email: emailToSave } : {}), name: newBuyer.fullName, phone: newBuyer.phone }));
    } catch { /* ignore */ }
  }, [setBuyer, localBuyer]);

  const fireAbandonedCapture = useCallback(() => {
    const check = checkEmail(localBuyer.email);
    if (check.corrected && check.email !== localBuyer.email) setBuyer({ email: check.email });
    if (!check.ok) return;
    
    trackAbandonedCheckoutNow({
      email: check.email,
      name: localBuyer.fullName,
      phone: localBuyer.phone,
      productType: "", 
      language: "",
      country: "",
    }).catch(() => {});
  }, [localBuyer, setBuyer]);

  const region = useRegionTier();
  const { language, countryCode } = useI18n();
  const items = useCheckoutPruebaStore((s) => s.items);
  const t = getCheckoutUI(language);

  const hasPhysicalItems = items.some(i => i.isPhysical);
  const valid = isBuyerValid(localBuyer, hasPhysicalItems);
  const [showErrors, setShowErrors] = useState(false);
  const [shake, setShake] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = () => {
      setShowErrors(true);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    window.addEventListener(BUYER_ERRORS_EVENT, handler);
    return () => window.removeEventListener(BUYER_ERRORS_EVENT, handler);
  }, []);

  const nameInvalid = localBuyer.fullName.trim().length < 3;
  const emailInvalid = !checkEmail(localBuyer.email).ok;
  
  return (
    <div id={BUYER_FORM_ID} ref={containerRef} className={cn("rounded-xl border bg-background p-4 sm:p-5 space-y-3 transition-all", showErrors && !valid && "border-destructive/60 ring-2 ring-destructive/20", shake && "animate-[shake_0.5s_ease-in-out]")}>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-primary" /> {t.yourDetails}</h2>
        {valid ? <span className="flex items-center gap-1 text-xs text-primary font-medium"><CheckCircle2 className="w-4 h-4" /> {t.ready}</span> : showErrors && <span className="flex items-center gap-1 text-xs text-destructive font-medium"><AlertCircle className="w-4 h-4" /> {t.required}</span>}
      </div>
      <div className="space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">{t.fullName}</span>
          <div className="relative mt-1">
            <User className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", showErrors && nameInvalid ? "text-destructive" : "text-muted-foreground")} />
            <input type="text" value={localBuyer.fullName} onChange={(e) => setLocalBuyer(prev => ({ ...prev, fullName: e.target.value }))} onBlur={() => { debouncedSetBuyer({ fullName: localBuyer.fullName }); fireAbandonedCapture(); }} placeholder={t.fullNamePlaceholder} className={cn("w-full pl-9 pr-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2", showErrors && nameInvalid ? "border-destructive" : "focus:ring-primary/40")} />
          </div>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">{t.email}</span>
          <div className="relative mt-1">
            <Mail className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", showErrors && emailInvalid ? "text-destructive" : "text-muted-foreground")} />
            <input type="email" value={localBuyer.email} onChange={(e) => setLocalBuyer(prev => ({ ...prev, email: e.target.value }))} onBlur={() => { debouncedSetBuyer({ email: localBuyer.email }); fireAbandonedCapture(); }} placeholder={t.emailPlaceholder} className={cn("w-full pl-9 pr-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2", showErrors && emailInvalid ? "border-destructive" : "focus:ring-primary/40")} />
          </div>
        </label>
        {/* Physical items fields similar to above with controlled local state */}
      </div>
    </div>
  );
}
