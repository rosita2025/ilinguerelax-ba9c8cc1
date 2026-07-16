import { adminCorsHeaders, assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = adminCorsHeaders;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const { adminKey, days, country } = await req.json().catch(() => ({}));
    const expected = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expected || adminKey !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const windowDays = Math.min(Math.max(Number(days) || 30, 1), 180);
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await admin
      .from("brevo_sync_logs")
      .select("created_at, event_type, origin, status, http_status, attributes")
      .in("event_type", ["hotmart_abandoned", "tienda_abandoned"])
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw error;

    const rows = data ?? [];
    const countryFilter = typeof country === "string" && country.trim() ? country.trim().toUpperCase() : null;

    const getCC = (attrs: Record<string, unknown> | null): string => {
      const a = attrs ?? {};
      const raw = (a["COUNTRY_CODE"] ?? a["PAIS_CODE"] ?? a["PAIS"]) as string | undefined;
      return raw ? String(raw).toUpperCase() : "??";
    };

    const filtered = countryFilter
      ? rows.filter((r) => getCC(r.attributes as Record<string, unknown>) === countryFilter)
      : rows;

    // Series por día
    const dayMap = new Map<string, { day: string; hotmart: number; tienda: number }>();
    for (let i = windowDays - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      dayMap.set(d, { day: d, hotmart: 0, tienda: 0 });
    }
    let totalHotmart = 0, totalTienda = 0, totalErrors = 0;
    const countryCounts = new Map<string, { code: string; hotmart: number; tienda: number; total: number }>();

    for (const r of filtered) {
      const day = String(r.created_at).slice(0, 10);
      const isH = r.event_type === "hotmart_abandoned" || r.origin === "hotmart";
      const bucket = dayMap.get(day);
      if (bucket) { if (isH) bucket.hotmart++; else bucket.tienda++; }
      if (isH) totalHotmart++; else totalTienda++;
      const http = r.http_status;
      const ok = r.status === "ok" || r.status === "success" || (http != null && http >= 200 && http < 300);
      if (!ok) totalErrors++;

      const cc = getCC(r.attributes as Record<string, unknown>);
      const c = countryCounts.get(cc) ?? { code: cc, hotmart: 0, tienda: 0, total: 0 };
      if (isH) c.hotmart++; else c.tienda++;
      c.total++;
      countryCounts.set(cc, c);
    }

    // Lista de países disponibles (sin aplicar filtro) para el select
    const allCountries = new Set<string>();
    for (const r of rows) allCountries.add(getCC(r.attributes as Record<string, unknown>));

    return new Response(JSON.stringify({
      windowDays,
      country: countryFilter,
      totals: {
        total: filtered.length,
        hotmart: totalHotmart,
        tienda: totalTienda,
        errors: totalErrors,
      },
      series: Array.from(dayMap.values()),
      byCountry: Array.from(countryCounts.values()).sort((a, b) => b.total - a.total),
      availableCountries: Array.from(allCountries).sort(),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
