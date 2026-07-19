/**
 * Best-effort indexing event logger. Writes rows to public.indexing_events
 * so /admin/seo can show per-URL indexing status. Never throws — SEO
 * observability must not block the ping it is measuring.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type IndexingChannel =
  | "indexnow"
  | "sitemap_ping"
  | "gsc_sitemap"
  | "gsc_inspect"
  | "gsc_request";

export type IndexingStatus = "pending" | "sent" | "validated" | "error";

export interface IndexingEvent {
  url: string;
  channel: IndexingChannel;
  target?: string;
  status: IndexingStatus;
  http_status?: number;
  detail?: string;
}

function client() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function logIndexingEvents(events: IndexingEvent[]): Promise<void> {
  if (!events.length) return;
  const c = client();
  if (!c) return;
  try {
    await c.from("indexing_events").insert(events);
  } catch (e) {
    console.warn("[indexingLog] insert failed:", (e as Error).message);
  }
}
