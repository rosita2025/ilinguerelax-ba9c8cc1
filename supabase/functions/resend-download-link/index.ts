// Reenvía al correo del pedido el enlace /mi-descarga (nunca a un correo nuevo).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { dlCors, dlJson, TOKEN_RE, maskEmail } from "../_shared/downloadToken.ts";

const COOLDOWN_MS = 2 * 60 * 1000;

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
      return dlJson({ status: "cooldown", emailMasked: maskEmail(row.email) }, 429);
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

    return dlJson({ status: "sent", emailMasked: maskEmail(row.email) });
  } catch (e) {
    console.error("[resend-download-link]", e);
    return dlJson({ error: "Error interno" }, 500);
  }
});
