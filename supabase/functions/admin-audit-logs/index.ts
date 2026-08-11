import { createClient } from "npm:@supabase/supabase-js@2";
import { adminCorsHeaders, assertAdminCsrf } from "../_shared/adminCsrf.ts";

const JSON_HEADERS = { ...adminCorsHeaders, "Content-Type": "application/json" };

function admin() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: adminCorsHeaders });

  const block = await assertAdminCsrf(req);
  if (block) return block;

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action || "list";
    const supabase = admin();

    if (action === "list") {
      const { data, error } = await supabase
        .from("admin_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: JSON_HEADERS });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: JSON_HEADERS });
  } catch (e) {
    console.error("[admin-audit-logs] error", e);
    return new Response(JSON.stringify({ error: "Internal error", details: e.message }), { status: 500, headers: JSON_HEADERS });
  }
});
