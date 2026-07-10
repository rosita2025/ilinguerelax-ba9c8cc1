// Shared "Thank you for your purchase" email — used by stripe-webhook, paypal-webhook,
// and mercadopago-webhook. Sends via Lovable's built-in email infrastructure
// (send-transactional-email → queued → process-email-queue).
import { createClient } from "npm:@supabase/supabase-js@2";

interface Args {
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  customerCountry?: string;
  productName?: string;
  amount?: number;
  currency?: string;
  provider: "stripe" | "paypal" | "mercadopago";
  orderNumber?: string;
  idempotencyKey?: string;
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
  const prefix = provider === "stripe" ? "ILR-ST" : provider === "paypal" ? "ILR-PP" : "ILR-MP";
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
  const { error } = await supabase.functions.invoke("send-transactional-email", { body });
  if (error) console.error(`[thankyou-email] ${templateName} failed:`, error);
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
    productName: a.productName,
    amount: a.amount,
    currency: a.currency,
    provider: a.provider,
    orderDate: new Date().toISOString(),
  };

  await Promise.all([
    invokeTemplate("thank-you", a.customerEmail, data, `thank-you-${key}`),
    invokeTemplate("admin-sale", undefined, data, `admin-sale-${key}`),
  ]);
}
