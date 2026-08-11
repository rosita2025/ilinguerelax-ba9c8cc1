import { useMemo, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldAlert, History, AlertTriangle } from "lucide-react";
import AdminNav from "@/components/admin/AdminNav";
import { adminInvoke } from "@/lib/adminInvoke";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AuditLog {
  id: string;
  created_at: string;
  action: string;
  details: any;
  ip_address: string;
  user_agent: string;
  admin_email: string;
}

const AdminSecurityAudit = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // Obtenemos los logs a través de la función dedicada admin-audit-logs.
        // Solo accesible con una sesión 2FA activa.
        const res = await adminInvoke("admin-audit-logs", {
          method: "POST",
          body: { action: "list" }
        });
        
        if (res.error) throw res.error;
        setLogs(res.data as AuditLog[]);
      } catch (err: any) {
        console.error("Error fetching audit logs:", err);
        setError(err.message || "Error al cargar los logs de auditoría");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <>
      <AdminNav />
      <main className="min-h-dvh bg-background py-10 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <ShieldAlert className="w-8 h-8 text-destructive" />
                Auditoría de Seguridad
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Historial de accesos y acciones administrativas críticas.
              </p>
            </div>
          </header>

          <Card className="overflow-hidden">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Cargando registros...</p>
              </div>
            ) : error ? (
              <div className="p-12 text-center space-y-4">
                <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
                <p className="text-destructive font-medium">{error}</p>
                <p className="text-xs text-muted-foreground">
                  Nota: Esta función requiere permisos de administrador y una sesión 2FA válida.
                </p>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                No hay registros de auditoría disponibles.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>IP / Dispositivo</TableHead>
                    <TableHead>Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(log.created_at), "PPp", { locale: es })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.action.includes("fail") ? "destructive" : "outline"}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-mono">{log.ip_address}</div>
                        <div className="text-[10px] opacity-60 truncate max-w-[200px]" title={log.user_agent}>
                          {log.user_agent}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <pre className="max-w-[300px] overflow-x-auto bg-muted p-2 rounded text-[10px]">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      </main>
    </>
  );
};

export default AdminSecurityAudit;
