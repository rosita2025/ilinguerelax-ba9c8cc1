// Admin edge function: gestión de bans e historial del checkout gate.
// Acciones:
//   - list_bans:  bans activos + próximos a expirar
//   - list_hits:  últimos N hits (con filtros opcionales por ip)
//   - unban:      elimina un ban por ip
//   - stats:      totales por ip en las últimas 24 h

import { assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { getPurchasedEmails, markCartsConverted } from "../_shared/purchasedEmails.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const guard = await assertAdminCsrf(req);
  if (guard) return guard;

  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      ip?: string;
      limit?: number;
    };
    const action = body.action || "list_bans";
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    if (action === "list_bans") {
      const { data, error } = await admin
        .from("checkout_ip_bans")
        .select("*")
        .order("banned_until", { ascending: false })
        .limit(200);
      if (error) throw error;
      return json({ bans: data || [] });
    }

    if (action === "list_hits") {
      let q = admin
        .from("checkout_rate_hits")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(Math.min(body.limit || 100, 500));
      if (body.ip) q = q.eq("ip", body.ip);
      const { data, error } = await q;
      if (error) throw error;
      return json({ hits: data || [] });
    }

    if (action === "unban") {
      if (!body.ip) return json({ error: "missing ip" }, 400);
      const { error } = await admin.from("checkout_ip_bans").delete().eq("ip", body.ip);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "stats") {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { data, error } = await admin
        .from("checkout_rate_hits")
        .select("ip, slug, created_at, source, referer, ua, country, email, city")
        .gte("created_at", since)
        .limit(5000);
      if (error) throw error;

      // Resolvemos el país/ciudad real de las IPs que aún no lo tienen
      // (visitas antiguas o cabeceras sin geo). Guardamos el resultado para
      // no volver a consultar la misma IP.
      const unknown = [
        ...new Set(
          (data || [])
            .filter((r) => !(r as { country: string | null }).country)
            .map((r) => (r as { ip: string }).ip)
            .filter((ip) => ip && ip !== "unknown" && !ip.startsWith("127.") && !ip.startsWith("192.168.") && !ip.startsWith("10.")),
        ),
      ].slice(0, 250);

      const resolved = new Map<string, { country: string; city: string | null }>();
      if (unknown.length) {
        await Promise.all(
          unknown.map(async (ip) => {
            try {
              const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`);
              if (!res.ok) return;
              const geo = (await res.json()) as {
                success?: boolean;
                country_code?: string;
                city?: string;
              };
              if (!geo?.success || !geo.country_code) return;
              const country = geo.country_code.toUpperCase().slice(0, 2);
              const city = (geo.city || "").slice(0, 80) || null;
              resolved.set(ip, { country, city });
              await admin
                .from("checkout_rate_hits")
                .update({ country, city, geo_checked_at: new Date().toISOString() })
                .eq("ip", ip)
                .is("country", null);
            } catch (_e) {
              // Si el servicio de geo falla, seguimos mostrando el resto.
            }
          }),
        );
      }

      type Agg = { ip: string; count: number; last: string; slugs: Set<string>; sources: Set<string>; referers: Set<string>; ua: string | null; country: string | null; city: string | null; email: string | null };
      const byIp = new Map<string, Agg>();
      const bySource = new Map<string, number>();
      const byCountry = new Map<string, number>();
      for (const row of data || []) {
        const r = row as { ip: string; slug: string | null; created_at: string; source: string | null; referer: string | null; ua: string | null; country: string | null; city: string | null; email: string | null };
        const geo = resolved.get(r.ip);
        if (geo) {
          r.country = r.country || geo.country;
          r.city = r.city || geo.city;
        }
        const cur = byIp.get(r.ip) || { ip: r.ip, count: 0, last: r.created_at, slugs: new Set(), sources: new Set(), referers: new Set(), ua: r.ua, country: r.country, city: r.city, email: r.email };

        cur.count += 1;
        if (r.created_at > cur.last) cur.last = r.created_at;
        if (r.slug) cur.slugs.add(r.slug);
        if (r.source) cur.sources.add(r.source);
        if (r.referer) cur.referers.add(r.referer);
        if (!cur.ua && r.ua) cur.ua = r.ua;
        if (!cur.country && r.country) cur.country = r.country;
        if (!cur.city && r.city) cur.city = r.city;
        if (!cur.email && r.email) cur.email = r.email;
        byIp.set(r.ip, cur);
        const src = r.source || "direct";
        bySource.set(src, (bySource.get(src) || 0) + 1);
        const c = (r.country || "").toUpperCase();
        if (c) byCountry.set(c, (byCountry.get(c) || 0) + 1);
      }

      // Backfill de correo: si en las últimas 24 h la IP no dejó correo pero esa
      // misma IP sí lo escribió antes (visita previa), lo recuperamos para saber
      // quién es. No inventa datos: solo reutiliza correos reales de esa IP.
      const ipsSinEmail = [...byIp.values()].filter((x) => !x.email).map((x) => x.ip).slice(0, 200);
      if (ipsSinEmail.length) {
        const { data: prev } = await admin
          .from("checkout_rate_hits")
          .select("ip, email, created_at")
          .in("ip", ipsSinEmail)
          .not("email", "is", null)
          .order("created_at", { ascending: false })
          .limit(500);
        for (const p of (prev || []) as { ip: string; email: string }[]) {
          const agg = byIp.get(p.ip);
          if (agg && !agg.email) agg.email = p.email;
        }
      }


      // Cruce REAL con compras (entregas digitales, pagos aprobados, Shopify,
      // pagos manuales verificados y carritos ya convertidos). Antes se leía
      // solo la tabla legacy `abandoned_carts`, por lo que clientes que SÍ
      // compraron aparecían como "abandonó el carrito" (y recibían correos de
      // recuperación → los marcaban como spam).
      const emails = [...new Set([...byIp.values()].map((x) => (x.email || "").toLowerCase()).filter(Boolean))];
      const purchased = await getPurchasedEmails(admin, emails);
      // Auto-corrección: si compró, su carrito abierto queda como convertido
      // para que ninguna secuencia de abandono le vuelva a escribir.
      if (purchased.size) void markCartsConverted(admin, [...purchased]);

      const openCarts = new Map<string, number>();
      if (emails.length) {
        const { data: carts } = await admin
          .from("persistent_carts")
          .select("email, converted")
          .in("email", emails)
          .eq("converted", false);
        for (const c of (carts || []) as { email: string }[]) {
          openCarts.set((c.email || "").toLowerCase(), 0);
        }
        const { data: sends } = await admin
          .from("cart_reminder_sends")
          .select("email")
          .in("email", emails);
        for (const s of (sends || []) as { email: string }[]) {
          const k = (s.email || "").toLowerCase();
          if (openCarts.has(k)) openCarts.set(k, (openCarts.get(k) || 0) + 1);
        }
      }

      const top = [...byIp.values()]
        .map((x) => {
          const key = (x.email || "").toLowerCase();
          const status: "purchased" | "abandoned" | "browsing" | "anonymous" = !key
            ? "anonymous"
            : purchased.has(key)
              ? "purchased"
              : openCarts.has(key)
                ? "abandoned"
                : "browsing";

          return {
            ip: x.ip,
            count: x.count,
            last: x.last,
            slugs: [...x.slugs].slice(0, 5),
            sources: [...x.sources],
            referers: [...x.referers].slice(0, 3),
            ua: x.ua,
            country: x.country,
            city: x.city,
            email: x.email,
            status,
            reminders: cart?.emails_sent ?? 0,
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 100);
      const sources = [...bySource.entries()]
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count);
      const countries = [...byCountry.entries()]
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count);

      // Resumen real de las últimas 24 h (lo más importante para decidir).
      const summary = {
        visits: (data || []).length,
        visitors: byIp.size,
        with_email: top.filter((r) => !!r.email).length,
        without_email: top.filter((r) => !r.email).length,
        purchased: top.filter((r) => r.status === "purchased").length,
        abandoned: top.filter((r) => r.status === "abandoned").length,
        countries: countries.length,
        generated_at: new Date().toISOString(),
      };
      const leads = top
        .filter((r) => !!r.email)
        .map((r) => ({ email: r.email, country: r.country, city: r.city, status: r.status, last: r.last, slugs: r.slugs, reminders: r.reminders }));
      return json({ top, sources, countries, summary, leads, total: (data || []).length });

    }

    return json({ error: "unknown action" }, 400);
  } catch (err) {
    console.error("manage-checkout-abuse error", err);
    return json({ error: (err as Error).message }, 500);
  }
});
