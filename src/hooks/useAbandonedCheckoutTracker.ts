import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCheckoutPruebaStore, type PruebaItem } from "@/stores/checkoutStore";
import { useI18n } from "@/i18n/I18nContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENT_KEY = "abandoned-cart-sent-v2";

type TrackAbandonedCheckoutInput = {
  email: string;
  name?: string;
  phone?: string;
  productType?: string;
  language?: string;
  country?: string;
  items?: PruebaItem[];
  paymentMethod?: string;
  triggerReason?: string;
  force?: boolean;
};


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

function cartFromItems(items: PruebaItem[] | undefined) {
  return (items ?? []).map((i) => ({ id: i.id, q: i.quantity }));
}

function normalizeEmail(raw: string) {
  const email = raw.trim().toLowerCase();
  return email.endsWith("@gmail") ? `${email}.com` : email;
}

export async function trackAbandonedCheckoutNow(input: TrackAbandonedCheckoutInput): Promise<boolean> {
  const email = normalizeEmail(input.email);
  const name = (input.name || "").trim() || "Cliente";
  const phone = (input.phone || "").trim();
  const productType = input.productType || input.items?.[0]?.id || "checkout";

  if (!EMAIL_RE.test(email)) return false;
  if (!input.force && alreadySent(email, productType)) return true;

  const { data, error } = await supabase.functions.invoke<{ ok?: boolean }>("track-abandoned-checkout", {
    body: {
      email,
      name,
      phone,
      product_type: productType,
      language: input.language || "es",
      country: input.country || "",
      cart: cartFromItems(input.items),
      payment_method: input.paymentMethod || undefined,
      trigger_reason: input.triggerReason || "manual",
    },
  });


  if (error || data?.ok !== true) {
    console.warn("abandoned-cart track failed", error || data);
    return false;
  }

  markSent(email, productType);
  return true;
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
    const email = normalizeEmail(buyer.email);
    const name = buyer.fullName.trim() || "Cliente";
    const phone = (buyer.phone || "").trim();

    // Fire as soon as we have a valid email — name is optional (Shopify behavior).
    // This ensures we capture people who type email but never complete name/payment.
    if (!EMAIL_RE.test(email)) return;

    const slugKey = slug || productName || "checkout";
    const cart = cartFromItems(items);
    const fingerprint = `${email}::${slugKey}::${language}::${JSON.stringify(cart)}`;
    if (trackedRef.current === fingerprint) return;
    if (alreadySent(email, slugKey)) return;

    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        const ok = await trackAbandonedCheckoutNow({
          email,
          name,
          phone,
          productType: slugKey,
          language,
          country: countryCode || "",
          items,
        });
        if (ok) trackedRef.current = fingerprint;
      } catch (err) {
        console.warn("abandoned-cart track failed", err);
      }
    }, 1200);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [buyer.email, buyer.fullName, buyer.phone, items, slug, productName, language, countryCode]);
}
