// Persists every Brevo sync attempt (contact upsert / abandoned-cart upsert)
// into public.brevo_sync_logs so the admin can see what event arrived and
// what was sent, with success/failure status.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface BrevoLogEntry {
  event_type: string;                // e.g. "hotmart_purchase", "hotmart_abandoned", "tienda_purchase", "tienda_abandoned"
  source?: string;                   // "brevo_contact" | "brevo_abandoned"
  origin?: string;                   // "hotmart" | "tienda"
  email?: string;
  product_name?: string;
  product_sku?: string;
  order_ref?: string;
  status: "success" | "failed" | "skipped";
  http_status?: number;
  attributes?: Record<string, unknown>;
  response?: string;
  error?: string;
}

type BrevoLogClient = {
  from: (table: "brevo_sync_logs") => {
    insert: (row: Record<string, unknown>) => Promise<unknown>;
  };
};

let cached: BrevoLogClient | null = null;
function client() {
  if (cached) return cached;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  cached = createClient(url, key, { auth: { persistSession: false } }) as unknown as BrevoLogClient;
  return cached;
}

export async function logBrevoSync(entry: BrevoLogEntry): Promise<void> {
  try {
    const c = client();
    if (!c) return;
    const row = {
      ...entry,
      email: entry.email ? entry.email.toLowerCase() : null,
      response: entry.response ? entry.response.slice(0, 4000) : null,
      error: entry.error ? entry.error.slice(0, 2000) : null,
    };
    await c.from("brevo_sync_logs").insert(row);
  } catch (e) {
    console.warn("[brevo-log] insert failed:", e instanceof Error ? e.message : String(e));
  }
}
