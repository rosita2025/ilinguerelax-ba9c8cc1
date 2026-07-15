// Admin CRUD for `brevo_product_audiences` — mapping product identifiers to
// Brevo list IDs + tags so purchase/abandoned webhooks trigger the right
// per-product automations without editing code.
//
// Actions: list | upsert | delete | toggle

import { adminCorsHeaders, assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = adminCorsHeaders;

const MATCH_TYPES = new Set([
  "hotmart_product_id",
  "hotmart_product_code",
  "tienda_sku",
  "category",
  "any_sku",
]);
const EVENT_KINDS = new Set(["any", "compra", "abandonado"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const body = await req.json().catch(() => ({}));
    const { adminKey, action } = body || {};
    const expected = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expected || adminKey !== expected) {
      return json({ error: "Unauthorized" }, 401);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (action === "list") {
      const { data, error } = await admin
        .from("brevo_product_audiences")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json({ rows: data ?? [] });
    }

    if (action === "upsert") {
      const row = body?.row ?? {};
      const match_type = String(row.match_type ?? "").trim();
      const match_value = String(row.match_value ?? "").trim();
      const event_kind = String(row.event_kind ?? "any").trim();
      const list_id = Number(row.list_id);
      const tag = row.tag ? String(row.tag).trim() : null;
      const label = row.label ? String(row.label).trim() : null;
      const notes = row.notes ? String(row.notes).trim() : null;
      const active = row.active === false ? false : true;

      if (!MATCH_TYPES.has(match_type)) return json({ error: "match_type inválido" }, 400);
      if (!match_value) return json({ error: "match_value requerido" }, 400);
      if (!EVENT_KINDS.has(event_kind)) return json({ error: "event_kind inválido" }, 400);
      if (!Number.isFinite(list_id) || list_id <= 0) return json({ error: "list_id inválido" }, 400);

      const payload = { match_type, match_value, event_kind, list_id, tag, label, notes, active };
      if (row.id) {
        const { data, error } = await admin
          .from("brevo_product_audiences")
          .update(payload)
          .eq("id", row.id)
          .select()
          .single();
        if (error) throw error;
        return json({ row: data });
      }
      const { data, error } = await admin
        .from("brevo_product_audiences")
        .upsert(payload, { onConflict: "match_type,match_value,event_kind,list_id" })
        .select()
        .single();
      if (error) throw error;
      return json({ row: data });
    }

    if (action === "toggle") {
      const id = String(body?.id ?? "");
      const active = !!body?.active;
      if (!id) return json({ error: "id requerido" }, 400);
      const { error } = await admin
        .from("brevo_product_audiences")
        .update({ active })
        .eq("id", id);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "delete") {
      const id = String(body?.id ?? "");
      if (!id) return json({ error: "id requerido" }, 400);
      const { error } = await admin.from("brevo_product_audiences").delete().eq("id", id);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: "Acción no soportada" }, 400);
  } catch (e) {
    console.error("[manage-brevo-audiences]", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
