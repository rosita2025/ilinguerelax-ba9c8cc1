// Admin: historial de eventos de indexación (Google Indexing API, IndexNow,
// sitemap ping, GSC). Se lee con service role porque public.indexing_events
// no es legible por el rol anónimo del panel.
import { assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const guard = await assertAdminCsrf(req);
  if (guard) return guard;

  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const body = (await req.json().catch(() => ({}))) as {
      days?: number;
      channel?: string;
      limit?: number;
    };
    const days = Math.min(Math.max(body.days ?? 30, 1), 365);
    const limit = Math.min(Math.max(body.limit ?? 3000, 1), 5000);
    const since = new Date(Date.now() - days * 86_400_000).toISOString();

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    let q = admin
      .from("indexing_events")
      .select("id, url, channel, target, status, http_status, detail, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (body.channel && body.channel !== "all") q = q.eq("channel", body.channel);

    const { data, error } = await q;
    if (error) throw error;

    return json({ ok: true, rows: data ?? [] });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
