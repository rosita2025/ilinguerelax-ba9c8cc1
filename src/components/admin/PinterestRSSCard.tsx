import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2, Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const PROJECT_FN = "https://opyitzdvvurdyyyzkwwv.supabase.co/functions/v1";

export const PinterestRSSCard = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const feeds = [
    {
      name: "Catálogo de Productos (Pinterest Feed)",
      url: `${PROJECT_FN}/pinterest-catalog`,
      desc: "Usa este enlace en Pinterest Business > Catálogos para subir todos tus productos automáticamente.",
    },
    {
      name: "RSS del Blog (Pines Automáticos)",
      url: `${PROJECT_FN}/blog-feed?format=rss`,
      desc: "Usa este enlace en Pinterest > Ajustes > Auto-publicar para crear pines de tus artículos del blog.",
    },
    {
      name: "Catálogo en Inglés",
      url: `${PROJECT_FN}/pinterest-catalog?lang=en`,
      desc: "Versión del catálogo con metadatos en inglés.",
    },
  ];

  const handleCopy = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      toast.success("Enlace copiado al portapapeles");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Error al copiar");
    }
  };

  return (
    <Card className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <Link2 className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Pinterest Feeds & RSS</h2>
          <p className="text-sm text-muted-foreground">
            Copia estos enlaces para automatizar tu presencia en Pinterest.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {feeds.map((f, i) => (
          <div key={i} className="flex flex-col border rounded-lg p-4 bg-muted/30 space-y-3">
            <div className="flex-1">
              <h3 className="text-sm font-semibold">{f.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {f.desc}
              </p>
            </div>
            
            <div className="flex items-center gap-2 pt-2 border-t mt-auto">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs gap-1.5"
                onClick={() => handleCopy(f.url, `feed-${i}`)}
              >
                {copied === `feed-${i}` ? (
                  <Check className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                Copiar URL
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-8 p-0"
                onClick={() => window.open(f.url, "_blank")}
                title="Ver XML"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300">
        <strong>Nota:</strong> Pinterest tarda entre 24 y 48 horas en procesar los feeds por primera vez. Asegúrate de que tu dominio esté verificado en Pinterest.
      </div>
    </Card>
  );
};
