import { createClient } from "npm:@supabase/supabase-js@2";
import { SignJWT } from "npm:jose@5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const JWT_SECRET = new TextEncoder().encode(
  Deno.env.get("COREANO_ACCESS_JWT_SECRET") ?? "",
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { email, transaction_code } = await req.json();
    if (!email || !transaction_code) {
      return json({ error: "email y transaction_code requeridos" }, 400);
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanCode = String(transaction_code).trim();

    const { data, error } = await supabase
      .from("hotmart_purchases")
      .select("email, transaction_code, purchased_at, refund_deadline, status")
      .eq("transaction_code", cleanCode)
      .maybeSingle();

    if (error) throw error;
    if (!data || data.email.toLowerCase() !== cleanEmail) {
      return json({ status: "not_found" }, 200);
    }
    if (data.status !== "approved") {
      return json({ status: data.status }, 200);
    }

    const now = Date.now();
    const deadline = new Date(data.refund_deadline).getTime();
    const isPreview = now < deadline;
    const accessStatus = isPreview ? "preview_only" : "full_access";

    const token = await new SignJWT({
      email: cleanEmail,
      tx: cleanCode,
      access: accessStatus,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30m")
      .sign(JWT_SECRET);

    return json({
      status: accessStatus,
      token,
      purchased_at: data.purchased_at,
      refund_deadline: data.refund_deadline,
      email: cleanEmail,
    });
  } catch (err) {
    console.error("verify-coreano-access error", err);
    return json({ error: String(err) }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
