import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FUNNEL_EVENTS = ["ViewContent", "Lead", "AddToCart", "InitiateCheckout", "Purchase"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { adminKey, days = 7 } = await req.json().catch(() => ({}));

    const expectedKey = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expectedKey || adminKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeDays = Math.min(Math.max(parseInt(String(days)) || 7, 1), 90);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const since = new Date(Date.now() - safeDays * 86400000).toISOString();

    const { data, error } = await supabase
      .from("funnel_events")
      .select("event_name, product_id, value, currency, session_id, created_at")
      .gte("created_at", since)
      .limit(50000);

    if (error) throw error;

    const totals: Record<string, number> = {};
    const uniqueSessions: Record<string, Set<string>> = {};
    const byProduct: Record<string, Record<string, number>> = {};
    let revenue = 0;

    for (const ev of FUNNEL_EVENTS) {
      totals[ev] = 0;
      uniqueSessions[ev] = new Set();
    }

    for (const row of data || []) {
      const ev = row.event_name as string;
      if (!FUNNEL_EVENTS.includes(ev)) continue;
      totals[ev] = (totals[ev] || 0) + 1;
      if (row.session_id) uniqueSessions[ev].add(row.session_id);
      const pid = (row.product_id as string) || "(sin producto)";
      byProduct[pid] = byProduct[pid] || {};
      byProduct[pid][ev] = (byProduct[pid][ev] || 0) + 1;
      if (ev === "Purchase" && row.value) revenue += Number(row.value);
    }

    const uniques: Record<string, number> = {};
    for (const ev of FUNNEL_EVENTS) uniques[ev] = uniqueSessions[ev].size;

    const conversionRates = {
      view_to_cart: totals.ViewContent ? (totals.AddToCart / totals.ViewContent) * 100 : 0,
      cart_to_checkout: totals.AddToCart ? (totals.InitiateCheckout / totals.AddToCart) * 100 : 0,
      checkout_to_purchase: totals.InitiateCheckout ? (totals.Purchase / totals.InitiateCheckout) * 100 : 0,
      view_to_purchase: totals.ViewContent ? (totals.Purchase / totals.ViewContent) * 100 : 0,
    };

    return new Response(
      JSON.stringify({
        days: safeDays,
        totals,
        uniques,
        byProduct,
        revenue,
        conversionRates,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("funnel-report error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});