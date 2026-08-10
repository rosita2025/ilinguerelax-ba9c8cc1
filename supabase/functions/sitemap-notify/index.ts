/**
 * Sitemap notifier: re-envía TODOS los sitemaps a Google Search Console y
 * hace IndexNow de cada producto activo. Uso desde /admin/seo.
 *
 * Sin adminKey requerido: es idempotente y solo notifica motores; nunca
 * modifica datos. Ratelimit natural: GSC rechaza pings muy frecuentes.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-csrf, x-admin-2fa", "Access-Control-Allow-Methods": "POST, OPTIONS" };
import { pingIndexNow, pingSitemap, productUrl } from "../_shared/indexnow.ts";
import { resubmitSitemapsGSC, inspectUrlGSC } from "../_shared/gsc.ts";
import { notifyGoogleIndexing } from "../_shared/googleIndexing.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const body = await req.json().catch(() => ({}));
    const singleSku: string | undefined = body?.sku;
    const action: string | undefined = body?.action;

    // Modo probe: solo devuelve slugs del sitemap publicado (evita CORS del navegador).
    if (action === "probe") {
      const sitemapUrl = "https://ilinguerelax.com/sitemaps/sitemap-products-1.xml";
      const xml = await fetch(sitemapUrl, { cache: "no-store" }).then((r) => r.text());
      const slugs = Array.from(xml.matchAll(/<loc>[^<]*\/products\/([^<]+)<\/loc>/g)).map(
        (m) => m[1],
      );
      return new Response(
        JSON.stringify({ ok: true, slugs, count: slugs.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

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
    // Limiting concurrent pings and using AbortSignal timeouts (inside helpers) 
    // to stay within the 60s Edge Function limit.
    await Promise.allSettled([
      pingIndexNow(urls),
      notifyGoogleIndexing(urls, "URL_UPDATED"),
      pingSitemap(),
      resubmitSitemapsGSC(),
      // Inspections are slow; we only do a few per batch.
      ...urls.slice(0, 3).map((u) => inspectUrlGSC(u)),
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
