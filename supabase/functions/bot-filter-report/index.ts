import { assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa",
};

// UTC timestamp when the anti-bot classifier was deployed
const FILTER_DEPLOY_ISO = "2026-07-19T17:30:00Z";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const { adminKey, pagePath = "/", hoursBefore = 24, hoursAfter = 24 } =
      (await req.json().catch(() => ({}))) as {
        adminKey?: string; pagePath?: string; hoursBefore?: number; hoursAfter?: number;
      };
    const expected = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expected || adminKey !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const deployAt = new Date(FILTER_DEPLOY_ISO);
    const now = new Date();
    const beforeStart = new Date(deployAt.getTime() - hoursBefore * 3600_000);
    const afterEnd = new Date(Math.min(now.getTime(), deployAt.getTime() + hoursAfter * 3600_000));

    const fetchWindow = async (from: Date, to: Date) => {
      const { data, error } = await supabase
        .from("funnel_events")
        .select("event_name, session_id, country, is_bot, bot_reason, created_at")
        .eq("page_path", pagePath)
        .gte("created_at", from.toISOString())
        .lt("created_at", to.toISOString())
        .limit(50000);
      if (error) throw error;
      return data ?? [];
    };

    const [beforeRows, afterRows] = await Promise.all([
      fetchWindow(beforeStart, deployAt),
      fetchWindow(deployAt, afterEnd),
    ]);

    const summarize = (rows: Array<Record<string, unknown>>) => {
      const sessions = new Set<string>();
      const humanSessions = new Set<string>();
      const botSessions = new Set<string>();
      const byCountry: Record<string, number> = {};
      const byReason: Record<string, number> = {};
      const humansByCountry: Record<string, number> = {};
      let humans = 0, bots = 0;
      for (const r of rows) {
        const sid = (r.session_id as string) || "";
        const isBot = !!r.is_bot;
        const country = (r.country as string) || "??";
        if (sid) sessions.add(sid);
        if (isBot) {
          bots++;
          if (sid) botSessions.add(sid);
          const reason = (r.bot_reason as string) || "unknown";
          byReason[reason] = (byReason[reason] || 0) + 1;
        } else {
          humans++;
          if (sid) humanSessions.add(sid);
          humansByCountry[country] = (humansByCountry[country] || 0) + 1;
        }
        byCountry[country] = (byCountry[country] || 0) + 1;
      }
      return {
        events: rows.length,
        humans,
        bots,
        sessions: sessions.size,
        humanSessions: humanSessions.size,
        botSessions: botSessions.size,
        byCountry,
        byReason,
        humansByCountry,
      };
    };

    const before = summarize(beforeRows);
    const after = summarize(afterRows);

    const pct = (b: number, a: number) => {
      if (b === 0) return a === 0 ? 0 : 100;
      return Math.round(((a - b) / b) * 100);
    };

    return new Response(JSON.stringify({
      pagePath,
      filterDeployedAt: FILTER_DEPLOY_ISO,
      window: {
        beforeStart: beforeStart.toISOString(),
        beforeEnd: deployAt.toISOString(),
        afterStart: deployAt.toISOString(),
        afterEnd: afterEnd.toISOString(),
        hoursBefore,
        hoursAfter,
      },
      before,
      after,
      delta: {
        eventsPct: pct(before.events, after.events),
        humansPct: pct(before.humans, after.humans),
        botsPct: pct(before.bots, after.bots),
        sessionsPct: pct(before.sessions, after.sessions),
        humanSessionsPct: pct(before.humanSessions, after.humanSessions),
      },
      generatedAt: new Date().toISOString(),
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
