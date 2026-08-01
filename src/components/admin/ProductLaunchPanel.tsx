import { useState, useEffect, useRef, useCallback } from "react";
import { Eye, Loader2, Lock, Rocket, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/** Las 6 audiencias propias, en el mismo orden de prioridad del backend. */
const AUDIENCES = [
  { key: "buyers", label: "Compradores (checkout propio)" },
  { key: "hotmart", label: "Compradores Hotmart" },
  { key: "reviewers", label: "Clientes que dejaron reseña" },
  { key: "waitlist", label: "Lista de espera (avísame)" },
  { key: "abandoned", label: "Carritos abandonados" },
  { key: "newsletter", label: "Newsletter (popup)" },
] as const;

type AudienceKey = (typeof AUDIENCES)[number]["key"];

interface PreviewData {
  product: string;
  active: boolean;
  productUrl: string;
  total: number;
  perAudience: Array<{ audience: string; label: string; raw: number; unique: number }>;
  alreadySent: number;
  pending: number;
  history: Array<{ launch_key: string; last: string; count: number }>;
}

/**
 * Anuncio de PRODUCTO NUEVO a las 6 audiencias propias.
 * Una persona recibe un solo correo (prioridad: compradores > Hotmart >
 * reseñas > lista de espera > carrito abandonado > newsletter).
 */
export default function ProductLaunchPanel({ sku, adminKey }: { sku: string; adminKey: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [launchKey, setLaunchKey] = useState("");
  const [pitch, setPitch] = useState("");
  const [coupon, setCoupon] = useState("");
  const [audiences, setAudiences] = useState<AudienceKey[]>(AUDIENCES.map((a) => a.key));
  const [emailPreview, setEmailPreview] = useState<{
    html: string; subject: string; sampleEmail: string | null; sampleAudience: string | null; isSample: boolean; productUrl: string;
  } | null>(null);

  const audiencesKey = audiences.join(",");

  const call = useCallback(async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("notify-product-launch", {
      body: { adminKey, sku, audiences, ...body },
    });
    if (error) throw new Error(error.message);
    if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
    return data;
  }, [adminKey, sku, audiences]);

  const loadPreview = useCallback(async (key = launchKey, silent = false) => {
    setLoading(true);
    try {
      setPreview(await call({ action: "preview", launchKey: key.trim() }) as PreviewData);
    } catch (e) {
      if (!silent) toast({ title: "No se pudo calcular", description: e instanceof Error ? e.message : "Error", variant: "destructive" });
    } finally { setLoading(false); }
  }, [call, launchKey, toast]);

  // Recalcula la audiencia automáticamente al abrir el panel y cada vez que
  // cambian las audiencias marcadas, el SKU o la etiqueta de lanzamiento.
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!open) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { void loadPreview(launchKey, true); }, 400);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sku, audiencesKey, launchKey]);


  const renderEmail = async () => {
    setRendering(true);
    try {
      const data = await call({
        action: "render",
        launchKey: launchKey.trim(),
        pitch: pitch.trim() || undefined,
        coupon: coupon.trim() || undefined,
      });
      setEmailPreview(data as typeof emailPreview);
    } catch (e) {
      toast({ title: "No se pudo previsualizar", description: e instanceof Error ? e.message : "Error", variant: "destructive" });
    } finally { setRendering(false); }
  };

  const send = async () => {
    if (!launchKey.trim()) return toast({ title: "Falta la etiqueta del lanzamiento", variant: "destructive" });
    if (audiences.length === 0) return toast({ title: "Elige al menos una audiencia", variant: "destructive" });
    setSending(true);
    try {
      const data = await call({
        action: "send",
        launchKey: launchKey.trim(),
        pitch: pitch.trim() || undefined,
        coupon: coupon.trim() || undefined,
      }) as { sent: number; skipped: number; failed: number; total: number };
      toast({
        title: `Lanzamiento enviado a ${data.sent} persona(s)`,
        description: `Ya avisados antes: ${data.skipped} · Fallidos: ${data.failed} · Total audiencia: ${data.total}`,
      });
      await loadPreview();
    } catch (e) {
      toast({ title: "Error al enviar", description: e instanceof Error ? e.message : "Error", variant: "destructive" });
    } finally { setSending(false); }
  };

  const toggle = (key: AudienceKey) =>
    setAudiences((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  return (
    <Card className="p-4 sm:p-6 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-semibold flex items-center gap-2"><Rocket className="w-4 h-4" /> Anunciar producto nuevo (6 audiencias)</h2>
          <p className="text-xs text-muted-foreground">
            Compradores, Hotmart, reseñas, lista de espera, carritos abandonados y newsletter. Cada persona recibe un solo correo.
          </p>
        </div>
        <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setOpen((o) => !o)}>
          {open ? "Ocultar" : "Abrir"}
        </Button>
      </div>

      {open && (
        <div className="space-y-4 pt-2 border-t">
          <div className="space-y-2">
            <Label className="text-xs">Audiencias a incluir</Label>
            <div className="grid sm:grid-cols-2 gap-2">
              {AUDIENCES.map((a) => {
                const stat = preview?.perAudience.find((p) => p.audience === a.key);
                return (
                  <label key={a.key} className="flex items-center gap-2 text-sm rounded border p-2 cursor-pointer">
                    <Checkbox checked={audiences.includes(a.key)} onCheckedChange={() => toggle(a.key)} />
                    <span className="flex-1 min-w-0 truncate">{a.label}</span>
                    {stat && <span className="text-xs text-muted-foreground shrink-0">{stat.unique}</span>}
                  </label>
                );
              })}
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => loadPreview()} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Recalcular audiencia
            </Button>
          </div>

          <div className="text-xs rounded bg-muted p-3 space-y-1">
            {loading ? (
              <span className="text-muted-foreground">Calculando…</span>
            ) : preview ? (
              <>
                <div><strong>{preview.total}</strong> destinatario(s) únicos con las audiencias marcadas</div>
                {!preview.active && <div className="text-destructive">El producto está inactivo: actívalo antes de anunciarlo.</div>}
                {launchKey.trim() && (
                  <div>Ya avisados con «{launchKey.trim()}»: <strong>{preview.alreadySent}</strong> · pendientes: <strong>{preview.pending}</strong></div>
                )}
                <div className="break-all text-muted-foreground">Enlace del anuncio: {preview.productUrl}</div>
                {preview.history.length > 0 && (
                  <div className="text-muted-foreground">
                    Lanzamientos previos: {preview.history.map((h) => `${h.launch_key} (${h.count})`).join(" · ")}
                  </div>
                )}
              </>
            ) : <span className="text-muted-foreground">—</span>}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Etiqueta del lanzamiento</Label>
            <Input
              value={launchKey}
              onChange={(e) => setLaunchKey(e.target.value)}
              onBlur={() => launchKey.trim() && loadPreview()}
              placeholder="lanzamiento-1"
              maxLength={40}
            />
            <p className="text-[11px] text-muted-foreground">Cada persona recibe este anuncio una sola vez por etiqueta.</p>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Presentación corta (opcional)</Label>
            <Textarea value={pitch} onChange={(e) => setPitch(e.target.value)} rows={2} maxLength={400} placeholder="Un material práctico para hablar con confianza desde el primer día." />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Cupón de lanzamiento (opcional)</Label>
            <Input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} maxLength={24} placeholder="NEW10" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Producto a anunciar (fijo)</Label>
            <div className="relative">
              <Input value={sku} readOnly disabled className="font-mono pr-9 bg-muted cursor-not-allowed" />
              <Lock className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
            <p className="text-[11px] text-muted-foreground">🔒 No tocar: el anuncio siempre apunta a este SKU.</p>
          </div>

          <div className="space-y-2">
            <Button type="button" variant="outline" onClick={renderEmail} disabled={rendering} className="w-full sm:w-auto">
              {rendering ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              Previsualizar el correo
            </Button>

            {emailPreview && (
              <div className="rounded border overflow-hidden">
                <div className="p-3 text-xs bg-muted space-y-1">
                  <div><strong>Asunto:</strong> {emailPreview.subject}</div>
                  <div>
                    <strong>Para:</strong>{" "}
                    {emailPreview.isSample
                      ? <>{emailPreview.sampleEmail} · {emailPreview.sampleAudience}</>
                      : <span className="text-muted-foreground">sin contactos aún — se muestra un ejemplo</span>}
                  </div>
                  <div className="break-all"><strong>Enlace:</strong> {emailPreview.productUrl}</div>
                </div>
                <iframe title="Previsualización del anuncio" sandbox="" srcDoc={emailPreview.html} className="w-full h-[520px] bg-white border-t" />
              </div>
            )}
          </div>

          <Button onClick={send} disabled={sending} className="w-full sm:w-auto">
            {sending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
            Enviar anuncio de lanzamiento
          </Button>
        </div>
      )}
    </Card>
  );
}
