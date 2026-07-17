import { useEffect, useState } from "react";
import { Shield, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminInvoke } from "@/lib/adminInvoke";
import { useToast } from "@/hooks/use-toast";
import AdminNav from "@/components/admin/AdminNav";

interface Ban {
  ip: string;
  reason: string;
  banned_until: string;
  ua: string | null;
  hits: number;
  created_at: string;
}

interface StatRow {
  ip: string;
  count: number;
  last: string;
  slugs: string[];
}

export default function AdminCheckoutAbuse() {
  const { toast } = useToast();
  const [bans, setBans] = useState<Ban[]>([]);
  const [top, setTop] = useState<StatRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [b, s] = await Promise.all([
        adminInvoke("manage-checkout-abuse", { body: { action: "list_bans" } }),
        adminInvoke("manage-checkout-abuse", { body: { action: "stats" } }),
      ]);
      if (b.error) throw b.error;
      if (s.error) throw s.error;
      setBans(((b.data as { bans?: Ban[] } | null)?.bans) ?? []);
      setTop(((s.data as { top?: StatRow[] } | null)?.top) ?? []);
    } catch {
      toast({ title: "Error al cargar datos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const iv = setInterval(() => { void load(); }, 30000);
    return () => clearInterval(iv);
  }, []);

  const unban = async (ip: string) => {
    if (!confirm(`¿Desbloquear IP ${ip}?`)) return;
    try {
      const { error } = await adminInvoke("manage-checkout-abuse", { body: { action: "unban", ip } });
      if (error) throw error;
      toast({ title: "IP desbloqueada" });
      void load();
    } catch {
      toast({ title: "Error al desbloquear", variant: "destructive" });
    }
  };

  const activeBans = bans.filter((b) => new Date(b.banned_until) > new Date());

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Checkout · anti-abuso
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Rate limiting server-side por IP. Máx 20 accesos / 10 min → ban de 30 min.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refrescar
          </Button>
        </div>

        <section className="border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-muted/40 border-b flex items-center justify-between">
            <h2 className="font-semibold">IPs bloqueadas ({activeBans.length})</h2>
          </div>
          {activeBans.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">
              No hay IPs bloqueadas ahora mismo.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/20 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2">IP</th>
                    <th className="text-left px-3 py-2">Motivo</th>
                    <th className="text-left px-3 py-2">Hits</th>
                    <th className="text-left px-3 py-2">Hasta</th>
                    <th className="text-left px-3 py-2">User Agent</th>
                    <th className="text-right px-3 py-2">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {activeBans.map((b) => (
                    <tr key={b.ip} className="border-t">
                      <td className="px-3 py-2 font-mono">{b.ip}</td>
                      <td className="px-3 py-2">{b.reason}</td>
                      <td className="px-3 py-2">{b.hits}</td>
                      <td className="px-3 py-2">{new Date(b.banned_until).toLocaleString()}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-[280px]" title={b.ua || ""}>
                        {b.ua?.slice(0, 60) || "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button variant="ghost" size="sm" onClick={() => void unban(b.ip)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Desbloquear
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-muted/40 border-b">
            <h2 className="font-semibold">Top IPs · últimas 24 h</h2>
          </div>
          {top.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">Sin actividad reciente.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/20 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2">IP</th>
                    <th className="text-left px-3 py-2">Hits</th>
                    <th className="text-left px-3 py-2">Último</th>
                    <th className="text-left px-3 py-2">Productos</th>
                  </tr>
                </thead>
                <tbody>
                  {top.map((r) => (
                    <tr key={r.ip} className="border-t">
                      <td className="px-3 py-2 font-mono">{r.ip}</td>
                      <td className={`px-3 py-2 font-semibold ${r.count > 20 ? "text-destructive" : ""}`}>{r.count}</td>
                      <td className="px-3 py-2">{new Date(r.last).toLocaleString()}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{r.slugs.join(", ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
