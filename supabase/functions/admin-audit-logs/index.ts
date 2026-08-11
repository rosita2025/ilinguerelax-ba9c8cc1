import { createClient } from "npm:@supabase/supabase-js@2";
import { adminCorsHeaders, assertAdminCsrf, adminLog } from "../_shared/adminCsrf.ts";

const JSON_HEADERS = { ...adminCorsHeaders, "Content-Type": "application/json" };

function admin() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing Supabase configuration");
  return createClient(url, key);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: adminCorsHeaders });

  // Authentication: Origin + CSRF + 2FA
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

      if (error) {
        adminLog("admin-audit-logs", "error", "list_failed", { error: error.message });
        throw error;
      }
      
      adminLog("admin-audit-logs", "info", "list_success", { count: data?.length || 0 });
      return new Response(JSON.stringify(data), { headers: JSON_HEADERS });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: JSON_HEADERS });
  } catch (e) {
    console.error("[admin-audit-logs] error", e);
    return new Response(JSON.stringify({ error: "Internal error", details: e.message }), { status: 500, headers: JSON_HEADERS });
  }
});
