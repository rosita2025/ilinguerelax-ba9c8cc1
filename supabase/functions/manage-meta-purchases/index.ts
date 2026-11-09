// deno-lint-ignore-file no-explicit-any
// Admin «Meta · Compras»: lista las compras confirmadas de TODAS las pasarelas (Stripe, dLocal Go, PayPal, Mercado Pago,
// pagos manuales Yape/Plin/SPEI…) y dice si cada una se envió a Meta (Conversions API) y si Meta confirmó recibirla.
// Permite reenviar una compra (o todas las pendientes) con su valor.
import { adminCorsHeaders, assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendPurchaseCapiResult } from "../_shared/metaCapi.ts";

const corsHeaders = adminCorsHeaders;
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

type Purchase = {
  ref: string;
  provider: string;
  email: string | null;
  name: string | null;
  amount: number | null;
  currency: string | null;
  at: string;
  country: string | null;
};

const lastN = (v: unknown, n: number) => String(v ?? "").slice(-n).toUpperCase();

async function collectPurchases(admin: any, days: number): Promise<Purchase[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const out = new Map<string, Purchase>();
  const put = (p: Purchase) => {
    const prev = out.get(p.ref);
    if (!prev) { out.set(p.ref, p); return; }
    out.set(p.ref, { ...prev, email: prev.email || p.email, name: prev.name || p.name, amount: prev.amount ?? p.amount, currency: prev.currency || p.currency, country: prev.country || p.country });
  };

  // 1) Pagos confirmados por el webhook / panel (dLocal Go, PayPal, Mercado Pago, Stripe si usa order_events…)
  const { data: paid } = await admin
    .from("order_events")
    .select("order_number, provider, customer_email, amount, currency, created_at")
    .eq("event", "payment_paid")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1000);
  const paidRows = (paid ?? []) as any[];
  const nums = [...new Set(paidRows.map((r) => r.order_number).filter(Boolean))];
  const created: Record<string, { name: string | null; country: string | null; usd: number | null }> = {};
  for (let i = 0; i < nums.length; i += 100) {
    const { data } = await admin
      .from("order_events")
      .select("order_number, amount, currency, metadata")
      .eq("event", "order_created")
      .in("order_number", nums.slice(i, i + 100));
    for (const r of (data ?? []) as any[]) {
      created[r.order_number] = {
        name: r.metadata?.customerName ?? null,
        country: r.metadata?.country ?? null,
        usd: String(r.currency ?? "").toUpperCase() === "USD" && Number(r.amount) > 0 ? Number(r.amount) : null,
      };
    }
  }
  for (const r of paidRows) {
    const c = created[r.order_number];
    // dLocal Go: el valor para Meta es el total en US$ guardado al crear el pedido; si no, el del pago.
    const useUsd = String(r.provider ?? "").toLowerCase().startsWith("dlocal") && c?.usd;
    put({
      ref: String(r.order_number),
      provider: String(r.provider ?? "otro").toLowerCase(),
      email: r.customer_email ? String(r.customer_email).toLowerCase() : null,
      name: c?.name ?? null,
      amount: useUsd ? (c!.usd as number) : (typeof r.amount === "number" ? r.amount : r.amount != null ? Number(r.amount) : null),
      currency: useUsd ? "USD" : (r.currency ? String(r.currency).toUpperCase() : null),
      at: r.created_at,
      country: c?.country ?? null,
    });
  }

  // 2) Stripe: compras registradas por el webhook firmado de Stripe
  const { data: st } = await admin
    .from("funnel_events")
    .select("session_id, email, name, value, currency, country, created_at, referrer")
    .eq("event_name", "Purchase")
    .eq("provider", "stripe")
    .ilike("referrer", '%"event_type":"%')
    .ilike("referrer", '%"status":"approved"%')
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(500);
  for (const r of (st ?? []) as any[]) {
    if (!r.session_id) continue;
    put({
      ref: `ILR-ST-${lastN(r.session_id, 8)}`,
      provider: "stripe",
      email: r.email ? String(r.email).toLowerCase() : null,
      name: r.name ?? null,
      amount: r.value != null ? Number(r.value) : null,
      currency: r.currency ? String(r.currency).toUpperCase() : null,
      at: r.created_at,
      country: r.country ?? null,
    });
  }

  // 3) Pagos manuales verificados (Yape, Plin, Binance, SPEI, transferencias)
  const { data: mp } = await admin
    .from("manual_payments")
    .select("id, order_number, buyer_email, buyer_country, amount_usd, amount_local, currency_local, verified_at, created_at, method")
    .eq("status", "verified")
    .gte("verified_at", since)
    .order("verified_at", { ascending: false })
    .limit(500);
  for (const r of (mp ?? []) as any[]) {
    put({
      ref: `ILR-MP-${lastN(r.order_number || r.id, 8)}`,
      provider: "manual",
      email: r.buyer_email ? String(r.buyer_email).toLowerCase() : null,
      name: null,
      amount: r.amount_usd != null ? Number(r.amount_usd) : r.amount_local != null ? Number(r.amount_local) : null,
      currency: r.amount_usd != null ? "USD" : (r.currency_local ? String(r.currency_local).toUpperCase() : "USD"),
      at: r.verified_at || r.created_at,
      country: r.buyer_country ?? null,
    });
  }

  return [...out.values()].sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

type MetaState = { state: "sent" | "error" | "none"; at: string | null; eventsReceived: number | null; error: string | null; attempts: number };

async function metaStates(admin: any, refs: string[], days: number): Promise<Map<string, MetaState> & { tableReady?: boolean }> {
  const map: Map<string, MetaState> & { tableReady?: boolean } = new Map<string, MetaState>();
  map.tableReady = true;
  if (!refs.length) return map;
  const since = new Date(Date.now() - (days + 2) * 86400000).toISOString();
  try {
    for (let i = 0; i < refs.length; i += 100) {
      const { data, error } = await admin
        .from("meta_capi_log")
        .select("order_ref, ok, events_received, error, created_at")
        .in("order_ref", refs.slice(i, i + 100))
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) { map.tableReady = false; return map; } // tabla aún sin migrar: todo queda «sin registro»
      for (const r of (data ?? []) as any[]) {
        const cur = map.get(r.order_ref) ?? { state: "none" as const, at: null, eventsReceived: null, error: null, attempts: 0 };
        cur.attempts += 1;
        // El más reciente que salió bien manda; si ninguno salió bien, el error más reciente.
        if (r.ok && cur.state !== "sent") Object.assign(cur, { state: "sent", at: r.created_at, eventsReceived: r.events_received, error: null });
        else if (!r.ok && cur.state === "none") Object.assign(cur, { state: "error", at: r.created_at, error: r.error });
        map.set(r.order_ref, cur);
      }
    }
  } catch (_) { map.tableReady = false; }
  return map;
}

async function resendOne(p: Purchase): Promise<{ ok: boolean; message: string }> {
  if (!p.email) return { ok: false, message: "Sin correo del comprador: Meta no puede asociarla" };
  if (!(typeof p.amount === "number" && p.amount > 0)) return { ok: false, message: "La compra no tiene monto: corrígelo antes (Corregir monto en /admin/dlocal)" };
  const r = await sendPurchaseCapiResult({
    eventId: `Purchase_${p.ref}_v2`,
    email: p.email,
    country: p.country,
    value: p.amount,
    currency: p.currency || "USD",
    contentName: "Pedido iLingue Relax",
    orderId: p.ref,
  });
  return r.ok
    ? { ok: true, message: `Meta confirmó recibirla (${r.eventsReceived ?? 1} evento)` }
    : { ok: false, message: r.error || r.skipped || "No se pudo enviar" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;
  try {
    const body = await req.json().catch(() => ({}));
    const expected = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expected || body.adminKey !== expected) return json({ error: "Unauthorized" }, 401);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const action = String(body.action ?? "list");
    const days = Math.min(Math.max(Number(body.days) || 14, 1), 60);

    if (action === "list") {
      const purchases = await collectPurchases(admin, days);
      const states = await metaStates(admin, purchases.map((p) => p.ref), days);
      // «Con quién»: de qué campaña/anuncio llegó cada comprador (según nuestro propio registro del checkout) y si hay clic de anuncio guardado.
      const emails = [...new Set(purchases.map((p) => p.email).filter(Boolean) as string[])];
      const camp = new Map<string, { campaign: string | null; ad: string | null }>();
      const attrib = new Map<string, "fbc" | "fbp">();
      try {
        for (let i = 0; i < emails.length; i += 80) {
          const chunk = emails.slice(i, i + 80);
          const { data: hits } = await admin.from("checkout_rate_hits").select("email, campaign, ad, created_at").in("email", chunk).not("campaign", "is", null).order("created_at", { ascending: false }).limit(1000);
          for (const h of (hits ?? []) as any[]) {
            const k = String(h.email ?? "").toLowerCase();
            if (k && !camp.has(k)) camp.set(k, { campaign: h.campaign ?? null, ad: h.ad ?? null });
          }
          const { data: at } = await admin.from("meta_attribution").select("email, fbc, fbp, expires_at").in("email", chunk);
          for (const a of (at ?? []) as any[]) {
            if (a.expires_at && new Date(a.expires_at).getTime() < Date.now()) continue;
            const k = String(a.email ?? "").toLowerCase();
            if (a.fbc) attrib.set(k, "fbc"); else if (a.fbp) attrib.set(k, "fbp");
          }
        }
      } catch (_) { /* sin esos datos: la lista sigue funcionando */ }
      const rows = purchases.map((p) => ({
        ...p,
        campaign: p.email ? camp.get(p.email)?.campaign ?? null : null,
        ad: p.email ? camp.get(p.email)?.ad ?? null : null,
        attribution: p.email ? attrib.get(p.email) ?? null : null,
        meta: states.get(p.ref) ?? { state: "none", at: null, eventsReceived: null, error: null, attempts: 0 },
      }));
      const summary = {
        total: rows.length,
        sent: rows.filter((r) => r.meta.state === "sent").length,
        error: rows.filter((r) => r.meta.state === "error").length,
        none: rows.filter((r) => r.meta.state === "none").length,
      };
      return json({ ok: true, rows, summary, pixelId: "24959578143733255", tableReady: states.tableReady !== false, tokenSet: !!Deno.env.get("FB_CONVERSIONS_API_TOKEN") });
    }

    if (action === "resend") {
      const ref = String(body.ref ?? "").trim();
      if (!ref) return json({ error: "Falta el pedido" }, 400);
      const p = (await collectPurchases(admin, 60)).find((x) => x.ref === ref);
      if (!p) return json({ error: "No encontré esa compra confirmada (últimos 60 días)" }, 404);
      const amount = Number(body.amount);
      if (Number.isFinite(amount) && amount > 0) { p.amount = amount; if (body.currency) p.currency = String(body.currency).toUpperCase().slice(0, 3); }
      const r = await resendOne(p);
      return json(r.ok ? { ok: true, message: r.message } : { error: r.message }, r.ok ? 200 : 422);
    }

    if (action === "resend_pending") {
      const purchases = await collectPurchases(admin, days);
      const states = await metaStates(admin, purchases.map((p) => p.ref), days);
      const todo = purchases.filter((p) => (states.get(p.ref)?.state ?? "none") !== "sent").slice(0, 40);
      let sent = 0;
      const failed: { ref: string; message: string }[] = [];
      for (const p of todo) {
        const r = await resendOne(p);
        if (r.ok) sent++; else failed.push({ ref: p.ref, message: r.message });
      }
      return json({ ok: true, attempted: todo.length, sent, failed });
    }

    return json({ error: "Acción desconocida" }, 400);
  } catch (e) {
    console.error("manage-meta-purchases error", e);
    return json({ error: "Error interno" }, 500);
  }
});
