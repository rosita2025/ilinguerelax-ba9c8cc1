import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Copy, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminKey } from "@/components/admin/AdminGate";
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
      const { data, error } = await supabase.functions.invoke("google-suggest", {
        body: { adminKey, query, translate: true },
      });
      if (error) throw error;
      setResults(data?.results ?? []);
    } catch (e: any) {
      toast.error(`Error: ${e.message ?? e}`);
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

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Explorador Google Suggest (10 idiomas · auto-traducido)</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Escribe una semilla en <strong>tu idioma</strong> (ej: <em>aprender coreano</em>) y el sistema la traduce a cada mercado
        antes de consultar Google: en US buscará <em>"learn Korean"</em>, en Corea <em>"한국어 배우기"</em>, en Italia <em>"imparare coreano"</em>.
        La barra <TrendingUp className="w-3 h-3 inline" /> es el <strong>volumen relativo</strong> (nº de autocompletes que devuelve Google — más = más buscado en ese país).
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
