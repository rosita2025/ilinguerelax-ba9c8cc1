import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { assertInternalCall } from "../_shared/internalAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const mapProductType = (productName: string): string => {
  const name = productName.toLowerCase();
  if (name.includes("5,000 palabras") || name.includes("5000 palabras")) return "english";
  if (name.includes("8,000") || name.includes("8000")) return "english-8000";
  if (name.includes("verbos")) return "1000-verbos";
  if (name.includes("500 preguntas") || name.includes("500preguntas")) return "500-preguntas";
  if (name.includes("spanish")) return "spanish";
  return "english";
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const __blocked = await assertInternalCall(req);
  if (__blocked) return __blocked;

  try {
    const body = await req.json();
    
    let customerEmail: string;
    let customerName: string;
    let productType: string;
    let displayName: string;

    // Handle both direct API calls and Hotmart webhook format
    if (body.buyer && body.product) {
      customerEmail = body.buyer.email;
      customerName = body.buyer.name || "Estudiante";
      displayName = body.product.name || "Inglés Relax";
      productType = mapProductType(displayName);
    } else {
      customerEmail = body.customerEmail;
      customerName = body.customerName || "Estudiante";
      displayName = body.productName || "Inglés Relax";
      productType = body.productType || "english";
    }

    if (!customerEmail) {
      return new Response(JSON.stringify({ error: "customerEmail or buyer.email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if invitation already exists for this email + product
    const { data: existing } = await supabaseAdmin
      .from("review_invitations")
      .select("id")
      .eq("customer_email", customerEmail)
      .eq("product_type", productType)
      .maybeSingle();

    if (existing) {
      console.log("Review invitation already exists for", customerEmail, productType);
      return new Response(
        JSON.stringify({ success: true, message: "Invitation already exists" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create new invitation - first email will be sent after 1 day
    const { error } = await supabaseAdmin
      .from("review_invitations")
      .insert({
        customer_email: customerEmail,
        customer_name: customerName,
        product_type: productType,
        product_name: displayName,
        emails_sent: 0,
        next_email_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day
      });

    if (error) throw error;

    console.log("Review invitation created for", customerEmail, "product:", productType);

    return new Response(
      JSON.stringify({ success: true, message: "Review invitation scheduled" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error creating review invitation:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
