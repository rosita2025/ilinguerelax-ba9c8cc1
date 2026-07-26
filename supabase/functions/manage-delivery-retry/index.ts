// Admin-only helpers to manage automatic digital-delivery retry.
// Supports:
//   { action: "get" }             -> { config, alerts, recentRetries }
//   { action: "update", config }  -> updates public.digital_delivery_config
//   { action: "run" }             -> triggers retry-digital-delivery synchronously
//   { action: "resolve_alert", id } -> marks an alert as resolved

import { adminCorsHeaders, assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: adminCorsHeaders });
  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const body = await req.json().catch(() => ({} as any));
    const expected = Deno.env.get("ADMIN_REVIEW_KEY") || "";
    if (!expected || body?.adminKey !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const action = String(body?.action || "get");

    if (action === "update") {
      const patch: Record<string, unknown> = {};
      const c = body?.config ?? {};
      if (typeof c.retry_after_minutes === "number") patch.retry_after_minutes = Math.max(1, Math.min(1440, c.retry_after_minutes));
      if (typeof c.max_attempts === "number") patch.max_attempts = Math.max(1, Math.min(20, c.max_attempts));
      if (typeof c.scan_window_hours === "number") patch.scan_window_hours = Math.max(1, Math.min(168, c.scan_window_hours));
      if (typeof c.enabled === "boolean") patch.enabled = c.enabled;
      await admin.from("digital_delivery_config").update(patch).eq("id", 1);
    }

    if (action === "resolve_alert" && body?.id) {
      await admin.from("digital_delivery_alerts")
        .update({ resolved: true, updated_at: new Date().toISOString() })
        .eq("id", body.id);
    }

    // Manual re-send of one order's digital delivery (admin "Reintentar envío").
    if (action === "resend_order") {
      const email = String(body?.customerEmail || "").trim().toLowerCase();
      const skus: string[] = Array.isArray(body?.skus) ? body.skus.filter(Boolean) : [];
      if (!email || skus.length === 0) {
        return new Response(JSON.stringify({ error: "customerEmail y skus son obligatorios" }), {
          status: 400, headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
        });
      }
      const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-digital-ilinguerelax`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          customerEmail: email,
          customerName: body?.customerName || undefined,
          orderId: body?.orderId || undefined,
          skus,
          provider: body?.provider || "admin",
          force: true,
        }),
      });
      const text = await res.text();
      if (!res.ok) {
        console.error(`resend_order failed [${res.status}]: ${text}`);
        return new Response(JSON.stringify({ error: "Fallo el reenvío", status: res.status, details: text.slice(0, 500) }), {
          status: res.status, headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ ok: true, result: text.slice(0, 500) }), {
        headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
      });
    }


    let runReport: unknown = null;
    if (action === "run") {
      const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/retry-digital-delivery`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({}),
      });
      runReport = await res.json().catch(() => ({ ok: res.ok }));
    }

    const [{ data: config }, { data: alerts }] = await Promise.all([
      admin.from("digital_delivery_config").select("*").eq("id", 1).maybeSingle(),
      admin.from("digital_delivery_alerts").select("*").order("created_at", { ascending: false }).limit(100),
    ]);

    return new Response(JSON.stringify({ config, alerts: alerts ?? [], runReport }), {
      headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
    });
  }
});
