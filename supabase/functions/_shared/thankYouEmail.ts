// Shared "Thank you for your purchase" email — used by stripe-webhook, paypal-webhook,
// and mercadopago-webhook. Sends via Lovable's built-in email infrastructure
// (send-transactional-email → queued → process-email-queue).
import { createClient } from "npm:@supabase/supabase-js@2";
import { upsertBrevoContact } from "./brevoContact.ts";
import { sendInternalEmail } from "./sendInternalEmail.ts";

interface Item {
  name: string;
  qty?: number;
  price?: number;
  kind?: "main" | "upsell" | "bonus";
}

interface Args {
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  customerCountry?: string;
  customerAddress?: string;
  productName?: string;
  items?: Item[];
  bonuses?: string[];
  amount?: number;
  currency?: string;
  provider: "stripe" | "paypal" | "mercadopago" | "dlocalgo" | string;
  orderNumber?: string;
  idempotencyKey?: string;
  couponCode?: string;
  couponPercent?: number;
  couponAmount?: number;
  skus?: string[];
}

function getClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key);
}

function buildOrderNumber(provider: string, seed?: string): string {
  const d = new Date();
  const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const suffix = (seed || crypto.randomUUID()).replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  const prefix = provider === "stripe" ? "ILR-ST" : provider === "paypal" ? "ILR-PP" : provider === "dlocalgo" ? "ILR-DL" : "ILR-MP";
  return `${prefix}-${ymd}-${suffix}`;
}

async function invokeTemplate(
  templateName: string,
  recipientEmail: string | undefined,
  templateData: Record<string, unknown>,
  idempotencyKey: string,
) {
  const supabase = getClient();
  const body: Record<string, unknown> = {
    templateName,
    templateData,
    idempotencyKey,
    purpose: "transactional",
  };
  if (recipientEmail) body.recipientEmail = recipientEmail;
  const { error } = await sendInternalEmail(body as any);
  if (error) console.error(`[thankyou-email] ${templateName} failed:`, error);
}

export async function markAbandonedCartConverted(email?: string): Promise<void> {
  if (!email) return;
  const cleanEmail = email.trim().toLowerCase();
  try {
    const supabase = getClient();
    // 1. Marcar en persistent_carts (fuente actual)
    const { error: pErr } = await supabase
      .from("persistent_carts")
      .update({ converted: true, last_activity: new Date().toISOString() })
      .eq("email", cleanEmail)
      .eq("converted", false);
    if (pErr) console.error("[abandoned-cart] mark persistent converted failed:", pErr);

    // 2. Marcar en abandoned_carts (legacy fallback)
    const { error: aErr } = await supabase
      .from("abandoned_carts")
      .update({ converted: true, is_completed: true, updated_at: new Date().toISOString() })
      .eq("customer_email", cleanEmail)
      .eq("converted", false);
    if (aErr) console.error("[abandoned-cart] mark legacy converted failed:", aErr);
  } catch (e) {
    console.error("[abandoned-cart] mark converted exception:", e);
  }
}

export async function sendThankYouEmail(a: Args): Promise<void> {
  if (!a.customerEmail) return;
  const key = a.idempotencyKey || `${a.provider}-${a.customerEmail}-${Date.now()}`;
  const orderNumber = a.orderNumber || buildOrderNumber(a.provider, key);

  const data = {
    orderNumber,
    customerName: a.customerName,
    customerEmail: a.customerEmail,
    customerPhone: a.customerPhone,
    customerCountry: a.customerCountry,
    customerAddress: a.customerAddress,
    productName: a.productName,
    items: a.items,
    bonuses: a.bonuses,
    amount: a.amount,
    currency: a.currency,
    provider: a.provider,
    orderDate: new Date().toISOString(),
  };

  await Promise.all([
    invokeTemplate("thank-you", a.customerEmail, data, `thank-you-${key}`),
    invokeTemplate("admin-sale", undefined, data, `admin-sale-${key}`),
    upsertBrevoContact({
      email: a.customerEmail,
      name: a.customerName,
      phone: a.customerPhone,
      country: a.customerCountry,
      productName: a.productName,
      skus: a.skus,
      amount: a.amount,
      currency: a.currency,
      orderNumber,
      provider: a.provider,
      couponCode: a.couponCode,
      couponPercent: a.couponPercent,
      couponAmount: a.couponAmount,
    }),
    markAbandonedCartConverted(a.customerEmail),
  ]);
}
