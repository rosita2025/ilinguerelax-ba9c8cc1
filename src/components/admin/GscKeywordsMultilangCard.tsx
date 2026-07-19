import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Globe, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminKey } from "@/components/admin/AdminGate";
import { toast } from "sonner";

interface MarketRow {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}
interface MarketBlock {
  code: string;
  label: string;
  language: string;
  flag: string;
  rows: MarketRow[];
  error: string | null;
}

const GscKeywordsMultilangCard = () => {
  const { adminKey } = useAdminKey();
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(90);
  const [markets, setMarkets] = useState<MarketBlock[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("gsc-keywords-multilang", {
        body: { adminKey, days, limit: 20 },
      });
      if (error) throw error;
      setMarkets(data?.markets ?? []);
      toast.success(`Cargado — ${data?.markets?.length ?? 0} mercados`);
    } catch (e: any) {
      toast.error(`Error: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Keywords por idioma (Google Search Console)</h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="border rounded px-2 py-1 text-sm bg-background"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={28}>28 días</option>
            <option value={90}>3 meses</option>
            <option value={180}>6 meses</option>
            <option value={365}>1 año</option>
          </select>
          <Button size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cargar"}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Datos reales de tu Search Console. Muestra las búsquedas que llevan tráfico a tu sitio, segmentadas por país.
        <strong className="ml-1">100% gratis y sin límites</strong>.
      </p>

      {markets.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {markets.map((m) => {
            const isOpen = expanded[m.code] ?? false;
            const visible = isOpen ? m.rows : m.rows.slice(0, 5);
            return (
              <div key={m.code} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <span className="text-lg">{m.flag}</span>
                    <span>{m.label}</span>
                    <span className="text-muted-foreground text-xs">({m.language})</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{m.rows.length} kw</span>
                </div>
                {m.error ? (
                  <p className="text-xs text-destructive">{m.error}</p>
                ) : m.rows.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin datos en este mercado.</p>
                ) : (
                  <>
                    <ul className="space-y-1 text-xs">
                      {visible.map((r) => (
                        <li key={r.key} className="flex justify-between gap-2 border-b pb-1">
                          <span className="truncate flex-1" title={r.key}>{r.key}</span>
                          <span className="text-muted-foreground shrink-0">
                            {r.clicks}c · {r.impressions}i · p{r.position.toFixed(1)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {m.rows.length > 5 && (
                      <button
                        className="text-xs text-primary hover:underline"
                        onClick={() => setExpanded({ ...expanded, [m.code]: !isOpen })}
                      >
                        {isOpen ? "Ver menos" : `Ver ${m.rows.length - 5} más`}
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="border-t pt-3">
        <p className="text-xs text-muted-foreground mb-2">
          <strong>Backlinks:</strong> Google no expone el reporte de enlaces vía API pública. Ábrelo directo en Search Console:
        </p>
        <a
          href="https://search.google.com/search-console/links?resource_id=sc-domain:ilinguerelax.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Abrir reporte de enlaces en GSC <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </Card>
  );
};

export default GscKeywordsMultilangCard;
