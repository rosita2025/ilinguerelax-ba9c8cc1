import { adminCorsHeaders, assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = adminCorsHeaders;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const { adminKey, status, search, limit } = await req.json().catch(() => ({}));
    const expected = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expected || adminKey !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const take = Math.min(Math.max(Number(limit) || 200, 1), 500);
    const s = typeof search === "string" ? search.trim().toLowerCase() : "";

    // Hotmart purchases (contains raw_payload with original event)
    let hq = admin
      .from("hotmart_purchases")
      .select("id, email, transaction_code, product_code, product_id, purchased_at, status, raw_payload, created_at")
      .order("created_at", { ascending: false })
      .limit(take);
    if (s) hq = hq.or(`email.ilike.%${s}%,transaction_code.ilike.%${s}%,product_code.ilike.%${s}%,product_id.ilike.%${s}%`);

    // Abandoned carts (Hotmart origin)
    let aq = admin
      .from("abandoned_carts")
      .select("id, customer_email, customer_name, product_type, language, is_completed, converted, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(take);
    if (s) aq = aq.or(`customer_email.ilike.%${s}%,product_type.ilike.%${s}%`);

    const [hRes, aRes] = await Promise.all([hq, aq]);
    if (hRes.error) throw hRes.error;
    if (aRes.error) throw aRes.error;

    type Row = {
      id: string;
      source: "purchase" | "abandoned";
      received_at: string;
      event_raw: string;
      mapped_status: "approved" | "pending" | "refused" | "refunded" | "chargeback" | "cancelled" | "abandoned" | "unknown";
      email: string | null;
      transaction: string | null;
      product: string | null;
      converted: boolean | null;
      payload: unknown;
    };

    const purchases: Row[] = (hRes.data ?? []).map((r: any) => {
      const rawEvent = r?.raw_payload?.event ?? r?.raw_payload?.data?.purchase?.status ?? "UNKNOWN";
      const st = String(r.status || "").toLowerCase();
      const mapped: Row["mapped_status"] =
        st === "completed" || st === "approved" ? "approved"
        : st === "pending" ? "pending"
        : st === "refused" ? "refused"
        : st === "refunded" ? "refunded"
        : st === "chargeback" ? "chargeback"
        : st === "cancelled" || st === "canceled" ? "cancelled"
        : "unknown";
      return {
        id: r.id,
        source: "purchase",
        received_at: r.created_at,
        event_raw: String(rawEvent),
        mapped_status: mapped,
        email: r.email ?? null,
        transaction: r.transaction_code ?? null,
        product: r.product_code ?? r.product_id ?? null,
        converted: null,
        payload: r.raw_payload,
      };
    });

    const abandoned: Row[] = (aRes.data ?? []).map((r: any) => ({
      id: r.id,
      source: "abandoned",
      received_at: r.created_at,
      event_raw: "PURCHASE_OUT_OF_SHOPPING_CART",
      mapped_status: "abandoned",
      email: r.customer_email ?? null,
      transaction: null,
      product: r.product_type ?? null,
      converted: r.converted ?? r.is_completed ?? null,
      payload: r,
    }));

    let rows = [...purchases, ...abandoned].sort(
      (a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime(),
    );

    if (status && typeof status === "string" && status !== "all") {
      rows = rows.filter((r) => r.mapped_status === status);
    }
    rows = rows.slice(0, take);

    // Summary counts (last 7 days)
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const summary = { approved: 0, pending: 0, refused: 0, refunded: 0, chargeback: 0, cancelled: 0, abandoned: 0 };
    for (const r of [...purchases, ...abandoned]) {
      if (r.received_at >= since && r.mapped_status in summary) {
        (summary as any)[r.mapped_status]++;
      }
    }

    return new Response(JSON.stringify({ rows, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
