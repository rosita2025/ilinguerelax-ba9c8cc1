// Admin edge function: gestión de bans e historial del checkout gate.
// Acciones:
//   - list_bans:  bans activos + próximos a expirar
//   - list_hits:  últimos N hits (con filtros opcionales por ip)
//   - unban:      elimina un ban por ip
//   - stats:      totales por ip en las últimas 24 h

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
      action?: string;
      ip?: string;
      limit?: number;
    };
    const action = body.action || "list_bans";
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    if (action === "list_bans") {
      const { data, error } = await admin
        .from("checkout_ip_bans")
        .select("*")
        .order("banned_until", { ascending: false })
        .limit(200);
      if (error) throw error;
      return json({ bans: data || [] });
    }

    if (action === "list_hits") {
      let q = admin
        .from("checkout_rate_hits")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(Math.min(body.limit || 100, 500));
      if (body.ip) q = q.eq("ip", body.ip);
      const { data, error } = await q;
      if (error) throw error;
      return json({ hits: data || [] });
    }

    if (action === "unban") {
      if (!body.ip) return json({ error: "missing ip" }, 400);
      const { error } = await admin.from("checkout_ip_bans").delete().eq("ip", body.ip);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "stats") {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { data, error } = await admin
        .from("checkout_rate_hits")
        .select("ip, slug, created_at")
        .gte("created_at", since)
        .limit(5000);
      if (error) throw error;
      const byIp = new Map<string, { ip: string; count: number; last: string; slugs: Set<string> }>();
      for (const row of data || []) {
        const r = row as { ip: string; slug: string | null; created_at: string };
        const cur = byIp.get(r.ip) || { ip: r.ip, count: 0, last: r.created_at, slugs: new Set<string>() };
        cur.count += 1;
        if (r.created_at > cur.last) cur.last = r.created_at;
        if (r.slug) cur.slugs.add(r.slug);
        byIp.set(r.ip, cur);
      }
      const top = [...byIp.values()]
        .map((x) => ({ ip: x.ip, count: x.count, last: x.last, slugs: [...x.slugs].slice(0, 5) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 100);
      return json({ top, total: (data || []).length });
    }

    return json({ error: "unknown action" }, 400);
  } catch (err) {
    console.error("manage-checkout-abuse error", err);
    return json({ error: (err as Error).message }, 500);
  }
});
