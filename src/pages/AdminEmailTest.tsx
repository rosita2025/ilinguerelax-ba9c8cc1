import { useEffect, useState } from "react";
import AdminNav from "@/components/admin/AdminNav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Mail, RefreshCw, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface SendRow {
  id: string;
  order_id: string | null;
  customer_email: string;
  skus: string[];
  message_id: string | null;
  provider: string | null;
  status: string | null;
  last_event: string | null;
  last_event_at: string | null;
  event_count: number | null;
  events: unknown;
  created_at: string;
}

const AdminEmailTest = () => {
  const [orderId, setOrderId] = useState("ILR-TEST-" + Math.random().toString(36).slice(2, 8).toUpperCase());
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [skusText, setSkusText] = useState("");
  const [sending, setSending] = useState(false);
  const [rows, setRows] = useState<SendRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("digital_email_sends")
      .select("id, order_id, customer_email, skus, message_id, provider, status, last_event, last_event_at, event_count, events, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    setLoading(false);
    if (error) return toast.error(error.message);
    setRows((data ?? []) as SendRow[]);
  };

  useEffect(() => {
    loadRows();
  }, []);

  const send = async () => {
    const skus = skusText.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    if (!email || skus.length === 0) {
      toast.error("Email y al menos un SKU son obligatorios");
      return;
    }
    setSending(true);
    const { data, error } = await supabase.functions.invoke("send-digital-ilinguerelax", {
      body: {
        customerEmail: email,
        customerName: name || undefined,
        orderId: orderId || undefined,
        skus,
        force: true, // saltar idempotencia para pruebas
        idempotencyKey: `test:${orderId}:${Date.now()}`,
      },
    });
    setSending(false);
    if (error) return toast.error(error.message);
    if ((data as { success?: boolean })?.success === false) {
      toast.error("Envío falló — revisa logs");
    } else {
      toast.success("Enviado. Message ID guardado. Esperando eventos de Brevo…");
    }
    setTimeout(loadRows, 1200);
  };

  const statusColor = (s: string | null) => {
    if (!s) return "bg-muted text-muted-foreground";
    if (["delivered", "opened", "clicked"].includes(s)) return "bg-emerald-100 text-emerald-800";
    if (["bounced", "blocked", "complained", "invalid", "error"].includes(s)) return "bg-red-100 text-red-800";
    if (s === "sent") return "bg-blue-100 text-blue-800";
    return "bg-amber-100 text-amber-800";
  };

  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background py-10 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Mail className="w-7 h-7 text-primary" /> Prueba de correo transaccional
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Envía un correo real (Brevo) asociado a una orden. El <code>message_id</code> se guarda automáticamente para que el webhook actualice el estado (delivered / opened / bounced) en cuanto Brevo dispare los eventos.
            </p>
          </header>

          <Card className="p-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Orden (order_id)</Label>
                <Input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="ILR-TEST-XXXXXX" />
              </div>
              <div>
                <Label>Email destinatario</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@ejemplo.com" type="email" />
              </div>
              <div>
                <Label>Nombre (opcional)</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cliente de prueba" />
              </div>
              <div>
                <Label>SKUs (separados por coma o espacio)</Label>
                <Input value={skusText} onChange={(e) => setSkusText(e.target.value)} placeholder="coreano-100-mapas, spanish-relax-5000" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={send} disabled={sending}>
                {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                Enviar correo de prueba
              </Button>
              <Button variant="outline" onClick={loadRows} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refrescar
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-3">Últimos envíos (con matching de Brevo)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground border-b">
                  <tr>
                    <th className="text-left py-2 pr-3">Orden</th>
                    <th className="text-left py-2 pr-3">Email</th>
                    <th className="text-left py-2 pr-3">SKUs</th>
                    <th className="text-left py-2 pr-3">Message ID</th>
                    <th className="text-left py-2 pr-3">Estado</th>
                    <th className="text-left py-2 pr-3">Último evento</th>
                    <th className="text-left py-2">Eventos</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-mono text-xs">{r.order_id ?? "—"}</td>
                      <td className="py-2 pr-3">{r.customer_email}</td>
                      <td className="py-2 pr-3 text-xs">{(r.skus || []).join(", ")}</td>
                      <td className="py-2 pr-3 font-mono text-[11px] max-w-[180px] truncate" title={r.message_id ?? ""}>
                        {r.message_id ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" /> {r.message_id.slice(0, 20)}…
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <XCircle className="w-3 h-3" /> sin id
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(r.status)}`}>
                          {r.status ?? "—"}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-xs">
                        {r.last_event ? `${r.last_event} · ${r.last_event_at ? new Date(r.last_event_at).toLocaleString() : ""}` : "—"}
                      </td>
                      <td className="py-2 text-xs">{r.event_count ?? 0}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-muted-foreground">Sin envíos aún.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
};

export default AdminEmailTest;
