import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminKey } from "@/components/admin/AdminGate";
import { toast } from "sonner";

interface LangResult {
  hl: string;
  gl: string;
  label: string;
  flag: string;
  suggestions: string[];
  error: string | null;
}

const GoogleSuggestCard = () => {
  const { adminKey } = useAdminKey();
  const [query, setQuery] = useState("aprender");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LangResult[]>([]);

  const run = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-suggest", {
        body: { adminKey, query },
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

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Explorador Google Suggest (10 idiomas)</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Sugerencias reales de Google Autocomplete en 10 mercados. Escribe una palabra semilla (ej: <em>aprender</em>, <em>learn</em>, <em>apprendre</em>, <em>배우다</em>) y descubre qué buscan de verdad los usuarios. <strong>Gratis, ilimitado</strong>.
      </p>

      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="Ej: aprender coreano, learn spanish, apprendre..."
          className="flex-1"
        />
        <Button onClick={run} disabled={loading || !query.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {results.map((r) => (
            <div key={`${r.hl}-${r.gl}`} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 font-medium text-sm">
                <span className="text-lg">{r.flag}</span>
                <span>{r.label}</span>
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
          ))}
        </div>
      )}
    </Card>
  );
};

export default GoogleSuggestCard;
