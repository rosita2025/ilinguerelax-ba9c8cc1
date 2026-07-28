import { assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { checkEmailWithRules, loadEmailRules, invalidateEmailRulesCache } from "../_shared/emailGuard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const LIST_TYPES = ["allow", "block", "typo"];
const KINDS = ["domain", "tld", "email", "typo"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const body = await req.json().catch(() => ({}));
    const { adminKey, action } = body as { adminKey?: string; action?: string };

    const expected = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expected || adminKey !== expected) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (action === "list") {
      const { data, error } = await supabase
        .from("email_domain_rules")
        .select("*")
        .order("list_type", { ascending: true })
        .order("kind", { ascending: true })
        .order("value", { ascending: true });
      if (error) throw error;
      return json({ rules: data ?? [] });
    }

    if (action === "add") {
      const listType = String(body.list_type || "block");
      const kind = String(body.kind || "domain");
      const value = String(body.value || "").trim().toLowerCase().replace(/^[@.]/, "");
      const mapsTo = body.maps_to ? String(body.maps_to).trim().toLowerCase() : null;
      const note = body.note ? String(body.note).slice(0, 200) : null;
      if (!value) return json({ error: "value requerido" }, 400);
      if (!LIST_TYPES.includes(listType)) return json({ error: "list_type inválido" }, 400);
      if (!KINDS.includes(kind)) return json({ error: "kind inválido" }, 400);
      if (listType === "typo" && !mapsTo) return json({ error: "maps_to requerido para correcciones" }, 400);

      const { error } = await supabase.from("email_domain_rules").upsert(
        { list_type: listType, kind: listType === "typo" ? "typo" : kind, value, maps_to: mapsTo, note, enabled: true },
        { onConflict: "list_type,kind,value" },
      );
      if (error) throw error;
      invalidateEmailRulesCache();
      return json({ ok: true });
    }

    if (action === "toggle") {
      const id = String(body.id || "");
      if (!id) return json({ error: "id requerido" }, 400);
      const { error } = await supabase
        .from("email_domain_rules")
        .update({ enabled: Boolean(body.enabled) })
        .eq("id", id);
      if (error) throw error;
      invalidateEmailRulesCache();
      return json({ ok: true });
    }

    if (action === "delete") {
      const id = String(body.id || "");
      if (!id) return json({ error: "id requerido" }, 400);
      const { error } = await supabase.from("email_domain_rules").delete().eq("id", id);
      if (error) throw error;
      invalidateEmailRulesCache();
      return json({ ok: true });
    }

    if (action === "test") {
      invalidateEmailRulesCache();
      const rules = await loadEmailRules(supabase);
      const result = checkEmailWithRules(String(body.email || ""), rules);
      return json({ result });
    }

    return json({ error: "acción desconocida" }, 400);
  } catch (e) {
    console.error("[manage-email-rules]", e);
    return json({ error: e instanceof Error ? e.message : "Error" }, 500);
  }
});
