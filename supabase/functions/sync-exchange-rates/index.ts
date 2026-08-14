import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const API_URL = "https://open.er-api.com/v6/latest/USD";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Fetching latest exchange rates from:", API_URL);
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch rates: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.result !== "success") {
      throw new Error(`API returned error: ${data.result}`);
    }

    const rates = data.rates;
    const updates = [];

    // Get current rates to only update if necessary or to maintain markup
    const { data: currentRates } = await supabase
      .from("exchange_rates")
      .select("code, markup_percent");
    
    const markups = new Map(currentRates?.map(r => [r.code, r.markup_percent]) || []);

    for (const [code, rate] of Object.entries(rates)) {
      // We only care about currencies we already have in our list or major ones
      if (markups.has(code)) {
        updates.push({
          code,
          rate: rate,
          last_updated: new Date().toISOString()
        });
      }
    }

    if (updates.length > 0) {
      const { error } = await supabase
        .from("exchange_rates")
        .upsert(updates);
      
      if (error) throw error;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      updated: updates.length,
      timestamp: data.time_last_update_utc
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating exchange rates:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
