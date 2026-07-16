import { adminCorsHeaders, assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { upsertBrevoContact } from "../_shared/brevoContact.ts";
import { extractHotmartUsd } from "../_shared/hotmartUsd.ts";

const corsHeaders = adminCorsHeaders;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const { adminKey, status, search, limit, forceSync } = await req.json().catch(() => ({}));
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

    type BrevoInfo = {
      status: string;
      http_status: number | null;
      event_type: string;
      last_sync_at: string;
      missing_fields: string[];
      error: string | null;
      attributes: Record<string, unknown> | null;
    };

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
      usd_amount: number | null;
      usd_source: "producer" | "offer" | "price" | "none";
      brevo: BrevoInfo | null;
    };

    const purchases: Omit<Row, "brevo">[] = (hRes.data ?? []).map((r: any) => {
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
      const usd = extractHotmartUsd(r.raw_payload);
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
        usd_amount: usd.amount,
        usd_source: usd.source,
      };
    });

    const abandoned: Omit<Row, "brevo">[] = (aRes.data ?? []).map((r: any) => ({
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
      usd_amount: null,
      usd_source: "none",
    }));


    // Fetch latest Brevo sync log per email
    const emails = Array.from(new Set(
      [...purchases, ...abandoned].map((r) => (r.email ?? "").toLowerCase()).filter(Boolean),
    ));
    const brevoByEmail = new Map<string, BrevoInfo>();
    if (emails.length > 0) {
      const { data: logs } = await admin
        .from("brevo_sync_logs")
        .select("email, status, http_status, event_type, created_at, error, attributes")
        .in("email", emails)
        .order("created_at", { ascending: false })
        .limit(2000);
      for (const l of logs ?? []) {
        const key = String(l.email || "").toLowerCase();
        if (!key || brevoByEmail.has(key)) continue;
        const attrs = (l.attributes ?? null) as Record<string, unknown> | null;
        const missing: string[] = [];
        if (attrs) {
          const phoneProvided = attrs.PHONE_PROVIDED === true || attrs.TELEFONO_PROVISTO === "si";
          if (!phoneProvided) missing.push("teléfono");
          if (!attrs.COUNTRY_CODE && !attrs.PAIS_CODE) missing.push("país");
          if (!attrs.NOMBRE) missing.push("nombre");
          if (!attrs.APELLIDOS) missing.push("apellidos");
        } else {
          missing.push("sin sincronizar");
        }
        brevoByEmail.set(key, {
          status: String(l.status ?? "unknown"),
          http_status: l.http_status ?? null,
          event_type: String(l.event_type ?? ""),
          last_sync_at: l.created_at,
          missing_fields: missing,
          error: l.error ?? null,
          attributes: attrs,
        });
      }
    }

    const withBrevo = (r: Omit<Row, "brevo">): Row => ({
      ...r,
      brevo: r.email ? (brevoByEmail.get(r.email.toLowerCase()) ?? null) : null,
    });

    const purchasesFull = purchases.map(withBrevo);
    const abandonedFull = abandoned.map(withBrevo);

    // Auto-sync: any email present in audit but missing a Brevo log gets pushed
    // to Brevo in the background (fire-and-forget, does not block the response).
    const syncTargets = new Map<string, { name?: string; source: "purchase" | "abandoned"; product?: string; transaction?: string; status: string }>();
    for (const r of purchasesFull) {
      const key = (r.email ?? "").toLowerCase();
      if (!key) continue;
      if (!forceSync && r.brevo) continue;
      if (syncTargets.has(key)) continue;
      const st = r.mapped_status === "approved" ? "compra"
        : r.mapped_status === "pending" ? "pendiente"
        : r.mapped_status === "refused" ? "rechazado"
        : r.mapped_status === "refunded" ? "reembolso"
        : r.mapped_status === "chargeback" ? "chargeback"
        : r.mapped_status === "cancelled" ? "cancelado"
        : "compra";
      const buyer = (r.payload as any)?.data?.buyer ?? {};
      const product = (r.payload as any)?.data?.product ?? {};
      syncTargets.set(key, {
        name: [buyer.name, buyer.surname].filter(Boolean).join(" ") || buyer.name,
        source: "purchase",
        product: product.name ?? r.product ?? undefined,
        transaction: r.transaction ?? undefined,
        status: st,
      });
    }
    for (const r of abandonedFull) {
      const key = (r.email ?? "").toLowerCase();
      if (!key || syncTargets.has(key)) continue;
      if (!forceSync && r.brevo) continue;
      const p = r.payload as any;
      syncTargets.set(key, {
        name: p?.customer_name ?? undefined,
        source: "abandoned",
        product: r.product ?? undefined,
        status: "pendiente",
      });
    }
    let syncedCount = 0;
    if (syncTargets.size > 0) {
      const cap = forceSync ? 100 : 25;
      const jobs = Array.from(syncTargets.entries()).slice(0, cap).map(async ([email, meta]) => {
        try {
          await upsertBrevoContact({
            email,
            name: meta.name,
            productName: meta.product,
            orderNumber: meta.transaction,
            provider: meta.source === "purchase" ? "hotmart" : "abandoned",
            origin: meta.source === "purchase" ? "hotmart" : undefined,
            purchaseStatus: meta.status as any,
          });
          syncedCount++;
        } catch (err) {
          console.warn("[audit-auto-sync] failed", email, (err as Error).message);
        }
      });
      if (forceSync) {
        // Wait for completion so the UI can show the exact number synced.
        await Promise.allSettled(jobs);
      } else {
        // @ts-ignore Edge runtime
        EdgeRuntime.waitUntil(Promise.allSettled(jobs));
      }
    }




    let rows = [...purchasesFull, ...abandonedFull].sort(
      (a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime(),
    );

    if (status && typeof status === "string" && status !== "all") {
      rows = rows.filter((r) => r.mapped_status === status);
    }
    rows = rows.slice(0, take);

    // Summary counts (last 7 days).
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const summary = { approved: 0, pending: 0, refused: 0, refunded: 0, chargeback: 0, cancelled: 0, abandoned: 0 };
    const usdSummary = { approved_usd: 0, pending_usd: 0 };
    for (const r of [...purchasesFull, ...abandonedFull]) {
      if (r.received_at >= since && r.mapped_status in summary) {
        (summary as any)[r.mapped_status]++;
        if (r.usd_amount && r.usd_amount > 0) {
          if (r.mapped_status === "approved") usdSummary.approved_usd += r.usd_amount;
          else if (r.mapped_status === "pending") usdSummary.pending_usd += r.usd_amount;
        }
      }
    }


    return new Response(JSON.stringify({ rows, summary, usdSummary, synced: syncedCount, syncTargets: syncTargets.size }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
