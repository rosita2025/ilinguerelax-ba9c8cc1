import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminNav from "@/components/admin/AdminNav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Mail, Calendar, CheckCircle2, Search, ShoppingCart, AlertTriangle, User, Globe } from "lucide-react";
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
  metadata?: any;
}

interface AbandonedLog {
  id: string;
  created_at: string;
  email: string;
  product_name: string;
  status: string;
  http_status: number;
  attributes: any;
}

export default function AdminMarketingDrips() {
  const [configs, setConfigs] = useState<DripConfig[]>([]);
  const [sends, setSends] = useState<DripSend[]>([]);
  const [abandonedLogs, setAbandonedLogs] = useState<AbandonedLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: configData } = await supabase.from('marketing_drip_config' as any).select('*').order('day_offset');
      const { data: sendsData } = await supabase.from('marketing_drip_sends' as any).select('*').order('sent_at', { ascending: false }).limit(100);
      const { data: abLogs } = await supabase.from('brevo_sync_logs').select('*').in('event_type', ['tienda_abandoned', 'hotmart_abandoned']).order('created_at', { ascending: false }).limit(100);
      
      if (configData) setConfigs(configData as any);
      if (sendsData) setSends(sendsData as any);
      if (abLogs) setAbandonedLogs(abLogs as any);

      const sentToday = (sendsData as any[])?.filter(s => s.sent_at && new Date(s.sent_at).toDateString() === new Date().toDateString()).length || 0;
      setStats({ sentToday });
    } catch (e) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const processQueue = async (endpoint: string, label: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(endpoint);
      if (error) throw error;
      toast.success(`${label} procesado`, { 
        description: data.stats ? `Enviados: ${data.stats.sent}` : 'Proceso completado' 
      });
      loadData();
    } catch (e) {
      toast.error(`Error en ${label}`, { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSends = useMemo(() => {
    if (!search) return sends;
    const s = search.toLowerCase();
    return sends.filter(item => 
      item.email?.toLowerCase().includes(s) || 
      item.category?.toLowerCase().includes(s) ||
      item.metadata?.country?.toLowerCase().includes(s)
    );
  }, [sends, search]);

  const filteredAbandoned = useMemo(() => {
    if (!search) return abandonedLogs;
    const s = search.toLowerCase();
    return abandonedLogs.filter(item => 
      item.email?.toLowerCase().includes(s) || 
      item.product_name?.toLowerCase().includes(s) ||
      item.attributes?.COUNTRY_CODE?.toLowerCase().includes(s)
    );
  }, [abandonedLogs, search]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold">Marketing & Automatización</h1>
          <p className="text-xs text-muted-foreground">Gestión centralizada de secuencias post-compra, newsletter y abandonos.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => processQueue('send-cart-reminders', 'Abandonos')} disabled={loading} variant="outline" size="sm">
            <ShoppingCart className="w-4 h-4 mr-2" /> Abandonos
          </Button>
          <Button onClick={() => processQueue('send-marketing-drip', 'Drips')} disabled={loading} variant="outline" size="sm">
            <Mail className="w-4 h-4 mr-2" /> Drips
          </Button>
          <Button onClick={() => processQueue('send-newsletter-drip', 'Newsletter')} disabled={loading} variant="outline" size="sm">
            <User className="w-4 h-4 mr-2" /> Newsletter
          </Button>
          <Button onClick={loadData} disabled={loading} variant="ghost" size="sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
              <CheckCircle2 className="w-3 h-3" /> 24/7 Activo
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-[10px] uppercase text-muted-foreground">Configuraciones</div>
            <div className="text-xl font-bold">{configs.length} pasos</div>
          </Card>
          <Card className="p-3">
            <div className="text-[10px] uppercase text-muted-foreground">Ult. Actividad</div>
            <div className="text-[10px] font-mono mt-1 truncate">{sends[0] ? new Date(sends[0].sent_at).toLocaleTimeString() : '—'}</div>
          </Card>
        </div>
      )}

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input 
          className="pl-9" 
          placeholder="Filtrar por email, país o categoría..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
      </div>

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Actividad Reciente</TabsTrigger>
          <TabsTrigger value="abandoned">Abandonos (Logs)</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">Email / País</th>
                    <th className="px-4 py-2 text-left">Categoría</th>
                    <th className="px-4 py-2 text-left">Paso</th>
                    <th className="px-4 py-2 text-left">Fecha</th>
                    <th className="px-4 py-2 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredSends.map((s, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="px-4 py-2">
                        <div className="font-medium">{s.email}</div>
                        <div className="text-[9px] text-muted-foreground flex items-center gap-1">
                          <Globe className="w-2 h-2" /> {s.metadata?.country || '—'} · {s.metadata?.source || 'web'}
                        </div>
                      </td>
                      <td className="px-4 py-2 uppercase text-[10px] font-mono">{s.category}</td>
                      <td className="px-4 py-2">{s.step_name}</td>
                      <td className="px-4 py-2 text-muted-foreground">{new Date(s.sent_at).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px]">
                          {s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {filteredSends.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No se encontraron registros.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="abandoned">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">Email / Origen</th>
                    <th className="px-4 py-2 text-left">Producto</th>
                    <th className="px-4 py-2 text-left">Fecha</th>
                    <th className="px-4 py-2 text-right">Brevo / HTTP</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredAbandoned.map((l, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="px-4 py-2">
                        <div className="font-medium">{l.email}</div>
                        <div className="text-[9px] text-muted-foreground flex items-center gap-1">
                          <Badge variant="outline" className="text-[8px] h-3 px-1">
                            {l.attributes?.ORIGEN || 'tienda'}
                          </Badge>
                          {l.attributes?.COUNTRY_CODE && `· ${l.attributes.COUNTRY_CODE}`}
                        </div>
                      </td>
                      <td className="px-4 py-2 max-w-[200px] truncate">{l.product_name || l.attributes?.ABANDONED_PRODUCT_NAME}</td>
                      <td className="px-4 py-2 text-muted-foreground">{new Date(l.created_at).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right">
                        <Badge variant={l.status === 'success' ? 'default' : 'destructive'} className="text-[9px]">
                          {l.status} {l.http_status ? `(${l.http_status})` : ''}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
                  <p className="text-[11px] text-muted-foreground">Día {c.day_offset}</p>
                </div>
                <div className="mt-4 pt-2 border-t text-[10px] text-muted-foreground">
                  Plantilla: {c.template_key}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
