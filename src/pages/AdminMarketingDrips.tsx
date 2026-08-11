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
  const { adminKey } = useAdminKey();
  const [configs, setConfigs] = useState<DripConfig[]>([]);
  const [sends, setSends] = useState<DripSend[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: configData } = await supabase.from('marketing_drip_config').select('*').order('day_offset');
      const { data: sendsData } = await supabase.from('marketing_drip_sends').select('*').order('sent_at', { ascending: false }).limit(50);
      
      if (configData) setConfigs(configData);
      if (sendsData) setSends(sendsData);
    } catch (e) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Marketing Post-Compra</h1>
            <p className="text-muted-foreground">Automatización de lanzamientos y seguimiento a los 7, 15 y 25 días.</p>
          </div>
          <Button onClick={loadData} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </Button>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Secuencias Activas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {configs.map((c, i) => (
              <Card key={i} className="p-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline">{c.category}</Badge>
                    <Badge variant={c.enabled ? "default" : "secondary"}>
                      {c.enabled ? "Activo" : "Pausado"}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-lg">{c.step_name}</h3>
                  <p className="text-sm text-muted-foreground">Envío a los {c.day_offset} días</p>
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between items-center text-xs text-muted-foreground">
                  <span>Plantilla: {c.template_key}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" /> Últimos Envíos Realizados
          </h2>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">Comprador</th>
                  <th className="px-4 py-3 text-left">Categoría</th>
                  <th className="px-4 py-3 text-left">Paso</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sends.map((s, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{s.email}</td>
                    <td className="px-4 py-3 uppercase text-xs">{s.category}</td>
                    <td className="px-4 py-3">{s.step_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(s.sent_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
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
          </Card>
        </section>
      </div>
    </div>
  );
}
