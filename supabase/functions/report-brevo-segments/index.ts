import { adminCorsHeaders, assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = adminCorsHeaders;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const { adminKey, days, from, to } = await req.json().catch(() => ({}));
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

    let sinceDate: Date;
    let untilDate: Date;
    if (from && to) {
      sinceDate = new Date(`${from}T00:00:00.000Z`);
      untilDate = new Date(`${to}T23:59:59.999Z`);
      if (isNaN(sinceDate.getTime()) || isNaN(untilDate.getTime()) || sinceDate > untilDate) {
        return new Response(JSON.stringify({ error: "Invalid date range" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      const windowDays = Math.min(Math.max(Number(days) || 30, 1), 180);
      untilDate = new Date();
      sinceDate = new Date(Date.now() - windowDays * 86400000);
    }
    const windowDays = Math.max(1, Math.ceil((untilDate.getTime() - sinceDate.getTime()) / 86400000));

    const { data, error } = await admin
      .from("brevo_sync_logs")
      .select("created_at, event_type, origin, status, http_status, attributes")
      .gte("created_at", sinceDate.toISOString())
      .lte("created_at", untilDate.toISOString())
      .order("created_at", { ascending: false })
      .limit(20000);
    if (error) throw error;

    const rows = data ?? [];

    // Normalizar SEGMENTO en 3 categorías principales
    const normalizeSegment = (rawSeg: string | undefined, eventType: string): string => {
      const s = (rawSeg ?? "").toLowerCase();
      const e = (eventType ?? "").toLowerCase();
      if (s.includes("abandon") || e.includes("abandon")) return "abandoned_cart";
      if (s.includes("compra") || s.includes("purchase") || e.includes("purchase")) return "purchase";
      if (s.includes("pendiente") || s.includes("pending") || e.includes("pending")) return "pending";
      if (s.includes("news") || e.includes("news") || e.includes("subscribe")) return "newsletter";
      return "other";
    };

    const normalizeOrigin = (rawOrigen: string | undefined, origin: string | undefined, eventType: string): string => {
      const o = (rawOrigen ?? origin ?? "").toLowerCase();
      if (o.includes("hotmart") || eventType?.toLowerCase().includes("hotmart")) return "hotmart";
      if (o.includes("tienda") || eventType?.toLowerCase().includes("tienda")) return "tienda";
      return "otro";
    };

    // Matriz origen x segmento
    const matrix = new Map<string, { origen: string; segmento: string; total: number; ok: number; error: number }>();
    const originTotals = new Map<string, number>();
    const segmentTotals = new Map<string, number>();
    let grandTotal = 0, grandOk = 0, grandErr = 0;

    for (const r of rows) {
      const attrs = (r.attributes ?? {}) as Record<string, unknown>;
      const origen = normalizeOrigin(attrs["ORIGEN"] as string, r.origin as string, r.event_type as string);
      const segmento = normalizeSegment(attrs["SEGMENTO"] as string, r.event_type as string);
      const key = `${origen}|${segmento}`;
      const bucket = matrix.get(key) ?? { origen, segmento, total: 0, ok: 0, error: 0 };
      const http = r.http_status as number | null;
      const ok = r.status === "ok" || r.status === "success" || (http != null && http >= 200 && http < 300);
      bucket.total++;
      if (ok) bucket.ok++; else bucket.error++;
      matrix.set(key, bucket);
      originTotals.set(origen, (originTotals.get(origen) ?? 0) + 1);
      segmentTotals.set(segmento, (segmentTotals.get(segmento) ?? 0) + 1);
      grandTotal++;
      if (ok) grandOk++; else grandErr++;
    }

    return new Response(JSON.stringify({
      windowDays,
      from: sinceDate.toISOString().slice(0, 10),
      to: untilDate.toISOString().slice(0, 10),
      totals: { total: grandTotal, ok: grandOk, error: grandErr },
      byOrigin: Array.from(originTotals.entries()).map(([k, v]) => ({ origen: k, total: v })).sort((a, b) => b.total - a.total),
      bySegment: Array.from(segmentTotals.entries()).map(([k, v]) => ({ segmento: k, total: v })).sort((a, b) => b.total - a.total),
      matrix: Array.from(matrix.values()).sort((a, b) => b.total - a.total),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
