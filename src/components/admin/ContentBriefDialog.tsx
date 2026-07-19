import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Copy, FileText, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminKey } from "@/components/admin/AdminGate";
import { adminInvoke } from "@/lib/adminInvoke";
import { toast } from "sonner";

interface Product {
  sku: string;
  title: string;
  slug: string;
}
interface Brief {
  h1?: string;
  metaTitle?: string;
  metaDescription?: string;
  searchIntent?: string;
  targetAudience?: string;
  h2Outline?: { h2: string; bullets: string[] }[];
  faqs?: string[];
  semanticKeywords?: string[];
  internalLinks?: { anchor: string; url: string }[];
  cta?: string;
  wordCount?: string;
  notes?: string;
  raw?: string;
}

interface Props {
  keyword: string | null;
  onClose: () => void;
}

const LANGS = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "pt", label: "Português" },
  { code: "fr", label: "Français" },
  { code: "it", label: "Italiano" },
  { code: "de", label: "Deutsch" },
  { code: "ko", label: "한국어" },
];

const ContentBriefDialog = ({ keyword, onClose }: Props) => {
  const { adminKey } = useAdminKey();
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [language, setLanguage] = useState("es");
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<Brief | null>(null);

  useEffect(() => {
    if (!keyword) return;
    setBrief(null);
    supabase
      .from("digital_products")
      .select("sku,name")
      .eq("active", true)
      .order("name")
      .then(({ data }) => setProducts((data ?? []).map((p) => ({ sku: p.sku, title: p.name, slug: p.sku }))));
  }, [keyword]);

  const toggle = (sku: string) =>
    setSelected((prev) => (prev.includes(sku) ? prev.filter((s) => s !== sku) : [...prev, sku]));

  const generate = async () => {
    if (!keyword) return;
    setLoading(true);
    try {
      const { data, error } = await adminInvoke<{ brief: Brief; error?: string }>(
        "generate-content-brief",
        { body: { adminKey, keyword, language, productSkus: selected } },
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setBrief(data?.brief ?? null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    if (!brief) return;
    const md = [
      `# ${brief.h1 ?? keyword}`,
      brief.metaTitle && `**Meta title:** ${brief.metaTitle}`,
      brief.metaDescription && `**Meta description:** ${brief.metaDescription}`,
      brief.searchIntent && `**Intent:** ${brief.searchIntent}`,
      brief.targetAudience && `**Audiencia:** ${brief.targetAudience}`,
      brief.wordCount && `**Palabras:** ${brief.wordCount}`,
      "",
      "## Esquema",
      ...(brief.h2Outline?.map((s) => `### ${s.h2}\n${s.bullets.map((b) => `- ${b}`).join("\n")}`) ?? []),
      "",
      "## FAQs",
      ...(brief.faqs?.map((q) => `- ${q}`) ?? []),
      "",
      "## Keywords semánticas",
      (brief.semanticKeywords ?? []).join(", "),
      "",
      "## Enlaces internos",
      ...(brief.internalLinks?.map((l) => `- [${l.anchor}](${l.url})`) ?? []),
      "",
      "## CTA",
      brief.cta ?? "",
      brief.notes && `\n**Notas:** ${brief.notes}`,
    ]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard.writeText(md);
    toast.success("Brief copiado en Markdown");
  };

  return (
    <Dialog open={!!keyword} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Brief de contenido: <span className="text-primary">"{keyword}"</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium">Idioma</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className={`px-2 py-1 text-xs rounded border ${
                    language === l.code ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium">
              Productos a integrar en el CTA ({selected.length} seleccionados)
            </label>
            <div className="grid md:grid-cols-2 gap-1 mt-1 max-h-40 overflow-y-auto border rounded p-2">
              {products.map((p) => (
                <label key={p.sku} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted p-1 rounded">
                  <Checkbox checked={selected.includes(p.sku)} onCheckedChange={() => toggle(p.sku)} />
                  <span className="truncate">{p.title}</span>
                </label>
              ))}
            </div>
          </div>

          <Button onClick={generate} disabled={loading} className="w-full">
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generando…</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Generar brief con IA</>
            )}
          </Button>
        </div>

        {brief && (
          <div className="mt-4 space-y-4 text-sm border-t pt-4">
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={copyAll}>
                <Copy className="w-3 h-3 mr-1" /> Copiar todo (Markdown)
              </Button>
            </div>

            {brief.raw ? (
              <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap">{brief.raw}</pre>
            ) : (
              <>
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground">H1 sugerido</div>
                  <div className="font-semibold text-lg">{brief.h1}</div>
                </div>
                <div className="grid md:grid-cols-2 gap-3 text-xs">
                  {brief.metaTitle && <div><b>Meta title:</b> {brief.metaTitle}</div>}
                  {brief.metaDescription && <div><b>Meta desc:</b> {brief.metaDescription}</div>}
                  {brief.searchIntent && <div><b>Intent:</b> {brief.searchIntent}</div>}
                  {brief.targetAudience && <div><b>Audiencia:</b> {brief.targetAudience}</div>}
                  {brief.wordCount && <div><b>Extensión:</b> {brief.wordCount} palabras</div>}
                </div>

                {brief.h2Outline && (
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground mb-1">Esquema H2 / bullets</div>
                    <ol className="space-y-2 list-decimal list-inside">
                      {brief.h2Outline.map((s, i) => (
                        <li key={i}>
                          <span className="font-medium">{s.h2}</span>
                          <ul className="ml-5 mt-1 list-disc text-xs text-muted-foreground">
                            {s.bullets.map((b, j) => <li key={j}>{b}</li>)}
                          </ul>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {brief.faqs && (
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground mb-1">FAQs (long-tail)</div>
                    <ul className="list-disc list-inside text-xs space-y-0.5">
                      {brief.faqs.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                  </div>
                )}

                {brief.semanticKeywords && (
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground mb-1">Keywords semánticas</div>
                    <div className="flex flex-wrap gap-1">
                      {brief.semanticKeywords.map((k, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">{k}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {brief.internalLinks && brief.internalLinks.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground mb-1">Enlaces internos</div>
                    <ul className="text-xs space-y-0.5">
                      {brief.internalLinks.map((l, i) => (
                        <li key={i}>→ <b>{l.anchor}</b> <span className="text-muted-foreground">{l.url}</span></li>
                      ))}
                    </ul>
                  </div>
                )}

                {brief.cta && (
                  <div className="bg-primary/5 border border-primary/30 rounded p-3">
                    <div className="text-[10px] uppercase text-primary mb-1">CTA sugerido</div>
                    <p className="text-xs">{brief.cta}</p>
                  </div>
                )}

                {brief.notes && (
                  <p className="text-[11px] text-muted-foreground italic">💡 {brief.notes}</p>
                )}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContentBriefDialog;
