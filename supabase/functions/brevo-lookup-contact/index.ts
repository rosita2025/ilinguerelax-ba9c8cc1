import { adminCorsHeaders, assertAdminCsrf } from "../_shared/adminCsrf.ts";

const corsHeaders = adminCorsHeaders;
const GATEWAY_URL = "https://connector-gateway.lovable.dev/brevo";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const { adminKey, email } = await req.json().catch(() => ({}));
    const expected = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expected || adminKey !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const brevoKey = Deno.env.get("BREVO_API_KEY");
    if (!lovableKey || !brevoKey) {
      return new Response(JSON.stringify({ error: "Brevo connection not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(`${GATEWAY_URL}/contacts/${encodeURIComponent(email.trim().toLowerCase())}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": brevoKey,
        "Accept": "application/json",
      },
    });

    const bodyText = await res.text();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Brevo lookup failed", status: res.status, details: bodyText }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let contact: any = null;
    try { contact = JSON.parse(bodyText); } catch { contact = null; }

    const attrs = contact?.attributes ?? {};
    const missing: string[] = [];
    if (!contact?.smsBlacklisted && !attrs.SMS && !attrs.PHONE && !attrs.WHATSAPP && attrs.PHONE_PROVIDED !== true) missing.push("teléfono");
    if (!attrs.COUNTRY_CODE && !attrs.PAIS_CODE && !attrs.COUNTRY) missing.push("país");
    if (!attrs.NOMBRE && !attrs.FIRSTNAME) missing.push("nombre");
    if (!attrs.APELLIDOS && !attrs.LASTNAME) missing.push("apellidos");

    return new Response(JSON.stringify({
      id: contact?.id ?? null,
      email: contact?.email ?? email,
      created_at: contact?.createdAt ?? null,
      modified_at: contact?.modifiedAt ?? null,
      list_ids: contact?.listIds ?? [],
      attributes: attrs,
      missing_fields: missing,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
