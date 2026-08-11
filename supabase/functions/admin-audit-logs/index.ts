import { adminCorsHeaders, assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const JSON_HEADERS = { ...adminCorsHeaders, "Content-Type": "application/json" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: adminCorsHeaders });

  // Exigimos 2FA para ver los logs de auditoría
  const block = await assertAdminCsrf(req, { require2fa: true });
  if (block) return block;

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action || "list";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    if (action === "list") {
      const { data, error } = await supabase
        .from("admin_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: JSON_HEADERS });
    }

    return new Response(JSON.stringify({ error: "Acción no permitida" }), { status: 400, headers: JSON_HEADERS });
  } catch (e) {
    console.error("[admin-audit-logs] error", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: JSON_HEADERS });
  }
});
