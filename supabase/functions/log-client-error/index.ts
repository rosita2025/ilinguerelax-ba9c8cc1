import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const truncate = (v: unknown, max = 8000) => {
  if (v == null) return null;
  const s = typeof v === "string" ? v : String(v);
  return s.length > max ? s.slice(0, max) : s;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const row = {
      source: truncate(body.source ?? "unknown", 64) ?? "unknown",
      message: truncate(body.message, 2000),
      stack: truncate(body.stack, 8000),
      component_stack: truncate(body.componentStack, 8000),
      url: truncate(body.url, 500),
      route: truncate(body.route, 500),
      user_agent: truncate(body.userAgent, 500),
      viewport: truncate(body.viewport, 32),
      release: truncate(body.release, 64),
      extra: body.extra ?? null,
    };

    const { error } = await supabase.from("client_error_logs").insert(row);
    if (error) {
      console.error("insert client_error_logs failed", error);
      return new Response(JSON.stringify({ ok: false }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("log-client-error failed", err);
    return new Response(JSON.stringify({ ok: false }), {
      status: 200, // avoid retry storms on the client
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
