import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  RefreshCw, Mail, CheckCircle2, Clock, AlertTriangle, 
  Send, User, Tag, Calendar
} from "lucide-react";
import { toast } from "sonner";

interface ReviewInvitation {
  id: string;
  customer_email: string;
  customer_name: string;
  product_name: string;
  emails_sent: number;
  next_email_at: string;
  has_reviewed: boolean;
  is_completed: boolean;
  created_at: string;
  last_email_sent_at?: string;
}

export default function AdminReviewInvitations() {
  const [invitations, setInvitations] = useState<ReviewInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('review_invitations' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      if (data) setInvitations(data as any);
    } catch (e) {
      console.error("Error loading review invitations:", e);
      toast.error("Error al cargar invitaciones a reseñas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Invitaciones a Reseñas</h1>
          <p className="text-xs text-muted-foreground">Seguimiento de recordatorios y cupones post-compra (Días 1, 15, 20, 27).</p>
        </div>
        <Button onClick={loadData} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-[10px] uppercase text-muted-foreground">Pendientes</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-2xl font-bold">{invitations.filter(i => !i.is_completed && !i.has_reviewed).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-[10px] uppercase text-muted-foreground">Reseñados</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-2xl font-bold text-emerald-600">{invitations.filter(i => i.has_reviewed).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-[10px] uppercase text-muted-foreground">Completados</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-2xl font-bold">{invitations.filter(i => i.is_completed).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-[10px] uppercase text-muted-foreground">Envíos Max</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-2xl font-bold text-orange-600">{invitations.filter(i => i.emails_sent >= 5).length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-none shadow-none bg-transparent">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-xs min-w-[700px] sm:min-w-0">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Cliente</th>
                <th className="px-4 py-2 text-left font-semibold">Producto</th>
                <th className="px-4 py-2 text-center font-semibold">Envíos</th>
                <th className="px-4 py-2 text-left font-semibold">Próximo / Último</th>
                <th className="px-4 py-2 text-right font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-card">
              {invitations.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium flex items-center gap-1"><User className="w-3 h-3" /> {inv.customer_name}</span>
                      <span className="text-[10px] text-muted-foreground">{inv.customer_email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 italic"><Tag className="w-3 h-3" /> {inv.product_name}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={inv.emails_sent >= 5 ? "destructive" : "secondary"} className="text-[10px]">
                      {inv.emails_sent}/5
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col text-[10px]">
                      {inv.is_completed ? (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Finalizado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-orange-600 font-medium">
                          <Clock className="w-3 h-3" /> {new Date(inv.next_email_at).toLocaleDateString()}
                        </span>
                      )}
                      {inv.last_email_sent_at && (
                        <span className="text-muted-foreground mt-0.5">Último: {new Date(inv.last_email_sent_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {inv.has_reviewed ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Reseñado
                      </Badge>
                    ) : inv.is_completed ? (
                      <Badge variant="outline" className="text-[10px]">Cerrado</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                        <Send className="w-3 h-3 mr-1" /> En proceso
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
              {invitations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle className="w-8 h-8 opacity-20" />
                      <p>No se encontraron invitaciones recientes.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
