import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, ExternalLink, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Panel de salud del sitemap:
 *  - Compara el sitemap estático publicado con los productos activos en la BD.
 *  - Los productos creados en /admin/productos aparecen en el sitemap estático
 *    solamente en el siguiente deploy. Este panel avisa cuáles están pendientes
 *    y permite notificarlos manualmente a Google/IndexNow ya mismo.
 */
const SITEMAP_URL = "https://ilinguerelax.com/sitemaps/sitemap-products-1.xml";

const SitemapHealthCard = () => {
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);
  const [sitemapSlugs, setSitemapSlugs] = useState<Set<string>>(new Set());
  const [dbSlugs, setDbSlugs] = useState<{ sku: string; name: string; updated_at: string }[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [xml, dbRes] = await Promise.all([
        fetch(SITEMAP_URL, { cache: "no-store" }).then((r) => r.text()),
        supabase
          .from("digital_products")
          .select("sku,name,updated_at")
          .eq("active", true)
          .order("updated_at", { ascending: false }),
      ]);
      const matches = Array.from(xml.matchAll(/<loc>[^<]*\/products\/([^<]+)<\/loc>/g)).map(
        (m) => m[1],
      );
      setSitemapSlugs(new Set(matches));
      setDbSlugs((dbRes.data ?? []) as { sku: string; name: string; updated_at: string }[]);
    } catch (e) {
      setFetchError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const missing = dbSlugs.filter((p) => !sitemapSlugs.has(p.sku));
  const included = dbSlugs.length - missing.length;

  const notifyAll = async (sku?: string) => {
    setNotifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("sitemap-notify", {
        body: sku ? { sku } : {},
      });
      if (error) throw error;
      toast.success(
        sku
          ? `Producto notificado a Google + IndexNow`
          : `${data?.notified ?? "?"} productos notificados a Google + IndexNow`,
      );
    } catch (e) {
      toast.error(`Error al notificar: ${(e as Error).message}`);
    } finally {
      setNotifying(false);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="font-semibold text-lg flex items-center gap-2">
            {missing.length === 0 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            )}
            Estado del sitemap
          </h2>
          <p className="text-xs text-muted-foreground">
            {loading
              ? "Comprobando…"
              : fetchError
              ? `Error: ${fetchError}`
              : `${included}/${dbSlugs.length} productos activos incluidos · ${sitemapSlugs.size} URLs totales en /sitemaps/sitemap-products-1.xml`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button size="sm" variant="outline" onClick={load} disabled={loading} className="flex-1 sm:flex-none">
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Revisar
          </Button>
          <Button size="sm" onClick={() => notifyAll()} disabled={notifying || loading} className="flex-1 sm:flex-none whitespace-normal text-xs sm:text-sm h-auto py-1.5">
            {notifying ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin shrink-0" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-1 shrink-0" />
            )}
            <span className="sm:hidden">Notificar Google + IndexNow</span>
            <span className="hidden sm:inline">Notificar a Google + IndexNow</span>
          </Button>
          <a
            href={SITEMAP_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline w-full sm:w-auto justify-center sm:justify-start"
          >
            Ver sitemap <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {missing.length > 0 && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 space-y-2">
          <div className="text-sm font-medium text-amber-700 dark:text-amber-400">
            ⚠️ {missing.length} producto(s) aún no aparecen en el sitemap estático
          </div>
          <p className="text-xs text-muted-foreground">
            El sitemap estático se regenera en cada deploy. Estos productos ya son notificados
            individualmente vía IndexNow al guardar, pero puedes forzar el aviso a Google aquí.
            Aparecerán en el sitemap público tras el próximo publish del proyecto.
          </p>
          <ul className="space-y-1">
            {missing.map((p) => (
              <li key={p.sku} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground truncate">/products/{p.sku}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-xs">
                    {new Date(p.updated_at).toLocaleDateString()}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => notifyAll(p.sku)}
                    disabled={notifying}
                  >
                    Notificar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};

export default SitemapHealthCard;
