import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCheckoutPruebaStore } from "@/stores/checkoutStore";
import { useI18n } from "@/i18n/I18nContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENT_KEY = "abandoned-cart-sent-v1";

function alreadySent(email: string, slug: string) {
  try {
    const raw = localStorage.getItem(SENT_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    const key = `${email}::${slug}`;
    const last = map[key];
    // Re-track after 6 hours
    return last && Date.now() - last < 6 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function markSent(email: string, slug: string) {
  try {
    const raw = localStorage.getItem(SENT_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    map[`${email}::${slug}`] = Date.now();
    localStorage.setItem(SENT_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}

/**
 * Tracks abandoned checkout: when the buyer has entered a valid name+email
 * but hasn't completed payment, saves to `abandoned_carts` so the 6-step
 * recovery email sequence kicks in. Fires once per (email, slug) per 6h.
 */
export function useAbandonedCheckoutTracker(slug: string | undefined, productName?: string) {
  const buyer = useCheckoutPruebaStore((s) => s.buyer);
  const items = useCheckoutPruebaStore((s) => s.items);
  const { language, countryCode } = useI18n();
  const timer = useRef<number | null>(null);
  const trackedRef = useRef<string>("");

  useEffect(() => {
    const email = buyer.email.trim().toLowerCase();
    const name = buyer.fullName.trim() || "Cliente";
    const phone = (buyer.phone || "").trim();

    // Fire as soon as we have a valid email — name is optional (Shopify behavior).
    // This ensures we capture people who type email but never complete name/payment.
    if (!EMAIL_RE.test(email)) return;

    const slugKey = slug || productName || "checkout";
    const cart = items.map((i) => ({ id: i.id, q: i.quantity }));
    const fingerprint = `${email}::${slugKey}::${language}::${JSON.stringify(cart)}`;
    if (trackedRef.current === fingerprint) return;
    if (alreadySent(email, slugKey)) return;

    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        await supabase.functions.invoke("track-abandoned-checkout", {
          body: {
            email,
            name,
            phone,
            product_type: slugKey,
            language,
            country: countryCode || "",
            cart,
          },
        });
        trackedRef.current = fingerprint;
        markSent(email, slugKey);
      } catch (err) {
        console.warn("abandoned-cart track failed", err);
      }
    }, 2000);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [buyer.email, buyer.fullName, buyer.phone, items, slug, productName, language, countryCode]);
}
