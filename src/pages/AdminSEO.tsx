import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Search, FileText, ExternalLink, TrendingUp, Link2, Sparkles, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";


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
  const [genLoading, setGenLoading] = useState(false);
  const [genPosts, setGenPosts] = useState<Array<{ id: string; slug: string; title: string; category: string; created_at: string; published: boolean }>>([]);

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
      const { data, error } = await supabase.functions.invoke("generate-blog-post", {
        body: {
          adminKey,
          topic: genTopic.trim(),
          keyword: genKeyword.trim() || undefined,
          category: genCategory,
          publish: true,
        },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      toast.success("Post generado y publicado en /blog");
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
        body: { adminKey, days: d, limit: 25 },
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
            </div>

            <Button onClick={generatePost} disabled={genLoading}>
              {genLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generar y publicar
            </Button>

            {genPosts.length > 0 && (
              <div className="pt-2">
                <h3 className="text-sm font-semibold mb-2">Últimos posts generados</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase text-muted-foreground border-b">
                      <tr>
                        <th className="py-2 pr-2">Título</th>
                        <th className="py-2 px-2">Categoría</th>
                        <th className="py-2 px-2">Fecha</th>
                        <th className="py-2 pl-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {genPosts.map((p) => (
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
                          <td className="py-2 pl-2">
                            {p.published ? (
                              <span className="text-primary text-xs">Publicado</span>
                            ) : (
                              <span className="text-muted-foreground text-xs">Borrador</span>
                            )}
                          </td>
                        </tr>
                      ))}
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
