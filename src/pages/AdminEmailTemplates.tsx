import { useEffect, useMemo, useState } from "react";
import AdminNav from "@/components/admin/AdminNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Mail, ShoppingCart, Download, Clock } from "lucide-react";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/preview-email-templates`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

type Kind = "order" | "digital" | "abandoned";

const ABANDONED_STEPS = [
  { day: "Día 1", label: "Recordatorio suave" },
  { day: "Día 7", label: "Beneficios + prueba social" },
  { day: "Día 15", label: "Última oportunidad" },
  { day: "Día 30", label: "Despedida con cupón" },
];

function usePreview(kind: Kind, index = 0) {
  const [state, setState] = useState<{ subject: string; html: string; loading: boolean; error: string | null }>({
    subject: "", html: "", loading: true, error: null,
  });
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetch(`${FN_URL}?kind=${kind}&index=${index}&format=json`, {
      headers: ANON ? { apikey: ANON, Authorization: `Bearer ${ANON}` } : {},
    })
      .then(async (r) => {
        const j = await r.json();
        if (!alive) return;
        if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
        setState({ subject: j.subject, html: j.html, loading: false, error: null });
      })
      .catch((e) => alive && setState({ subject: "", html: "", loading: false, error: e.message }));
    return () => { alive = false; };
  }, [kind, index]);
  return state;
}

function PreviewFrame({ html }: { html: string }) {
  const src = useMemo(() => `data:text/html;charset=utf-8,${encodeURIComponent(html)}`, [html]);
  return (
    <iframe
      src={src}
      title="Vista previa del correo"
      className="w-full rounded-lg border bg-white"
      style={{ height: "720px" }}
      sandbox=""
    />
  );
}

function PreviewCard({ kind, index = 0 }: { kind: Kind; index?: number }) {
  const { subject, html, loading, error } = usePreview(kind, index);
  return (
    <div className="space-y-3">
      <Card className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Asunto</div>
        <div className="mt-1 font-medium">{loading ? "Cargando…" : error ? `Error: ${error}` : subject}</div>
      </Card>
      {!loading && !error && <PreviewFrame html={html} />}
      {!loading && !error && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            const w = window.open("", "_blank"); if (w) { w.document.write(html); w.document.close(); }
          }}>Abrir en pestaña nueva</Button>
        </div>
      )}
    </div>
  );
}

const AdminEmailTemplates = () => {
  const [abIdx, setAbIdx] = useState(0);
  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Mail className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Plantillas de correo</h1>
            <p className="text-sm text-muted-foreground">Vista previa exacta de los correos que reciben tus clientes.</p>
          </div>
        </div>

        <Tabs defaultValue="order" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="order" className="gap-2"><ShoppingCart className="h-4 w-4" /> Confirmación</TabsTrigger>
            <TabsTrigger value="digital" className="gap-2"><Download className="h-4 w-4" /> Entrega digital</TabsTrigger>
            <TabsTrigger value="abandoned" className="gap-2"><Clock className="h-4 w-4" /> Carrito abandonado</TabsTrigger>
          </TabsList>

          <TabsContent value="order" className="mt-6">
            <p className="mb-3 text-sm text-muted-foreground">Se envía inmediatamente tras el pago (Stripe, PayPal, Mercado Pago, Yape/Plin).</p>
            <PreviewCard kind="order" />
          </TabsContent>

          <TabsContent value="digital" className="mt-6">
            <p className="mb-3 text-sm text-muted-foreground">Segundo correo con los enlaces de descarga (Google Drive) tras la confirmación.</p>
            <PreviewCard kind="digital" />
          </TabsContent>

          <TabsContent value="abandoned" className="mt-6">
            <p className="mb-3 text-sm text-muted-foreground">Secuencia automática de 4 correos. Se detiene automáticamente al confirmarse la compra.</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {ABANDONED_STEPS.map((s, i) => (
                <Button
                  key={i}
                  variant={abIdx === i ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAbIdx(i)}
                >
                  {s.day} — {s.label}
                </Button>
              ))}
            </div>
            <PreviewCard kind="abandoned" index={abIdx} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminEmailTemplates;
