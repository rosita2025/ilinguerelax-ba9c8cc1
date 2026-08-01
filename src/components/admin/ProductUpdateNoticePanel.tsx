import { useState } from "react";
import { Loader2, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PreviewData {
  product: string;
  buyers: number;
  alreadySent: number;
  pending: number;
  history: Array<{ notice_key: string; last: string; count: number }>;
}

/**
 * Aviso de material actualizado — SOLO a los compradores de ESTE producto.
 * Reutiliza el mismo enlace privado /mi-descarga?t=<token> de cada cliente.
 */
export default function ProductUpdateNoticePanel({ sku, adminKey }: { sku: string; adminKey: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [noticeKey, setNoticeKey] = useState("");
  const [changes, setChanges] = useState("");
  const [bonusNote, setBonusNote] = useState("");
  const [confirm, setConfirm] = useState("");

  const call = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("notify-product-update", {
      body: { adminKey, sku, ...body },
    });
    if (error) throw new Error(error.message);
    if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
    return data;
  };

  const loadPreview = async (key = noticeKey) => {
    setLoading(true);
    try {
      const data = await call({ action: "preview", noticeKey: key.trim() });
      setPreview(data as PreviewData);
    } catch (e) {
      toast({ title: "No se pudo calcular", description: e instanceof Error ? e.message : "Error", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const send = async () => {
    const list = changes.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!noticeKey.trim()) return toast({ title: "Falta la etiqueta (ej. v1.7)", variant: "destructive" });
    if (list.length === 0) return toast({ title: "Escribe al menos una novedad", variant: "destructive" });
    if (confirm.trim() !== sku) return toast({ title: "Escribe el SKU para confirmar", description: sku, variant: "destructive" });
    setSending(true);
    try {
      const data = await call({
        action: "send",
        noticeKey: noticeKey.trim(),
        changes: list,
        bonusNote: bonusNote.trim() || undefined,
      }) as { sent: number; skipped: number; failed: number; buyers: number };
      toast({
        title: `Aviso enviado a ${data.sent} comprador(es)`,
        description: `Ya avisados antes: ${data.skipped} · Fallidos: ${data.failed} · Total compradores: ${data.buyers}`,
      });
      setConfirm("");
      await loadPreview();
    } catch (e) {
      toast({ title: "Error al enviar", description: e instanceof Error ? e.message : "Error", variant: "destructive" });
    } finally { setSending(false); }
  };

  return (
    <Card className="p-4 sm:p-6 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-semibold flex items-center gap-2"><Mail className="w-4 h-4" /> Avisar a compradores de este producto</h2>
          <p className="text-xs text-muted-foreground">
            Correo único a quienes compraron <span className="font-mono">{sku}</span> — nadie más. Reutiliza su mismo enlace de descarga.
          </p>
        </div>
        <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => { setOpen((o) => !o); if (!open) loadPreview(); }}>
          {open ? "Ocultar" : "Abrir"}
        </Button>
      </div>

      {open && (
        <div className="space-y-4 pt-2 border-t">
          <div className="text-xs rounded bg-muted p-3 space-y-1">
            {loading ? (
              <span className="text-muted-foreground">Calculando compradores…</span>
            ) : preview ? (
              <>
                <div><strong>{preview.buyers}</strong> comprador(es) de este producto</div>
                {noticeKey.trim() && (
                  <div>Ya avisados con «{noticeKey.trim()}»: <strong>{preview.alreadySent}</strong> · pendientes: <strong>{preview.pending}</strong></div>
                )}
                {preview.history.length > 0 && (
                  <div className="text-muted-foreground">
                    Avisos previos: {preview.history.map((h) => `${h.notice_key} (${h.count})`).join(" · ")}
                  </div>
                )}
              </>
            ) : <span className="text-muted-foreground">—</span>}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Etiqueta de la actualización</Label>
            <Input
              value={noticeKey}
              onChange={(e) => setNoticeKey(e.target.value)}
              onBlur={() => noticeKey.trim() && loadPreview()}
              placeholder="v1.7"
              maxLength={40}
            />
            <p className="text-[11px] text-muted-foreground">Identifica el aviso: cada comprador lo recibe una sola vez por etiqueta.</p>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Novedades (una por línea)</Label>
            <Textarea
              value={changes}
              onChange={(e) => setChanges(e.target.value)}
              rows={4}
              placeholder={"Se añadieron 120 páginas nuevas\nPronunciación revisada"}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Nota del bono nuevo (opcional)</Label>
            <Input value={bonusNote} onChange={(e) => setBonusNote(e.target.value)} placeholder="Se agregó el bono de frases de viaje en la misma carpeta." maxLength={300} />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Escribe el SKU para confirmar el envío</Label>
            <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={sku} className="font-mono" />
          </div>

          <Button onClick={send} disabled={sending} className="w-full sm:w-auto">
            {sending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
            Enviar aviso a compradores
          </Button>
        </div>
      )}
    </Card>
  );
}
