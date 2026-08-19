import { useEffect, useState, useRef, useCallback, useMemo } from "react";
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

export function isBuyerValid(buyer: { 
  fullName: string; 
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  zip?: string;
  country?: string;
}, hasPhysicalItems = false) {
  try {
    const nameValid = (buyer.fullName || "").trim().length >= 3;
    const emailValid = checkEmail(buyer.email || "").ok;
    // El teléfono es opcional: solo se valida si el comprador escribió algo.
    const phoneTyped = (buyer.phone || "").trim();
    const phoneValid = phoneTyped.length === 0 || phoneTyped.length >= 7;

    const basicOk = nameValid && emailValid && phoneValid;
    
    if (!hasPhysicalItems) return basicOk;

    return (
      basicOk &&
      (buyer.address || "").trim().length >= 8 &&
      (buyer.city || "").trim().length >= 3 &&
      (buyer.zip || "").trim().length >= 4 &&
      (buyer.country || "").trim().length >= 1
    );
  } catch {
    return false;
  }
}

export const BUYER_FORM_ID = "buyer-info-form";
export const BUYER_ERRORS_EVENT = "checkout:showBuyerErrors";

export function BuyerInfoForm() {
  const { buyer, setBuyer, applyCoupon, coupon } = useCheckoutPruebaStore();
  const region = useRegionTier();
  const { language, countryCode } = useI18n();
  const items = useCheckoutPruebaStore((s) => s.items);
  const t = getCheckoutUI(language);
  const hasPhysicalItems = items.some(i => i.isPhysical);

  // Local state to prevent infinite loops and laggy typing
  const [localName, setLocalName] = useState(buyer.fullName || "");
  const [localEmail, setLocalEmail] = useState(buyer.email || "");
  const [localPhone, setLocalPhone] = useState(buyer.phone || "");
  const [localAddress, setLocalAddress] = useState(buyer.address || "");
  const [localCity, setLocalCity] = useState(buyer.city || "");
  const [localZip, setLocalZip] = useState(buyer.zip || "");
  const [localState, setLocalState] = useState(buyer.state || "");
  const [localCountry, setLocalCountry] = useState(buyer.country || "");

  const [showErrors, setShowErrors] = useState(false);
  const [shake, setShake] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);

  // Sync local state when global state changes (e.g. hydrate from localStorage or URL)
  useEffect(() => {
    setLocalName(buyer.fullName || "");
    setLocalEmail(buyer.email || "");
    setLocalPhone(buyer.phone || "");
    setLocalAddress(buyer.address || "");
    setLocalCity(buyer.city || "");
    setLocalZip(buyer.zip || "");
    setLocalState(buyer.state || "");
    setLocalCountry(buyer.country || "");
  }, [buyer]);

  const fireAbandonedCapture = useCallback((currentBuyer: typeof buyer) => {
    const check = checkEmail(currentBuyer.email);
    if (!check.ok) return;
    
    trackAbandonedCheckoutNow({
      email: check.email,
      name: currentBuyer.fullName,
      phone: currentBuyer.phone,
      productType: items?.[0]?.id,
      language,
      country: countryCode || "",
      items,
    }).catch(() => {});
  }, [items, language, countryCode]);

  const updateGlobalBuyer = useCallback((patch: Partial<typeof buyer>) => {
    setBuyer(patch);
    const updatedBuyer = { ...buyer, ...patch };
    
    // Persist to localStorage
    try {
      const emailCheck = checkEmail(updatedBuyer.email || "");
      const email = emailCheck.ok ? emailCheck.email : "";
      const raw = localStorage.getItem("ilr_buyer");
      const prev = raw ? JSON.parse(raw) : {};
      localStorage.setItem("ilr_buyer", JSON.stringify({
        ...prev,
        ...(email ? { email } : {}),
        name: updatedBuyer.fullName,
        phone: updatedBuyer.phone
      }));
    } catch { /* ignore */ }

    fireAbandonedCapture(updatedBuyer);
  }, [buyer, setBuyer, fireAbandonedCapture]);

  const nameInvalid = localName.trim().length < 3;
  const emailCheckResult = useMemo(() => checkEmail(localEmail), [localEmail]);
  const emailInvalid = !emailCheckResult.ok;
  const phoneInvalid = localPhone.trim().length > 0 && localPhone.trim().length < 7;
  
  const addressInvalid = hasPhysicalItems && localAddress.trim().length < 8;
  const cityInvalid = hasPhysicalItems && localCity.trim().length < 3;
  const zipInvalid = hasPhysicalItems && localZip.trim().length < 4;
  const countryInvalid = hasPhysicalItems && !localCountry.trim();

  const valid = useMemo(() => isBuyerValid({
    fullName: localName,
    email: localEmail,
    phone: localPhone,
    address: localAddress,
    city: localCity,
    zip: localZip,
    country: localCountry
  }, hasPhysicalItems), [localName, localEmail, localPhone, localAddress, localCity, localZip, localCountry, hasPhysicalItems]);

  useEffect(() => {
    const handler = () => {
      setShowErrors(true);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        if (nameInvalid) nameRef.current?.focus();
        else if (emailInvalid) emailRef.current?.focus();
        else if (phoneInvalid) {
          // Focus phone input - using a data attribute or selector since it's a wrapper component
          const phoneInput = containerRef.current?.querySelector('input[type="tel"]');
          if (phoneInput instanceof HTMLInputElement) phoneInput.focus();
        }
        else if (addressInvalid) document.getElementById("shipping-address")?.focus();
        else if (cityInvalid) document.getElementById("shipping-city")?.focus();
        else if (zipInvalid) document.getElementById("shipping-zip")?.focus();
        else if (countryInvalid) document.getElementById("shipping-country")?.focus();
      }, 350);
    };
    window.addEventListener(BUYER_ERRORS_EVENT, handler);
    return () => window.removeEventListener(BUYER_ERRORS_EVENT, handler);
  }, [nameInvalid, emailInvalid, phoneInvalid, addressInvalid, cityInvalid, zipInvalid, countryInvalid]);

  useEffect(() => {
    if (valid) setShowErrors(false);
  }, [valid]);

  const showNameError = showErrors && nameInvalid;
  const showEmailError = showErrors && emailInvalid;
  const showPhoneError = showErrors && phoneInvalid;

  return (
    <div
      id={BUYER_FORM_ID}
      ref={containerRef}
      className={cn(
        "rounded-xl border bg-background p-4 sm:p-5 space-y-3 transition-all",
        showErrors && !valid && "border-destructive/60 ring-2 ring-destructive/20",
        shake && "animate-[shake_0.5s_ease-in-out]",
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-primary" />
            {t.yourDetails}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t.yourDetailsHint}
          </p>
        </div>
        {valid ? (
          <span className="flex items-center gap-1 text-xs text-primary font-medium">
            <CheckCircle2 className="w-4 h-4" /> {t.ready}
          </span>
        ) : showErrors ? (
          <span className="flex items-center gap-1 text-xs text-destructive font-medium">
            <AlertCircle className="w-4 h-4" /> {t.required}
          </span>
        ) : null}
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">{t.fullName}</span>
          <div className="relative mt-1">
            <User className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
              showNameError ? "text-destructive" : "text-muted-foreground",
            )} />
            <input
              ref={nameRef}
              type="text"
              autoComplete="name"
              required
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={() => updateGlobalBuyer({ fullName: localName })}
              placeholder={t.fullNamePlaceholder}
              aria-invalid={showNameError}
              className={cn(
                "w-full pl-9 pr-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2",
                showNameError
                  ? "border-destructive focus:ring-destructive/40"
                  : "focus:ring-primary/40",
              )}
            />
          </div>
          {showNameError && (
            <p className="text-[11px] text-destructive mt-1">{t.fullNameError}</p>
          )}
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">{t.email}</span>
          <div className="relative mt-1">
            <Mail className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
              showEmailError ? "text-destructive" : "text-muted-foreground",
            )} />
            <input
              ref={emailRef}
              type="email"
              autoComplete="email"
              required
              value={localEmail}
              onChange={(e) => setLocalEmail(e.target.value.trim())}
              onBlur={() => {
                const check = checkEmail(localEmail);
                const finalEmail = check.corrected ? check.email : localEmail;
                if (check.corrected) setLocalEmail(finalEmail);
                updateGlobalBuyer({ email: finalEmail });
              }}
              placeholder={t.emailPlaceholder}
              aria-invalid={showEmailError}
              className={cn(
                "w-full pl-9 pr-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2",
                showEmailError
                  ? "border-destructive focus:ring-destructive/40"
                  : "focus:ring-primary/40",
              )}
            />
          </div>
          {showEmailError ? (
            <p className="text-[11px] text-destructive mt-1">{emailCheckResult.message || t.emailError}</p>
          ) : (
            <p className="text-[11px] text-muted-foreground mt-1">
              {t.emailHint}
            </p>
          )}
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">
            {t.whatsappOptional}
          </span>
          <div className="mt-1 phone-input-wrap">
            <PhoneInput
              flags={flags}
              international
              defaultCountry={(region.country as any) || "PE"}
              value={localPhone}
              onChange={(v) => setLocalPhone(v ?? "")}
              onBlur={() => updateGlobalBuyer({ phone: localPhone })}
              placeholder="999 999 999"
              className={cn(
                "w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus-within:ring-2 transition-all",
                showPhoneError 
                  ? "border-destructive focus-within:ring-destructive/40" 
                  : "focus-within:ring-primary/40"
              )}
            />
          </div>
          {showPhoneError && (
            <p className="text-[11px] text-destructive mt-1">El teléfono es obligatorio para soporte/verificación.</p>
          )}
        </label>

        {hasPhysicalItems && (
          <div className="space-y-3 pt-3 border-t">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              {t.shippingAddress}
            </h3>
            
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">{t.shippingAddress} *</span>
              <div className="relative mt-1">
                <MapPin className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
                  showErrors && addressInvalid ? "text-destructive" : "text-muted-foreground",
                )} />
                <input
                  id="shipping-address"
                  type="text"
                  required
                  value={localAddress}
                  onChange={(e) => setLocalAddress(e.target.value)}
                  onBlur={() => updateGlobalBuyer({ address: localAddress })}
                  placeholder={t.addressPlaceholder}
                  className={cn(
                    "w-full pl-9 pr-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2",
                    showErrors && addressInvalid
                      ? "border-destructive focus:ring-destructive/40"
                      : "focus:ring-primary/40",
                  )}
                />
              </div>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">{t.city} *</span>
                <input
                  id="shipping-city"
                  type="text"
                  required
                  value={localCity}
                  onChange={(e) => setLocalCity(e.target.value)}
                  onBlur={() => updateGlobalBuyer({ city: localCity })}
                  className={cn(
                    "w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 mt-1",
                    showErrors && cityInvalid
                      ? "border-destructive focus:ring-destructive/40"
                      : "focus:ring-primary/40",
                  )}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">{t.postalCode} *</span>
                <input
                  id="shipping-zip"
                  type="text"
                  required
                  value={localZip}
                  onChange={(e) => setLocalZip(e.target.value)}
                  onBlur={() => updateGlobalBuyer({ zip: localZip })}
                  className={cn(
                    "w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 mt-1",
                    showErrors && zipInvalid
                      ? "border-destructive focus:ring-destructive/40"
                      : "focus:ring-primary/40",
                  )}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">{t.stateProvince}</span>
                <input
                  type="text"
                  value={localState}
                  onChange={(e) => setLocalState(e.target.value)}
                  onBlur={() => updateGlobalBuyer({ state: localState })}
                  className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 mt-1"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">{t.shippingCountry} *</span>
                <div className="relative mt-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select
                    id="shipping-country"
                    value={localCountry}
                    onChange={(e) => setLocalCountry(e.target.value)}
                    onBlur={() => updateGlobalBuyer({ country: localCountry })}
                    className={cn(
                      "w-full pl-9 pr-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 appearance-none",
                      showErrors && countryInvalid
                        ? "border-destructive focus:ring-destructive/40"
                        : "focus:ring-primary/40",
                    )}
                  >
                    <option value="">{t.selectCountry}</option>
                    <option value="US">United States 🇺🇸</option>
                    <option value="CA">Canada 🇨🇦</option>
                    <option value="GB">United Kingdom 🇬🇧</option>
                    <option value="AU">Australia 🇦🇺</option>
                    <option value="NZ">New Zealand 🇳🇿</option>
                    <option value="PE">Perú 🇵🇪</option>
                    <option value="CO">Colombia 🇨🇴</option>
                    <option value="MX">México 🇲🇽</option>
                    <option value="AR">Argentina 🇦🇷</option>
                    <option value="CL">Chile 🇨🇱</option>
                  </select>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
