// Generate SEO-optimized blog post using Lovable AI Gateway and store it in
// generated_blog_posts. Admin-only. La lógica vive en _shared/blogGenerator.ts
// para que la cola programada (process-blog-queue) use exactamente el mismo motor.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { assertAdminCsrf } from "../_shared/adminCsrf.ts";
import { BlogGenError, generateAndStorePost } from "../_shared/blogGenerator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const csrfBlock = await assertAdminCsrf(req);
  if (csrfBlock) return csrfBlock;

  try {
    const body = await req.json().catch(() => ({}));
    const {
      adminKey,
      topic,
      keyword,
      category = "Aprendizaje",
      language = "es",
      publish = false,
      relatedProducts = [],
      productCards = [],
    } = body as {
      adminKey?: string;
      topic?: string;
      keyword?: string;
      category?: string;
      language?: string;
      publish?: boolean;
      relatedProducts?: string[];
      productCards?: Array<{ id: string; title: string; slug: string; description?: string }>;
    };

    const expected = Deno.env.get("ADMIN_REVIEW_KEY");
    if (!expected || adminKey !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const post = await generateAndStorePost({
      topic: topic ?? "",
      keyword,
      category,
      language,
      publish,
      relatedProducts,
      productCards,
    });

    return new Response(JSON.stringify({ post }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-blog-post error:", err);
    const status = err instanceof BlogGenError ? err.status : 500;
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
