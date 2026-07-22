import { assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { stripeMethodsFor } from "./stripeCountryMethods.ts";

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

      // Guardar una región no debe modificar su selección de pagos. El llenado
      // automático queda disponible únicamente mediante la acción explícita
      // "autofill_stripe" del administrador.
      return json({ ok: true, autofilled: 0 });
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
      const id = String(m.id || "");
      const payload = {
        region_code: m.region_code,
        method_key: m.method_key,
        label: String(m.label || m.method_key),
        note: m.note ?? null,
        icon: String(m.icon || "CreditCard"),
        enabled: m.enabled !== false,
        sort_order: Number(m.sort_order || 0),
      };
      const query = id
        ? db.from("checkout_payment_methods").update(payload).eq("id", id).select("*").single()
        : db.from("checkout_payment_methods").upsert(payload, { onConflict: "region_code,method_key" }).select("*").single();
      const { data, error } = await query;
      if (error) return json({ error: error.message }, 500);
      await db
        .from("checkout_method_suppressions")
        .delete()
        .eq("region_code", payload.region_code)
        .eq("method_key", payload.method_key);
      return json({ ok: true, method: data });
    }

    if (action === "delete_method") {
      const id = String(body.id || "");
      if (!id) return json({ error: "missing id" }, 400);
      const { data: method, error: findErr } = await db
        .from("checkout_payment_methods")
        .select("region_code, method_key")
        .eq("id", id)
        .maybeSingle();
      if (findErr) return json({ error: findErr.message }, 500);
      const { error } = await db.from("checkout_payment_methods").delete().eq("id", id);
      if (error) return json({ error: error.message }, 500);
      if (method?.region_code && method?.method_key) {
        await db.from("checkout_method_suppressions").upsert({
          region_code: method.region_code,
          method_key: method.method_key,
          suppressed_at: new Date().toISOString(),
        });
      }
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


    if (action === "autofill_stripe") {
      const code = String(body.code || "");
      if (!CODE_RE.test(code)) return json({ error: "invalid region code" }, 400);
      const { data: region, error: rErr } = await db
        .from("checkout_regions").select("*").eq("code", code).maybeSingle();
      if (rErr || !region) return json({ error: rErr?.message || "region not found" }, 404);

      const suggested = stripeMethodsFor(region.country_codes || []);
      const [{ data: existing, error: exErr }, { data: suppressed, error: supErr }] = await Promise.all([
        db
          .from("checkout_payment_methods")
          .select("method_key, sort_order")
          .eq("region_code", code),
        db
          .from("checkout_method_suppressions")
          .select("method_key")
          .eq("region_code", code),
      ]);
      if (exErr) return json({ error: exErr.message }, 500);
      if (supErr) return json({ error: supErr.message }, 500);
      const existingRows = existing ?? [];
      const existingKeys = new Set(existingRows.map((x: { method_key: string }) => x.method_key));
      const suppressedKeys = new Set((suppressed ?? []).map((x: { method_key: string }) => x.method_key));
      const maxOrder = existingRows.reduce((max: number, x: { sort_order: number | null }) => Math.max(max, Number(x.sort_order || 0)), 0);
      const rows = suggested
        .filter((m) => !existingKeys.has(m.method_key) && !suppressedKeys.has(m.method_key))
        .map((m, idx) => ({
          region_code: code,
          method_key: m.method_key,
          label: m.label,
          note: m.note,
          icon: m.icon,
          enabled: true,
          sort_order: maxOrder + idx + 1,
        }));
      if (!rows.length) return json({ ok: true, added: 0 });
      const { error } = await db.from("checkout_payment_methods").insert(rows);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, added: rows.length });
    }

    if (action === "sync_all_stripe") {
      // Re-aplica autofill a todas las regiones con gateway Stripe. Upsert por
      // (region_code, method_key) — mantiene los métodos manuales existentes
      // y refresca labels/notes/icons según el mapa oficial más reciente.
      const { data: regions, error: rErr } = await db
        .from("checkout_regions").select("code, country_codes, gateway").eq("enabled", true);
      if (rErr) return json({ error: rErr.message }, 500);
      let totalAdded = 0;
      const touched: string[] = [];
      for (const region of regions || []) {
        const gw = String(region.gateway || "").toLowerCase();
        if (!gw.includes("stripe")) continue;
        const suggested = stripeMethodsFor(region.country_codes || []);
        if (!suggested.length) continue;
        const [{ data: existing, error: exErr }, { data: suppressed, error: supErr }] = await Promise.all([
          db
            .from("checkout_payment_methods")
            .select("method_key, sort_order")
            .eq("region_code", region.code),
          db
            .from("checkout_method_suppressions")
            .select("method_key")
            .eq("region_code", region.code),
        ]);
        if (exErr) return json({ error: `region ${region.code}: ${exErr.message}` }, 500);
        if (supErr) return json({ error: `region ${region.code}: ${supErr.message}` }, 500);
        const existingRows = existing ?? [];
        const existingKeys = new Set(existingRows.map((x: { method_key: string }) => x.method_key));
        const suppressedKeys = new Set((suppressed ?? []).map((x: { method_key: string }) => x.method_key));
        const maxOrder = existingRows.reduce((max: number, x: { sort_order: number | null }) => Math.max(max, Number(x.sort_order || 0)), 0);
        const rows = suggested
          .filter((m) => !existingKeys.has(m.method_key) && !suppressedKeys.has(m.method_key))
          .map((m, idx) => ({
            region_code: region.code,
            method_key: m.method_key,
            label: m.label,
            note: m.note,
            icon: m.icon,
            enabled: true,
            sort_order: maxOrder + idx + 1,
          }));
        if (!rows.length) {
          touched.push(region.code);
          continue;
        }
        const { error } = await db.from("checkout_payment_methods").insert(rows);
        if (error) return json({ error: `region ${region.code}: ${error.message}` }, 500);
        totalAdded += rows.length;
        touched.push(region.code);
      }
      return json({ ok: true, regions: touched, upserted: totalAdded });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
