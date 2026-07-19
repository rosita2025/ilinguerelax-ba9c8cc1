import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Copy, TrendingUp } from "lucide-react";
import { useAdminKey } from "@/components/admin/AdminGate";
import { adminInvoke } from "@/lib/adminInvoke";
import { toast } from "sonner";

interface LangResult {
  hl: string;
  gl: string;
  label: string;
  flag: string;
  translatedSeed: string;
  popularity: number;
  suggestions: string[];
  error: string | null;
}

const GoogleSuggestCard = () => {
  const { adminKey } = useAdminKey();
  const [query, setQuery] = useState("aprender coreano");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LangResult[]>([]);

  const run = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await adminInvoke<{ results?: LangResult[] }>("google-suggest", {
        body: { adminKey, query, translate: true },
      });
      if (error) throw error;
      setResults(data?.results ?? []);
    } catch (e: any) {
      const message = String(e?.message ?? e);
      toast.error(
        message.includes("Failed to send")
          ? "No se pudo conectar. Recarga /admin/seo e inténtalo otra vez."
          : `Error: ${message}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado");
  };

  // Sort by popularity desc so highest-volume markets show first
  const sorted = [...results].sort((a, b) => b.popularity - a.popularity);
  const maxPop = Math.max(1, ...sorted.map((r) => r.popularity));

  // Aggregate: keywords that appear across multiple markets = high global demand
  const globalRanking = (() => {
    const map = new Map<string, { count: number; markets: string[] }>();
    for (const r of results) {
      for (const s of r.suggestions) {
        const key = s.toLowerCase().trim();
        const entry = map.get(key) ?? { count: 0, markets: [] };
        entry.count += 1;
        entry.markets.push(`${r.flag} ${r.label}`);
        map.set(key, entry);
      }
    }
    return Array.from(map.entries())
      .map(([kw, v]) => ({ keyword: kw, count: v.count, markets: v.markets }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 25);
  })();

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Explorador Google Suggest (España + LATAM + EN/FR/KR/IT/PT/SE)</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Escribe una semilla en <strong>tu idioma</strong> (ej: <em>aprender coreano</em>) y el sistema la traduce a cada mercado
        antes de consultar Google. Cubre <strong>España + 14 países LATAM</strong> con la misma keyword en español, más EN-US, EN-UK, francés, coreano, italiano, portugués (BR) y sueco.
        La barra <TrendingUp className="w-3 h-3 inline" /> es el <strong>volumen relativo</strong> por país. El bloque <strong>"Top global"</strong> abajo son long-tails que aparecen en varios países = <strong>alto volumen agregado</strong>.
      </p>

      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="Ej: aprender coreano, verbos ingles, patrones gramática..."
          className="flex-1"
        />
        <Button onClick={run} disabled={loading || !query.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
        </Button>
      </div>

      {globalRanking.length > 0 && (
        <div className="border rounded-lg p-3 bg-primary/5 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <TrendingUp className="w-4 h-4 text-primary" />
            Top palabras de alto volumen (aparecen en varios países)
          </div>
          <ul className="space-y-1 text-xs">
            {globalRanking.map((k, i) => (
              <li key={i} className="flex items-center gap-2 border-b pb-1">
                <span className="w-6 text-[10px] font-mono text-muted-foreground">#{i + 1}</span>
                <span className="shrink-0 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold">
                  {k.count}×
                </span>
                <span className="flex-1 truncate" title={`${k.keyword} — ${k.markets.join(", ")}`}>{k.keyword}</span>
                <button onClick={() => copy(k.keyword)} className="text-muted-foreground hover:text-primary shrink-0" title="Copiar">
                  <Copy className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {sorted.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map((r) => {
            const barPct = Math.round((r.popularity / maxPop) * 100);
            return (
              <div key={`${r.hl}-${r.gl}`} className="border rounded-lg p-3 space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-medium text-sm">
                      <span className="text-lg">{r.flag}</span>
                      <span>{r.label}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{r.popularity}/10</span>
                  </div>
                  <div className="h-1 bg-muted rounded overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${barPct}%` }} />
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                    <span className="truncate italic" title={r.translatedSeed}>
                      🔎 "{r.translatedSeed}"
                    </span>
                    <button
                      onClick={() => copy(r.translatedSeed)}
                      className="hover:text-primary shrink-0"
                      title="Copiar semilla traducida"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {r.error ? (
                  <p className="text-xs text-destructive">{r.error}</p>
                ) : r.suggestions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin sugerencias.</p>
                ) : (
                  <ul className="space-y-1 text-xs">
                    {r.suggestions.map((s, i) => (
                      <li key={i} className="flex justify-between gap-2 items-center border-b pb-1">
                        <span className="truncate flex-1" title={s}>{s}</span>
                        <button
                          onClick={() => copy(s)}
                          className="text-muted-foreground hover:text-primary shrink-0"
                          title="Copiar"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default GoogleSuggestCard;
