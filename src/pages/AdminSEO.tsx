import { useEffect, useMemo, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Loader2, Search, FileText, ExternalLink, TrendingUp, Link2, Sparkles, Target, RefreshCw, Zap, Copy, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";
import { products } from "@/data/products";
import SitemapHealthCard from "@/components/admin/SitemapHealthCard";
import IndexingEventsCard from "@/components/admin/IndexingEventsCard";
import BacklinksCard from "@/components/admin/BacklinksCard";
import GscKeywordsMultilangCard from "@/components/admin/GscKeywordsMultilangCard";
import GoogleSuggestCard from "@/components/admin/GoogleSuggestCard";
import BlogScheduleCard from "@/components/admin/BlogScheduleCard";
import { Skeleton } from "@/components/ui/skeleton";


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
  const [genPosts, setGenPosts] = useState<Array<{ id: string; slug: string; title: string; category: string; created_at: string; published: boolean; google_index_requested_at: string | null }>>([]);
  const [postsPage, setPostsPage] = useState(1);
  const [postsFilter, setPostsFilter] = useState<"all" | "pending" | "indexed" | "drafts">("all");
  const isMobile = useIsMobile();
  const postsPerPage = isMobile ? 4 : 5;
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [publishNow, setPublishNow] = useState(true);
  type IndexEntry = { verdict: string; coverageState: string; lastCrawlTime?: string | null; checkedAt: number };
  type EngineName = "bing" | "yandex" | "duckduckgo" | "brave";
  type EngineEntry = { indexed: boolean | null; note?: string; checkedAt: number };
  type MultiEntry = Partial<Record<EngineName, EngineEntry>>;
  const INDEX_CACHE_KEY = "ilr_gsc_index_cache_v1";
  const MULTI_CACHE_KEY = "ilr_multi_index_cache_v1";
  const [indexStatus, setIndexStatus] = useState<Record<string, IndexEntry>>(() => {
    try { return JSON.parse(localStorage.getItem(INDEX_CACHE_KEY) || "{}"); } catch { return {}; }
  });
  const [multiStatus, setMultiStatus] = useState<Record<string, MultiEntry>>(() => {
    try { return JSON.parse(localStorage.getItem(MULTI_CACHE_KEY) || "{}"); } catch { return {}; }
  });
  const [indexLoading, setIndexLoading] = useState(false);
  const [multiLoading, setMultiLoading] = useState(false);
  const [multiRowLoading, setMultiRowLoading] = useState<string | null>(null);
  const [rowLoading, setRowLoading] = useState<string | null>(null);
  const [requestLoading, setRequestLoading] = useState<string | null>(null);
  const [copyPost, setCopyPost] = useState<{ slug: string; title: string } | null>(null);
  const [bulkUrls, setBulkUrls] = useState<Array<{ slug: string; title: string; url: string }> | null>(null);


  const GSC_RESOURCE = "sc-domain:ilinguerelax.com";
  const gscInspectUrl = (url: string) =>
    `https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent(GSC_RESOURCE)}&url=${encodeURIComponent(url)}`;

  const copyText = async (text: string, message: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement("textarea");
        area.value = text;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.focus();
        area.select();
        document.execCommand("copy");
        area.remove();
      }
      toast.success(message);
    } catch {
      toast.error("No se pudo copiar. Mantén presionado el texto y selecciona Copiar.");
    }
  };

  const requestIndexing = async (slug: string) => {
    const post = genPosts.find((item) => item.slug === slug);
    if (post?.google_index_requested_at) {
      toast.info("Esta URL ya tuvo su única solicitud de indexación.");
      setCopyPost(null);
      return;
    }
    const url = `https://ilinguerelax.com/blog/${slug}`;
    setRequestLoading(slug);
    const gscTab = window.open(
      `https://search.google.com/search-console?resource_id=${encodeURIComponent(GSC_RESOURCE)}`,
      "_blank",
      "noopener,noreferrer",
    );
    toast.info("Copia la URL y pégala en la barra superior de Search Console.", { duration: 6000 });
    if (!gscTab) {
      toast.info("Abre manualmente Search Console — el navegador bloqueó la pestaña nueva.");
    }
    try {
      const { data, error } = await supabase.functions.invoke("request-google-indexing", {
        body: { adminKey, urls: [url], siteUrl: "https://ilinguerelax.com/" },
      });
      if (error) throw error;
      const result = data as { alreadyRequested?: boolean };
      if (result?.alreadyRequested) {
        toast.info("Esta URL ya había sido solicitada. No se envió de nuevo.");
      } else {
        toast.success("Solicitud única registrada. No podrá repetirse mañana ni otro día.", { duration: 7000 });
      }
      await loadGenPosts();
      setCopyPost(null);
    } catch {
      toast.error("No se pudo registrar la solicitud. No se marcó como enviada.");
    }
    setRequestLoading(null);
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

  const persistMulti = (next: Record<string, MultiEntry>) => {
    setMultiStatus(next);
    try { localStorage.setItem(MULTI_CACHE_KEY, JSON.stringify(next)); } catch { /* noop */ }
  };

  const checkMultiIndex = async (slugsFilter?: string[]) => {
    const targets = slugsFilter
      ? genPosts.filter((p) => slugsFilter.includes(p.slug))
      : genPosts.slice(0, 15);
    if (targets.length === 0) return;
    const isSingle = !!slugsFilter && slugsFilter.length === 1;
    if (isSingle) setMultiRowLoading(slugsFilter![0]); else setMultiLoading(true);
    try {
      const urls = targets.map((p) => `https://ilinguerelax.com/blog/${p.slug}`);
      const { data, error } = await supabase.functions.invoke("check-multi-search-index", {
        body: { adminKey, urls },
      });
      if (error) throw error;
      const results = (data as {
        results?: Array<{
          url: string;
          results: Record<EngineName, { indexed: boolean | null; note?: string }>;
        }>;
      })?.results ?? [];
      const now = Date.now();
      const merged: Record<string, MultiEntry> = { ...multiStatus };
      for (const r of results) {
        const slug = r.url.split("/blog/")[1]?.replace(/\/$/, "");
        if (!slug) continue;
        const entry: MultiEntry = {};
        (Object.keys(r.results) as EngineName[]).forEach((eng) => {
          const v = r.results[eng];
          entry[eng] = { indexed: v?.indexed ?? null, note: v?.note, checkedAt: now };
        });
        merged[slug] = entry;
      }
      persistMulti(merged);
      if (!isSingle) toast.success("Verificado en Bing, Yandex, DuckDuckGo y Brave");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al verificar buscadores");
    } finally {
      setMultiLoading(false);
      setMultiRowLoading(null);
    }
  };


  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };

  const loadGenPosts = async () => {
    const { data } = await supabase
      .from("generated_blog_posts")
      .select("id,slug,title,category,created_at,published,google_index_requested_at")
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
      if (error) {
        if (error.message.includes("2FA") || (error as any).status === 401) {
          toast.error("Tu sesión de administrador ha expirado. Recarga la página para verificar tu 2FA.");
        } else {
          throw error;
        }
        return;
      }
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
    const timer = setTimeout(() => {
      void loadGsc(days);
      void loadSemrush();
      void loadGenPosts();
    }, 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey]);

  // Auto-verify indexing for posts without a fresh status (>24h old or never checked).
  useEffect(() => {
    if (genPosts.length === 0 || !adminKey) return;
    const timer = setTimeout(() => {
      const STALE_MS = 24 * 60 * 60 * 1000;
      const now = Date.now();
      const stale = genPosts
        .slice(0, 5) // Reduced from 25 to 5 to avoid initial load spike
        .filter((p) => {
          const s = indexStatus[p.slug];
          return !s || (now - s.checkedAt) > STALE_MS;
        })
        .map((p) => p.slug);
      if (stale.length > 0) void checkIndexing(stale);
    }, 2000); // Wait 2s after posts load before checking indexing
    return () => clearTimeout(timer);
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
      <main className="min-h-dvh bg-background py-6 md:py-10 px-3 md:px-4">
        <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
          <div>
            <h1 className="text-lg md:text-3xl font-bold leading-tight break-words">
              <span className="md:hidden">SEO · GSC + Semrush</span>
              <span className="hidden md:inline">SEO · Google Search Console + Semrush</span>
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm mt-1">
              Rendimiento orgánico automático por intervalo de fechas.
            </p>
          </div>

          <SitemapHealthCard />

          <div className="flex justify-end">
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs gap-1.5"
              onClick={() => window.open("/admin/indexing", "_blank")}
            >
              <Target className="w-3.5 h-3.5" />
              Ver historial de indexación completo
            </Button>
          </div>

          <IndexingEventsCard />


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
                  <>
                    {/* Mobile card list */}
                    <div className="md:hidden space-y-2">
                      {report.queries.map((r) => (
                        <div key={r.key} className="rounded-md border border-border/60 p-2.5">
                          <div className="text-sm font-medium break-words leading-snug" title={r.key}>{r.key}</div>
                          <div className="mt-1.5 grid grid-cols-4 gap-1 text-[11px] text-muted-foreground">
                            <div><span className="block text-foreground font-semibold">{r.clicks}</span>Clics</div>
                            <div><span className="block text-foreground font-semibold">{r.impressions}</span>Impr.</div>
                            <div><span className="block text-foreground font-semibold">{fmtPct(r.ctr)}</span>CTR</div>
                            <div><span className="block text-foreground font-semibold">{fmtPos(r.position)}</span>Pos.</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
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
                  </>
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
                  <>
                    {/* Mobile card list */}
                    <div className="md:hidden space-y-2">
                      {report.pages.map((r) => (
                        <div key={r.key} className="rounded-md border border-border/60 p-2.5">
                          <a href={r.key} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-medium hover:text-primary break-all" title={r.key}>
                            <span className="break-all">{shortPath(r.key)}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                          <div className="mt-1.5 grid grid-cols-4 gap-1 text-[11px] text-muted-foreground">
                            <div><span className="block text-foreground font-semibold">{r.clicks}</span>Clics</div>
                            <div><span className="block text-foreground font-semibold">{r.impressions}</span>Impr.</div>
                            <div><span className="block text-foreground font-semibold">{fmtPct(r.ctr)}</span>CTR</div>
                            <div><span className="block text-foreground font-semibold">{fmtPos(r.position)}</span>Pos.</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
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
                  </>
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



          <GscKeywordsMultilangCard />
          <GoogleSuggestCard />
          <BlogScheduleCard />



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

            {genPosts.length > 0 && (() => {
              const filteredPosts = genPosts.filter((p) => {
                if (postsFilter === "drafts") return !p.published;
                const v = indexStatus[p.slug]?.verdict;
                if (postsFilter === "indexed") return v === "PASS";
                if (postsFilter === "pending") return v !== "PASS";
                return true;
              });
              const totalPages = Math.max(1, Math.ceil(filteredPosts.length / postsPerPage));
              const page = Math.min(postsPage, totalPages);
              const paginatedPosts = filteredPosts.slice((page - 1) * postsPerPage, page * postsPerPage);
              return (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold">Últimos posts generados ({filteredPosts.length})</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => checkIndexing()}
                      disabled={indexLoading}
                    >
                      {indexLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Search className="w-3 h-3 mr-1" />}
                      Verificar Google
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const pending = genPosts
                          .filter((p) => indexStatus[p.slug]?.verdict !== "PASS")
                          .map((p) => p.slug);
                        if (pending.length === 0) {
                          toast.info("Todos los posts visibles ya están indexados en Google ✅");
                          return;
                        }
                        void checkIndexing(pending);
                      }}
                      disabled={indexLoading}
                      title="Re-verifica en Google solo los posts que aún no aparecen indexados"
                    >
                      {indexLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Search className="w-3 h-3 mr-1" />}
                      Verificar solo pendientes
                    </Button>




                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        // Include everything not yet confirmed indexed (PASS). We ignore
                        // google_index_requested_at because the API call is limited to one
                        // per URL but Search Console lets the user paste the URL manually
                        // as many times as needed while it stays "Descubierta".
                        const pending = filteredPosts.filter((p) => {
                          const v = indexStatus[p.slug]?.verdict;
                          return v !== "PASS";
                        });
                        if (pending.length === 0) {
                          toast.info("Todas las URLs visibles ya están indexadas.");
                          return;
                        }
                        setBulkUrls(
                          pending.map((p) => ({
                            slug: p.slug,
                            title: p.title,
                            url: `https://ilinguerelax.com/blog/${p.slug}`,
                          })),
                        );
                      }}
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      Solicitar indexación ({filteredPosts.filter((p) => indexStatus[p.slug]?.verdict !== "PASS").length})
                    </Button>
                  </div>
                </div>

                {/* Filtros */}
                <div className="flex items-center gap-1.5 flex-wrap mb-3 pb-2 border-b">
                  {([
                    { id: "all", label: "Todos" },
                    { id: "pending", label: "No indexados" },
                    { id: "indexed", label: "Indexados" },
                    { id: "drafts", label: "Borradores" },
                  ] as const).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => { setPostsFilter(f.id); setPostsPage(1); }}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                        postsFilter === f.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Leyenda de estados */}
                <div className="mb-3 p-2.5 rounded-md bg-muted/40 border border-border/60 text-[11px] leading-snug space-y-1.5">
                  <div className="font-semibold text-foreground mb-1">¿Qué significa cada estado?</div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Pendiente</span>
                    <span className="text-muted-foreground">Aún no consultado en Google. Pulsa "Verificar Google".</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-medium">Descubierta</span>
                    <span className="text-muted-foreground">Google la conoce pero aún no la ha rastreado. Pulsa "Solicitar indexación".</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-medium">Rastreada s/indexar</span>
                    <span className="text-muted-foreground">Google la rastreó pero no la indexó todavía. Mejora contenido/enlaces internos.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-700 dark:text-green-400 font-medium">Indexado</span>
                    <span className="text-muted-foreground">Ya aparece en resultados de Google. ✅</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive font-medium">No indexado</span>
                    <span className="text-muted-foreground">Excluida por Google (error, duplicado o noindex). Revisa la URL.</span>
                  </div>
                </div>

                {/* Mobile: stacked cards */}
                <div className="md:hidden space-y-3">
                  {paginatedPosts.map((p) => {
                    const idx = indexStatus[p.slug];
                    const verdict = idx?.verdict;
                    const badgeClass =
                      verdict === "PASS" ? "bg-green-500/15 text-green-700 dark:text-green-400" :
                      verdict === "PARTIAL" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" :
                      verdict === "FAIL" ? "bg-destructive/15 text-destructive" :
                      "bg-muted text-muted-foreground";
                    const coverage = idx?.coverageState?.toLowerCase() || "";
                    const label =
                      verdict === "PASS" ? "Indexado" :
                      coverage.includes("crawled") || coverage.includes("rastreada") ? "Rastreada s/indexar" :
                      coverage.includes("discovered") || coverage.includes("descubierta") ? "Descubierta" :
                      verdict === "PARTIAL" ? "Parcial" :
                      verdict === "FAIL" ? "No indexado" :
                      verdict === "NEUTRAL" ? "Pendiente" : "—";
                    const created = new Date(p.created_at);
                    const days = Math.floor((Date.now() - created.getTime()) / 86400000);
                    const hours = Math.floor((Date.now() - created.getTime()) / 3600000);
                    const ageLabel = days >= 1 ? `hace ${days}d` : `hace ${hours}h`;
                    return (
                      <div key={p.id} className="border rounded-lg p-3 space-y-2 bg-card">
                        <div className="flex items-start justify-between gap-2">
                          <a
                            href={`/blog/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium leading-snug hover:text-primary flex-1 min-w-0"
                          >
                            {p.title}
                            <ExternalLink className="w-3 h-3 inline ml-1 shrink-0" />
                          </a>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${badgeClass}`}>
                            {label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
                          <span>{p.category}</span>
                          <span>·</span>
                          <span>{created.toLocaleDateString("es-ES")} ({ageLabel})</span>
                          <span>·</span>
                          <span>{p.published ? "Publicado" : "Borrador"}</span>
                        </div>


                        <div className="flex items-center gap-2 pt-1 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs flex-1"
                            onClick={() => checkIndexing([p.slug])}
                            disabled={rowLoading === p.slug}
                          >
                            {rowLoading === p.slug
                              ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              : <RefreshCw className="w-3 h-3 mr-1" />}
                            Google
                          </Button>


                          {!p.google_index_requested_at && (verdict === "NEUTRAL" || verdict === "FAIL" || !verdict) ? (
                            <Button
                              size="sm"
                              className="h-8 text-xs flex-1"
                              onClick={() => setCopyPost({ slug: p.slug, title: p.title })}
                            >
                              <Zap className="w-3 h-3 mr-1" />
                              Indexar
                            </Button>
                          ) : p.google_index_requested_at && verdict !== "PASS" ? (
                            <span className="text-[10px] text-muted-foreground flex-1 text-center">
                              Solicitada 1 vez
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop: table */}
                <div className="overflow-x-auto hidden md:block">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase text-muted-foreground border-b">
                      <tr>
                        <th className="py-2 pr-2">Título</th>
                        <th className="py-2 px-2">Categoría</th>
                        <th className="py-2 px-2">Fecha</th>
                        <th className="py-2 px-2">Estado</th>
                        <th className="py-2 px-2">Google</th>


                      </tr>

                    </thead>
                    <tbody>
                      {paginatedPosts.map((p) => {
                        const idx = indexStatus[p.slug];
                        const verdict = idx?.verdict;
                        const badgeClass =
                          verdict === "PASS" ? "text-green-600 dark:text-green-400" :
                          verdict === "PARTIAL" ? "text-amber-600 dark:text-amber-400" :
                          verdict === "FAIL" ? "text-destructive" :
                          verdict === "NEUTRAL" ? "text-muted-foreground" :
                          "text-muted-foreground";
                        const coverage = idx?.coverageState?.toLowerCase() || "";
                        const label =
                          verdict === "PASS" ? "Indexado" :
                          coverage.includes("crawled") || coverage.includes("rastreada") ? "Rastreada, aún sin indexar" :
                          coverage.includes("discovered") || coverage.includes("descubierta") ? "Descubierta, aún sin rastrear" :
                          verdict === "PARTIAL" ? "Parcial" :
                          verdict === "FAIL" ? "No indexado" :
                          verdict === "NEUTRAL" ? "Pendiente de Google" :
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
                              {(() => {
                                const created = new Date(p.created_at);
                                const days = Math.floor((Date.now() - created.getTime()) / 86400000);
                                const hours = Math.floor((Date.now() - created.getTime()) / 3600000);
                                const ageLabel = days >= 1 ? `hace ${days}d` : `hace ${hours}h`;
                                const isIndexed = verdict === "PASS";
                                let eta = "";
                                let etaColor = "text-muted-foreground";
                                if (!isIndexed) {
                                  if (days < 1) { eta = "ETA: 1–7 días"; etaColor = "text-amber-600 dark:text-amber-400"; }
                                  else if (days < 7) { eta = `ETA: ${7 - days}–${14 - days} días`; etaColor = "text-amber-600 dark:text-amber-400"; }
                                  else if (days < 14) { eta = "⚠ Retrasado"; etaColor = "text-orange-600 dark:text-orange-400"; }
                                  else { eta = "⚠ Revisar contenido"; etaColor = "text-destructive"; }
                                }
                                return (
                                  <div className="flex flex-col">
                                    <span>{created.toLocaleDateString("es-ES")}</span>
                                    <span className="text-[10px]">{ageLabel}</span>
                                    {eta && <span className={`text-[10px] font-medium ${etaColor}`}>{eta}</span>}
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="py-2 px-2">
                              {p.published ? (
                                <span className="text-primary text-xs">Publicado</span>
                              ) : (
                                <span className="text-muted-foreground text-xs">Borrador</span>
                              )}
                            </td>
                            <td className="py-2 px-2">
                              <div className="flex items-start gap-2">
                                <div className="min-w-0">
                                  <span className={`text-xs font-medium ${badgeClass}`} title={idx?.coverageState || ""}>
                                    {label}
                                  </span>
                                  {idx?.checkedAt && (
                                    <div className="text-[10px] text-muted-foreground">
                                      {new Date(idx.checkedAt).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
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
                                {!p.google_index_requested_at && (verdict === "NEUTRAL" || verdict === "FAIL" || !verdict) && (
                                  <button
                                    type="button"
                                    onClick={() => setCopyPost({ slug: p.slug, title: p.title })}
                                    disabled={requestLoading === p.slug}
                                    className="text-amber-600 hover:text-amber-500 dark:text-amber-400 transition-colors mt-0.5"
                                    title="Solicitar indexación en Google Search Console"
                                  >
                                    {requestLoading === p.slug
                                      ? <Loader2 className="w-3 h-3 animate-spin" />
                                      : <Zap className="w-3 h-3" />}
                                  </button>
                                )}
                                {p.google_index_requested_at && verdict !== "PASS" && (
                                  <span
                                    className="text-[10px] text-muted-foreground"
                                    title={new Date(p.google_index_requested_at).toLocaleString("es-ES")}
                                  >
                                    Solicitada 1 vez
                                  </span>
                                )}
                              </div>
                            </td>



                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPostsPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      ← Anterior
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Página {page} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPostsPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Siguiente →
                    </Button>
                  </div>
                )}
              </div>
              );
            })()}

            {bulkUrls && (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40 p-0 sm:p-4" role="dialog" aria-modal="true">
                <div className="w-full sm:max-w-lg rounded-t-lg sm:rounded-lg border bg-background shadow-xl flex flex-col max-h-[85vh]">
                  <div className="flex items-start justify-between gap-3 p-4 border-b">
                    <div>
                      <h3 className="font-semibold">Solicitar indexación ({bulkUrls.length})</h3>
                      <p className="text-xs text-muted-foreground">Copia cada URL y pégala en Search Console para pedir indexación manual.</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setBulkUrls(null)} aria-label="Cerrar">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-3 border-b flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyText(bulkUrls.map((u) => u.url).join("\n"), `${bulkUrls.length} URLs copiadas`)}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" /> Copiar todas
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        window.open(
                          `https://search.google.com/search-console?resource_id=${encodeURIComponent(GSC_RESOURCE)}`,
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1" /> Abrir Search Console
                    </Button>
                  </div>
                  <div className="overflow-y-auto p-3 space-y-2">
                    {bulkUrls.map((u) => (
                      <div key={u.slug} className="border rounded-md p-2 space-y-1.5">
                        <p className="text-xs font-medium line-clamp-2">{u.title}</p>
                        <p className="text-[11px] font-mono text-muted-foreground break-all">{u.url}</p>
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="outline" className="h-7 text-[11px] flex-1" onClick={() => copyText(u.url, "URL copiada")}>
                            <Copy className="h-3 w-3 mr-1" /> Copiar
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-[11px] flex-1"
                            onClick={async () => {
                              await copyText(u.url, "URL copiada — pégala arriba en GSC");
                              window.open(
                                `https://search.google.com/search-console?resource_id=${encodeURIComponent(GSC_RESOURCE)}`,
                                "_blank",
                                "noopener,noreferrer",
                              );
                            }}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" /> GSC
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {copyPost && (() => {
              const postUrl = `https://ilinguerelax.com/blog/${copyPost.slug}`;
              return (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40 p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="copy-index-title">
                  <div className="w-full sm:max-w-lg rounded-t-lg sm:rounded-lg border bg-background p-4 shadow-xl space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 id="copy-index-title" className="font-semibold">Solicitar indexación</h3>
                        <p className="text-xs text-muted-foreground">Copia la URL desde tu celular y pégala en Google Search Console.</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setCopyPost(null)} aria-label="Cerrar">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Título</Label>
                      <div className="flex gap-2">
                        <Textarea readOnly value={copyPost.title} rows={2} className="text-sm resize-none" onFocus={(e) => e.currentTarget.select()} />
                        <Button variant="outline" size="icon" className="shrink-0" onClick={() => copyText(copyPost.title, "Título copiado")} aria-label="Copiar título">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>URL</Label>
                      <div className="flex gap-2">
                        <Textarea readOnly value={postUrl} rows={2} className="text-sm resize-none break-all" onFocus={(e) => e.currentTarget.select()} />
                        <Button variant="outline" size="icon" className="shrink-0" onClick={() => copyText(postUrl, "URL copiada")} aria-label="Copiar URL">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button variant="outline" onClick={() => copyText(`${copyPost.title}\n${postUrl}`, "Título y URL copiados")}>
                        <Copy className="h-4 w-4 mr-2" /> Copiar título + URL
                      </Button>
                      <Button onClick={() => requestIndexing(copyPost.slug)} disabled={requestLoading === copyPost.slug}>
                        {requestLoading === copyPost.slug ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-2" />}
                        Abrir Search Console
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </Card>
        </div>
      </main>

    </>
  );
};

export default AdminSEO;
