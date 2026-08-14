import { useEffect, useState } from "react";
import { useAdminKey } from "@/components/admin/AdminGate";
import { supabase } from "@/integrations/supabase/client";
import AdminNav from "@/components/admin/AdminNav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Mail, Calendar, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface DripConfig {
  category: string;
  step_name: string;
  day_offset: number;
  template_key: string;
  enabled: boolean;
}

interface DripSend {
  email: string;
  category: string;
  step_name: string;
  sent_at: string;
  status: string;
}

export default function AdminMarketingDrips() {
  const [configs, setConfigs] = useState<DripConfig[]>([]);
  const [sends, setSends] = useState<DripSend[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: configData } = await supabase.from('marketing_drip_config' as any).select('*').order('day_offset');
      const { data: sendsData } = await supabase.from('marketing_drip_sends' as any).select('*').order('sent_at', { ascending: false }).limit(50);
      
      if (configData) setConfigs(configData as any);
      if (sendsData) setSends(sendsData as any);

      // Calculamos stats rápidos
      const sentToday = (sendsData as any[])?.filter(s => s.sent_at && new Date(s.sent_at).toDateString() === new Date().toDateString()).length || 0;
      setStats({ sentToday });
    } catch (e) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const processDrips = async () => {
    setLoading(true);
    try {
      // 1. Marketing Post-Compra
      const { data: mData, error: mErr } = await supabase.functions.invoke('send-marketing-drip');
      if (mErr) throw mErr;

      // 2. Newsletter Drip
      const { data: nData, error: nErr } = await supabase.functions.invoke('send-newsletter-drip');
      if (nErr) throw nErr;

      toast.success("Secuencias procesadas", { 
        description: `Marketing: ${mData.stats.sent} enviados. Newsletter: ${nData.stats.sent} enviados.` 
      });
      loadData();
    } catch (e) {
      toast.error("Error al procesar secuencias", { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold">Marketing & Secuencias Automáticas</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Automatización de lanzamientos post-compra y secuencias de bienvenida.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={processDrips} disabled={loading} variant="outline" size="sm" className="h-8 sm:h-9 text-[10px] sm:text-xs">
              <Mail className={`w-3 h-3 sm:w-4 sm:h-4 mr-2 ${loading ? 'animate-pulse' : ''}`} /> Procesar Ahora
            </Button>
            <Button onClick={loadData} disabled={loading} variant="outline" size="sm" className="h-8 sm:h-9 text-[10px] sm:text-xs">
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualizar
            </Button>
          </div>
        </header>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Envíos Hoy</div>
              <div className="text-xl font-bold text-primary">{stats.sentToday}</div>
            </Card>
            <Card className="p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Estado Cron</div>
              <div className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Activo (Auto)
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Categorías</div>
              <div className="text-xl font-bold">{new Set(configs.map(c => c.category)).size}</div>
            </Card>
            <Card className="p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Ult. Actividad</div>
              <div className="text-[10px] font-mono mt-1 truncate">{sends[0] ? new Date(sends[0].sent_at).toLocaleTimeString() : '—'}</div>
            </Card>
          </div>
        )}

        <section className="space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Secuencias Activas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {configs.map((c, i) => (
              <Card key={i} className="p-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-[10px]">{c.category}</Badge>
                    <Badge variant={c.enabled ? "default" : "secondary"} className="text-[10px]">
                      {c.enabled ? "Activo" : "Pausado"}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-sm">{c.step_name}</h3>
                  <p className="text-[11px] text-muted-foreground">Envío a los {c.day_offset} días</p>
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between items-center text-[10px] text-muted-foreground">
                  <span>Plantilla: {c.template_key}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" /> Últimos Envíos Realizados
          </h2>
          <Card className="overflow-hidden border-none shadow-none">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-xs min-w-[600px] sm:min-w-0">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">Comprador</th>
                    <th className="px-4 py-2 text-left">Categoría</th>
                    <th className="px-4 py-2 text-left">Paso</th>
                    <th className="px-4 py-2 text-left text-muted-foreground">Fecha</th>
                    <th className="px-4 py-2 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sends.map((s, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="px-4 py-2 font-medium">{s.email}</td>
                      <td className="px-4 py-2 uppercase text-[10px]">{s.category}</td>
                      <td className="px-4 py-2">{s.step_name}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {new Date(s.sent_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> {s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {sends.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No se han realizado envíos todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
    </div>
  );
}
