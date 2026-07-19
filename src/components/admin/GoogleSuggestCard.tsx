import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Copy, TrendingUp } from "lucide-react";
import { useAdminKey } from "@/components/admin/AdminGate";
import { adminInvoke } from "@/lib/adminInvoke";
import { toast } from "sonner";

interface GroupResult {
  id: string;
  label: string;
  flag: string;
  translatedSeed: string;
  countryCount: number;
  popularity: number;
  maxCount: number;
  keywords: { keyword: string; count: number; countries: string[] }[];
}

const GoogleSuggestCard = () => {
  const { adminKey } = useAdminKey();
  const [query, setQuery] = useState("aprender coreano");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GroupResult[]>([]);

  const run = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await adminInvoke<{ results?: GroupResult[] }>("google-suggest", {
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

  // Sort groups by popularity (unique keywords surfaced) desc
  const sorted = [...results].sort((a, b) => b.popularity - a.popularity);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Explorador Google Suggest (agrupado por idioma / región)</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Escribe una semilla y el sistema la traduce a cada mercado antes de consultar Google. Grupos: <strong>LATAM (14 países juntos)</strong>, España, USA+Canadá, UK, Francia, Corea, Italia, Brasil y Suecia.
        Dentro de cada grupo las palabras se ordenan por <strong>frecuencia entre países = alto volumen</strong>. El número <TrendingUp className="w-3 h-3 inline" /> <code>3×</code> significa que aparece en 3 países del grupo.
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
          {sorted.map((r) => (
            <div key={r.id} className="border rounded-lg p-3 space-y-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <span className="text-lg">{r.flag}</span>
                    <span>{r.label}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {r.countryCount} {r.countryCount === 1 ? "país" : "países"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span className="truncate italic" title={r.translatedSeed}>
                    🔎 "{r.translatedSeed}"
                  </span>
                  <button onClick={() => copy(r.translatedSeed)} className="hover:text-primary shrink-0" title="Copiar semilla">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {r.keywords.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin sugerencias.</p>
              ) : (
                <ul className="space-y-1 text-xs">
                  {r.keywords.map((k, i) => (
                    <li key={i} className="flex items-center gap-2 border-b pb-1">
                      <span className="w-5 text-[10px] font-mono text-muted-foreground">#{i + 1}</span>
                      {k.count > 1 && (
                        <span
                          className="shrink-0 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold"
                          title={`Aparece en: ${k.countries.join(", ")}`}
                        >
                          {k.count}×
                        </span>
                      )}
                      <span className="truncate flex-1" title={`${k.keyword} — ${k.countries.join(", ")}`}>
                        {k.keyword}
                      </span>
                      <button onClick={() => copy(k.keyword)} className="text-muted-foreground hover:text-primary shrink-0" title="Copiar">
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
