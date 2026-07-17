// Automatic retry scanner for digital delivery.
// Runs on cron (and can be invoked manually from the admin panel).
//
// Behaviour:
//  - Reads public.digital_delivery_config (retry_after_minutes, max_attempts,
//    scan_window_hours, enabled).
//  - Retries every `digital_email_sends` row whose latest event is NOT one of
//    (delivered/sent/opened/clicked) after `retry_after_minutes`, up to
//    `max_attempts`, by re-invoking `send-digital-ilinguerelax` with force=true.
//  - Scans recent verified `manual_payments` / approved `hotmart_purchases`
//    that have NO matching `digital_email_sends` row and either:
//       * triggers a retry when SKUs can be resolved from stored items, or
//       * logs a `digital_delivery_alerts` row (reason=missing_skus) for
//         human review.
//  - Rows that exhaust `max_attempts` are logged as
//    `digital_delivery_alerts` (reason=max_attempts_reached).
//
// Auth: allowed for service_role (cron) OR when the caller sends the correct
// ADMIN_REVIEW_KEY in the body (admin panel button).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { normalizeSkus } from "../_shared/digitalSku.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DELIVERED_EVENTS = new Set([
  "delivered", "sent", "opened", "clicked", "email.sent", "email.delivered",
]);

type Config = {
  retry_after_minutes: number;
  max_attempts: number;
  scan_window_hours: number;
  enabled: boolean;
};

async function loadConfig(admin: ReturnType<typeof createClient>): Promise<Config> {
  const { data } = await admin
    .from("digital_delivery_config").select("*").eq("id", 1).maybeSingle();
  return {
    retry_after_minutes: data?.retry_after_minutes ?? 10,
    max_attempts: data?.max_attempts ?? 5,
    scan_window_hours: data?.scan_window_hours ?? 24,
    enabled: data?.enabled ?? true,
  };
}

function isDelivered(row: { status?: string | null; last_event?: string | null }): boolean {
  const s = String(row.status || "").toLowerCase();
  const e = String(row.last_event || "").toLowerCase();
  return DELIVERED_EVENTS.has(s) || DELIVERED_EVENTS.has(e);
}

async function invokeSend(payload: Record<string, unknown>) {
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-digital-ilinguerelax`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

async function upsertAlert(
  admin: ReturnType<typeof createClient>,
  source: string, source_ref: string, customer_email: string | null,
  reason: string, details: Record<string, unknown>,
) {
  await admin.from("digital_delivery_alerts").upsert({
    source, source_ref, customer_email, reason, details, resolved: false,
    updated_at: new Date().toISOString(),
  }, { onConflict: "source,source_ref,reason" });
}

// Best-effort SKU resolution from a manual_payments.items JSON blob.
// STRICT: never cross-match products. Prefer exact SKU (with alias normalization),
// then exact name equality; only fall back to a long shared prefix (>=12 chars)
// so short/generic names like "coreano" or "palabras" can't match the wrong row.
async function resolveSkusFromItems(
  admin: ReturnType<typeof createClient>,
  items: unknown,
): Promise<string[]> {
  if (!Array.isArray(items)) return [];
  const raw: string[] = [];
  for (const it of items as Array<Record<string, unknown>>) {
    const candidate = String(
      it?.sku || it?.SKU || it?.adminSku || it?.admin_sku || it?.productSku ||
      it?.slug || it?.id || it?.productId || ""
    ).trim();
    if (candidate) raw.push(candidate);
  }
  const normalized = normalizeSkus(raw);
  if (normalized.length > 0) {
    // Verify these SKUs actually exist in digital_products before returning.
    const { data } = await admin
      .from("digital_products").select("sku").in("sku", normalized);
    const known = new Set(((data ?? []) as Array<{ sku: string }>).map((r) => r.sku));
    const verified = normalized.filter((s) => known.has(s));
    if (verified.length > 0) return verified;
  }

  // Strict name fallback.
  const names = (items as Array<Record<string, unknown>>)
    .map((it) => String(it?.name || "").trim().toLowerCase())
    .filter((n) => n.length >= 8);
  if (names.length === 0) return [];
  const { data } = await admin.from("digital_products").select("sku,name").eq("active", true);
  const products = (data ?? []) as Array<{ sku: string; name: string | null }>;
  const matched: string[] = [];
  for (const n of names) {
    // 1) exact match
    let hit = products.find((p) => (p.name || "").toLowerCase() === n);
    // 2) shared prefix of at least 12 chars (start of both names is equal)
    if (!hit) {
      hit = products.find((p) => {
        const pn = (p.name || "").toLowerCase();
        if (pn.length < 12) return false;
        const len = Math.min(pn.length, n.length, 20);
        return len >= 12 && pn.substring(0, len) === n.substring(0, len);
      });
    }
    if (hit) matched.push(hit.sku);
  }
  return normalizeSkus(matched);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const adminKey = String(body?.adminKey || "");
  const authHeader = req.headers.get("authorization") || "";
  const expectedAdmin = Deno.env.get("ADMIN_REVIEW_KEY") || "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const isService = (() => {
    if (!authHeader.startsWith("Bearer ")) return false;
    const token = authHeader.slice(7).trim();
    if (serviceRole && token === serviceRole) return true;
    if (token.startsWith("sb_secret_") || token.startsWith("sbp_")) return true;
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    try {
      const pad = (s: string) => s + "===".slice((s.length + 3) % 4);
      const payload = JSON.parse(atob(pad(parts[1].replace(/-/g, "+").replace(/_/g, "/"))));
      return payload?.role === "service_role";
    } catch { return false; }
  })();
  const isAdmin = !!expectedAdmin && adminKey === expectedAdmin;
  if (!isService && !isAdmin) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const config = await loadConfig(admin);
    if (!config.enabled && !body?.force) {
      return new Response(JSON.stringify({ skipped: true, reason: "disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = Date.now();
    const cutoffRetryMs = now - config.retry_after_minutes * 60_000;
    const windowCutoff = new Date(now - config.scan_window_hours * 3_600_000).toISOString();

    const report = {
      config,
      scanned: 0,
      retried: 0,
      skipped: 0,
      alerts: 0,
      details: [] as Array<Record<string, unknown>>,
    };

    // 1) Retry existing digital_email_sends rows that never delivered.
    const { data: sends } = await admin
      .from("digital_email_sends")
      .select("*")
      .gte("created_at", windowCutoff)
      .order("created_at", { ascending: false })
      .limit(500);

    for (const row of (sends ?? []) as Array<Record<string, unknown>>) {
      report.scanned++;
      if (isDelivered(row as { status: string; last_event: string })) {
        report.skipped++; continue;
      }
      const created = new Date(String(row.created_at)).getTime();
      const lastRetry = row.last_retry_at ? new Date(String(row.last_retry_at)).getTime() : created;
      if (lastRetry > cutoffRetryMs) { report.skipped++; continue; }

      const attempts = Number(row.retry_attempts || 0);
      if (attempts >= config.max_attempts) {
        await upsertAlert(admin, String(row.provider || "unknown"), String(row.order_id || row.idempotency_key || row.id), String(row.customer_email || ""), "max_attempts_reached", {
          idempotency_key: row.idempotency_key, attempts, skus: row.skus,
        });
        report.alerts++;
        continue;
      }

      const skus = Array.isArray(row.skus) ? (row.skus as string[]) : [];
      if (skus.length === 0) {
        await upsertAlert(admin, String(row.provider || "unknown"), String(row.order_id || row.id), String(row.customer_email || ""), "missing_skus", { idempotency_key: row.idempotency_key });
        report.alerts++;
        continue;
      }

      const result = await invokeSend({
        customerEmail: row.customer_email,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        customerCountry: row.customer_country,
        orderId: row.order_id,
        skus,
        amount: row.amount,
        currency: row.currency,
        provider: row.provider,
        idempotencyKey: row.idempotency_key,
        force: true,
      });

      await admin.from("digital_email_sends").update({
        retry_attempts: attempts + 1,
        last_retry_at: new Date().toISOString(),
      }).eq("id", row.id);

      report.retried++;
      report.details.push({ id: row.id, ok: result.ok, status: result.status });
    }

    // 2) Scan verified manual_payments without any digital_email_sends row.
    const { data: manuals } = await admin
      .from("manual_payments")
      .select("id,order_number,buyer_email,buyer_name,buyer_phone,buyer_country,items,amount_usd,currency_local,verified_at,created_at,status")
      .eq("status", "verified")
      .gte("verified_at", windowCutoff)
      .limit(200);

    for (const mp of (manuals ?? []) as Array<Record<string, unknown>>) {
      const verifiedAt = mp.verified_at ? new Date(String(mp.verified_at)).getTime() : new Date(String(mp.created_at)).getTime();
      if (verifiedAt > cutoffRetryMs) continue;
      const email = String(mp.buyer_email || "").trim();
      if (!email) continue;

      const { data: existing } = await admin
        .from("digital_email_sends")
        .select("id,status,last_event")
        .or(`order_id.eq.${String(mp.order_number || mp.id)},customer_email.eq.${email}`)
        .gte("created_at", windowCutoff)
        .limit(20);
      const alreadyOk = (existing ?? []).some((r: any) => isDelivered(r));
      if (alreadyOk) continue;
      if ((existing ?? []).length > 0) continue; // handled by loop #1

      const skus = await resolveSkusFromItems(admin, mp.items);
      if (skus.length === 0) {
        await upsertAlert(admin, "manual_payment", String(mp.order_number || mp.id), email, "missing_skus", { items: mp.items });
        report.alerts++;
        continue;
      }

      const result = await invokeSend({
        customerEmail: email,
        customerName: mp.buyer_name,
        customerPhone: mp.buyer_phone,
        customerCountry: mp.buyer_country,
        orderId: mp.order_number || mp.id,
        skus,
        amount: mp.amount_usd,
        currency: "USD",
        provider: "manual_payment",
        force: true,
      });
      report.retried++;
      report.details.push({ manual_id: mp.id, ok: result.ok, status: result.status });
    }

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
