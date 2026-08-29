import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase().slice(0, 200);
    const name = String(body.name || "").trim().slice(0, 120);
    const source = String(body.source || "checkout-prueba-1").trim().slice(0, 60);
    const productType = body.product_type ? String(body.product_type).slice(0, 120) : null;
    const language = body.language ? String(body.language).slice(0, 10) : null;
    const metadata = body.metadata && typeof body.metadata === "object" ? body.metadata : {};

    if (!EMAIL_RE.test(email)) return json({ error: "invalid_email" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await supabase
      .from("email_contacts")
      .upsert(
        { email, name: name || null, source, product_type: productType, language, metadata },
        { onConflict: "email,source" },
      );

    if (error) {
      console.error("[capture-email-contact] upsert failed", error);
      return json({ error: error.message }, 500);
    }

    return json({ ok: true });
  } catch (e) {
    console.error("[capture-email-contact]", e);
    return json({ error: e instanceof Error ? e.message : "Error" }, 500);
  }
});
