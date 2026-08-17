import { adminCorsHeaders, assertAdminCsrf } from "../_shared/adminCsrf.ts";

const corsHeaders = adminCorsHeaders;
const GATEWAY_URL = "https://connector-gateway.lovable.dev/brevo";

async function brevoGet(path: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
  if (!LOVABLE_API_KEY || !BREVO_API_KEY) {
    return { error: "Brevo not configured", status: 500 };
  }
  try {
    const res = await fetch(`${GATEWAY_URL}${path}`, {
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": BREVO_API_KEY,
        "Accept": "application/json",
      },
    });
    const text = await res.text();
    if (!res.ok) return { error: text, status: res.status };
    try { return { data: JSON.parse(text) }; } catch { return { data: text }; }
  } catch (e) {
    return { error: (e as Error).message, status: 502 };
  }
}

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

    let startDate: string, endDate: string;
    if (from && to) { startDate = from; endDate = to; }
    else {
      const d = Math.min(Math.max(Number(days) || 7, 1), 90);
      const now = new Date();
      endDate = now.toISOString().slice(0, 10);
      startDate = new Date(Date.now() - (d - 1) * 86400000).toISOString().slice(0, 10);
    }

    const [accountRes, aggRes] = await Promise.all([
      brevoGet(`/account`),
      brevoGet(`/smtp/statistics/aggregatedReport?startDate=${startDate}&endDate=${endDate}`),
    ]);

    // Extract plan info
    let emailsLeft: number | null = null;
    let planType: string | null = null;
    let planEndDate: string | null = null;
    if (accountRes.data && typeof accountRes.data === "object") {
      const plans = (accountRes.data as any).plan ?? [];
      for (const p of plans) {
        if (p.type && String(p.type).toLowerCase().includes("sms")) continue;
        if (typeof p.credits === "number") {
          emailsLeft = p.credits;
          planType = p.type ?? planType;
          planEndDate = p.endDate ?? planEndDate;
          break;
        }
      }
    }

    const agg = (aggRes.data ?? {}) as Record<string, number>;

    return new Response(JSON.stringify({
      range: { from: startDate, to: endDate },
      account: {
        emailsLeft,
        planType,
        planEndDate,
        raw: accountRes.data ?? null,
        error: accountRes.error ?? null,
      },
      stats: {
        requests: agg.requests ?? 0,
        delivered: agg.delivered ?? 0,
        opens: agg.opens ?? 0,
        uniqueOpens: agg.uniqueOpens ?? 0,
        clicks: agg.clicks ?? 0,
        uniqueClicks: agg.uniqueClicks ?? 0,
        hardBounces: agg.hardBounces ?? 0,
        softBounces: agg.softBounces ?? 0,
        spamReports: agg.spamReports ?? 0,
        blocked: agg.blocked ?? 0,
        unsubscribed: agg.unsubscribed ?? 0,
        error: aggRes.error ?? null,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

