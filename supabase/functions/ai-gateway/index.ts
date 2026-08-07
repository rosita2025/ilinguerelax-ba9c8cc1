import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { assertAdminCsrf, withAdminLogging, adminCorsHeaders } from "../_shared/adminCsrf.ts";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const handler = async (req: Request): Promise<Response> => {
  // CORS check is handled by serve / OPTIONS block if needed, 
  // but withAdminLogging + assertAdminCsrf handles it too.

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const body = await req.json().catch(() => ({}));
    const { action, messages, model = "google/gemini-2.0-flash", adminKey } = body;

    const expected = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expected || adminKey !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action !== "chat") {
      return new Response(JSON.stringify({ error: "Unsupported action" }), {
        status: 400,
        headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500,
        headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiRes = await fetch(AI_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit de IA. Reintenta en 1 min." }), {
        status: 429,
        headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos IA agotados." }), {
        status: 402,
        headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      return new Response(JSON.stringify({ error: `AI error: ${t.slice(0, 300)}` }), {
        status: 500,
        headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await aiRes.json();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...adminCorsHeaders, "Content-Type": "application/json" } },
    );
  }
};

serve(withAdminLogging("ai-gateway", handler));
