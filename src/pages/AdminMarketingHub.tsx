import { useEffect, useState } from "react";
import { useAdminKey } from "@/components/admin/AdminGate";
import { supabase } from "@/integrations/supabase/client";
import { adminInvoke } from "@/lib/adminInvoke";
import AdminNav from "@/components/admin/AdminNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  RefreshCw, Mail, Calendar, CheckCircle2, ShoppingCart, 
  ShieldCheck, Info, AlertCircle, Clock, Zap, Target
} from "lucide-react";
import { toast } from "sonner";
import AdminNewsletterDrip from "./AdminNewsletterDrip";
import AdminMarketingDrips from "./AdminMarketingDrips";

import AdminReviewInvitations from "./AdminReviewInvitations";

interface Stats {
  today: {
    newsletter: number;
    marketing: number;
    abandoned: number;
    total: number;
  };
  lifetime: {
    newsletter: number;
    marketing: number;
  };
  account?: {
    emailsLeft: number | null;
    planType: string | null;
    planEndDate: string | null;
  };
}

export default function AdminMarketingHub() {
  const { adminKey } = useAdminKey();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await adminInvoke<Stats>("get-marketing-stats", {
        body: { adminKey }
      });
      if (error) throw error;
      setStats(data);
    } catch (e) {
      console.error("Error loading stats:", e);
      toast.error("Error al cargar estadísticas globales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [adminKey]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <AdminNav />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Marketing Hub</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Control centralizado de Newsletter, Post-Compra y Carritos Abandonados.
            </p>
          </div>
          <Button onClick={loadStats} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualizar Global
          </Button>
        </header>

        {/* Créditos y Estado del Plan */}
        {stats?.account && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Créditos Brevo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-emerald-600">
                  {stats.account.emailsLeft?.toLocaleString() ?? "—"}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Créditos disponibles para envío</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plan Activo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold uppercase">{stats.account.planType || "Free"}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Tipo de suscripción en Brevo</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vencimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {stats.account.planEndDate ? new Date(stats.account.planEndDate).toLocaleDateString() : "No vence"}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Fecha de renovación del plan</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Salud del Sistema y Resumen */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Zap className="w-3 h-3 text-primary" /> Hoy (Enviados)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">{stats?.today.total ?? 0}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Correos automáticos entregados hoy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ShoppingCart className="w-3 h-3 text-orange-500" /> Abandonos Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-orange-600">{stats?.today.abandoned ?? 0}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Recuperación de ventas activa</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Target className="w-3 h-3 text-rose-500" /> Post-Compra Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-rose-600">{stats?.today.marketing ?? 0}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Fidelización a compradores</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Mail className="w-3 h-3 text-sky-500" /> Newsletter Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-sky-600">{stats?.today.newsletter ?? 0}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Drip de bienvenida y contenido</p>
            </CardContent>
          </Card>
        </div>

        {/* Panel de Seguridad y Deduplicación */}
        <Card className="border-emerald-500/20 bg-emerald-500/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> Checklist de Seguridad y Anti-Duplicados
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex gap-3">
              <Clock className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold">Límite 24h Global</h4>
                <p className="text-[11px] text-muted-foreground">Nunca enviamos más de 1 email de marketing al mismo cliente en un periodo de 24 horas.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Target className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold">Filtro de Compra</h4>
                <p className="text-[11px] text-muted-foreground">Si el cliente ya compró el producto promocionado, el sistema lo salta automáticamente.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <ShoppingCart className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold">Pausa por Abandono</h4>
                <p className="text-[11px] text-muted-foreground">Si hay un carrito abandonado activo (72h), pausamos el Newsletter para no saturar.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            <TabsList className="w-max sm:w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-4 sm:gap-6 flex-nowrap min-w-full">
              <TabsTrigger 
                value="overview" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-2 h-auto font-semibold whitespace-nowrap"
              >
                Resumen
              </TabsTrigger>
              <TabsTrigger 
                value="post-purchase" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-2 h-auto font-semibold whitespace-nowrap"
              >
                Post-Compra
              </TabsTrigger>
              <TabsTrigger 
                value="newsletter" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-2 h-auto font-semibold whitespace-nowrap"
              >
                Newsletter
              </TabsTrigger>
              <TabsTrigger 
                value="abandoned" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-2 h-auto font-semibold whitespace-nowrap"
              >
                Abandonos
              </TabsTrigger>
              <TabsTrigger 
                value="reviews" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-2 h-auto font-semibold whitespace-nowrap"
              >
                Reseñas
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-none border-muted/60 sm:shadow-sm">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" /> ¿Cómo funciona el flujo?
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4 text-sm text-muted-foreground">
                  <p>
                    El sistema detecta automáticamente en qué fase está el usuario y prioriza el mensaje más relevante:
                  </p>
                  <ol className="space-y-3 list-decimal list-inside">
                    <li><span className="text-foreground font-medium">Checkout Abierto:</span> Prioridad máxima. Se envían recordatorios de Brevo.</li>
                    <li><span className="text-foreground font-medium">Compra Exitosa:</span> El usuario entra en la secuencia <Badge variant="outline" className="text-[10px]">Post-Compra</Badge> (7, 15, 25 días).</li>
                    <li><span className="text-foreground font-medium">Suscripción:</span> Si no hay compra ni abandono reciente, sigue el <Badge variant="outline" className="text-[10px]">Newsletter Drip</Badge>.</li>
                  </ol>
                  <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-600 text-[11px]">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Deduplicación activa: Los emails se bloquean si ya se envió uno en las últimas 24h.</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-none border-muted/60 sm:shadow-sm">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">Estado de Listas Brevo</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-xs sm:text-sm">Contactos Newsletter</span>
                    <Badge variant="secondary">Sincronizado</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">Compradores (Hotmart/Stripe)</span>
                    <Badge variant="secondary">Sincronizado</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">Eventos de Abandono</span>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Activo (Webhook)</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="post-purchase">
            <div className="bg-card border rounded-lg overflow-hidden">
               <div className="p-4 border-b bg-muted/30">
                 <h3 className="font-semibold">Secuencias para Compradores</h3>
                 <p className="text-xs text-muted-foreground">Envíos automáticos tras la aprobación del pedido.</p>
               </div>
               <div className="p-0 sm:p-4 overflow-hidden">
                 <AdminMarketingDrips />
               </div>
            </div>
          </TabsContent>

          <TabsContent value="newsletter">
            <div className="bg-card border rounded-lg overflow-hidden">
               <div className="p-4 border-b bg-muted/30">
                 <h3 className="font-semibold">Drip de Newsletter</h3>
                 <p className="text-xs text-muted-foreground">Secuencia de bienvenida y valor para suscriptores.</p>
               </div>
               <div className="p-0 sm:p-4 overflow-hidden">
                 <AdminNewsletterDrip />
               </div>
            </div>
          </TabsContent>

          <TabsContent value="abandoned">
            <div className="bg-card border rounded-lg overflow-hidden">
               <div className="p-4 border-b bg-muted/30">
                 <h3 className="font-semibold">Log de Abandonos Brevo</h3>
                 <p className="text-xs text-muted-foreground">Payloads y estados de envío de carritos no finalizados.</p>
               </div>
               <div className="p-0 sm:p-4 overflow-hidden">
                 <div className="p-8 text-center text-sm text-muted-foreground">
                   Los registros de abandonos ahora se gestionan directamente en la pestaña de <b>Automatización de Email</b>.
                 </div>
               </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="bg-card border rounded-lg overflow-hidden">
               <div className="p-4 border-b bg-muted/30">
                 <h3 className="font-semibold">Automatización de Reseñas</h3>
                 <p className="text-xs text-muted-foreground">Recordatorios a los 1, 15, 20 y 27 días con incentivo de cupón.</p>
               </div>
               <div className="p-0 sm:p-4">
                 <AdminReviewInvitations />
               </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
