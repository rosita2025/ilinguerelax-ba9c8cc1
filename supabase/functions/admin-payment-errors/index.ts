import { assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Row = {
  id: string;
  created_at: string;
  provider: string | null;
  error_reason: string | null;
  country: string | null;
  ip: string | null;
  product_id: string | null;
  value: number | null;
  currency: string | null;
  page_path: string | null;
  session_id: string | null;
  user_agent: string | null;
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
      hours?: number;
      provider?: string;
      country?: string;
      limit?: number;
    };
    const hours = Math.min(Math.max(body.hours ?? 72, 1), 24 * 30);
    const limit = Math.min(body.limit ?? 200, 500);
    const since = new Date(Date.now() - hours * 3600_000).toISOString();

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Intentamos leer de funnel_events (nuestro tracking real de errores)
    let q = admin
      .from("funnel_events")
      .select(
        "id,created_at,provider,error_reason,country,ip,product_id,value,currency,page_path,session_id,user_agent",
      )
      .eq("event_name", "PaymentError")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (body.provider) q = q.eq("provider", body.provider);
    if (body.country) q = q.eq("country", body.country);

    const { data, error } = await q;
    
    // Si falla funnel_events, intentamos admin_payment_errors (nuestra tabla de auditoría)
    let rows: Row[] = [];
    if (error) {
      console.warn("admin-payment-errors: funnel_events failed, falling back to admin_payment_errors", error);
      const { data: fallbackData, error: fallbackError } = await admin
        .from("admin_payment_errors")
        .select("id, created_at, provider, error_message, error_kind, country:error_detail->>'country'")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(limit);
      
      if (fallbackError) throw fallbackError;
      
      rows = (fallbackData || []).map(r => ({
        id: r.id,
        created_at: r.created_at,
        provider: r.provider,
        error_reason: r.error_kind || r.error_message,
        country: r.country || null,
        ip: null,
        product_id: null,
        value: null,
        currency: null,
        page_path: null,
        session_id: null,
        user_agent: null
      }));
    } else {
      rows = (data || []) as Row[];
    }

    const tally = (key: (r: Row) => string) => {
      const m = new Map<string, number>();
      for (const r of rows) {
        const k = key(r) || "—";
        m.set(k, (m.get(k) ?? 0) + 1);
      }
      return [...m.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);
    };

    return json({
      rows,
      hours,
      total: rows.length,
      byReason: tally((r) => r.error_reason || "sin_motivo"),
      byProvider: tally((r) => r.provider || "desconocido"),
      byCountry: tally((r) => r.country || "??"),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg }, 500);
  }
});