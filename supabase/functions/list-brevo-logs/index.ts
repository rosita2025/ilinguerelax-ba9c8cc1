import { adminCorsHeaders, assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = adminCorsHeaders;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const { adminKey, event, status, search, limit } = await req.json().catch(() => ({}));
    const expected = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expected || adminKey !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const take = Math.min(Math.max(Number(limit) || 200, 1), 500);
    let q = admin
      .from("brevo_sync_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(take);

    if (event && typeof event === "string" && event !== "all") q = q.eq("event_type", event);
    if (status && typeof status === "string" && status !== "all") q = q.eq("status", status);
    if (search && typeof search === "string" && search.trim()) {
      const s = search.trim().toLowerCase();
      q = q.or(`email.ilike.%${s}%,product_name.ilike.%${s}%,product_sku.ilike.%${s}%,order_ref.ilike.%${s}%`);
    }

    const { data, error } = await q;
    if (error) throw error;

    const { count: total7d } = await admin
      .from("brevo_sync_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    const { count: failed7d } = await admin
      .from("brevo_sync_logs")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    return new Response(
      JSON.stringify({ logs: data ?? [], total7d: total7d ?? 0, failed7d: failed7d ?? 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
