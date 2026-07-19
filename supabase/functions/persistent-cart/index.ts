// Server-side persistent cart per email.
// GET  ?token=xxx        → returns { items, buyer } to hydrate the local checkout store.
// POST { email, items, buyer, country, language } → merges items into the row for that email.
// Used by (a) the recovery link in reminder emails, (b) internal tracking so
// carts survive across sessions/devices and abandoned-cart emails list every
// SKU the customer accumulated, not just the last one.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(raw: unknown) {
  const email = String(raw || "").trim().toLowerCase();
  return email.endsWith("@gmail") ? `${email}.com` : email;
}

interface CartItem {
  id: string;
  q: number;
}

function normalizeItems(input: unknown): CartItem[] {
  if (!Array.isArray(input)) return [];
  const out: CartItem[] = [];
  const seen = new Set<string>();
  for (const raw of input.slice(0, 30)) {
    const item = raw as { id?: unknown; q?: unknown; quantity?: unknown };
    const id = String(item?.id ?? "").trim().slice(0, 180);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const q = Math.max(1, Math.min(20, Number(item?.q ?? item?.quantity) || 1));
    out.push({ id, q });
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    if (req.method === "GET") {
      const url = new URL(req.url);
      const token = (url.searchParams.get("token") || "").trim().slice(0, 128);
      if (!token) {
        return new Response(JSON.stringify({ error: "missing token" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data } = await admin
        .from("persistent_carts")
        .select("email, items, buyer, country, language, converted")
        .eq("cart_token", token)
        .maybeSingle();
      if (!data) {
        return new Response(JSON.stringify({ error: "not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({
        ok: true,
        email: data.email,
        items: data.items || [],
        buyer: data.buyer || {},
        country: data.country || "",
        language: data.language || "es",
        converted: !!data.converted,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body.email);
    if (!EMAIL_RE.test(email)) {
      return new Response(JSON.stringify({ error: "invalid email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newItems = normalizeItems(body.items);
    const buyer = {
      name: String(body?.buyer?.name || body?.name || "").slice(0, 120),
      phone: String(body?.buyer?.phone || body?.phone || "").slice(0, 40),
    };
    const country = String(body.country || "").trim().toUpperCase().slice(0, 2) || null;
    const language = String(body.language || "es").toLowerCase().slice(0, 5);
    const converted = body.converted === true;

    // Merge: keep any existing SKUs, add any new ones (dedupe by id, quantity=1 for digitals).
    const { data: existing } = await admin
      .from("persistent_carts")
      .select("items, converted")
      .eq("email", email)
      .maybeSingle();

    let merged: CartItem[] = newItems;
    if (existing && Array.isArray(existing.items)) {
      const map = new Map<string, CartItem>();
      for (const it of existing.items as CartItem[]) {
        if (it?.id) map.set(String(it.id), { id: String(it.id), q: Math.max(1, Number(it.q) || 1) });
      }
      for (const it of newItems) {
        map.set(it.id, { id: it.id, q: Math.max(map.get(it.id)?.q ?? 0, it.q) });
      }
      merged = [...map.values()].slice(0, 30);
    }

    const payload: Record<string, unknown> = {
      email,
      items: merged,
      buyer,
      country,
      language,
      last_activity: new Date().toISOString(),
    };
    if (converted) payload.converted = true;

    const { data: row, error } = await admin
      .from("persistent_carts")
      .upsert(payload, { onConflict: "email" })
      .select("cart_token, items")
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({
      ok: true, cart_token: row?.cart_token, items: row?.items ?? merged,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
