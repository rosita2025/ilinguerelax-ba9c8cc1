import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Search, FileText, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminNav from "@/components/admin/AdminNav";

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

const AdminSEO = () => {
  const [adminKey, setAdminKey] = useState("");
  const [days, setDays] = useState(28);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<GscReport | null>(null);

  const loadReport = async () => {
    if (!adminKey) {
      toast.error("Ingresa la clave de administración");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("gsc-report", {
        body: { adminKey, days, limit: 25 },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setReport(data as GscReport);
      toast.success("Datos de Google Search Console cargados");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const fmtPos = (n: number) => n.toFixed(1);

  const shortPath = (url: string) => {
    try {
      const u = new URL(url);
      return u.pathname + u.search;
    } catch {
      return url;
    }
  };

  return (
    <main className="min-h-dvh bg-background py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">SEO · Google Search Console</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Top consultas y páginas de aterrizaje desde Google.
          </p>
        </div>

        <Card className="p-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_140px_auto]">
            <Input
              type="password"
              placeholder="Clave de administración"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadReport()}
            />
            <Input
              type="number"
              min={1}
              max={90}
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value) || 28)}
              placeholder="Días"
            />
            <Button onClick={loadReport} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cargar"}
            </Button>
          </div>
          {report && (
            <p className="text-xs text-muted-foreground">
              Últimos {report.days} días · Sitio: {report.site}
            </p>
          )}
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
                  Aún no hay consultas registradas. Google necesita indexar y acumular datos (suele tardar 2-4 semanas).
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
                <p className="text-sm text-muted-foreground">
                  Aún no hay páginas registradas por Google Search Console.
                </p>
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
                            <a
                              href={r.key}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 hover:text-primary"
                              title={r.key}
                            >
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
      </div>
    </main>
  );
};

export default AdminSEO;
