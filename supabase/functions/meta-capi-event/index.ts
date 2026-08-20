import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FB_PIXEL_ID = "24959578143733255";
const FB_API_VERSION = "v21.0";
const TIKTOK_PIXEL_ID = "DA38RORC77UFIU51BH10";

const ALLOWED_EVENTS = new Set(["ViewContent", "AddToCart", "InitiateCheckout", "Lead", "Purchase"]);

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
    const fbAccessToken = Deno.env.get("FB_CONVERSIONS_API_TOKEN");
    const ttAccessToken = Deno.env.get("TIKTOK_ACCESS_TOKEN");
    
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
    const ttp = parseCookie(cookieHeader, "_ttp") || body.ttp;
    const clientIp = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const results: Record<string, unknown> = {};

    // --- FACEBOOK CAPI ---
    if (fbAccessToken) {
      try {
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

        const fbRes = await fetch(`https://graph.facebook.com/${FB_API_VERSION}/${FB_PIXEL_ID}/events?access_token=${fbAccessToken}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        results.fb = await fbRes.json();
      } catch (e) {
        console.error("FB CAPI error", e);
        results.fb_error = String(e);
      }
    }

    // --- TIKTOK CAPI ---
    if (ttAccessToken) {
      try {
        const hashedEmail = email ? await sha256(email.toLowerCase().trim()) : undefined;
        
        const payload = {
          event_source: "web",
          event_source_id: TIKTOK_PIXEL_ID,
          data: [
            {
              event: event_name,
              event_id: event_id || `${event_name}_TT_${Date.now()}`,
              event_time: Math.floor(Date.now() / 1000),
              url: event_source_url || undefined,
              user: {
                ip: clientIp,
                ua: userAgent,
                email: hashedEmail,
                ttp: ttp,
              },
              properties: {
                content_id: custom_data.content_ids?.[0] || custom_data.product_id,
                content_name: custom_data.content_name,
                content_type: "product",
                value: custom_data.value,
                currency: "USD",
              },
            },
          ],
        };

        const ttRes = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Access-Token": ttAccessToken,
          },
          body: JSON.stringify(payload),
        });
        results.tt = await ttRes.json();
      } catch (e) {
        console.error("TikTok CAPI error", e);
        results.tt_error = String(e);
      }
    }

    return new Response(JSON.stringify({ ok: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});