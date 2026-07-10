import { useEffect, useRef, useState } from "react";
import { User, Mail, Phone, CheckCircle2, AlertCircle } from "lucide-react";
import { useCheckoutPruebaStore } from "@/stores/checkoutPruebaStore";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nContext";
import { getCheckoutUI } from "@/i18n/checkoutUI";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isBuyerValid(buyer: { fullName: string; email: string }) {
  return buyer.fullName.trim().length >= 3 && EMAIL_RE.test(buyer.email.trim());
}

export const BUYER_FORM_ID = "buyer-info-form";
export const BUYER_ERRORS_EVENT = "checkout:showBuyerErrors";

export function BuyerInfoForm() {
  const { buyer, setBuyer } = useCheckoutPruebaStore();
  const { language } = useI18n();
  const t = getCheckoutUI(language);
  const valid = isBuyerValid(buyer);
  const [showErrors, setShowErrors] = useState(false);
  const [shake, setShake] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);

  const nameInvalid = buyer.fullName.trim().length < 3;
  const emailInvalid = !EMAIL_RE.test(buyer.email.trim());

  useEffect(() => {
    const handler = () => {
      setShowErrors(true);
      setShake(true);
      window.setTimeout(() => setShake(false), 600);
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => {
        if (nameInvalid) nameRef.current?.focus();
        else if (emailInvalid) emailRef.current?.focus();
      }, 350);
    };
    window.addEventListener(BUYER_ERRORS_EVENT, handler);
    return () => window.removeEventListener(BUYER_ERRORS_EVENT, handler);
  }, [nameInvalid, emailInvalid]);

  useEffect(() => {
    if (valid) setShowErrors(false);
  }, [valid]);

  const showNameError = showErrors && nameInvalid;
  const showEmailError = showErrors && emailInvalid;

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
          <h2 className="text-base font-semibold">{t.yourDetails}</h2>
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
              value={buyer.fullName}
              onChange={(e) => setBuyer({ fullName: e.target.value })}
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
              value={buyer.email}
              onChange={(e) => setBuyer({ email: e.target.value.trim() })}
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
            <p className="text-[11px] text-destructive mt-1">{t.emailError}</p>
          ) : (
            <p className="text-[11px] text-muted-foreground mt-1">
              {t.emailHint}
            </p>
          )}
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">
            WhatsApp (opcional)
          </span>
          <div className="relative mt-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="tel"
              autoComplete="tel"
              value={buyer.phone ?? ""}
              onChange={(e) => setBuyer({ phone: e.target.value })}
              placeholder="+51 999 999 999"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </label>
      </div>
    </div>
  );
}
