// Reenvía al correo del pedido el enlace /mi-descarga (nunca a un correo nuevo).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { dlCors, dlJson, TOKEN_RE, maskEmail } from "../_shared/downloadToken.ts";

const COOLDOWN_MS = 2 * 60 * 1000;
// Límites de reenvío
const TOKEN_DAILY_LIMIT = 3; // por token, últimas 24 h
const TOKEN_TOTAL_LIMIT = 10; // por token, histórico
const ORDER_DAILY_LIMIT = 5; // por pedido (todos sus tokens), últimas 24 h

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: dlCors });
  if (req.method !== "POST") return dlJson({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const token = String(body?.token ?? "").trim();
    if (!TOKEN_RE.test(token)) return dlJson({ status: "invalid" }, 403);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: row } = await admin
      .from("download_tokens")
      .select("id, token, order_number, email, revoked, expires_at, last_sent_at")
      .eq("token", token)
      .maybeSingle();

    if (!row || row.revoked) return dlJson({ status: "invalid" }, 403);
    if (new Date(row.expires_at).getTime() < Date.now()) return dlJson({ status: "expired" }, 403);

    if (row.last_sent_at && Date.now() - new Date(row.last_sent_at).getTime() < COOLDOWN_MS) {
      const waitMin = Math.max(
        1,
        Math.ceil((COOLDOWN_MS - (Date.now() - new Date(row.last_sent_at).getTime())) / 60000),
      );
      return dlJson(
        {
          status: "cooldown",
          emailMasked: maskEmail(row.email),
          retryInMinutes: waitMin,
          error: `Espera ${waitMin} minuto(s) antes de pedir otro reenvío.`,
        },
        429,
      );
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Límite por token (24 h y total)
    const [{ count: tokenDay }, { count: tokenTotal }] = await Promise.all([
      admin
        .from("download_token_access")
        .select("id", { count: "exact", head: true })
        .eq("token_id", row.id)
        .eq("action", "resend")
        .gte("created_at", since),
      admin
        .from("download_token_access")
        .select("id", { count: "exact", head: true })
        .eq("token_id", row.id)
        .eq("action", "resend"),
    ]);

    if ((tokenDay ?? 0) >= TOKEN_DAILY_LIMIT) {
      return dlJson(
        {
          status: "limit_daily",
          scope: "token",
          limit: TOKEN_DAILY_LIMIT,
          emailMasked: maskEmail(row.email),
          error: `Alcanzaste el máximo de ${TOKEN_DAILY_LIMIT} reenvíos en 24 horas para este enlace. Vuelve a intentarlo mañana o escríbenos a hola@ilinguerelax.com.`,
        },
        429,
      );
    }

    if ((tokenTotal ?? 0) >= TOKEN_TOTAL_LIMIT) {
      return dlJson(
        {
          status: "limit_total",
          scope: "token",
          limit: TOKEN_TOTAL_LIMIT,
          emailMasked: maskEmail(row.email),
          error: `Este enlace ya se reenvió ${TOKEN_TOTAL_LIMIT} veces (máximo permitido). Escríbenos a hola@ilinguerelax.com y te ayudamos.`,
        },
        429,
      );
    }

    // Límite por pedido: suma de reenvíos de todos los tokens del mismo pedido
    const { data: orderTokens } = await admin
      .from("download_tokens")
      .select("id")
      .eq("order_number", row.order_number);
    const orderTokenIds = (orderTokens ?? []).map((t: { id: string }) => t.id);

    if (orderTokenIds.length > 0) {
      const { count: orderDay } = await admin
        .from("download_token_access")
        .select("id", { count: "exact", head: true })
        .in("token_id", orderTokenIds)
        .eq("action", "resend")
        .gte("created_at", since);

      if ((orderDay ?? 0) >= ORDER_DAILY_LIMIT) {
        return dlJson(
          {
            status: "limit_order",
            scope: "order",
            limit: ORDER_DAILY_LIMIT,
            emailMasked: maskEmail(row.email),
            error: `Este pedido alcanzó el máximo de ${ORDER_DAILY_LIMIT} reenvíos en 24 horas. Intenta mañana o escríbenos a hola@ilinguerelax.com.`,
          },
          429,
        );
      }
    }

    // El reenvío real reutiliza la entrega digital ya verificada del pedido.
    const { error } = await admin.functions.invoke("request-digital-resend", {
      body: { orderId: row.order_number, email: row.email },
    });
    if (error) {
      console.error("[resend-download-link] resend failed", error);
      return dlJson({ error: "No se pudo reenviar" }, 500);
    }

    await admin
      .from("download_tokens")
      .update({ last_sent_at: new Date().toISOString() })
      .eq("id", row.id);
    await admin.from("download_token_access").insert({
      token_id: row.id,
      action: "resend",
      ip: req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null,
      user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
    });

    const remainingToday = Math.max(0, TOKEN_DAILY_LIMIT - ((tokenDay ?? 0) + 1));
    return dlJson({
      status: "sent",
      emailMasked: maskEmail(row.email),
      remainingToday,
    });
  } catch (e) {
    console.error("[resend-download-link]", e);
    return dlJson({ error: "Error interno" }, 500);
  }
});
