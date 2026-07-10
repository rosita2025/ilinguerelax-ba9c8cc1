// Shared "Thank you for your purchase" email — used by stripe-webhook, paypal-webhook,
// and mercadopago-webhook. Sends via Lovable's built-in email infrastructure
// (send-transactional-email → queued → process-email-queue).
import { createClient } from "npm:@supabase/supabase-js@2";

interface Args {
  customerEmail: string;
  customerName?: string;
  productName?: string;
  amount?: number;
  currency?: string;
  provider: "stripe" | "paypal" | "mercadopago";
  idempotencyKey?: string;
}

function getClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key);
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

  const data = {
    customerName: a.customerName,
    customerEmail: a.customerEmail,
    productName: a.productName,
    amount: a.amount,
    currency: a.currency,
    provider: a.provider,
  };

  await Promise.all([
    invokeTemplate("thank-you", a.customerEmail, data, `thank-you-${key}`),
    invokeTemplate("admin-sale", undefined, data, `admin-sale-${key}`),
  ]);
}

