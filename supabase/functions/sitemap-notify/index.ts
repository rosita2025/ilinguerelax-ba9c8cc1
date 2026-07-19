/**
 * Sitemap notifier: re-envía TODOS los sitemaps a Google Search Console y
 * hace IndexNow de cada producto activo. Uso desde /admin/seo.
 *
 * Sin adminKey requerido: es idempotente y solo notifica motores; nunca
 * modifica datos. Ratelimit natural: GSC rechaza pings muy frecuentes.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { pingIndexNow, pingSitemap, productUrl } from "../_shared/indexnow.ts";
import { resubmitSitemapsGSC, inspectUrlGSC } from "../_shared/gsc.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const body = await req.json().catch(() => ({}));
    const singleSku: string | undefined = body?.sku;

    let skus: string[] = [];
    if (singleSku) {
      skus = [singleSku];
    } else {
      const { data } = await supabase
        .from("digital_products")
        .select("sku")
        .eq("active", true);
      skus = (data ?? []).map((r: { sku: string }) => r.sku).filter(Boolean);
    }

    const urls = skus.map(productUrl);
    await Promise.allSettled([
      pingIndexNow(urls),
      pingSitemap(),
      resubmitSitemapsGSC(),
      ...urls.slice(0, 5).map((u) => inspectUrlGSC(u)),
    ]);

    return new Response(
      JSON.stringify({ ok: true, notified: urls.length, sample: urls.slice(0, 5) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
