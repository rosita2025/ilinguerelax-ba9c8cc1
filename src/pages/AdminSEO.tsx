import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Loader2, Search, FileText, ExternalLink, TrendingUp, Link2, Sparkles, Target, RefreshCw, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";
import { products } from "@/data/products";
import SitemapHealthCard from "@/components/admin/SitemapHealthCard";


interface GscRow {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface GscReport {
  days: number;
  site: string;
  queries: GscRow[];
  pages: GscRow[];
}

interface SemrushReport {
  domain: string;
  database: string;
  overview: Record<string, any> | null;
  organic: Record<string, any>[] | { error: string };
  backlinks: Record<string, any> | null;
  error?: string;
  notConnected?: boolean;
}

const PRESETS: { label: string; days: number }[] = [
  { label: "Hoy", days: 1 },
  { label: "7 días", days: 7 },
  { label: "15 días", days: 15 },
  { label: "28 días", days: 28 },
  { label: "2 meses", days: 60 },
  { label: "3 meses", days: 90 },
  { label: "6 meses", days: 180 },
  { label: "1 año", days: 365 },
];

const AdminSEO = () => {
  const { adminKey } = useAdminKey();
  const [days, setDays] = useState(28);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<GscReport | null>(null);
  const [semrush, setSemrush] = useState<SemrushReport | null>(null);
  const [smLoading, setSmLoading] = useState(false);

  // Blog generator state
  const [genTopic, setGenTopic] = useState("");
  const [genKeyword, setGenKeyword] = useState("");
  const [genCategory, setGenCategory] = useState("Aprendizaje");
  const [genLanguage, setGenLanguage] = useState<"es" | "en" | "fr" | "pt" | "it" | "de">("es");
  const [genLoading, setGenLoading] = useState(false);
  const [genPosts, setGenPosts] = useState<Array<{ id: string; slug: string; title: string; category: string; created_at: string; published: boolean }>>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [publishNow, setPublishNow] = useState(true);
  type IndexEntry = { verdict: string; coverageState: string; lastCrawlTime?: string | null; checkedAt: number };
  const INDEX_CACHE_KEY = "ilr_gsc_index_cache_v1";
  const [indexStatus, setIndexStatus] = useState<Record<string, IndexEntry>>(() => {
    try { return JSON.parse(localStorage.getItem(INDEX_CACHE_KEY) || "{}"); } catch { return {}; }
  });
  const [indexLoading, setIndexLoading] = useState(false);
  const [rowLoading, setRowLoading] = useState<string | null>(null);
  const [requestLoading, setRequestLoading] = useState<string | null>(null);

  const GSC_RESOURCE = "sc-domain:ilinguerelax.com";
  const gscInspectUrl = (url: string) =>
    `https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent(GSC_RESOURCE)}&url=${encodeURIComponent(url)}`;

  const requestIndexing = async (slug: string) => {
    const url = `https://ilinguerelax.com/blog/${slug}`;
    setRequestLoading(slug);
    // Open the GSC inspection deep link immediately (must happen inside the click
    // handler or popup blockers will swallow it).
    const gscTab = window.open(gscInspectUrl(url), "_blank", "noopener,noreferrer");
    try {
      const { data, error } = await supabase.functions.invoke("request-google-indexing", {
        body: { adminKey, urls: [url], siteUrl: "https://ilinguerelax.com/" },
      });
      if (error) throw error;
      const note = (data as { note?: string })?.note;
      toast.success(
        note
          ? "IndexNow + sitemap enviados. Pulsa 'Solicitar indexación' en la pestaña de Google."
          : "Indexación solicitada. Google la procesará en minutos."
      );
      // Re-check status shortly after so the row updates.
      setTimeout(() => { void checkIndexing([slug]); }, 4000);
      if (!gscTab) {
        toast.info("Abre manualmente Search Console — el navegador bloqueó la pestaña nueva.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al solicitar indexación");
    } finally {
      setRequestLoading(null);
    }
  };


  const persistIndex = (next: Record<string, IndexEntry>) => {
    setIndexStatus(next);
    try { localStorage.setItem(INDEX_CACHE_KEY, JSON.stringify(next)); } catch { /* noop */ }
  };

  const checkIndexing = async (slugsFilter?: string[]) => {
    const targets = slugsFilter
      ? genPosts.filter((p) => slugsFilter.includes(p.slug))
      : genPosts.slice(0, 25);
    if (targets.length === 0) return;
    const isSingle = !!slugsFilter && slugsFilter.length === 1;
    if (isSingle) setRowLoading(slugsFilter![0]); else setIndexLoading(true);
    try {
      const urls = targets.map((p) => `https://ilinguerelax.com/blog/${p.slug}`);
      const { data, error } = await supabase.functions.invoke("gsc-inspect-urls", {
        body: { adminKey, urls },
      });
      if (error) throw error;
      const results = (data as { results?: Array<{ url: string; verdict: string; coverageState: string; lastCrawlTime?: string | null }> })?.results ?? [];
      const now = Date.now();
      const merged: Record<string, IndexEntry> = { ...indexStatus };
      for (const r of results) {
        const slug = r.url.split("/blog/")[1];
        if (slug) merged[slug] = { verdict: r.verdict, coverageState: r.coverageState, lastCrawlTime: r.lastCrawlTime, checkedAt: now };
      }
      persistIndex(merged);
      if (!isSingle) toast.success("Estado de indexación actualizado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al consultar Google Search Console");
    } finally {
      setIndexLoading(false);
      setRowLoading(null);
    }
  };

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };

  const loadGenPosts = async () => {
    const { data } = await supabase
      .from("generated_blog_posts")
      .select("id,slug,title,category,created_at,published")
      .order("created_at", { ascending: false })
      .limit(50);
    setGenPosts(data ?? []);
  };

  const generatePost = async () => {
    if (!genTopic.trim()) {
      toast.error("Escribe un tema o título aproximado");
      return;
    }
    setGenLoading(true);
    try {
      const productCards = products
        .filter((p) => selectedProducts.includes(p.id))
        .map((p) => ({ id: p.id, title: p.title, slug: p.slug, description: p.subtitle }));
      const { data, error } = await supabase.functions.invoke("generate-blog-post", {
        body: {
          adminKey,
          topic: genTopic.trim(),
          keyword: genKeyword.trim() || undefined,
          category: genCategory,
          language: genLanguage,
          publish: publishNow,
          relatedProducts: selectedProducts,
          productCards,
        },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      toast.success(publishNow ? "¡Post publicado en el blog!" : "Borrador generado. Revísalo antes de publicar.");

      setGenTopic("");
      setGenKeyword("");
      void loadGenPosts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al generar el post");
    } finally {
      setGenLoading(false);
    }
  };





  const loadGsc = async (d = days) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("gsc-report", {
        body: { adminKey, days: d, limit: 100 },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setReport(data as GscReport);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar GSC");
    } finally {
      setLoading(false);
    }
  };

  const loadSemrush = async () => {
    setSmLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("semrush-report", {
        body: { adminKey, limit: 25 },
      });
      if (error) throw error;
      setSemrush(data as SemrushReport);
      if ((data as SemrushReport)?.notConnected) {
        toast.info("Conecta Semrush desde Connectors para ver estos datos.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar Semrush");
    } finally {
      setSmLoading(false);
    }
  };

  useEffect(() => {
    void loadGsc(days);
    void loadSemrush();
    void loadGenPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey]);

  // Auto-verify indexing for posts without a fresh status (>24h old or never checked).
  useEffect(() => {
    if (genPosts.length === 0 || !adminKey) return;
    const STALE_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const stale = genPosts
      .slice(0, 25)
      .filter((p) => {
        const s = indexStatus[p.slug];
        return !s || (now - s.checkedAt) > STALE_MS;
      })
      .map((p) => p.slug);
    if (stale.length > 0) void checkIndexing(stale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genPosts, adminKey]);


  const applyPreset = (d: number) => {
    setDays(d);
    void loadGsc(d);
  };

  const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const fmtPos = (n: number) => n.toFixed(1);
  const shortPath = (url: string) => {
    try { const u = new URL(url); return u.pathname + u.search; } catch { return url; }
  };

  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background py-10 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">SEO · Google Search Console + Semrush</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Rendimiento orgánico automático por intervalo de fechas.
            </p>
          </div>

          <SitemapHealthCard />


          <Card className="p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Button
                  key={p.days}
                  size="sm"
                  variant={days === p.days ? "default" : "outline"}
                  onClick={() => applyPreset(p.days)}
                  disabled={loading}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Personalizado:</span>
              <Input
                type="number"
                min={1}
                max={480}
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 28)}
                className="w-28"
              />
              <Button size="sm" onClick={() => loadGsc(days)} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
              </Button>
              {report && (
                <p className="text-xs text-muted-foreground ml-auto">
                  Últimos {report.days} días · {report.site}
                </p>
              )}
            </div>
          </Card>

          {report && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Top Queries</h2>
                </div>
                {report.queries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aún no hay consultas registradas.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-xs uppercase text-muted-foreground border-b">
                        <tr>
                          <th className="py-2 pr-2">Query</th>
                          <th className="py-2 px-2 text-right">Clics</th>
                          <th className="py-2 px-2 text-right">Impr.</th>
                          <th className="py-2 px-2 text-right">CTR</th>
                          <th className="py-2 pl-2 text-right">Pos.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.queries.map((r) => (
                          <tr key={r.key} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-2 pr-2 max-w-[220px] truncate" title={r.key}>{r.key}</td>
                            <td className="py-2 px-2 text-right font-medium">{r.clicks}</td>
                            <td className="py-2 px-2 text-right">{r.impressions}</td>
                            <td className="py-2 px-2 text-right">{fmtPct(r.ctr)}</td>
                            <td className="py-2 pl-2 text-right">{fmtPos(r.position)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Top Landing Pages</h2>
                </div>
                {report.pages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin páginas registradas aún.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-xs uppercase text-muted-foreground border-b">
                        <tr>
                          <th className="py-2 pr-2">Página</th>
                          <th className="py-2 px-2 text-right">Clics</th>
                          <th className="py-2 px-2 text-right">Impr.</th>
                          <th className="py-2 px-2 text-right">CTR</th>
                          <th className="py-2 pl-2 text-right">Pos.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.pages.map((r) => (
                          <tr key={r.key} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-2 pr-2 max-w-[260px] truncate">
                              <a href={r.key} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 hover:text-primary" title={r.key}>
                                <span className="truncate">{shortPath(r.key)}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                            </td>
                            <td className="py-2 px-2 text-right font-medium">{r.clicks}</td>
                            <td className="py-2 px-2 text-right">{r.impressions}</td>
                            <td className="py-2 px-2 text-right">{fmtPct(r.ctr)}</td>
                            <td className="py-2 pl-2 text-right">{fmtPos(r.position)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}

          {report && (() => {
            const opportunities = report.queries
              .filter((q) => q.position >= 5 && q.position <= 20 && q.impressions >= 50)
              .sort((a, b) => b.impressions - a.impressions)
              .slice(0, 20);
            return (
              <Card className="p-4 border-primary/40 bg-primary/5">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Oportunidades rápidas</h2>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-2">
                    {opportunities.length}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Queries en posición <strong>5–20</strong> con <strong>+50 impresiones</strong>. Son las que más fácil suben a top 3 mejorando el post existente (título, H2, contenido).
                </p>
                {opportunities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sin oportunidades en este rango. Amplía el intervalo de fechas o publica más contenido.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-xs uppercase text-muted-foreground border-b">
                        <tr>
                          <th className="py-2 pr-2">Query</th>
                          <th className="py-2 px-2 text-right">Pos.</th>
                          <th className="py-2 px-2 text-right">Impr.</th>
                          <th className="py-2 px-2 text-right">Clics</th>
                          <th className="py-2 px-2 text-right">CTR</th>
                          <th className="py-2 pl-2 text-right">Potencial</th>
                        </tr>
                      </thead>
                      <tbody>
                        {opportunities.map((r) => {
                          // potential = impressions * (0.30 - current ctr), assuming top 3 ≈ 30% CTR
                          const potentialClicks = Math.max(0, Math.round(r.impressions * (0.30 - r.ctr)));
                          return (
                            <tr key={r.key} className="border-b border-border/50 hover:bg-muted/30">
                              <td className="py-2 pr-2 max-w-[260px] truncate" title={r.key}>{r.key}</td>
                              <td className="py-2 px-2 text-right font-medium">{fmtPos(r.position)}</td>
                              <td className="py-2 px-2 text-right">{r.impressions}</td>
                              <td className="py-2 px-2 text-right">{r.clicks}</td>
                              <td className="py-2 px-2 text-right">{fmtPct(r.ctr)}</td>
                              <td className="py-2 pl-2 text-right text-primary font-semibold">+{potentialClicks}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            );
          })()}



          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Semrush</h2>
              <Button size="sm" variant="outline" className="ml-auto" onClick={loadSemrush} disabled={smLoading}>
                {smLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Recargar"}
              </Button>
            </div>

            {!semrush && !smLoading && (
              <p className="text-sm text-muted-foreground">Cargando…</p>
            )}

            {semrush?.notConnected && (
              <p className="text-sm text-muted-foreground">
                Semrush no está conectado. Actívalo desde <strong>Connectors → Semrush</strong> para ver keywords, tráfico orgánico y backlinks del dominio.
              </p>
            )}

            {semrush && !semrush.notConnected && (
              <div className="space-y-6">
                {semrush.overview && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Tráfico orgánico</p>
                      <p className="text-2xl font-bold">{semrush.overview.Ot ?? semrush.overview.Or ?? "—"}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Keywords orgánicas</p>
                      <p className="text-2xl font-bold">{semrush.overview.Or ?? "—"}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Rank</p>
                      <p className="text-2xl font-bold">{semrush.overview.Rk ?? "—"}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Coste orgánico</p>
                      <p className="text-2xl font-bold">${semrush.overview.Oc ?? "—"}</p>
                    </div>
                  </div>
                )}

                {semrush.backlinks && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Link2 className="w-3 h-3" /> Authority Score</p>
                      <p className="text-2xl font-bold">{semrush.backlinks.ascore ?? "—"}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Backlinks</p>
                      <p className="text-2xl font-bold">{semrush.backlinks.total ?? "—"}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Dominios ref.</p>
                      <p className="text-2xl font-bold">{semrush.backlinks.domains_num ?? "—"}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Follow</p>
                      <p className="text-2xl font-bold">{semrush.backlinks.follows_num ?? "—"}</p>
                    </div>
                  </div>
                )}

                {Array.isArray(semrush.organic) && semrush.organic.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Keywords orgánicas del dominio</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-left text-xs uppercase text-muted-foreground border-b">
                          <tr>
                            <th className="py-2 pr-2">Keyword</th>
                            <th className="py-2 px-2 text-right">Pos</th>
                            <th className="py-2 px-2 text-right">Volumen</th>
                            <th className="py-2 px-2 text-right">CPC</th>
                            <th className="py-2 px-2 text-right">Tráfico %</th>
                            <th className="py-2 pl-2">URL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {semrush.organic.map((r, i) => (
                            <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                              <td className="py-2 pr-2 max-w-[220px] truncate" title={r.Ph}>{r.Ph}</td>
                              <td className="py-2 px-2 text-right font-medium">{r.Po}</td>
                              <td className="py-2 px-2 text-right">{r.Nq}</td>
                              <td className="py-2 px-2 text-right">${r.Cp}</td>
                              <td className="py-2 px-2 text-right">{r.Tr}</td>
                              <td className="py-2 pl-2 max-w-[220px] truncate">
                                {r.Ur && (
                                  <a href={r.Ur} target="_blank" rel="noopener noreferrer" className="hover:text-primary inline-flex items-center gap-1">
                                    <span className="truncate">{shortPath(r.Ur)}</span>
                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                  </a>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Generador de posts SEO para el blog</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              La IA redacta un artículo con H1, H2, H3, listas y menciones sutiles a tus productos.
              Se publica automáticamente en <code>/blog/[slug]</code>.
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <Label>Tema / título aproximado</Label>
                <Textarea
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="Ej: Cómo aprender inglés con pronunciación en español desde cero"
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <Label>Keyword principal (SEO)</Label>
                <Input
                  value={genKeyword}
                  onChange={(e) => setGenKeyword(e.target.value)}
                  placeholder="aprender ingles con pronunciacion"
                />
              </div>
              <div className="space-y-1">
                <Label>Categoría</Label>
                <Input
                  value={genCategory}
                  onChange={(e) => setGenCategory(e.target.value)}
                  placeholder="Aprendizaje, Vocabulario, Fonética…"
                />
              </div>
              <div className="space-y-1">
                <Label>Idioma del artículo</Label>
                <select
                  value={genLanguage}
                  onChange={(e) => setGenLanguage(e.target.value as typeof genLanguage)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="es">🇪🇸 Español</option>
                  <option value="en">🇬🇧 English</option>
                  <option value="fr">🇫🇷 Français</option>
                  <option value="pt">🇵🇹 Português</option>
                  <option value="it">🇮🇹 Italiano</option>
                  <option value="de">🇩🇪 Deutsch</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Tarjetas de productos a incluir en el post</Label>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setSelectedProducts(products.map((p) => p.id))}
                  >Seleccionar todos</button>
                  <span className="text-muted-foreground">·</span>
                  <button
                    type="button"
                    className="text-muted-foreground hover:underline"
                    onClick={() => setSelectedProducts([])}
                  >Ninguno</button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Se mostrarán como "Recursos recomendados" al final del artículo y la IA los mencionará de forma natural en el CTA.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto rounded border p-2 bg-muted/20">
                {products.map((p) => {
                  const checked = selectedProducts.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex items-start gap-2 p-2 rounded cursor-pointer border transition ${checked ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/40"}`}
                    >
                      <Checkbox checked={checked} onCheckedChange={() => toggleProduct(p.id)} className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{p.flag} {p.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{p.subtitle}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">{selectedProducts.length} producto(s) seleccionado(s)</p>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t">
              <Switch id="publish-now" checked={publishNow} onCheckedChange={setPublishNow} />
              <Label htmlFor="publish-now" className="text-sm cursor-pointer">
                Publicar directamente en el blog
                <span className="block text-[11px] text-muted-foreground font-normal">
                  {publishNow ? "El post será visible al instante en /blog" : "Se guardará como borrador (published: false)"}
                </span>
              </Label>
            </div>

            <Button onClick={generatePost} disabled={genLoading} className="w-full sm:w-auto">
              {genLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {publishNow ? "Generar y publicar" : "Generar borrador"}
            </Button>

            {genPosts.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold">Últimos posts generados</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => checkIndexing()}
                    disabled={indexLoading}
                  >
                    {indexLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Search className="w-3 h-3 mr-1" />}
                    Verificar indexación en Google
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase text-muted-foreground border-b">
                      <tr>
                        <th className="py-2 pr-2">Título</th>
                        <th className="py-2 px-2">Categoría</th>
                        <th className="py-2 px-2">Fecha</th>
                        <th className="py-2 px-2">Estado</th>
                        <th className="py-2 pl-2">Google Index</th>
                      </tr>
                    </thead>
                    <tbody>
                      {genPosts.map((p) => {
                        const idx = indexStatus[p.slug];
                        const verdict = idx?.verdict;
                        const badgeClass =
                          verdict === "PASS" ? "text-green-600 dark:text-green-400" :
                          verdict === "PARTIAL" ? "text-amber-600 dark:text-amber-400" :
                          verdict === "FAIL" ? "text-destructive" :
                          verdict === "NEUTRAL" ? "text-muted-foreground" :
                          "text-muted-foreground";
                        const label =
                          verdict === "PASS" ? "Indexado" :
                          verdict === "PARTIAL" ? "Parcial" :
                          verdict === "FAIL" ? "No indexado" :
                          verdict === "NEUTRAL" ? "Descubierta" :
                          verdict ? "Desconocido" : "—";
                        return (
                          <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-2 pr-2 max-w-[320px] truncate">
                              <a
                                href={`/blog/${p.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary inline-flex items-center gap-1"
                              >
                                <span className="truncate">{p.title}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                            </td>
                            <td className="py-2 px-2">{p.category}</td>
                            <td className="py-2 px-2 text-xs text-muted-foreground">
                              {new Date(p.created_at).toLocaleDateString("es-ES")}
                            </td>
                            <td className="py-2 px-2">
                              {p.published ? (
                                <span className="text-primary text-xs">Publicado</span>
                              ) : (
                                <span className="text-muted-foreground text-xs">Borrador</span>
                              )}
                            </td>
                            <td className="py-2 pl-2">
                              <div className="flex items-start gap-2">
                                <div className="min-w-0">
                                  <span className={`text-xs font-medium ${badgeClass}`} title={idx?.coverageState || ""}>
                                    {label}
                                  </span>
                                  {idx?.coverageState && idx.coverageState !== "—" && (
                                    <div className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                      {idx.coverageState}
                                    </div>
                                  )}
                                  {idx?.checkedAt && (
                                    <div className="text-[10px] text-muted-foreground">
                                      Verificado {new Date(idx.checkedAt).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => checkIndexing([p.slug])}
                                  disabled={rowLoading === p.slug}
                                  className="text-muted-foreground hover:text-primary transition-colors mt-0.5"
                                  title="Volver a verificar en Google"
                                >
                                  {rowLoading === p.slug
                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                    : <RefreshCw className="w-3 h-3" />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>

    </>
  );
};

export default AdminSEO;
