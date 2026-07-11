// Brevo Event Webhook — records delivery/bounce/open/click events per email
// and updates `digital_email_sends` with the latest status per message_id.
//
// Configure in Brevo: Transactional → Settings → Webhook
//   URL: https://<project>.functions.supabase.co/brevo-webhook?token=<BREVO_WEBHOOK_SECRET>
//   Events: delivered, soft_bounce, hard_bounce, spam, blocked,
//           invalid_email, deferred, opened, unique_opened, click, unsubscribed
//
// Brevo sends either a single JSON object or an array of events.
// Docs: https://developers.brevo.com/docs/transactional-webhooks

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Brevo event → normalized status stored on digital_email_sends
const STATUS_MAP: Record<string, string> = {
  request: "queued",
  delivered: "delivered",
  opened: "opened",
  unique_opened: "opened",
  click: "clicked",
  soft_bounce: "soft_bounce",
  hard_bounce: "bounced",
  blocked: "blocked",
  spam: "complained",
  invalid_email: "invalid",
  deferred: "deferred",
  unsubscribed: "unsubscribed",
  error: "error",
};

interface BrevoEvent {
  event?: string;
  email?: string;
  "message-id"?: string;
  messageId?: string;
  date?: string;
  ts?: number;
  ts_event?: number;
  reason?: string;
  tag?: string;
  tags?: string[];
  [k: string]: unknown;
}

function normalize(ev: BrevoEvent) {
  const messageId = (ev.messageId || ev["message-id"] || "") as string;
  const event = String(ev.event || "").toLowerCase();
  const occurredAt = ev.date
    ? new Date(ev.date as string).toISOString()
    : ev.ts_event
      ? new Date(Number(ev.ts_event) * 1000).toISOString()
      : ev.ts
        ? new Date(Number(ev.ts) * 1000).toISOString()
        : new Date().toISOString();
  return {
    messageId: messageId ? messageId.replace(/[<>]/g, "").trim() : "",
    event,
    email: (ev.email as string) || null,
    reason: (ev.reason as string) || null,
    occurredAt,
    status: STATUS_MAP[event] ?? event,
    raw: ev,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ---- Auth: shared token in query string or header ----
    const secret = Deno.env.get("BREVO_WEBHOOK_SECRET");
    if (secret) {
      const url = new URL(req.url);
      const token = url.searchParams.get("token")
        || req.headers.get("x-webhook-token")
        || "";
      if (token !== secret) {
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "method not allowed" }), {
        status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(JSON.stringify({ error: "invalid json" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const events: BrevoEvent[] = Array.isArray(body) ? body : [body];

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let processed = 0;

    for (const raw of events) {
      const n = normalize(raw);
      if (!n.event) continue;

      // 1) Append full event to history
      const { error: insErr } = await supabase.from("email_delivery_events").insert({
        provider: "brevo",
        message_id: n.messageId || null,
        event: n.event,
        recipient_email: n.email,
        reason: n.reason,
        raw: n.raw,
        occurred_at: n.occurredAt,
      });
      if (insErr) console.warn("email_delivery_events insert failed:", insErr.message);

      // 2) Update digital_email_sends row (matched by message_id, fallback by email)
      if (n.messageId) {
        const { data: existing } = await supabase
          .from("digital_email_sends")
          .select("id, events, event_count, order_id, customer_email")
          .eq("message_id", n.messageId)
          .maybeSingle();

        if (existing) {
          const nextEvents = Array.isArray(existing.events) ? [...existing.events] : [];
          nextEvents.push({
            event: n.event,
            status: n.status,
            at: n.occurredAt,
            reason: n.reason,
          });
          await supabase
            .from("digital_email_sends")
            .update({
              status: n.status,
              last_event: n.event,
              last_event_at: n.occurredAt,
              event_count: (existing.event_count ?? 0) + 1,
              events: nextEvents,
            })
            .eq("id", existing.id);

          // Backfill order_id on the event log if we have it
          if (existing.order_id) {
            await supabase
              .from("email_delivery_events")
              .update({ order_id: existing.order_id })
              .eq("message_id", n.messageId)
              .is("order_id", null);
          }
        }
      }

      processed++;
    }

    return new Response(JSON.stringify({ ok: true, processed }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("brevo-webhook error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
