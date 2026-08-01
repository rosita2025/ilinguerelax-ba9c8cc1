// Admin: change the status of a Hotmart purchase from /admin/purchases-status.
// Only `hotmart_purchases` rows can be edited here; every change is audited in
// `order_events` so the operator can see who/when/why the status was moved.
import { adminCorsHeaders, assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = adminCorsHeaders;

const ALLOWED = new Set([
  "approved",
  "pending",
  "refused",
  "refunded",
  "chargeback",
  "cancelled",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { adminKey, rowId, status, note } = await req.json().catch(() => ({}));
    const expected = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expected || adminKey !== expected) return json({ error: "Unauthorized" }, 401);

    const id = typeof rowId === "string" ? rowId.replace(/^hot-/, "").trim() : "";
    const next = typeof status === "string" ? status.trim().toLowerCase() : "";
    if (!id) return json({ error: "rowId requerido" }, 400);
    if (!ALLOWED.has(next)) return json({ error: "Estado no permitido" }, 400);
    if (typeof rowId === "string" && !rowId.startsWith("hot-")) {
      return json({ error: "Solo se puede cambiar el estado de compras Hotmart" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: current, error: readErr } = await admin
      .from("hotmart_purchases")
      .select("id, email, status, transaction_code, product_code")
      .eq("id", id)
      .maybeSingle();
    if (readErr) return json({ error: readErr.message }, 500);
    if (!current) return json({ error: "Compra no encontrada" }, 404);

    const previous = current.status;
    if (previous === next) return json({ ok: true, unchanged: true, status: next });

    const { error: updErr } = await admin
      .from("hotmart_purchases")
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (updErr) return json({ error: updErr.message }, 500);

    await admin.from("order_events").insert({
      order_number: current.transaction_code ?? `HOTMART-${id}`,
      customer_email: current.email ?? null,
      provider: "hotmart",
      event: "status_changed_manually",
      status: next,
      detail: `Estado cambiado manualmente en admin: ${previous} → ${next}${note ? ` · ${String(note).slice(0, 300)}` : ""}`,
      metadata: {
        previous_status: previous,
        new_status: next,
        product_code: current.product_code ?? null,
        source: "admin/purchases-status",
      },
    });

    return json({ ok: true, previous, status: next });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
