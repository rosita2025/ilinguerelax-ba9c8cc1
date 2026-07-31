import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, FlaskConical, CheckCircle2, XCircle, Clock, Trash2, Copy } from "lucide-react";
import { adminInvoke } from "@/lib/adminInvoke";

/**
 * Simulador de estados dLocal (PENDING / PAID / REJECTED) para validar la
 * entrega digital y los mensajes al cliente sin esperar un pago real.
 * Solo trabaja con pedidos de prueba `ILR-TEST-…`; nunca toca compras reales.
 */
type Ev = { event: string; status: string | null; created_at: string; detail?: string | null };

const METHODS = [
  { value: "transfer", label: "Transferencia" },
  { value: "cash", label: "Efectivo" },
  { value: "wallet", label: "Billetera" },
] as const;

export default function DlocalTestSimulator() {
  const [adminKey, setAdminKey] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("Cliente Prueba");
  const [country, setCountry] = useState("PE");
  const [currency, setCurrency] = useState("USD");
  const [amount, setAmount] = useState("10");
  const [skus, setSkus] = useState("");
  const [method, setMethod] = useState<"transfer" | "cash" | "wallet">("transfer");
  const [sendEmails, setSendEmails] = useState(true);
  const [orderNumber, setOrderNumber] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [events, setEvents] = useState<Ev[]>([]);

  async function run(action: "create" | "pending" | "paid" | "rejected" | "inspect" | "cleanup") {
    if (!adminKey.trim()) { toast.error("Falta la clave de admin"); return; }
    if (action === "create" && !email.trim()) { toast.error("Indica el correo de prueba"); return; }
    if (action !== "create" && !orderNumber.trim()) { toast.error("Crea o escribe un pedido de prueba"); return; }
    setBusy(action);
    try {
      const { data, error } = await adminInvoke<any>("dlocal-test-simulator", {
        body: {
          action,
          adminKey: adminKey.trim(),
          orderNumber: orderNumber.trim() ? orderNumber.trim().toUpperCase() : undefined,
          email: email.trim() || undefined,
          name: name.trim() || undefined,
          country: country.trim() || undefined,
          currency: currency.trim().toUpperCase() || undefined,
          amount: Number(amount) || 0,
          method,
          skus: skus.split(",").map((s) => s.trim()).filter(Boolean),
          sendEmails,
        },
      });
      if (error || data?.error) {
        toast.error(data?.error || error?.message || "No se pudo simular");
        return;
      }
      if (data.orderNumber) setOrderNumber(data.orderNumber);
      setEvents(data.events ?? []);
      if (action === "create") toast.success(`Pedido de prueba ${data.orderNumber} creado`);
      else if (action === "cleanup") { setEvents([]); setOrderNumber(""); toast.success("Pedido de prueba borrado"); }
      else if (action === "paid") {
        toast.success(data.delivery?.delivered ? "PAID simulado + entrega enviada" : "PAID simulado");
      } else if (action !== "inspect") toast.success(`Estado simulado: ${data.applied}`);
      else toast.success("Estado consultado");
    } catch (e) {
      toast.error((e as Error).message || "Error inesperado");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="p-3 sm:p-4 space-y-3 border-dashed">
      <div className="space-y-1">
        <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2">
          <FlaskConical className="h-4 w-4" /> Modo de prueba dLocal (PENDING / PAID / REJECTED)
          <Badge variant="outline" className="text-[10px]">solo pruebas</Badge>
        </h2>
        <p className="text-xs text-muted-foreground">
          Crea un pedido simulado <code>ILR-TEST-…</code> y dispara cada estado para verificar el correo del cliente,
          el token de descarga y la pantalla <strong>/mi-pedido</strong> sin esperar un pago real. No mueve dinero ni afecta pedidos reales.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Input type="password" placeholder="Clave de admin" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} />
        <Input placeholder="Correo de prueba" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="País (PE, MX…)" value={country} onChange={(e) => setCountry(e.target.value)} />
        <Input placeholder="Moneda (USD, PEN…)" value={currency} onChange={(e) => setCurrency(e.target.value)} />
        <Input placeholder="Importe" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <Input
        placeholder="SKUs separados por coma (ej. 1000-verbos-ingles)"
        value={skus}
        onChange={(e) => setSkus(e.target.value)}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {METHODS.map((m) => (
            <Button
              key={m.value}
              type="button"
              size="sm"
              variant={method === m.value ? "default" : "outline"}
              onClick={() => setMethod(m.value)}
            >
              {m.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Switch id="sim-emails" checked={sendEmails} onCheckedChange={setSendEmails} />
          <Label htmlFor="sim-emails" className="text-xs">Enviar correos reales de prueba</Label>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={!!busy} onClick={() => run("create")}>
          {busy === "create" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4 mr-1" />}
          Crear pedido de prueba
        </Button>
        <Button size="sm" variant="outline" disabled={!!busy || !orderNumber} onClick={() => run("pending")}>
          {busy === "pending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4 mr-1" />}
          Simular PENDING
        </Button>
        <Button size="sm" variant="secondary" disabled={!!busy || !orderNumber} onClick={() => run("paid")}>
          {busy === "paid" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
          Simular PAID + entrega
        </Button>
        <Button size="sm" variant="ghost" disabled={!!busy || !orderNumber} onClick={() => run("rejected")}>
          {busy === "rejected" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
          Simular REJECTED
        </Button>
        <Button size="sm" variant="ghost" disabled={!!busy || !orderNumber} onClick={() => run("cleanup")}>
          {busy === "cleanup" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
          Borrar prueba
        </Button>
      </div>

      {orderNumber && (
        <div className="rounded-lg border border-border p-3 text-xs space-y-2 break-words">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{orderNumber}</Badge>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2"
              onClick={() => { navigator.clipboard.writeText(orderNumber); toast.success("Copiado"); }}
            >
              <Copy className="h-3 w-3 mr-1" /> Copiar
            </Button>
            <a
              className="underline text-muted-foreground"
              href={`/mi-pedido?order=${encodeURIComponent(orderNumber)}`}
              target="_blank"
              rel="noreferrer"
            >
              Ver en /mi-pedido
            </a>
          </div>
          {events.length > 0 && (
            <ul className="space-y-1">
              {events.map((e, i) => (
                <li key={i} className="flex flex-wrap gap-1.5 items-center">
                  <Badge variant="outline" className="text-[10px]">{e.event}</Badge>
                  <span className="text-muted-foreground">{e.status ?? "-"}</span>
                  <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
