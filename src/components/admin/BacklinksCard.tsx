import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2, ExternalLink, Loader2, RefreshCw, Globe, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BacklinksData {
  overview?: {
    ascore?: number;
    total?: number;
    domains_num?: number;
    urls_num?: number;
    ips_num?: number;
    follows_num?: number;
    nofollows_num?: number;
    texts_num?: number;
    images_num?: number;
  };
  refDomains?: Array<{
    domain?: string;
    domain_ascore?: number;
    backlinks_num?: number;
    country?: string;
    first_seen?: string;
    last_seen?: string;
  }>;
  backlinks?: Array<{
    page_ascore?: number;
    source_url?: string;
    source_title?: string;
    target_url?: string;
    anchor?: string;
    nofollow?: string;
    first_seen?: string;
  }>;
  anchors?: Array<{
    anchor?: string;
    domains_num?: number;
    backlinks_num?: number;
  }>;
  errors?: Record<string, string | undefined>;
}

const CACHE_KEY = "ilr_semrush_backlinks_v1";
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6h

const num = (v: any) => (v == null || v === "" ? "—" : Number(v).toLocaleString("es-ES"));
const short = (u?: string, n = 42) => (!u ? "—" : u.length > n ? u.slice(0, n) + "…" : u);

const BacklinksCard = () => {
  const [data, setData] = useState<BacklinksData | null>(null);
  const [loading, setLoading] = useState(false);
  const [cachedAt, setCachedAt] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.ts && Date.now() - parsed.ts < CACHE_TTL) {
          setData(parsed.data);
          setCachedAt(parsed.ts);
          return;
        }
      }
    } catch { /* ignore */ }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("semrush-backlinks", {
        body: { target: "ilinguerelax.com", target_type: "root_domain" },
      });
      if (error) throw error;
      setData(res as BacklinksData);
      const ts = Date.now();
      setCachedAt(ts);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts, data: res }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cargar backlinks");
    } finally {
      setLoading(false);
    }
  };

  const ov = data?.overview || {};
  const asBand = (s?: number) =>
    s == null ? "text-muted-foreground" :
    s >= 60 ? "text-green-600 dark:text-green-400" :
    s >= 40 ? "text-primary" :
    s >= 20 ? "text-amber-600 dark:text-amber-400" :
    "text-destructive";

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Link2 className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Backlinks (Semrush)</h2>
        {cachedAt && (
          <span className="text-[10px] text-muted-foreground ml-2">
            Actualizado {new Date(cachedAt).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
        <Button size="sm" variant="outline" className="ml-auto" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span className="ml-1">Actualizar</span>
        </Button>
      </div>

      {!data && loading && (
        <p className="text-sm text-muted-foreground italic">Sincronizando con Semrush…</p>
      )}

      {data && (
        <>
          {/* Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Shield className="w-3 h-3" /> Authority Score</p>
              <p className={`text-2xl font-bold ${asBand(ov.ascore)}`}>{ov.ascore ?? "—"}</p>
              <p className="text-[10px] text-muted-foreground">
                {ov.ascore == null ? "" : ov.ascore < 20 ? "Nuevo — sigue publicando" : ov.ascore < 40 ? "Creciendo" : "Sólido"}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Total backlinks</p>
              <p className="text-2xl font-bold">{num(ov.total)}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Dominios de referencia</p>
              <p className="text-2xl font-bold">{num(ov.domains_num)}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Follow / Nofollow</p>
              <p className="text-lg font-bold">
                <span className="text-green-600 dark:text-green-400">{num(ov.follows_num)}</span>
                <span className="text-muted-foreground text-sm"> / </span>
                <span className="text-muted-foreground">{num(ov.nofollows_num)}</span>
              </p>
            </div>
          </div>

          {/* Referring domains */}
          {data.refDomains && data.refDomains.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                <Globe className="w-4 h-4" /> Top dominios que te enlazan
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-muted-foreground border-b">
                    <tr>
                      <th className="py-2 pr-2">Dominio</th>
                      <th className="py-2 px-2 text-right">AS</th>
                      <th className="py-2 px-2 text-right">Backlinks</th>
                      <th className="py-2 px-2">País</th>
                      <th className="py-2 pl-2">Primer visto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.refDomains.map((r, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 pr-2">
                          <a href={`https://${r.domain}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary inline-flex items-center gap-1">
                            {r.domain} <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className={`py-2 px-2 text-right font-medium ${asBand(r.domain_ascore)}`}>{r.domain_ascore ?? "—"}</td>
                        <td className="py-2 px-2 text-right">{num(r.backlinks_num)}</td>
                        <td className="py-2 px-2 uppercase text-xs">{r.country || "—"}</td>
                        <td className="py-2 pl-2 text-xs text-muted-foreground">{r.first_seen ? new Date(r.first_seen).toLocaleDateString("es-ES") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Backlinks list */}
          {data.backlinks && data.backlinks.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Últimos backlinks descubiertos</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-muted-foreground border-b">
                    <tr>
                      <th className="py-2 pr-2">Página origen</th>
                      <th className="py-2 px-2">Anchor</th>
                      <th className="py-2 px-2">Destino</th>
                      <th className="py-2 px-2 text-right">AS</th>
                      <th className="py-2 pl-2 text-center">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.backlinks.map((b, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 pr-2 max-w-[280px] truncate" title={b.source_title || b.source_url}>
                          <a href={b.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary inline-flex items-center gap-1">
                            {short(b.source_title || b.source_url, 40)} <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </td>
                        <td className="py-2 px-2 max-w-[160px] truncate text-xs" title={b.anchor}>{b.anchor || "—"}</td>
                        <td className="py-2 px-2 max-w-[200px] truncate text-xs text-muted-foreground" title={b.target_url}>{short(b.target_url, 30)}</td>
                        <td className={`py-2 px-2 text-right font-medium ${asBand(b.page_ascore)}`}>{b.page_ascore ?? "—"}</td>
                        <td className="py-2 pl-2 text-center text-xs">
                          {String(b.nofollow) === "true"
                            ? <span className="text-muted-foreground">nofollow</span>
                            : <span className="text-green-600 dark:text-green-400">follow</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Anchors */}
          {data.anchors && data.anchors.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Textos de anchor más usados</h3>
              <div className="flex flex-wrap gap-2">
                {data.anchors.slice(0, 12).map((a, i) => (
                  <div key={i} className="px-2 py-1 bg-muted/40 rounded text-xs">
                    <span className="font-medium">{a.anchor || "(vacío)"}</span>
                    <span className="text-muted-foreground ml-1">· {num(a.backlinks_num)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.errors && Object.values(data.errors).some(Boolean) && (
            <p className="text-xs text-destructive">
              Algunas consultas fallaron (posible cuota Semrush agotada). Revisa {Object.entries(data.errors).filter(([, v]) => v).map(([k]) => k).join(", ")}.
            </p>
          )}

          {(!data.refDomains?.length && !data.backlinks?.length) && (
            <p className="text-sm text-muted-foreground">
              Aún no hay backlinks visibles en Semrush para <code>ilinguerelax.com</code>. Los backlinks aparecen a medida que otros sitios te enlazan (comparte tus posts en redes sociales, foros, invitados, etc.).
            </p>
          )}
        </>
      )}
    </Card>
  );
};

export default BacklinksCard;
