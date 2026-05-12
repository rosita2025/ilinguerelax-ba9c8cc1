import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FB_PIXEL_ID = "24959578143733255";
const FB_API_VERSION = "v21.0";

const ALLOWED_EVENTS = new Set(["ViewContent", "AddToCart", "InitiateCheckout", "Lead"]);

async function sha256(message: string): Promise<string> {
  const buf = new TextEncoder().encode(message);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function parseCookie(cookieHeader: string, name: string): string | undefined {
  const m = cookieHeader.match(new RegExp("(?:^|; )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[1]) : undefined;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const accessToken = Deno.env.get("FB_CONVERSIONS_API_TOKEN");
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "FB token not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const {
      event_name,
      event_id,
      event_source_url,
      custom_data = {},
      email,
    } = body || {};

    if (!event_name || !ALLOWED_EVENTS.has(event_name)) {
      return new Response(JSON.stringify({ error: "invalid event_name" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cookieHeader = req.headers.get("cookie") || "";
    const fbp = parseCookie(cookieHeader, "_fbp") || body.fbp;
    const fbc = parseCookie(cookieHeader, "_fbc") || body.fbc;
    const clientIp = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const user_data: Record<string, unknown> = {
      client_ip_address: clientIp,
      client_user_agent: userAgent,
    };
    if (fbp) user_data.fbp = fbp;
    if (fbc) user_data.fbc = fbc;
    if (email && typeof email === "string") {
      user_data.em = [await sha256(email.toLowerCase().trim())];
    }

    const payload = {
      data: [
        {
          event_name,
          event_time: Math.floor(Date.now() / 1000),
          event_id: event_id || `${event_name}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          event_source_url: event_source_url || undefined,
          action_source: "website",
          user_data,
          custom_data,
        },
      ],
    };

    const url = `https://graph.facebook.com/${FB_API_VERSION}/${FB_PIXEL_ID}/events?access_token=${accessToken}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      console.error("FB CAPI error", event_name, JSON.stringify(json));
      return new Response(JSON.stringify({ error: json }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true, fb: json }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
