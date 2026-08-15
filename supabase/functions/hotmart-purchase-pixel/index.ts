import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Facebook Conversions API config
const FB_PIXEL_ID = "24959578143733255";
const FB_API_VERSION = "v21.0";

// Map Hotmart product names to internal tracking data
function mapHotmartProduct(productName: string): {
  id: string;
  name: string;
  category: string;
  value: number;
} | null {
  const lower = productName.toLowerCase();

  // Main products
  if (lower.includes("5,000") || lower.includes("5.000") || lower.includes("5000")) {
    if (lower.includes("adicional") || lower.includes("3,000") || lower.includes("3.000") || lower.includes("8,000") || lower.includes("8.000") || lower.includes("completa")) {
      return {
        id: "product-8000",
        name: "Inglés Relax - 8,000 Palabras (Upsell 3,000 Adicionales)",
        category: "Digital Book",
        value: 10,
      };
    }
    if (lower.includes("spanish") || lower.includes("español para")) {
      return {
        id: "product-spanish-5000",
        name: "Spanish Relax - 5,000 Words",
        category: "Digital Book",
        value: 12,
      };
    }
    return {
      id: "product-5000",
      name: "Inglés Relax - 5,000 Palabras",
      category: "Digital Book",
      value: 12,
    };
  }

  if (lower.includes("8,000") || lower.includes("8.000") || lower.includes("8000")) {
    return {
      id: "product-8000",
      name: "Inglés Relax - 8,000 Palabras",
      category: "Digital Book",
      value: 22,
    };
  }

  if (lower.includes("1,000") || lower.includes("1.000") || lower.includes("1000")) {
    if (lower.includes("verbo") || lower.includes("verb")) {
      return {
        id: "product-1000-verbos",
        name: "Inglés Relax - 1,000 Verbos Esenciales",
        category: "Digital Book",
        value: 12,
      };
    }
    // 1,000 free
    return {
      id: "product-1000-free",
      name: "Inglés Relax - 1,000 Palabras Gratis",
      category: "Digital Book",
      value: 0,
    };
  }

  if (lower.includes("500") && (lower.includes("pregunta") || lower.includes("question"))) {
    return {
      id: "product-500-preguntas",
      name: "Inglés Relax - 500 Preguntas en Inglés",
      category: "Digital Book",
      value: 7,
    };
  }

  if (lower.includes("coreano") || lower.includes("korean") || lower.includes("hangul")) {
    return {
      id: "product-coreano-100-mapas",
      name: "Coreano Sin Complicaciones - 100 Mapas Mentales",
      category: "Digital Book",
      value: 10,
    };
  }

  if (lower.includes("patrones")) {
    return {
      id: "patrones-especiales",
      name: "Patrones Especiales, Alfabeto y Combinaciones Secretas en Inglés",
      category: "Digital Book",
      value: 8.08,
    };
  }

  if (lower.includes("estructura") || lower.includes("grammar")) {
    return {
      id: "product-estructuras-gramaticales",
      name: "Estructuras Gramaticales de Inglés A1-C1",
      category: "Digital Book",
      value: 12,
    };
  }

  // Fallback - try to extract from name
  console.warn(`Unknown Hotmart product: "${productName}"`);
  return null;
}

// Send Purchase event to Facebook Conversions API
async function sendFacebookPurchaseEvent(
  accessToken: string,
  product: { id: string; name: string; category: string; value: number },
  buyerEmail: string,
  buyerName: string,
  sourceUrl: string,
  clientIpAddress?: string,
  clientUserAgent?: string,
) {
  const eventTime = Math.floor(Date.now() / 1000);
  const eventId = `hotmart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Hash email for matching (SHA256)
  const emailHash = await sha256(buyerEmail.toLowerCase().trim());

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: eventTime,
        event_id: eventId,
        event_source_url: sourceUrl,
        action_source: "website",
        user_data: {
          em: [emailHash],
          client_ip_address: clientIpAddress || undefined,
          client_user_agent: clientUserAgent || undefined,
        },
        custom_data: {
          content_name: product.name,
          content_category: product.category,
          content_ids: [product.id],
          content_type: "product",
          value: product.value,
          currency: "USD",
          num_items: 1,
        },
      },
    ],
  };

  const url = `https://graph.facebook.com/${FB_API_VERSION}/${FB_PIXEL_ID}/events?access_token=${accessToken}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error(`Facebook CAPI error for ${product.name}:`, JSON.stringify(result));
    throw new Error(`Facebook CAPI error: ${JSON.stringify(result)}`);
  }

  console.log(`✅ Facebook CAPI Purchase sent: ${product.name} ($${product.value}) - Event ID: ${eventId}`);
  return result;
}

// SHA256 hash helper
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("FB_CONVERSIONS_API_TOKEN");
    if (!accessToken) {
      console.error("FB_CONVERSIONS_API_TOKEN not configured");
      return new Response(
        JSON.stringify({ error: "Facebook token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const body = await req.json();

    // Verify Hotmart webhook token (set HOTMART_WEBHOOK_TOKEN secret and match in Hotmart panel)
    const expectedToken = Deno.env.get("HOTMART_WEBHOOK_TOKEN");
    const receivedToken =
      body.hottok ||
      body.data?.hottok ||
      url.searchParams.get("hottok") ||
      req.headers.get("x-hotmart-hottok");
    if (!expectedToken || receivedToken !== expectedToken) {
      console.warn("Unauthorized Hotmart webhook (invalid or missing hottok)");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Hotmart Purchase webhook received:", JSON.stringify(body));

    // Extract event type - Hotmart webhook format
    const event = body.event || body.data?.event || "";
    
    // Map Hotmart statuses to unified status
    const isApproved = event.includes("PURCHASE_APPROVED") || event.includes("PURCHASE_COMPLETE");
    const isRefunded = event.includes("PURCHASE_REFUNDED");
    const isChargeback = event.includes("PURCHASE_CHARGEBACK");
    const isRefused = event.includes("PURCHASE_REFUSED") || event.includes("PURCHASE_REJECTED");
    const isPending = event.includes("PURCHASE_BILLET_PRINTED") || event.includes("PURCHASE_WAITING_PAYMENT");
    const isCancelled = event.includes("PURCHASE_CANCELED") || event.includes("PURCHASE_EXPIRED");

    // Unified status for admin panel
    const mappedStatus = isApproved ? "approved" :
                         isRefunded ? "refunded" :
                         isChargeback ? "chargeback" :
                         isRefused ? "refused" :
                         isPending ? "pending" :
                         isCancelled ? "cancelled" : "unknown";
    
    // We process everything for the admin panel sync, but only send CAPI for approved purchases
    if (!isApproved) {
      console.log(`Processing non-purchase event for sync: ${event}`);
    }

    // Extract buyer info (Hotmart webhook format)
    const buyerEmail =
      body.data?.buyer?.email || body.buyer?.email || body.email || "";
    const buyerName =
      body.data?.buyer?.name || body.buyer?.name || body.name || "Cliente";
    const productName =
      body.data?.product?.name || body.product?.name || body.prod_name || "";
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "";
    const userAgent = req.headers.get("user-agent") || "";
    const transactionCode = body.data?.purchase?.transaction || body.purchase?.transaction || body.transaction || `hotmart_${Date.now()}`;

    if (!productName) {
      console.error("No product name found in Hotmart webhook:", JSON.stringify(body));
      return new Response(
        JSON.stringify({ error: "No product name found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map to internal product
    const product = mapHotmartProduct(productName);
    if (!product) {
      console.warn(`Could not map product: "${productName}" - skipping CAPI event`);
      return new Response(
        JSON.stringify({ success: true, message: `Unknown product: ${productName}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Skip free products
    if (product.value === 0) {
      console.log(`Skipping free product: ${product.name}`);
      return new Response(
        JSON.stringify({ success: true, message: "Free product - no Purchase event" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only send Purchase event to Facebook CAPI if approved
    let facebookResult = null;
    if (isApproved) {
      const sourceUrl = "https://ilinguerelax.com/hotmart-success";
      facebookResult = await sendFacebookPurchaseEvent(
        accessToken,
        product,
        buyerEmail,
        buyerName,
        sourceUrl,
        clientIp,
        userAgent,
      );
    }

    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const meta = {
        provider: "hotmart",
        event_type: event || "purchase",
        status: mappedStatus,
        transaction: transactionCode,
        email: buyerEmail,
        name: buyerName,
        product_name: productName,
        hottok: receivedToken,
      };

      await supabase.from("funnel_events").insert({
        event_name: isApproved ? "Purchase" : `hotmart_${mappedStatus}`,
        product_id: product.id,
        value: product.value,
        currency: "USD",
        session_id: transactionCode || body.data?.purchase?.transaction || body.purchase?.transaction || body.transaction,
        page_path: "/hotmart-success",
        country: body.data?.buyer?.address?.country || body.buyer?.address?.country || null,
        provider: "hotmart",
        email: buyerEmail,
        name: buyerName,
        referrer: JSON.stringify(meta).slice(0, 2000),
        event_data: meta
      });
    } catch (trackingError) {
      console.error("funnel purchase tracking error:", trackingError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        product: product.name,
        value: product.value,
        status: mappedStatus,
        facebook_response: facebookResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Webhook error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
