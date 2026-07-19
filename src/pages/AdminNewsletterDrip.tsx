import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send, RefreshCw, Mail } from "lucide-react";

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
  const [config, setConfig] = useState<DripConfigRow[]>([]);
  const [sends, setSends] = useState<SendRow[]>([]);
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
    const [{ data: cfg }, { data: rows }] = await Promise.all([
      supabase.from("newsletter_drip_config").select("*").order("step"),
      supabase.from("newsletter_drip_sends").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setConfig((cfg as DripConfigRow[]) || []);
    setSends((rows as SendRow[]) || []);
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
      const { data, error } = await supabase.functions.invoke("send-newsletter-drip", {
        body: { mode, email, template_key: stepKey, step: cfg.step, language, name: name || undefined },
      });
      if (error) throw error;
      if ((data as any)?.ok === false) throw new Error((data as any).error || "Error al enviar");
      toast.success(mode === "test" ? `Test enviado a ${email}` : `Reenvío del paso ${cfg.step} a ${email}`);
      loadAll();
    } catch (e: any) {
      toast.error(e?.message || "Error al enviar");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="container mx-auto max-w-5xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Mail className="w-6 h-6"/> Newsletter Drip · Test & Reenvío</h1>
        <p className="text-sm text-muted-foreground">Envía correos de prueba a cualquier email o reenvía manualmente un paso a un suscriptor.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Enviar</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Email destinatario</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="test@correo.com" />
            </div>
            <div>
              <Label>Nombre (opcional)</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" />
            </div>
            <div>
              <Label>Paso / Plantilla</Label>
              <Select value={stepKey} onValueChange={setStepKey}>
                <SelectTrigger><SelectValue placeholder="Elige un paso" /></SelectTrigger>
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
              <Label>Idioma</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LANGS.map(l => <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Modo</Label>
              <Select value={mode} onValueChange={v => setMode(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">Test send (no toca DB, asunto con [TEST])</SelectItem>
                  <SelectItem value="resend">Reenvío manual (registra en newsletter_drip_sends)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={send} disabled={sending} className="gap-2">
              <Send className="w-4 h-4" /> {sending ? "Enviando..." : mode === "test" ? "Enviar test" : "Reenviar paso"}
            </Button>
            <Button variant="outline" onClick={loadAll} disabled={loading} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Recargar
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            <strong>Test</strong>: envía sin afectar la base — útil para revisar copy. <strong>Reenvío</strong>: marca el paso como enviado (evitas duplicados del cron y forzas la entrega aunque haya throttle o compra previa).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Últimos 50 envíos del drip</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
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
