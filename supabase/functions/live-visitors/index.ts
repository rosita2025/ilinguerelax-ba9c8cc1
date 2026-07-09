import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const classifyReferrer = (ref: string | null): string => {
  if (!ref) return "Direct";
  try {
    const host = new URL(ref).hostname.toLowerCase().replace(/^www\./, "");
    if (host.includes("google")) return "Google";
    if (host.includes("facebook") || host.includes("fb.")) return "Facebook";
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("tiktok")) return "TikTok";
    if (host.includes("youtube") || host === "youtu.be") return "YouTube";
    if (host.includes("bing")) return "Bing";
    if (host.includes("twitter") || host === "t.co" || host.includes("x.com")) return "Twitter/X";
    if (host.includes("whatsapp") || host === "wa.me") return "WhatsApp";
    if (host.includes("hotmart")) return "Hotmart";
    if (host.includes("ilinguerelax")) return "Direct";
    return host;
  } catch { return "Direct"; }
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { adminKey, windowMinutes = 5 } = await req.json().catch(() => ({}));
    const expected = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expected || adminKey !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const win = Math.min(Math.max(parseInt(String(windowMinutes)) || 5, 1), 60);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const since = new Date(Date.now() - win * 60000).toISOString();

    const { data, error } = await supabase
      .from("funnel_events")
      .select("event_name, product_id, session_id, country, page_path, referrer, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw error;

    // Group by session — one entry per live visitor with their latest activity
    const bySession = new Map<string, {
      session_id: string;
      country: string | null;
      page_path: string | null;
      referrer: string | null;
      source: string;
      last_seen: string;
      event_count: number;
      last_event: string;
      product_id: string | null;
    }>();

    for (const row of data || []) {
      const sid = row.session_id as string | null;
      if (!sid) continue;
      const existing = bySession.get(sid);
      if (existing) {
        existing.event_count += 1;
        continue;
      }
      bySession.set(sid, {
        session_id: sid,
        country: (row.country as string) || null,
        page_path: (row.page_path as string) || null,
        referrer: (row.referrer as string) || null,
        source: classifyReferrer((row.referrer as string) || null),
        last_seen: row.created_at as string,
        event_count: 1,
        last_event: row.event_name as string,
        product_id: (row.product_id as string) || null,
      });
    }

    const visitors = Array.from(bySession.values());

    // Aggregate by country
    const byCountry: Record<string, number> = {};
    const byPage: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    for (const v of visitors) {
      const c = v.country || "??";
      byCountry[c] = (byCountry[c] || 0) + 1;
      if (v.page_path) byPage[v.page_path] = (byPage[v.page_path] || 0) + 1;
      bySource[v.source] = (bySource[v.source] || 0) + 1;
    }

    return new Response(JSON.stringify({
      windowMinutes: win,
      total: visitors.length,
      byCountry,
      byPage,
      bySource,
      visitors: visitors.slice(0, 200),
      generatedAt: new Date().toISOString(),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("live-visitors error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
