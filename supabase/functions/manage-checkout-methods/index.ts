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
const KEY_RE = /^[a-z0-9_]{1,48}$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const block = await assertAdminCsrf(req);
  if (block) return block;

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "list");
    const db = sb();

    if (action === "list") {
      const [{ data: regions, error: e1 }, { data: methods, error: e2 }] = await Promise.all([
        db.from("checkout_regions").select("*").order("sort_order"),
        db.from("checkout_payment_methods").select("*").order("sort_order"),
      ]);
      if (e1 || e2) return json({ error: e1?.message || e2?.message }, 500);
      return json({ regions, methods });
    }

    if (action === "save_region") {
      const r = body.region ?? {};
      if (!CODE_RE.test(String(r.code || ""))) return json({ error: "invalid code" }, 400);
      const payload = {
        code: r.code,
        name: String(r.name || r.code),
        flag: r.flag ?? null,
        currency: String(r.currency || "USD"),
        gateway: r.gateway ?? null,
        description: r.description ?? null,
        country_codes: Array.isArray(r.country_codes) ? r.country_codes : [],
        enabled: r.enabled !== false,
        sort_order: Number(r.sort_order || 0),
      };
      const { error } = await db.from("checkout_regions").upsert(payload, { onConflict: "code" });
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "delete_region") {
      const code = String(body.code || "");
      if (!CODE_RE.test(code)) return json({ error: "invalid code" }, 400);
      const { error } = await db.from("checkout_regions").delete().eq("code", code);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "save_method") {
      const m = body.method ?? {};
      if (!CODE_RE.test(String(m.region_code || ""))) return json({ error: "invalid region" }, 400);
      if (!KEY_RE.test(String(m.method_key || ""))) return json({ error: "invalid method_key" }, 400);
      const payload = {
        region_code: m.region_code,
        method_key: m.method_key,
        label: String(m.label || m.method_key),
        note: m.note ?? null,
        icon: String(m.icon || "CreditCard"),
        enabled: m.enabled !== false,
        sort_order: Number(m.sort_order || 0),
      };
      const { error } = await db
        .from("checkout_payment_methods")
        .upsert(payload, { onConflict: "region_code,method_key" });
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "delete_method") {
      const id = String(body.id || "");
      if (!id) return json({ error: "missing id" }, 400);
      const { error } = await db.from("checkout_payment_methods").delete().eq("id", id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "toggle_method") {
      const id = String(body.id || "");
      const enabled = Boolean(body.enabled);
      if (!id) return json({ error: "missing id" }, 400);
      const { error } = await db.from("checkout_payment_methods").update({ enabled }).eq("id", id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
