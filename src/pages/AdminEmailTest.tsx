import { useEffect, useState } from "react";
import AdminNav from "@/components/admin/AdminNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Mail, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
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
  created_at: string;
}

const formatDateTime = (iso: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
};

const AdminEmailTest = () => {
  const [rows, setRows] = useState<SendRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("digital_email_sends")
      .select("id, order_id, customer_email, skus, message_id, provider, status, last_event, last_event_at, event_count, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    setLoading(false);
    if (error) return toast.error(error.message);
    setRows((data ?? []) as SendRow[]);
  };

  useEffect(() => {
    loadRows();
    const interval = setInterval(loadRows, 30000);
    return () => clearInterval(interval);
  }, []);

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
        <div className="max-w-6xl mx-auto space-y-6">
          <header className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Mail className="w-7 h-7 text-primary" /> Pedidos de clientes — Entrega digital
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Solo lectura. Muestra los pedidos reales de clientes y el estado de entrega del correo con los enlaces (enviado, entregado, abierto, rebotado). Se actualiza automáticamente cada 30 segundos.
              </p>
            </div>
            <Button variant="outline" onClick={loadRows} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refrescar
            </Button>
          </header>

          <Card className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground border-b">
                  <tr>
                    <th className="text-left py-2 pr-3">Fecha y hora</th>
                    <th className="text-left py-2 pr-3">Orden</th>
                    <th className="text-left py-2 pr-3">Cliente</th>
                    <th className="text-left py-2 pr-3">Productos (SKUs)</th>
                    <th className="text-left py-2 pr-3">Estado</th>
                    <th className="text-left py-2 pr-3">Último evento</th>
                    <th className="text-left py-2">Message ID</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 align-top">
                      <td className="py-2 pr-3 whitespace-nowrap text-xs">{formatDateTime(r.created_at)}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{r.order_id ?? "—"}</td>
                      <td className="py-2 pr-3">{r.customer_email}</td>
                      <td className="py-2 pr-3 text-xs">{(r.skus || []).join(", ")}</td>
                      <td className="py-2 pr-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(r.status)}`}>
                          {r.status ?? "—"}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-xs whitespace-nowrap">
                        {r.last_event ? (
                          <>
                            <div className="font-medium">{r.last_event}</div>
                            <div className="text-muted-foreground">{formatDateTime(r.last_event_at)}</div>
                          </>
                        ) : "—"}
                      </td>
                      <td className="py-2 font-mono text-[11px] max-w-[200px] truncate" title={r.message_id ?? ""}>
                        {r.message_id ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" /> {r.message_id.slice(0, 22)}…
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <XCircle className="w-3 h-3" /> sin id
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        {loading ? "Cargando pedidos…" : "Aún no hay pedidos de clientes."}
                      </td>
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
