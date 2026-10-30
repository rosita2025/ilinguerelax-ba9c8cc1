// Admin edge function: gestión de bans e historial del checkout gate.
// Acciones:
//   - list_bans:  bans activos + próximos a expirar
//   - list_hits:  últimos N hits (con filtros opcionales por ip)
//   - unban:      elimina un ban por ip
//   - stats:      totales por ip en las últimas 24 h

import { assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { registerTeamIp, loadExcludedIps } from "../_shared/teamIps.ts";
import { getPurchasedEmails, getClientSidePurchaseEmails, markCartsConverted } from "../_shared/purchasedEmails.ts";
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
      range?: string;
      tz_offset?: number;
      only_real?: boolean;
    };
    const action = body.action || "list_bans";
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Quien usa este panel es del equipo: su IP se guarda para no contarla como visita.
    void registerTeamIp(admin, req);

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

    if (action === "purge_team") {
      // Limpia lo ya guardado de las IPs del equipo: borra sus aperturas de checkout y marca como "no real"
      // sus eventos de funnels / visitas en vivo (así dejan de contarse).
      const ips = [...(await loadExcludedIps(admin))];
      if (!ips.length) return json({ ok: true, checkout_deleted: 0, funnel_marked: 0, ips: 0 });
      let checkoutDeleted = 0;
      let funnelMarked = 0;
      for (let i = 0; i < ips.length; i += 50) {
        const chunk = ips.slice(i, i + 50);
        const { count: c1 } = await admin.from("checkout_rate_hits").delete({ count: "exact" }).in("ip", chunk);
        checkoutDeleted += c1 ?? 0;
        const { count: c2 } = await admin
          .from("funnel_events")
          .update({ is_bot: true, bot_reason: "team_ip" }, { count: "exact" })
          .in("ip", chunk)
          .eq("is_bot", false);
        funnelMarked += c2 ?? 0;
      }
      return json({ ok: true, checkout_deleted: checkoutDeleted, funnel_marked: funnelMarked, ips: ips.length });
    }

    if (action === "delete_visitor") {
      // Borra de la lista las visitas de una IP en el rango pedido (pruebas propias, duplicados…).
      const ip = String(body.ip ?? "").trim();
      if (!ip) return json({ error: "missing ip" }, 400);
      const range = String(body.range ?? "24h");
      const tz = Number.isFinite(Number(body.tz_offset)) ? Math.max(-840, Math.min(840, Number(body.tz_offset))) : 0;
      const nowMs = Date.now();
      const startOfTodayMs = Math.floor((nowMs - tz * 60_000) / 86_400_000) * 86_400_000 + tz * 60_000;
      let sinceMs = nowMs - 24 * 3600 * 1000;
      let untilMs = nowMs + 60_000;
      if (range === "today") sinceMs = startOfTodayMs;
      else if (range === "yesterday") { sinceMs = startOfTodayMs - 86_400_000; untilMs = startOfTodayMs; }
      const { error, count } = await admin
        .from("checkout_rate_hits")
        .delete({ count: "exact" })
        .eq("ip", ip)
        .gte("created_at", new Date(sinceMs).toISOString())
        .lt("created_at", new Date(untilMs).toISOString());
      if (error) throw error;
      return json({ ok: true, deleted: count ?? 0 });
    }

    if (action === "unban") {
      if (!body.ip) return json({ error: "missing ip" }, 400);
      const { error } = await admin.from("checkout_ip_bans").delete().eq("ip", body.ip);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "stats") {
      // Rango: "today" (desde las 00:00 de hoy), "yesterday" (el día completo de ayer) o "24h" (por defecto).
      // El día se corta con la hora local del administrador (tz_offset = minutos, como Date.getTimezoneOffset()).
      const range = String(body.range ?? "24h");
      const tzOffsetMin = Number.isFinite(Number(body.tz_offset)) ? Math.max(-840, Math.min(840, Number(body.tz_offset))) : 0;
      const nowMs = Date.now();
      const localNow = nowMs - tzOffsetMin * 60_000;
      const startOfTodayMs = Math.floor(localNow / 86_400_000) * 86_400_000 + tzOffsetMin * 60_000;
      let sinceMs = nowMs - 24 * 3600 * 1000;
      let untilMs = nowMs + 60_000;
      if (range === "today") sinceMs = startOfTodayMs;
      else if (range === "yesterday") { sinceMs = startOfTodayMs - 86_400_000; untilMs = startOfTodayMs; }
      const since = new Date(sinceMs).toISOString();
      const until = new Date(untilMs).toISOString();
      const { data: rawData, error } = await admin
        .from("checkout_rate_hits")
        .select("ip, slug, created_at, source, referer, ua, country, email, city")
        .gte("created_at", since)
        .lt("created_at", until)
        .limit(5000);
      if (error) throw error;
      // Solo tráfico real (anuncios de Meta/TikTok, redes sociales y orgánico): se ocultan las visitas
      // "directas" sin origen y las que vienen de nuestro propio sitio (pruebas del equipo).
      const onlyReal = body.only_real !== false;
      const isRealSource = (src: string | null) => !!src && src !== "direct" && src !== "internal";
      // Las IPs del equipo (cualquier navegador o país desde el que se haya entrado al panel) nunca cuentan.
      const teamIps = await loadExcludedIps(admin);
      const notTeam = (rawData || []).filter((r) => !teamIps.has(String((r as { ip: string }).ip)));
      const data = onlyReal ? notTeam.filter((r) => isRealSource((r as { source: string | null }).source)) : notTeam;
      const hiddenVisits = (rawData || []).length - data.length;

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

      type Agg = { ip: string; count: number; first: string; last: string; slugs: Set<string>; sources: Set<string>; referers: Set<string>; ua: string | null; country: string | null; city: string | null; email: string | null };
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
        const cur = byIp.get(r.ip) || { ip: r.ip, count: 0, first: r.created_at, last: r.created_at, slugs: new Set(), sources: new Set(), referers: new Set(), ua: r.ua, country: r.country, city: r.city, email: r.email };

        cur.count += 1;
        if (r.created_at > cur.last) cur.last = r.created_at;
        if (r.created_at < cur.first) cur.first = r.created_at;
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
      // Señal informativa (NO fuente de verdad): navegador disparó "Purchase"
      // en funnel_events. Sirve para detectar falsos positivos — evento de
      // compra del navegador sin orden confirmada en la pasarela.
      const clientSidePurchase = await getClientSidePurchaseEmails(admin, emails);
      // Auto-corrección: si compró, su carrito abierto queda como convertido
      // para que ninguna secuencia de abandono le vuelva a escribir.
      if (purchased.size) void markCartsConverted(admin, [...purchased]);

      const openCarts = new Map<string, number>();
      // Datos del carrito abierto (nombre, teléfono, cuándo empezó y última actividad) para el seguimiento por WhatsApp.
      const cartInfo = new Map<string, { name: string; phone: string; started: string | null; last_activity: string | null; recover_url: string | null }>();
      if (emails.length) {
        const { data: carts } = await admin
          .from("persistent_carts")
          .select("email, converted, buyer, created_at, last_activity, cart_token")
          .in("email", emails)
          .eq("converted", false);
        for (const c of (carts || []) as { email: string; buyer: { name?: string; phone?: string } | null; created_at: string | null; last_activity: string | null; cart_token: string | null }[]) {
          const k = (c.email || "").toLowerCase();
          openCarts.set(k, 0);
          cartInfo.set(k, {
            name: String(c.buyer?.name || "").slice(0, 120),
            phone: String(c.buyer?.phone || "").slice(0, 40),
            started: c.created_at,
            last_activity: c.last_activity,
            recover_url: c.cart_token ? `https://ilinguerelax.com/recuperar-carrito?t=${encodeURIComponent(c.cart_token)}` : null,
          });
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

      // Último método de pago que el cliente pulsó (se guarda al elegirlo: Stripe, PayPal, Hotmart, Binance, Yape, dLocal…)
      // y proveedores con los que llegó a crear un pedido.
      const methodByEmail = new Map<string, string>();
      const providersByEmail = new Map<string, Set<string>>();
      if (emails.length) {
        const { data: contacts } = await admin
          .from("email_contacts")
          .select("email, metadata, updated_at")
          .in("email", emails)
          .eq("source", "abandoned_cart");
        for (const c of (contacts || []) as { email: string; metadata: { payment_method?: string } | null }[]) {
          const m = String(c.metadata?.payment_method ?? "").trim().toLowerCase();
          if (m) methodByEmail.set((c.email || "").toLowerCase(), m);
        }
        const { data: evs } = await admin
          .from("order_events")
          .select("customer_email, provider")
          .in("customer_email", emails)
          .gte("created_at", since)
          .limit(2000);
        for (const e of (evs || []) as { customer_email: string | null; provider: string | null }[]) {
          const k = (e.customer_email || "").toLowerCase();
          if (!k || !e.provider) continue;
          if (!providersByEmail.has(k)) providersByEmail.set(k, new Set());
          providersByEmail.get(k)!.add(String(e.provider).toLowerCase());
        }
      }

      // Clics en WhatsApp y popups (eventos "CheckoutAction" guardados por IP): para saber, sobre todo de quien
      // no llenó datos, qué hizo en lugar de pagar.
      const actionsByIp = new Map<string, Record<string, number>>();
      const allIps = [...byIp.keys()].filter((ip) => ip && ip !== "unknown");
      for (let i = 0; i < allIps.length; i += 100) {
        const { data: acts } = await admin
          .from("funnel_events")
          .select("ip, provider")
          .eq("event_name", "CheckoutAction")
          .eq("is_bot", false)
          .in("ip", allIps.slice(i, i + 100))
          .gte("created_at", since)
          .lt("created_at", until)
          .limit(2000);
        for (const a of (acts || []) as { ip: string; provider: string | null }[]) {
          const key = String(a.provider ?? "").split(":")[0];
          if (!key) continue;
          const cur = actionsByIp.get(a.ip) ?? {};
          cur[key] = (cur[key] ?? 0) + 1;
          actionsByIp.set(a.ip, cur);
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
            first: x.first,
            last: x.last,
            // Tiempo entre la primera y la última vez que abrió el checkout (24 h).
            duration_sec: Math.max(0, Math.round((new Date(x.last).getTime() - new Date(x.first).getTime()) / 1000)),
            cart: cartInfo.get(key) ?? null,
            payment_method: methodByEmail.get(key) ?? null,
            actions: actionsByIp.get(x.ip) ?? {},
            providers: [...(providersByEmail.get(key) ?? [])],
            slugs: [...x.slugs].slice(0, 5),
            sources: [...x.sources],
            referers: [...x.referers].slice(0, 3),
            ua: x.ua,
            country: x.country,
            city: x.city,
            email: x.email,
            status,
            // true = el navegador reportó "Purchase" pero NO hay orden
            // confirmada en la pasarela → posible pago fallido / falso positivo.
            client_purchase_event: !!key && clientSidePurchase.has(key) && status !== "purchased",
            reminders: openCarts.get(key) ?? 0,
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
      // Un correo = una fila. Antes salía una fila por IP, así que la misma
      // persona aparecía varias veces. Se queda la visita más reciente y el
      // estado más fuerte (compró > abandonó > navegó).
      const rank: Record<string, number> = { purchased: 3, abandoned: 2, browsing: 1, anonymous: 0 };
      // deno-lint-ignore no-explicit-any
      const leadMap = new Map<string, any>();
      for (const r of top) {
        if (!r.email) continue;
        const k = r.email.trim().toLowerCase();
        const row = { email: r.email, country: r.country, city: r.city, status: r.status, first: r.first, last: r.last, duration_sec: r.duration_sec, cart: r.cart, slugs: r.slugs, reminders: r.reminders, client_purchase_event: r.client_purchase_event };
        const prev = leadMap.get(k);
        if (!prev) { leadMap.set(k, row); continue; }
        const best = (rank[row.status] ?? 0) > (rank[prev.status] ?? 0) ? row.status : prev.status;
        const newer = String(row.last) > String(prev.last) ? row : prev;
        leadMap.set(k, { ...newer, status: best, first: String(row.first) < String(prev.first) ? row.first : prev.first, duration_sec: Math.max(row.duration_sec ?? 0, prev.duration_sec ?? 0), cart: row.cart ?? prev.cart, slugs: [...new Set([...(prev.slugs || []), ...(row.slugs || [])])].slice(0, 5) });
      }
      const leads = [...leadMap.values()].sort((a, b) => String(b.last).localeCompare(String(a.last)));
      const durations = top.filter((r) => r.count > 1 && r.duration_sec > 0).map((r) => r.duration_sec);
      (summary as Record<string, unknown>).avg_duration_sec = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
      summary.with_email = leads.length;
      summary.purchased = leads.filter((l) => l.status === "purchased").length;
      summary.abandoned = leads.filter((l) => l.status === "abandoned").length;
      return json({ top, sources, countries, summary, leads, total: (data || []).length, range, since, until, only_real: onlyReal, hidden_visits: hiddenVisits });

    }

    return json({ error: "unknown action" }, 400);
  } catch (err) {
    console.error("manage-checkout-abuse error", err);
    return json({ error: (err as Error).message }, 500);
  }
});
