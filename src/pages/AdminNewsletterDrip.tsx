import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminInvoke } from "@/lib/adminInvoke";
import { useAdminKey } from "@/components/admin/AdminGate";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send, RefreshCw, Mail, Activity, AlertCircle } from "lucide-react";


interface DripConfigRow {
  step: number;
  day_offset: number;
  template_key: string;
  product_sku: string | null;
  enabled: boolean;
}

interface SendRow {
  id: string;
  email: string;
  step: number;
  status: string;
  sent_at: string | null;
  created_at: string;
  error: string | null;
  metadata: any;
}

const LANGS = ['es','en','fr','pt','de','it','nl','ja','ko','zh','ru','ar','hi','tr'];

export default function AdminNewsletterDrip() {
  const { adminKey } = useAdminKey();
  const [config, setConfig] = useState<DripConfigRow[]>([]);
  const [sends, setSends] = useState<SendRow[]>([]);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("youtumundial2017@gmail.com");
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("es");
  const [stepKey, setStepKey] = useState<string>("");
  const [mode, setMode] = useState<"test" | "resend">("test");
  const [sending, setSending] = useState(false);


  const stepLabel = useMemo(() => {
    const s = config.find(c => c.template_key === stepKey);
    return s ? `Paso ${s.step} · Día ${s.day_offset}` : "";
  }, [stepKey, config]);

  async function loadAll() {
    setLoading(true);
    const [{ data: cfg }, { data: rows }, { data: logs }] = await Promise.all([
      supabase.from("newsletter_drip_config").select("*").order("step"),
      supabase.from("newsletter_drip_sends").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("brevo_sync_logs").select("*").order("created_at", { ascending: false }).limit(20)
    ]);
    setConfig((cfg as DripConfigRow[]) || []);
    setSends((rows as SendRow[]) || []);
    setSyncLogs(logs || []);
    if (!stepKey && cfg && cfg.length) setStepKey((cfg[0] as any).template_key);
    setLoading(false);
  }


  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, []);

  async function send() {
    if (!email || !stepKey) { toast.error("Email y paso son obligatorios"); return; }
    const cfg = config.find(c => c.template_key === stepKey);
    if (!cfg) { toast.error("Paso no encontrado"); return; }
    setSending(true);
    try {
      const { data, error } = await adminInvoke<{ ok?: boolean; error?: string }>("send-newsletter-drip", {
        body: { mode, email, template_key: stepKey, step: cfg.step, language, name: name || undefined },
      });
      if (error) {
        let detail = error.message;
        if (error instanceof FunctionsHttpError) {
          try {
            const payload = await error.context.json();
            detail = payload?.error || payload?.detail || detail;
          } catch { /* retain the original message */ }
        }
        throw new Error(detail);
      }
      if (data?.ok === false) throw new Error(data.error || "Error al enviar");
      toast.success(mode === "test" ? `Test enviado a ${email}` : `Reenvío del paso ${cfg.step} a ${email}`);
      loadAll();
    } catch (e: any) {
      toast.error(e?.message || "Error al enviar");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">


      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Enviar Prueba / Reenvío</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <Label className="text-[10px] uppercase">Email</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="test@correo.com" className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[10px] uppercase">Nombre</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[10px] uppercase">Paso / Plantilla</Label>
              <Select value={stepKey} onValueChange={setStepKey}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Elige un paso" /></SelectTrigger>
                <SelectContent>
                  {config.map(c => (
                    <SelectItem key={c.template_key} value={c.template_key}>
                      Paso {c.step} · Día {c.day_offset} · {c.template_key}{c.enabled ? "" : " (off)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {stepLabel && <p className="text-xs text-muted-foreground mt-1">{stepLabel}</p>}
            </div>
            <div>
              <Label className="text-[10px] uppercase">Idioma</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{LANGS.map(l => <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase">Modo</Label>
              <Select value={mode} onValueChange={v => setMode(v as any)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="test" className="text-xs">Test send (no toca DB)</SelectItem>
                  <SelectItem value="resend" className="text-xs">Reenvío manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={send} disabled={sending} className="gap-2" size="sm">
              <Send className="w-3 h-3" /> {sending ? "Enviando..." : mode === "test" ? "Enviar test" : "Reenviar paso"}
            </Button>
            <Button variant="outline" onClick={loadAll} disabled={loading} className="gap-2" size="sm">
              <RefreshCw className="w-3 h-3" /> Recargar
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            <strong>Test</strong>: envía sin afectar la base — útil para revisar copy. <strong>Reenvío</strong>: marca el paso como enviado (evitas duplicados del cron y forzas la entrega aunque haya throttle o compra previa).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" /> 
            Estado de Sincronización Brevo
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">Últimos 20 eventos</Badge>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b text-left text-muted-foreground font-medium">
                  <th className="pb-2 pr-2">Fecha</th>
                  <th className="pb-2 pr-2">Email</th>
                  <th className="pb-2 pr-2">Evento</th>
                  <th className="pb-2 pr-2 text-center">Status</th>
                  <th className="pb-2 pr-2">Respuesta / Error</th>
                </tr>
              </thead>
              <tbody>
                {syncLogs.map(log => (
                  <tr key={log.id} className="border-b border-border/40 hover:bg-muted/30">
                    <td className="py-1.5 pr-2 whitespace-nowrap text-muted-foreground font-mono">
                      {new Date(log.created_at).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-1.5 pr-2 font-medium">{log.email}</td>
                    <td className="py-1.5 pr-2">
                      <Badge variant="outline" className="text-[9px] uppercase px-1 py-0 h-4 bg-muted/50">
                        {log.event_type?.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="py-1.5 pr-2 text-center">
                      {log.status === 'success' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                      ) : log.status === 'failed' ? (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-amber-400 mx-auto" />
                      )}
                    </td>
                    <td className="py-1.5 pr-2 text-muted-foreground truncate max-w-[200px]" title={log.error || log.response}>
                      {log.error || log.response || '—'}
                      {log.http_status && <span className="ml-1 opacity-50">({log.http_status})</span>}
                    </td>
                  </tr>
                ))}
                {!syncLogs.length && <tr><td colSpan={5} className="py-4 text-center text-muted-foreground italic">No hay logs recientes</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Últimos 50 envíos del drip</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-sm min-w-[600px] sm:min-w-0">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Paso</th>
                  <th className="py-2 pr-3">Estado</th>
                  <th className="py-2 pr-3">Plantilla</th>
                  <th className="py-2 pr-3">Nota</th>
                </tr>
              </thead>
              <tbody>
                {sends.map(r => (
                  <tr key={r.id} className="border-b hover:bg-muted/40">
                    <td className="py-1.5 pr-3 whitespace-nowrap">{new Date(r.sent_at || r.created_at).toLocaleString()}</td>
                    <td className="py-1.5 pr-3">{r.email}</td>
                    <td className="py-1.5 pr-3">{r.step}</td>
                    <td className="py-1.5 pr-3">
                      <span className={
                        r.status === "sent" ? "text-emerald-600" :
                        r.status === "failed" ? "text-red-600" :
                        r.status === "skipped" ? "text-amber-600" : "text-muted-foreground"
                      }>{r.status}</span>
                    </td>
                    <td className="py-1.5 pr-3 text-xs">{r.metadata?.template || "—"}</td>
                    <td className="py-1.5 pr-3 text-xs text-muted-foreground">
                      {r.metadata?.manual_resend ? "manual" : r.metadata?.reason || ""} {r.error ? `· ${r.error}` : ""}
                    </td>
                  </tr>
                ))}
                {!sends.length && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Sin envíos aún</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
