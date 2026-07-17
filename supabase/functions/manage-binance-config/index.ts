import { assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const sb = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

const CODE_RE = /^[A-Z0-9_-]{1,32}$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const block = await assertAdminCsrf(req);
  if (block) return block;

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "list");
    const db = sb();

    if (action === "list") {
      const { data, error } = await db
        .from("binance_pay_configs")
        .select("*")
        .order("region_code");
      if (error) return json({ error: error.message }, 500);
      return json({ configs: data ?? [] });
    }

    if (action === "save") {
      const c = body.config ?? {};
      const region_code = String(c.region_code || "").toUpperCase();
      if (!CODE_RE.test(region_code)) return json({ error: "invalid region_code" }, 400);
      const payload = {
        region_code,
        address: String(c.address || "").trim(),
        holder_name: String(c.holder_name || "").trim(),
        qr_url: String(c.qr_url || "").trim(),
        network: String(c.network || "Binance Pay (Pay ID)").trim(),
        pay_id: c.pay_id ? String(c.pay_id).trim() : null,
        notes: c.notes ? String(c.notes) : null,
        active: c.active !== false,
      };
      if (!payload.address || !payload.holder_name || !payload.qr_url) {
        return json({ error: "address, holder_name and qr_url are required" }, 400);
      }
      const { data, error } = await db
        .from("binance_pay_configs")
        .upsert(payload, { onConflict: "region_code" })
        .select("*")
        .single();
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, config: data });
    }

    if (action === "delete") {
      const region_code = String(body.region_code || "").toUpperCase();
      if (!CODE_RE.test(region_code)) return json({ error: "invalid region_code" }, 400);
      if (region_code === "DEFAULT") return json({ error: "cannot delete DEFAULT" }, 400);
      const { error } = await db.from("binance_pay_configs").delete().eq("region_code", region_code);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
